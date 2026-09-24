import React, { useState } from 'react';
import {
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Send,
  Check,
  RotateCcw,
  XCircle,
  Flame,
  Truck,
  Building,
  UserCheck
} from 'lucide-react';
import { RescuePassport, RescuePassportStage, SystemExecutionState } from '../types/disaster';

interface RescuePassportsViewProps {
  state: SystemExecutionState;
  onStateUpdate: (newState: SystemExecutionState) => void;
}

export const RescuePassportsView: React.FC<RescuePassportsViewProps> = ({ state, onStateUpdate }) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    state.rescuePassports?.[0]?.incidentId || 'INC-B-01'
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const passports = state.rescuePassports || [];
  const selectedPassport = passports.find((p) => p.incidentId === selectedIncidentId) || passports[0];

  const stages: { key: RescuePassportStage; label: string }[] = [
    { key: 'PLAN', label: 'PLAN' },
    { key: 'APPROVAL', label: 'APPROVAL' },
    { key: 'DISPATCH', label: 'DISPATCH' },
    { key: 'IN_TRANSIT', label: 'IN TRANSIT' },
    { key: 'ARRIVAL', label: 'ARRIVAL' },
    { key: 'HELP_RECEIVED', label: 'HELP RECEIVED' },
    { key: 'COMPLETED', label: 'COMPLETED' },
  ];

  const handleVerify = async (status: 'CONFIRMED' | 'DELAYED' | 'FAILED') => {
    if (!selectedPassport) return;
    setIsVerifying(true);
    setActionNotice(null);

    try {
      const res = await fetch('/api/passport/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: selectedPassport.incidentId,
          status,
          notes: verificationNotes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onStateUpdate(json.data);
        setActionNotice(
          status === 'CONFIRMED'
            ? `Assistance confirmed for ${selectedPassport.incidentId}. Incident marked COMPLETED and resources freed for reuse.`
            : status === 'DELAYED'
            ? `Delay reported for ${selectedPassport.incidentId}. Re-monitoring transit corridor.`
            : `Response chain broken for ${selectedPassport.incidentId}. Coordinator replanning triggered.`
        );
        setVerificationNotes('');
      }
    } catch (err: any) {
      setActionNotice(`Error recording verification: ${err?.message || err}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const getStageIcon = (stageKey: RescuePassportStage, passport: RescuePassport) => {
    const status = passport.stageStatus[stageKey];
    if (status === 'COMPLETED') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === 'IN_PROGRESS') return <Clock className="w-4 h-4 text-blue-400 animate-spin" />;
    if (status === 'FAILED') return <XCircle className="w-4 h-4 text-red-400" />;
    if (status === 'DELAYED') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    if (stageKey === 'HELP_RECEIVED' && passport.helpReceivedStatus === 'PENDING_VERIFICATION') {
      return <HelpCircle className="w-4 h-4 text-amber-400" />;
    }
    return <Clock className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Ticket className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Rescue Passports & Lifecycle</h1>
          </div>
          <p className="text-xs text-slate-400">
            End-to-end incident lifecycle tracking, verification of assistance received, and response chain integrity monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Rule:</span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300">
            DISPATCHED ≠ RECEIVED
          </span>
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

      {/* INCIDENT PASSPORT SELECTOR TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {passports.map((p) => {
          const isSelected = p.incidentId === selectedIncidentId;
          const isCompleted = p.stage === 'COMPLETED' && p.helpReceivedStatus === 'CONFIRMED';
          const isBroken = p.failurePoint !== null && p.failurePoint !== undefined;

          return (
            <div
              key={p.incidentId}
              onClick={() => setSelectedIncidentId(p.incidentId)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {p.incidentId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.priority === 'CRITICAL'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : p.priority === 'HIGH'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {p.priority}
                </span>
              </div>
              <h3 className="font-semibold text-xs text-slate-200 truncate" title={p.location}>
                {p.location}
              </h3>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Stage: <strong className="text-white">{p.stage}</strong></span>
                {isCompleted ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Completed
                  </span>
                ) : isBroken ? (
                  <span className="text-red-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Broken Chain
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5" /> Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPassport && (
        <div className="space-y-6">
          {/* FEATURE 5: RESPONSE CHAIN MONITOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                  Response Chain Monitor
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual execution pipeline from initial planning to ground-truth help delivery.
                </p>
              </div>

              {selectedPassport.failurePoint ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-950 border border-red-800 text-xs font-bold text-red-300 animate-pulse">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  ⚠ RESPONSE CHAIN BROKEN
                </span>
              ) : selectedPassport.stage === 'COMPLETED' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950 border border-emerald-800 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Lifecycle Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-950 border border-blue-800 text-xs font-semibold text-blue-300">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Stage: {selectedPassport.stage}
                </span>
              )}
            </div>

            {/* FAILURE BANNER IF CHAIN BROKEN */}
            {selectedPassport.failurePoint && (
              <div className="p-3.5 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-300">
                  <AlertCircle className="w-4 h-4" />
                  Failure Point: {selectedPassport.failurePoint}
                </div>
                <p className="text-slate-200">
                  Reason: {selectedPassport.failureReason || 'Response unit unable to reach destination or assist casualties.'}
                </p>
                <div className="text-[11px] text-red-400 pt-1 font-mono">
                  Directive: Autonomous Coordinator replanning triggered. Backup asset reassignment queued.
                </div>
              </div>
            )}

            {/* Visual Timeline Nodes */}
            <div className="overflow-x-auto pb-2">
              <div className="flex items-center justify-between min-w-[650px] gap-2">
                {stages.map((stg, idx) => {
                  const status = selectedPassport.stageStatus[stg.key];
                  const isCurrent = selectedPassport.stage === stg.key;
                  const isBroken = selectedPassport.failurePoint === stg.key;

                  return (
                    <React.Fragment key={stg.key}>
                      <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                            isBroken
                              ? 'bg-red-950 border-red-600 text-red-400 ring-2 ring-red-500/50'
                              : status === 'COMPLETED'
                              ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                              : isCurrent
                              ? 'bg-blue-950 border-blue-500 text-blue-300 ring-2 ring-blue-500/40'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          {getStageIcon(stg.key, selectedPassport)}
                        </div>
                        <span className={`text-[11px] font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                          {stg.label}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            isBroken
                              ? 'bg-red-900/60 text-red-300'
                              : status === 'COMPLETED'
                              ? 'text-emerald-400 bg-emerald-950/60'
                              : isCurrent
                              ? 'text-blue-300 bg-blue-950/60'
                              : 'text-slate-500'
                          }`}
                        >
                          {isBroken ? 'FAILED' : status}
                        </span>
                      </div>
                      {idx < stages.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 min-w-[20px] transition-colors ${
                            selectedPassport.stageStatus[stages[idx + 1].key] === 'COMPLETED' ||
                            selectedPassport.stage === stages[idx + 1].key
                              ? 'bg-blue-500'
                              : 'bg-slate-800'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FEATURE 3: RESCUE PASSPORT DETAILS CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-white px-2.5 py-1 rounded bg-slate-800 border border-slate-700">
                    PASSPORT: {selectedPassport.incidentId}
                  </span>
                  <span className="text-xs text-slate-400">Live Mission Dossier</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Updated: {new Date(selectedPassport.updatedAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[11px] block">Location / Sector</span>
                  <span className="font-semibold text-white text-sm block">{selectedPassport.location}</span>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[11px] block">Casualty & Triage Telemetry</span>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400">At Risk: </span>
                      <strong className="text-white font-mono">{selectedPassport.affectedPeople}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Injuries: </span>
                      <strong className="text-red-400 font-mono font-bold">{selectedPassport.reportedInjuries}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[11px] block flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    Assigned Vehicle Fleet
                  </span>
                  <span className="font-semibold text-slate-200">{selectedPassport.assignedVehicle}</span>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-1">
                  <span className="text-slate-400 text-[11px] block flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Assigned Medical Personnel
                  </span>
                  <span className="font-semibold text-slate-200">{selectedPassport.assignedMedicalTeam}</span>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-1 sm:col-span-2">
                  <span className="text-slate-400 text-[11px] block flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-purple-400" />
                    Designated Receiving Shelter / Evac Center
                  </span>
                  <span className="font-semibold text-slate-200">{selectedPassport.assignedShelter}</span>
                </div>
              </div>

              {selectedPassport.verificationNotes && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 block text-[11px] mb-1">Field Verification Log:</span>
                  <p>{selectedPassport.verificationNotes}</p>
                </div>
              )}
            </div>

            {/* FEATURE 4: HELP RECEIVED VERIFICATION ACTION PANEL */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Help Received Verification</h3>
                </div>

                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/70 text-xs text-amber-200 space-y-1">
                  <span className="font-bold block">Critical Human/Responder Check:</span>
                  <p className="text-[11px] leading-relaxed">
                    “Was assistance received?” An incident can never be completed merely because units were dispatched. Ground confirmation is required.
                  </p>
                </div>

                <div className="text-xs space-y-1.5">
                  <label className="text-slate-400 block text-[11px]">Field Notes / Verification Reason:</label>
                  <input
                    type="text"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="e.g., Triage complete; 18 victims treated or transit obstacle"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  disabled={isVerifying || selectedPassport.helpReceivedStatus === 'CONFIRMED'}
                  onClick={() => handleVerify('CONFIRMED')}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  [ CONFIRM RECEIVED ]
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isVerifying}
                    onClick={() => handleVerify('DELAYED')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    [ REPORT DELAY ]
                  </button>

                  <button
                    disabled={isVerifying}
                    onClick={() => handleVerify('FAILED')}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    [ REPORT FAILURE ]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
