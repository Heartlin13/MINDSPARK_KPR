import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  FileQuestion,
  EyeOff,
  Plane,
  ShieldAlert,
  Search,
  Check,
  Radio,
  FileText
} from 'lucide-react';
import { DataHealthField, ConflictingReport, SystemExecutionState } from '../types/disaster';

interface DataHealthViewProps {
  state: SystemExecutionState;
  onStateUpdate: (newState: SystemExecutionState) => void;
}

export const DataHealthView: React.FC<DataHealthViewProps> = ({ state, onStateUpdate }) => {
  const dataHealthFields = state.dataHealthFields || [];
  const conflictingReports = state.conflictingReports || [];
  const [isVerifyingGap, setIsVerifyingGap] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Overall Data Confidence Calculation
  const totalFields = dataHealthFields.length || 1;
  const verifiedCount = dataHealthFields.filter((f) => f.status === 'VERIFIED').length;
  const confidenceScore = Math.round((verifiedCount / totalFields) * 100);

  // Invisible Zones / Data Gaps
  const dataGaps = dataHealthFields.filter((f) => f.status === 'UNKNOWN');
  const hasDataGap = dataGaps.length > 0;

  const handleVerifyGap = async () => {
    setIsVerifyingGap(true);
    setActionNotice(null);
    try {
      const res = await fetch('/api/intel/verify-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId: 'Zone D' }),
      });
      const json = await res.json();
      if (json.success) {
        onStateUpdate(json.data);
        setActionNotice('Reconnaissance UAV completed thermal scan of Zone D. Telemetry updated.');
      }
    } catch (err: any) {
      setActionNotice(`Scout dispatch error: ${err?.message || err}`);
    } finally {
      setIsVerifyingGap(false);
    }
  };

  const getStatusBadge = (status: DataHealthField['status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> VERIFIED
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
            <Clock className="w-3 h-3" /> STALE (&gt; 15m)
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800 animate-pulse">
            <HelpCircle className="w-3 h-3" /> UNKNOWN ≠ 0
          </span>
        );
      case 'CONFLICTING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
            <AlertTriangle className="w-3 h-3" /> CONFLICTING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
            UNVERIFIED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Data Health & Intelligence</h1>
          </div>
          <p className="text-xs text-slate-400">
            Ground-truth telemetry audit, conflicting intelligence detection, and invisible zone reconnaissance.
          </p>
        </div>

        {/* Global Data Confidence Badge */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Overall Data Confidence
              </span>
              <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
                <span>{confidenceScore}%</span>
                <span className="text-xs font-normal text-amber-400">
                  {confidenceScore >= 80 ? 'High Fidelity' : 'Caution Advised'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-amber-400">
              {verifiedCount}/{totalFields}
            </div>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* FEATURE 15: DATA GAP / INVISIBLE ZONE ALERT */}
      {hasDataGap && (
        <div className="rounded-xl border border-red-800/80 bg-red-950/40 p-5 shadow-lg space-y-3">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-900/60 text-red-200 shrink-0">
                <EyeOff className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-red-200 uppercase tracking-wide">
                    ⚠ DATA GAP DETECTED: ZONE D (WEST HILLS)
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-red-900 border border-red-700 font-mono text-red-100">
                    DO NOT ASSUME SAFE
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Zone D has insufficient sensor feeds and no ground responders. Population and injury counts are Unknown.
                  <strong className="text-amber-300"> Rule: Unknown is not zero.</strong> Do not divert resources away under false assumptions of safety.
                </p>
              </div>
            </div>

            <button
              disabled={isVerifyingGap}
              onClick={handleVerifyGap}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Plane className="w-4 h-4" />
              [ DISPATCH RECONNAISSANCE DRONE ]
            </button>
          </div>
        </div>
      )}

      {/* FEATURE 9: CONFLICTING INFORMATION DETECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              Conflicting Intelligence Feeds & Reports
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies divergent ground reports from multiple reporting channels rather than silently selecting one value.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
            {conflictingReports.length} Discrepancies
          </span>
        </div>

        <div className="space-y-4">
          {conflictingReports.map((cr) => (
            <div key={cr.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-400 font-mono uppercase">
                    ⚠ INFORMATION CONFLICT
                  </span>
                  <span className="text-xs font-semibold text-white">| {cr.topic} ({cr.zone})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Reported Range:</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-800 font-bold font-mono">
                    {cr.reportedRange}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                    {cr.status}
                  </span>
                </div>
              </div>

              {/* Source breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {cr.sources.map((src, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium truncate" title={src.source}>
                        {src.source}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px]">{src.timestamp}</span>
                    </div>
                    <div className="text-sm font-bold text-white font-mono">{String(src.reportedValue)}</div>
                    <div className="text-[10px] text-slate-400">
                      Reliability Score: <strong className="text-indigo-400">{Math.round(src.reliabilityScore * 100)}%</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-300">
                <span className="font-semibold text-amber-300 block text-[11px] mb-0.5">Required Action:</span>
                <p>{cr.recommendedAction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE 8: FIELD-LEVEL DATA HEALTH AUDIT TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Field-Level Telemetry Health Table
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Audits the freshness, verification status, and telemetry provenance for every key operational data point.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Strict Data Integrity Enforced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-3 py-2.5">Field / Metric</th>
                <th className="px-3 py-2.5">Sector</th>
                <th className="px-3 py-2.5">Reported Value</th>
                <th className="px-3 py-2.5">Data Health Status</th>
                <th className="px-3 py-2.5">Source Provenance</th>
                <th className="px-3 py-2.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dataHealthFields.map((field) => (
                <tr key={field.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-3 py-2.5 font-semibold text-white">{field.field}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">{field.zone}</td>
                  <td className="px-3 py-2.5 font-mono font-medium text-slate-200">
                    {field.isUnknown ? (
                      <span className="text-red-400 font-bold">Unknown</span>
                    ) : (
                      field.value
                    )}
                  </td>
                  <td className="px-3 py-2.5">{getStatusBadge(field.status)}</td>
                  <td className="px-3 py-2.5 text-slate-400 text-[11px] max-w-xs truncate" title={field.source}>
                    {field.source}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px]">{field.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
