import React from 'react';
import { History, FileText } from 'lucide-react';
import { SystemExecutionState, AuditTrailEntry } from '../types/disaster';

interface ResponseHistoryViewProps {
  state: SystemExecutionState | null;
}

export const ResponseHistoryView: React.FC<ResponseHistoryViewProps> = ({ state }) => {
  if (!state) return null;

  const auditTrail: AuditTrailEntry[] = state.auditTrail || [];

  const getStatusBadge = (status: AuditTrailEntry['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            COMPLETED
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
            PENDING
          </span>
        );
      case 'ALERT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
            ALERT
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
            LOGGED
          </span>
        );
    }
  };

  const extractZone = (text: string) => {
    const match = text.match(/Zone\s+[A-D]/i);
    return match ? match[0] : 'All Zones';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit log of operations, agent analyses, resource allocations, and approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Logged Events:</span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-slate-200">
            {auditTrail.length}
          </span>
        </div>
      </div>

      {/* SECTION 18: RESPONSE HISTORY TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        {auditTrail.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-mono">
            No response history yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Agent/System</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditTrail.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">
                      {entry.action}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 whitespace-nowrap">
                      {extractZone(entry.action + ' ' + (entry.details || ''))}
                    </td>
                    <td className="py-2.5 px-3 text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                        {entry.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {getStatusBadge(entry.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
