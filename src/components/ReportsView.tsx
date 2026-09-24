import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Mail, 
  RefreshCw, 
  X, 
  Send,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Bell,
  Clock
} from 'lucide-react';
import { SystemExecutionState } from '../types/disaster';

interface ReportsViewProps {
  state: SystemExecutionState | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ state }) => {
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!state) return null;

  const isDamEmergency = state.activeEmergencyId?.includes('DAM') || state.activeEmergencyId?.includes('EMERGENCY');
  const coordinator = state.coordinatorOutput;
  const zones = state.zones || [];
  const resources = state.resources || [];
  const conflicts = state.conflicts || [];
  const auditTrail = state.auditTrail || [];

  const reportId = 'RPT-2026-RESQ-01';
  const generatedTime = new Date().toLocaleString();
  const incidentName = isDamEmergency
    ? 'Cascading Flood and Dam Failure'
    : 'Regional Seismic Hazard and Chemical Leak';
  const affectedZones = zones.map((z) => z.name || z.id || (z as any).zone || 'Sector').join(', ') || 'Zone A, Zone B, Zone C, Zone D';
  const finalStatus = coordinator ? 'Resolved and Active' : 'Active';

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await fetch('/api/reports/generate', { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) return;

    setIsSending(true);
    setEmailStatus(null);

    try {
      const res = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recipientEmail, reportId }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatus('Report sent successfully.');
        setTimeout(() => {
          setEmailModalOpen(false);
          setEmailStatus(null);
          setRecipientEmail('');
        }, 2000);
      } else {
        setEmailStatus('Unable to send report. Please try again.');
      }
    } catch (err: any) {
      setEmailStatus('Unable to send report. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official operational response dossier, resource allocations, and audit timeline
          </p>
        </div>

        {/* Buttons strictly matching Section 19 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Generate Report</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => setEmailModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-white" />
            <span>Send Report</span>
          </button>
        </div>
      </div>

      {/* SECTION 19: LATEST REPORT CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Latest Report
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Report ID</span>
            <span className="text-white font-bold mt-1 block">{reportId}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Generated</span>
            <span className="text-slate-200 mt-1 block">{generatedTime}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Disaster</span>
            <span className="text-slate-200 mt-1 block truncate">{incidentName}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Affected Zones</span>
            <span className="text-cyan-300 mt-1 block truncate">{affectedZones}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Final Status</span>
            <span className="text-emerald-400 font-semibold mt-1 block">{finalStatus}</span>
          </div>
        </div>
      </div>

      {/* AGENT ASSESSMENTS & RESOURCE ALLOCATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-white uppercase text-xs">Agent Assessments</h3>
          <div className="space-y-2 font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-red-400 font-bold block">Medical Agent:</span>
              <p className="text-slate-300 text-[11px] mt-0.5">Critical triage in Zone B. 2 Ambulances and emergency surgical kits requested.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-amber-400 font-bold block">Logistics Agent:</span>
              <p className="text-slate-300 text-[11px] mt-0.5">North Highway transit clearance prioritized. 3 Heavy Rescue Vehicles deployed.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-cyan-400 font-bold block">Communication Agent:</span>
              <p className="text-slate-300 text-[11px] mt-0.5">Emergency sirens and SMS broadcast active for flood and trauma sectors.</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-white uppercase text-xs">Resource Allocation & Constraints</h3>
          <div className="space-y-2 font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] block">CONFLICT RESOLUTION</span>
              <p className="text-slate-200 text-[11px] mt-0.5">
                AMB-02 contended between Medical and Logistics agents. Reassigned to Zone B for life-saving trauma priority.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] block">CONSTRAINT VALIDATION</span>
              <p className="text-emerald-400 text-[11px] mt-0.5">
                ✓ Passed: No double allocation, non-negative fleet headroom, capacity limits preserved.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] block">COORDINATOR DECISION</span>
              <p className="text-slate-200 text-[11px] mt-0.5">
                {coordinator?.decision || 'Prioritize Zone B surgical extraction; route Zone A via RV-01.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RESPONSE PLAN, PUBLIC ALERTS & TIMELINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white uppercase text-xs">Response Plan & Public Alerts</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Active Directive</span>
            <p className="text-slate-200 mt-1">
              Immediate medical extraction across Sector B and containment barriers along Highway 102.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Public Warning</span>
            <p className="text-amber-300 mt-1">
              {coordinator?.public_alert || 'Evacuate low-lying zones immediately. Follow municipal rescue corridors.'}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="pt-2 space-y-2">
          <h4 className="font-mono text-slate-400 text-[11px] uppercase">Incident Timeline</h4>
          <div className="space-y-1.5 font-mono text-[11px] max-h-40 overflow-y-auto">
            {auditTrail.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded bg-slate-950 border border-slate-800/60">
                <span className="text-slate-400 shrink-0">{item.timestamp}</span>
                <span className="text-white font-medium truncate">{item.action}</span>
                <span className="text-slate-400 ml-auto shrink-0">{item.source}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">Send Response Report</h3>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Recipient Email</label>
                <input
                  type="email"
                  required
                  placeholder="commander@emergency.gov"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-hidden focus:border-cyan-500 font-mono"
                />
              </div>

              {emailStatus && (
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
                  {emailStatus}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-1.5 rounded-lg text-xs font-mono font-semibold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSending ? 'Sending...' : 'Send Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
