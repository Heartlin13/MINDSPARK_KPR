import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  RefreshCw,
  Play,
  Clock,
  Radio,
  Sparkles,
  LogOut,
  UserRound
} from 'lucide-react';
import { GeminiStatusInfo, SystemExecutionState } from '../types/disaster';
import { AuthUser } from '../pages/Login';

interface NavbarProps {
  state: SystemExecutionState | null;
  geminiStatus: GeminiStatusInfo | null;
  onRunCoordinatedResponse: () => void;
  onReset: () => void;
  onToggleMobileSidebar?: () => void;
  isLoading: boolean;
  user: AuthUser;
  onLogout: () => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  geminiStatus,
  onRunCoordinatedResponse,
  onReset,
  onToggleMobileSidebar,
  isLoading,
  user,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isGeminiConnected = geminiStatus?.status === 'CONNECTED';

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-30 select-none">
      <div className="max-w-7xl mx-auto w-full min-h-[74px] px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        {/* Mobile navigation trigger */}
        <div className="flex min-w-0 flex-1 shrink items-center">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 md:hidden cursor-pointer"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

        </div>

        {/* Right side: Live System Status, Gemini AI, Clock & Primary Actions */}
        <div className="ml-auto flex shrink-0 items-center justify-end gap-4 whitespace-nowrap">
          {/* Dynamic Last Updated Clock */}
          <div className="hidden lg:flex flex-col items-end justify-center whitespace-nowrap text-right font-mono">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Last Updated</span>
            <span className="text-xs text-slate-200 font-semibold flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3 text-slate-400" />
              {currentTime || '00:00:00'}
            </span>
          </div>

          <div className="hidden lg:block h-7 w-px shrink-0 bg-slate-800" />

          {/* Gemini AI Status */}
          <div className="hidden sm:flex flex-col items-start justify-center whitespace-nowrap text-left font-mono">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Gemini AI</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isGeminiConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className={isGeminiConnected ? 'text-slate-200 font-medium' : 'text-amber-300 font-medium'}>
                {isGeminiConnected ? 'Connected' : 'Fallback'}
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-px shrink-0 bg-slate-800" />

          {/* System Status */}
          <div className="hidden md:flex flex-col items-start justify-center whitespace-nowrap text-left font-mono">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">System</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-200 font-medium">Operational</span>
            </div>
          </div>

          {/* Reset Simulation Button */}
          <button
            onClick={onReset}
            disabled={isLoading}
            title="Reset simulation state to baseline"
            className="inline-flex items-center justify-center whitespace-nowrap p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* RUN COORDINATED RESPONSE Button (Replaces Run Multi-Agent Demo) */}
          <button
            onClick={onRunCoordinatedResponse}
            disabled={isLoading}
            className="inline-flex items-center justify-center whitespace-nowrap space-x-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-mono">
              {isLoading ? 'Coordinating...' : 'RUN COORDINATED RESPONSE'}
            </span>
            <span className="sm:hidden font-mono">
              {isLoading ? '...' : 'COORDINATE'}
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <UserRound className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline max-w-24 truncate text-xs text-slate-300" title={user.email || user.username}>
              {user.username}
            </span>
            <button
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="inline-flex items-center justify-center whitespace-nowrap p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
