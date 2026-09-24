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
import { AgentRole, GeminiStatusInfo, SystemExecutionState } from './types/disaster';
import { INITIAL_DEFAULT_STATE } from './utils/defaultState';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

// WebSocket status type for robust real-time synchronization
type WebSocketState = 'connecting' | 'connected' | 'reconnecting' | 'idle' | 'offline';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [state, setState] = useState<SystemExecutionState>(INITIAL_DEFAULT_STATE);
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatusInfo | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>('Medical Agent');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [wsState, setWsState] = useState<WebSocketState>('idle');
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

  const stateDelayRef = React.useRef<number>(BASE_STATE_INTERVAL_MS);
  const geminiDelayRef = React.useRef<number>(BASE_GEMINI_INTERVAL_MS);

  // WebSocket linear backoff refs (start at 2000ms, increase by 2000ms on failure up to 16000ms max)
  const wsLinearBackoffMsRef = React.useRef<number>(2000);
  const WS_LINEAR_STEP_MS = 2000;
  const WS_MAX_BACKOFF_MS = 16000;
  const wsRef = React.useRef<WebSocket | null>(null);
  const wsReconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = React.useRef<boolean>(true);

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

  // Robust WebSocket Connection Handler with Linear Backoff on Failure
  const connectWebSocket = useCallback(() => {
    // Guard against running in non-browser environments or when component unmounted
    if (!isMountedRef.current || typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      return;
    }

    // Clean up any stale socket instance
    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
      } catch {
        // Safe disposal
      }
      wsRef.current = null;
    }

    try {
      setWsState((prev) => (prev === 'idle' ? 'connecting' : 'reconnecting'));
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMountedRef.current) return;
        setWsState('connected');
        // Reset linear backoff on successful connection
        wsLinearBackoffMsRef.current = 2000;
        // Immediate state sync upon channel open
        fetchState();
      };

      socket.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'STATE_UPDATE' && payload.data) {
            setState(payload.data);
          } else if (payload?.type === 'PING') {
            socket.send(JSON.stringify({ type: 'PONG' }));
          }
        } catch {
          // Ignore non-json or unparsed ping frames safely
        }
      };

      // Handle socket error gracefully - prevents unhandled rejection or app crash during early mount
      socket.onerror = () => {
        // Suppress browser console noise and handle state transition safely
        if (!isMountedRef.current) return;
        setWsState('offline');
      };

      socket.onclose = () => {
        if (!isMountedRef.current) return;
        setWsState('offline');
        wsRef.current = null;

        // Schedule reconnection with linear backoff only when connection fails
        const nextDelay = wsLinearBackoffMsRef.current;
        wsLinearBackoffMsRef.current = Math.min(wsLinearBackoffMsRef.current + WS_LINEAR_STEP_MS, WS_MAX_BACKOFF_MS);

        if (wsReconnectTimeoutRef.current) {
          clearTimeout(wsReconnectTimeoutRef.current);
        }

        wsReconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connectWebSocket();
          }
        }, nextDelay);
      };
    } catch {
      // Early mount initialization failure guard: ensures UI doesn't crash
      if (!isMountedRef.current) return;
      setWsState('offline');
      const nextDelay = wsLinearBackoffMsRef.current;
      wsLinearBackoffMsRef.current = Math.min(wsLinearBackoffMsRef.current + WS_LINEAR_STEP_MS, WS_MAX_BACKOFF_MS);

      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
      }
      wsReconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connectWebSocket();
        }
      }, nextDelay);
    }
  }, [fetchState]);

  // Initialize WebSocket connection safely after early mount
  useEffect(() => {
    isMountedRef.current = true;

    // Slight deferral (300ms) to ensure early DOM and network context are ready
    const initTimer = setTimeout(() => {
      connectWebSocket();
    }, 300);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initTimer);
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        try {
          wsRef.current.onopen = null;
          wsRef.current.onmessage = null;
          wsRef.current.onerror = null;
          wsRef.current.onclose = null;
          wsRef.current.close();
        } catch {
          // Safe unmount
        }
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  // Resilient Exponential Backoff Polling Loops
  useEffect(() => {
    let stateTimeoutId: NodeJS.Timeout;
    let geminiTimeoutId: NodeJS.Timeout;
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

    // Initial triggers
    fetchState();
    fetchGeminiStatus();

    // Start recursive scheduled backoff loops
    scheduleStatePoll();
    scheduleGeminiPoll();

    return () => {
      isMounted = false;
      clearTimeout(stateTimeoutId);
      clearTimeout(geminiTimeoutId);
    };
  }, [fetchState, fetchGeminiStatus]);

  const handleManualReconnect = useCallback(() => {
    stateDelayRef.current = BASE_STATE_INTERVAL_MS;
    geminiDelayRef.current = BASE_GEMINI_INTERVAL_MS;
    wsLinearBackoffMsRef.current = 2000;
    fetchState();
    fetchGeminiStatus();
    connectWebSocket();
  }, [fetchState, fetchGeminiStatus, connectWebSocket]);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-red-500/30 selection:text-white antialiased">
      {/* Top Navbar */}
      <Navbar
        state={state}
        geminiStatus={geminiStatus}
        onRunCoordinatedResponse={handleRunCoordinatedResponse}
        onReset={handleReset}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isLoading={isLoading}
      />

      {/* Main Layout: Left Sidebar + Main Content */}
      <div className="flex-1 flex flex-row relative min-h-0">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
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
