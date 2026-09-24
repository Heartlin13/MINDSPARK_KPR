import React, { useState } from 'react';
import { 
  Activity, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  ChevronUp, 
  ChevronDown, 
  X,
  Server,
  Zap,
  Radio,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SystemExecutionState, SystemLogEntry } from '../types/disaster';

interface SystemHealthDrawerProps {
  state: SystemExecutionState | null;
}

export const SystemHealthDrawer: React.FC<SystemHealthDrawerProps> = ({ state }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('ALL');

  if (!state) return null;

  const logs = state.logs || [];
  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.level === logFilter;
  });

  const getLogLevelBadge = (level: SystemLogEntry['level']) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-950 text-red-400 border-red-800';
      case 'WARN':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'AGENT':
        return 'bg-purple-950 text-purple-400 border-purple-800';
      case 'RULE':
        return 'bg-cyan-950 text-cyan-400 border-cyan-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Floating Bottom Ribbon */}
      <div className="bg-slate-950/95 border-t border-slate-800 backdrop-blur-md px-4 py-2 flex items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center space-x-3 overflow-x-auto">
          {/* Health Pill */}
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>SYSTEM HEALTH: NOMINAL</span>
          </div>

          <span className="text-slate-700">|</span>

          {/* Microservices */}
          <div className="hidden sm:flex items-center space-x-3 text-slate-400 text-[11px]">
            <span>
              Bus: <span className="text-cyan-400 font-semibold">ONLINE</span>
            </span>
            <span>
              Conflict Engine: <span className="text-emerald-400 font-semibold">STANDBY</span>
            </span>
            <span>
              Constraint Validator: <span className="text-emerald-400 font-semibold">ENFORCED</span>
            </span>
            <span>
              Model: <span className="text-purple-400 font-semibold">gemini-3.1-flash-lite / flash</span>
            </span>
          </div>
        </div>

        {/* Toggle Debug Logs Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isOpen ? 'Close Telemetry Log' : 'Live Microservice Telemetry'}</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-cyan-300">
            {logs.length}
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Logs Drawer */}
      {isOpen && (
        <div className="bg-slate-950 border-t border-slate-800 p-4 h-72 max-h-80 overflow-hidden flex flex-col shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Microservice Diagnostic Event Stream
              </h3>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1 text-[10px] font-mono">
              {['ALL', 'AGENT', 'RULE', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2 py-0.5 rounded transition ${
                    logFilter === lvl
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 font-mono text-[11px] pr-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-1.5 rounded bg-slate-900/60 border border-slate-800/60 flex items-start space-x-2"
              >
                <span className="text-slate-500 shrink-0 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold shrink-0 ${getLogLevelBadge(
                    log.level
                  )}`}
                >
                  {log.level}
                </span>
                <span className="text-cyan-400 font-semibold shrink-0">
                  [{log.service}]
                </span>
                <span className="text-slate-300 font-sans text-xs">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
