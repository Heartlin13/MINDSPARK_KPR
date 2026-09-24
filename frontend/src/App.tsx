/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LiveIncidentsView } from './components/LiveIncidentsView';
import { AgentOperationsView } from './components/AgentOperationsView';
import { ResourcesView } from './components/ResourcesView';
import { ResponsePlanView } from './components/ResponsePlanView';
import { AlertsView } from './components/AlertsView';
import { ResponseHistoryView } from './components/ResponseHistoryView';
import { ArchitectureView } from './components/ArchitectureView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AuthUser, Login } from './pages/Login';
import { AgentRole, GeminiStatusInfo, SatelliteMonitoring, SystemExecutionState } from './types/disaster';
import { INITIAL_DEFAULT_STATE } from './utils/defaultState';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface DashboardAppProps {
  user: AuthUser;
  onLogout: () => Promise<void>;
}

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

function DashboardApp({ user, onLogout }: DashboardAppProps) {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [state, setState] = useState<SystemExecutionState>(INITIAL_DEFAULT_STATE);
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatusInfo | null>(null);
  const [satelliteMonitoring, setSatelliteMonitoring] = useState<SatelliteMonitoring>(INITIAL_DEFAULT_STATE.satelliteMonitoring);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>('Medical Agent');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Helper to show brief toast notification
  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Constants for exponential backoff strategy for HTTP polling
  const BASE_STATE_INTERVAL_MS = 4000;
  const MAX_STATE_INTERVAL_MS = 32000;
  const BASE_GEMINI_INTERVAL_MS = 15000;
  const MAX_GEMINI_INTERVAL_MS = 60000;
  const SATELLITE_INTERVAL_MS = 60000;

  const stateDelayRef = React.useRef<number>(BASE_STATE_INTERVAL_MS);
  const geminiDelayRef = React.useRef<number>(BASE_GEMINI_INTERVAL_MS);

  // Fetch state from server with resilient retry & exponential backoff on error/429
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/simulation/state');
      if (res.status === 429) {
        stateDelayRef.current = Math.min(stateDelayRef.current * 2, MAX_STATE_INTERVAL_MS);
        setFetchError(`Rate limit encountered (HTTP 429). Backing off for ${Math.round(stateDelayRef.current / 1000)}s`);
        return false;
      }
      if (!res.ok) {
        stateDelayRef.current = Math.min(stateDelayRef.current * 1.5, MAX_STATE_INTERVAL_MS);
        throw new Error(`HTTP error ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setState(json.data);
        setFetchError(null);
        // Successful response resets backoff to baseline
        stateDelayRef.current = BASE_STATE_INTERVAL_MS;
        return true;
      }
      return false;
    } catch (err: any) {
      stateDelayRef.current = Math.min(stateDelayRef.current * 2, MAX_STATE_INTERVAL_MS);
      setFetchError(err?.message || 'Server connection in progress');
      return false;
    }
  }, []);

  // Fetch Gemini status with exponential backoff on 429/failure
  const fetchGeminiStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/gemini/status');
      if (res.status === 429) {
        geminiDelayRef.current = Math.min(geminiDelayRef.current * 2, MAX_GEMINI_INTERVAL_MS);
        return false;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setGeminiStatus(json.data);
          // Successful response resets backoff to baseline
          geminiDelayRef.current = BASE_GEMINI_INTERVAL_MS;
          return true;
        }
      }
      geminiDelayRef.current = Math.min(geminiDelayRef.current * 1.5, MAX_GEMINI_INTERVAL_MS);
      return false;
    } catch {
      // Server may be initializing; increase backoff
      geminiDelayRef.current = Math.min(geminiDelayRef.current * 2, MAX_GEMINI_INTERVAL_MS);
      return false;
    }
  }, []);

  const fetchSatelliteObservations = useCallback(async () => {
    try {
      const res = await fetch('/api/satellite/observations');
      if (!res.ok) return false;
      const json = await res.json();
      if (json.success && json.data) {
        setSatelliteMonitoring(json.data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Resilient Exponential Backoff Polling Loops
  useEffect(() => {
    let stateTimeoutId: NodeJS.Timeout;
    let geminiTimeoutId: NodeJS.Timeout;
    let satelliteTimeoutId: NodeJS.Timeout;
    let isMounted = true;

    const scheduleStatePoll = () => {
      stateTimeoutId = setTimeout(async () => {
        if (!isMounted) return;
        await fetchState();
        if (isMounted) scheduleStatePoll();
      }, stateDelayRef.current);
    };

    const scheduleGeminiPoll = () => {
      geminiTimeoutId = setTimeout(async () => {
        if (!isMounted) return;
        await fetchGeminiStatus();
        if (isMounted) scheduleGeminiPoll();
      }, geminiDelayRef.current);
    };

    const scheduleSatellitePoll = () => {
      satelliteTimeoutId = setTimeout(async () => {
        if (!isMounted) return;
        await fetchSatelliteObservations();
        if (isMounted) scheduleSatellitePoll();
      }, SATELLITE_INTERVAL_MS);
    };

    // Initial triggers
    fetchState();
    fetchGeminiStatus();
    fetchSatelliteObservations();

    // Start recursive scheduled backoff loops
    scheduleStatePoll();
    scheduleGeminiPoll();
    scheduleSatellitePoll();

    return () => {
      isMounted = false;
      clearTimeout(stateTimeoutId);
      clearTimeout(geminiTimeoutId);
      clearTimeout(satelliteTimeoutId);
    };
  }, [fetchState, fetchGeminiStatus, fetchSatelliteObservations]);

  const handleManualReconnect = useCallback(() => {
    stateDelayRef.current = BASE_STATE_INTERVAL_MS;
    geminiDelayRef.current = BASE_GEMINI_INTERVAL_MS;
    fetchState();
    fetchGeminiStatus();
  }, [fetchState, fetchGeminiStatus]);

  // Run full coordinated response (Section 9)
  const handleRunCoordinatedResponse = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/run-all-agents', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to execute multi-agent coordination`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setState(json.data);
        const agentCount = Object.keys(json.data.agentStatuses || {}).length || 4;
        showToast(
          'success',
          'Coordinated Response Completed',
          `Successfully synthesized directives across ${agentCount} disaster response agents.`
        );
      } else {
        throw new Error(json.error || 'Server returned unsuccessful coordination result');
      }
    } catch (err: any) {
      console.error('Error executing coordinated response:', err);
      showToast(
        'error',
        'Coordinated Response Failed',
        err?.message || 'Unable to complete multi-agent response. Please try again.'
      );
    } finally {
      setIsLoading(false);
      fetchGeminiStatus();
    }
  };

  // Run selected agent only (Section 8)
  const handleAnalyzeSelectedAgent = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: selectedAgent }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to run ${selectedAgent}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setState(json.data);
        showToast(
          'success',
          `${selectedAgent} Analysis Complete`,
          `Updated operational recommendations and sector telemetry for ${selectedAgent}.`
        );
      } else {
        throw new Error(json.error || `Server failed to analyze ${selectedAgent}`);
      }
    } catch (err: any) {
      console.error(`Error running ${selectedAgent}:`, err);
      showToast(
        'error',
        `${selectedAgent} Execution Failed`,
        err?.message || `Unable to complete analysis for ${selectedAgent}. Please try again.`
      );
    } finally {
      setIsLoading(false);
      fetchGeminiStatus();
    }
  };

  // Reset simulation to baseline
  const handleReset = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setState(json.data);
      }
    } catch (err) {
      console.error('Error resetting simulation:', err);
    } finally {
      setIsLoading(false);
      fetchGeminiStatus();
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col selection:bg-red-500/30 selection:text-white antialiased">
      {/* Top Navbar */}
      <Navbar
        state={state}
        geminiStatus={geminiStatus}
        onRunCoordinatedResponse={handleRunCoordinatedResponse}
        onReset={handleReset}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isLoading={isLoading}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Layout: Left Sidebar + Main Content */}
      <div className="flex-1 flex flex-row relative min-h-0 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          state={state}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 h-full min-h-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto overflow-x-hidden">
          {fetchError && (
            <div className="mb-4 p-3 bg-slate-900 border border-amber-600/60 rounded-xl text-xs font-mono text-amber-300 flex items-center justify-between gap-2 shadow-xs">
              <span className="truncate">Connection notice: {fetchError}. Retrying in background...</span>
              <button
                onClick={handleManualReconnect}
                className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-800 rounded text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                Reconnect Now
              </button>
            </div>
          )}

          {/* 1. Dashboard (Main Landing Page) */}
          {currentTab === 'dashboard' && (
            <DashboardView
              state={state}
              geminiStatus={geminiStatus}
              satelliteMonitoring={satelliteMonitoring}
              onNavigateTab={setCurrentTab}
              onRunCoordinatedResponse={handleRunCoordinatedResponse}
              isLoading={isLoading}
            />
          )}

          {/* 2. Live Incidents */}
          {currentTab === 'incidents' && (
            <LiveIncidentsView
              state={state}
              onStateUpdate={setState}
            />
          )}

          {/* 3. Agent Operations */}
          {currentTab === 'agent-operations' && (
            <AgentOperationsView
              state={state}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
              onAnalyzeSelectedAgent={handleAnalyzeSelectedAgent}
              isLoading={isLoading}
            />
          )}

          {/* 4. Resources */}
          {currentTab === 'resources' && (
            <ResourcesView state={state} />
          )}

          {/* 5. Response Plan */}
          {currentTab === 'response-plan' && (
            <ResponsePlanView
              state={state}
              onRunCoordinatedResponse={handleRunCoordinatedResponse}
              isLoading={isLoading}
              onStateUpdate={setState}
            />
          )}

          {/* 6. Alerts */}
          {currentTab === 'alerts' && (
            <AlertsView
              state={state}
              onStateUpdate={setState}
            />
          )}

          {/* 7. History */}
          {currentTab === 'history' && (
            <ResponseHistoryView state={state} />
          )}

          {/* 8. Architecture */}
          {currentTab === 'architecture' && (
            <ArchitectureView />
          )}

          {/* 9. Reports */}
          {currentTab === 'reports' && (
            <ReportsView state={state} />
          )}

          {/* 10. Settings */}
          {currentTab === 'settings' && (
            <SettingsView
              state={state}
              geminiStatus={geminiStatus}
              onRefreshStatus={fetchGeminiStatus}
            />
          )}
        </main>
      </div>

      {/* Floating Toast Notification Container */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md w-full px-4 sm:px-0 transition-all duration-300 ease-out"
        >
          <div
            className={`p-4 rounded-xl border shadow-xl backdrop-blur-md flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-100 shadow-red-950/50'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-100 shadow-slate-950/50'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider leading-snug">
                {toast.title}
              </h4>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-sans">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => setToast(null)}
              className="shrink-0 text-slate-400 hover:text-white transition p-1 rounded-md hover:bg-white/10 cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => (response.ok ? response.json() : { success: false }))
      .then((result) => {
        if (!active) return;
        if (result.success && result.data) {
          setUser(result.data);
          setAuthStatus('authenticated');
        } else {
          setUser(null);
          setAuthStatus('unauthenticated');
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setAuthStatus('unauthenticated');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setUser(null);
    setAuthStatus('unauthenticated');
  };

  const handleLogin = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    setAuthStatus('authenticated');
  };

  if (authStatus === 'checking') return <div className="min-h-screen bg-slate-950" />;
  if (authStatus === 'unauthenticated' || !user) return <Login onLogin={handleLogin} />;
  return <DashboardApp user={user} onLogout={handleLogout} />;
}
