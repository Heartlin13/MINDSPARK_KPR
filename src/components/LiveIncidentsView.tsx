import React, { useState } from 'react';
import { 
  AlertOctagon, 
  MapPin, 
  Users, 
  Activity, 
  ShieldAlert, 
  PlusCircle, 
  Send, 
  CheckCircle2, 
  Clock, 
  Check, 
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { SystemExecutionState, DisasterZone } from '../types/disaster';

interface LiveIncidentsViewProps {
  state: SystemExecutionState | null;
  onStateUpdate?: (newState: SystemExecutionState) => void;
}

export const LiveIncidentsView: React.FC<LiveIncidentsViewProps> = ({
  state,
  onStateUpdate,
}) => {
  const [emergencyType, setEmergencyType] = useState<string>('Dam Failure');
  const [targetZone, setTargetZone] = useState<string>('Zone C');
  const [severityIncrease, setSeverityIncrease] = useState<number>(25);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!state) return null;

  const isDamEmergency = state.activeEmergencyId?.includes('DAM') || state.activeEmergencyId?.includes('EMERGENCY');
  const zones: DisasterZone[] = state.zones || [];
  const passports = state.rescuePassports || [];

  const totalPeopleAtRisk = zones.reduce((acc, z) => acc + (z.peopleAtRisk || 0), 0);
  const totalInjured = zones.reduce((acc, z) => acc + (z.injured || 0), 0);

  // Trigger New Emergency (Section 16)
  const handleTriggerEmergency = async () => {
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/emergency/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyType,
          targetZone,
          severityIncrease,
        }),
      });
      const json = await res.json();
      if (json.success && onStateUpdate) {
        onStateUpdate(json.data);
        setNotice(
          `New Emergency [${emergencyType} in ${targetZone}] triggered. Multi-agent re-planning completed.`
        );
      } else {
        setNotice('Failed to trigger emergency. Please check connectivity.');
      }
    } catch (err: any) {
      setNotice('Unable to trigger emergency. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify Help Received (Feature 4 preserved)
  const handleVerifyHelp = async (incidentId: string, status: 'CONFIRMED' | 'DELAYED' | 'FAILED') => {
    try {
      const res = await fetch('/api/passport/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId,
          status,
          notes: `Field verification: ${status} recorded by commander.`,
        }),
      });
      const json = await res.json();
      if (json.success && onStateUpdate) {
        onStateUpdate(json.data);
        setNotice(`Assistance verification updated: ${incidentId} marked as ${status}.`);
      }
    } catch (err: any) {
      setNotice('Failed to update verification status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Live Incidents
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time incident tracking, casualty metrics, dynamic escalation, and rescue lifecycle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            {isDamEmergency ? 'CRITICAL DISASTER ACTIVE' : 'ACTIVE INCIDENT'}
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ACTIVE INCIDENT DETAILS CARD (SECTION 5) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            Current Situation
          </h2>
          <span className="text-xs font-mono text-slate-400">Incident Telemetry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block uppercase">Incident Type</span>
            <span className="text-white font-bold text-sm mt-1 block">
              {isDamEmergency ? 'Flood / Dam Failure' : 'Regional Seismic Hazard'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block uppercase">Location / Affected</span>
            <span className="text-cyan-300 font-bold text-sm mt-1 block">
              {zones.map((z) => z.name || z.id || (z as any).zone || 'Sector').join(', ')}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block uppercase">People at Risk</span>
            <span className="text-amber-400 font-bold text-sm mt-1 block">
              {totalPeopleAtRisk.toLocaleString()}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block uppercase">Reported Injuries</span>
            <span className="text-red-400 font-bold text-sm mt-1 block">
              {totalInjured} Casualties
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 16: DYNAMIC EMERGENCY HANDLING (NEW EMERGENCY TRIGGER) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-400" />
              New Emergency
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Escalate conditions in a specific sector. Automatically triggers multi-agent re-planning and revised response plan.
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400 font-semibold">Incident Escalation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 font-mono text-[11px] block mb-1.5">Emergency Type</label>
            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              <option value="Dam Failure">Dam Failure (Flash Flood)</option>
              <option value="Chemical Hazmat Leak">Chemical Hazmat Leak</option>
              <option value="Structural Collapse">Structural Collapse</option>
              <option value="Wildfire Perimeter Breach">Wildfire Perimeter Breach</option>
              <option value="Grid Power Failure">Grid Power Failure</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-mono text-[11px] block mb-1.5">Target Zone</label>
            <select
              value={targetZone}
              onChange={(e) => setTargetZone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              {zones.map((z) => {
                const zoneName = z.name || z.id || (z as any).zone || 'Zone';
                return (
                  <option key={z.id || zoneName} value={zoneName}>
                    {zoneName} (Current Risk: {z.severityScore || 50}/100)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-mono text-[11px] block mb-1.5">Severity Surge</label>
            <select
              value={severityIncrease}
              onChange={(e) => setSeverityIncrease(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              <option value={15}>+15% Moderate Escalation</option>
              <option value={25}>+25% Critical Surge</option>
              <option value={40}>+40% Catastrophic Inundation</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleTriggerEmergency}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'Executing Re-Planning...' : 'Trigger Emergency'}</span>
          </button>
        </div>
      </div>

      {/* RESCUE PASSPORT & LIFECYCLE (FEATURE 3 & 4 PRESERVED) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Rescue Passports & Field Verification
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict end-to-end verification. Dispatched does not equal received until confirmed.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Lifecycle Tracking</span>
        </div>

        <div className="space-y-4">
          {passports.map((passport) => (
            <div key={passport.incidentId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {passport.incidentId}
                  </span>
                  <span className="font-semibold text-white">{passport.location}</span>
                  <span className="text-slate-400">({passport.affectedPeople} affected, {passport.reportedInjuries} injured)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-cyan-300">
                    Vehicle: {passport.assignedVehicle} | Team: {passport.assignedMedicalTeam}
                  </span>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="grid grid-cols-7 gap-1 text-[10px] font-mono text-center pt-1">
                {(['PLAN', 'APPROVAL', 'DISPATCH', 'IN_TRANSIT', 'ARRIVAL', 'HELP_RECEIVED', 'COMPLETED'] as const).map((stage) => {
                  const status = passport.stageStatus?.[stage];
                  const isDone = status === 'COMPLETED';
                  const isInProg = status === 'IN_PROGRESS';
                  return (
                    <div
                      key={stage}
                      className={`p-1.5 rounded border ${
                        isDone
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : isInProg
                          ? 'bg-blue-950/60 border-blue-700 text-blue-300 animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="font-bold truncate">{stage.replace('_', ' ')}</div>
                      <div className="text-[9px] mt-0.5">{isDone ? '✓' : isInProg ? '...' : '-'}</div>
                    </div>
                  );
                })}
              </div>

              {/* Verification Section */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[11px]">Was assistance received?</span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                    passport.helpReceivedStatus === 'CONFIRMED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : passport.helpReceivedStatus === 'DELAYED'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : passport.helpReceivedStatus === 'FAILED'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {passport.helpReceivedStatus || 'PENDING VERIFICATION'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleVerifyHelp(passport.incidentId, 'CONFIRMED')}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] cursor-pointer"
                  >
                    Confirm Received
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyHelp(passport.incidentId, 'DELAYED')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/60 text-[11px] cursor-pointer"
                  >
                    Report Delay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyHelp(passport.incidentId, 'FAILED')}
                    className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] cursor-pointer"
                  >
                    Report Failure
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
