import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Play,
  BatteryMedium,
  Check,
  Edit3,
  XCircle,
  UserCheck,
  Clock,
  Lock,
  Send,
  Truck,
  RotateCcw
} from 'lucide-react';
import { ApprovalState, ResourceUnit, SystemExecutionState } from '../types/disaster';

/* =====================================================================
   APPROVAL WORKFLOW COMPONENT
   ===================================================================== */

export interface ApprovalWorkflowProps {
  approvalState?: ApprovalState;
  resources: ResourceUnit[];
  isSubmitting?: boolean;
  onApprove: (
    approverName: string,
    role: string,
    decision: 'APPROVED' | 'MODIFIED' | 'REJECTED',
    modifications?: string,
    reason?: string,
    timestamp?: string
  ) => Promise<void> | void;
  onApprovalStatusChange?: (isApproved: boolean, approvalDetails?: ApprovalState) => void;
  proposedItems?: Array<{
    incident: string;
    destination: string;
    vehicle: string;
    medicalTeam: string;
    shelter: string;
    priority: string;
    reason: string;
    resourceImpact: string;
  }>;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  approvalState,
  resources,
  isSubmitting = false,
  onApprove,
  onApprovalStatusChange,
  proposedItems,
}) => {
  const [approverName, setApproverName] = useState('Cmdr. Elena Vance');
  const [approverRole, setApproverRole] = useState('Authorized Emergency Response Officer');
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [modificationNotes, setModificationNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const isApproved = approvalState?.status === 'PLAN_APPROVED';
  const isRejected = approvalState?.status === 'PLAN_REJECTED';
  const isModified = approvalState?.status === 'PLAN_MODIFIED';
  const isPending = !isApproved && !isRejected && !isModified;

  // Report approval status changes to parent component
  React.useEffect(() => {
    if (onApprovalStatusChange) {
      const isApprovedByCoordinator = approvalState?.status === 'PLAN_APPROVED' || approvalState?.status === 'PLAN_MODIFIED';
      onApprovalStatusChange(isApprovedByCoordinator, approvalState);
    }
  }, [approvalState, onApprovalStatusChange]);

  // Default proposed items if none provided
  const items = proposedItems || [
    {
      incident: 'Trauma Casualties',
      destination: 'Zone B',
      vehicle: 'AMB-02',
      medicalTeam: 'Team Alpha',
      shelter: 'Central Shelter',
      priority: 'CRITICAL',
      reason: 'Surgical extraction for crush injuries',
      resourceImpact: '1 Ambulance, 1 Team committed',
    },
    {
      incident: 'Chemical Dispersion',
      destination: 'Zone A',
      vehicle: 'RV-01',
      medicalTeam: 'Team Beta',
      shelter: 'North High Staging',
      priority: 'HIGH',
      reason: 'Evacuation perimeter security and toxic plume buffer',
      resourceImpact: '1 Heavy Vehicle, 1 Team committed',
    },
  ];

  const handleApproveClick = () => {
    const timestamp = new Date().toISOString();
    onApprove(
      approverName,
      approverRole,
      'APPROVED',
      undefined,
      'Verified and approved by officer.',
      timestamp
    );
  };

  const handleModifySubmit = () => {
    const timestamp = new Date().toISOString();
    onApprove(
      approverName,
      approverRole,
      'MODIFIED',
      modificationNotes,
      'Officer-directed modifications applied to operational directives.',
      timestamp
    );
    setShowModifyModal(false);
  };

  const handleRejectSubmit = () => {
    const timestamp = new Date().toISOString();
    onApprove(
      approverName,
      approverRole,
      'REJECTED',
      undefined,
      rejectReason || 'Plan rejected by officer. Replanning requested.',
      timestamp
    );
    setShowRejectModal(false);
  };

  return (
    <div className="space-y-4">
      {/* PROPOSED RESPONSE PLAN CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Proposed Response Plan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review incident assignments, vehicle routing, and resource impacts before official authorization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                isApproved
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : isRejected
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : isModified
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {isApproved
                ? 'PLAN APPROVED'
                : isRejected
                ? 'PLAN REJECTED'
                : isModified
                ? 'PLAN MODIFIED'
                : 'PENDING APPROVAL'}
            </span>
          </div>
        </div>

        {/* PROPOSED PLAN TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-mono">
                <th className="py-2.5 px-3">INCIDENT</th>
                <th className="py-2.5 px-3">DESTINATION</th>
                <th className="py-2.5 px-3">VEHICLE</th>
                <th className="py-2.5 px-3">MEDICAL TEAM</th>
                <th className="py-2.5 px-3">SHELTER</th>
                <th className="py-2.5 px-3">PRIORITY</th>
                <th className="py-2.5 px-3">REASON</th>
                <th className="py-2.5 px-3">RESOURCE IMPACT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                    {item.incident}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 whitespace-nowrap">
                    {item.destination}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold whitespace-nowrap">
                    {item.vehicle}
                  </td>
                  <td className="py-2.5 px-3 text-slate-200 whitespace-nowrap">
                    {item.medicalTeam}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                    {item.shelter}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.priority === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans max-w-xs truncate">
                    {item.reason}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {item.resourceImpact}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RESOURCE DISPATCH STATUS CALLOUT */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            isApproved || isModified
              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
              : 'bg-amber-950/30 border-amber-800 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isApproved || isModified ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="font-bold text-xs uppercase tracking-wide">
                {isApproved || isModified
                  ? 'Resource Dispatch: Authorized'
                  : 'Resource Dispatch: Disabled (Approval Required)'}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isApproved || isModified
                  ? `Plan approved by ${approvalState?.approverName || approverName}. Critical vehicles and teams are cleared for field deployment.`
                  : 'Critical vehicles (AMB-02, RV-01) remain locked in RESERVED status. Dispatch is strictly disabled until authorized.'}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold shrink-0 ${
              isApproved || isModified
                ? 'bg-emerald-900 border border-emerald-700 text-emerald-100'
                : 'bg-amber-900 border border-amber-700 text-amber-100'
            }`}
          >
            {isApproved || isModified ? 'DISPATCH UNLOCKED' : 'DISPATCH LOCKED'}
          </span>
        </div>

        {/* APPROVAL AUDIT RECORD (WHEN APPROVED OR REJECTED) */}
        {(isApproved || isModified || isRejected) && approvalState && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-200">Official Decision Record:</span>
              <span className="text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {approvalState.timestamp ? new Date(approvalState.timestamp).toLocaleString() : 'Recent'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              <div>
                <span className="text-slate-500 text-[10px] block">Approver:</span>
                <span className="text-white font-semibold">{approvalState.approverName || approverName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Role:</span>
                <span className="text-slate-300">{approvalState.approverRole || approverRole}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Decision:</span>
                <span className={isApproved ? 'text-emerald-400 font-bold' : isModified ? 'text-blue-400 font-bold' : 'text-red-400 font-bold'}>
                  {approvalState.decision || (isApproved ? 'APPROVED' : isModified ? 'MODIFIED' : 'REJECTED')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Reason:</span>
                <span className="text-slate-300 truncate block">{approvalState.reason || 'Verified by officer.'}</span>
              </div>
            </div>
            {approvalState.modifications && (
              <div className="pt-1 text-[11px] text-amber-300 border-t border-slate-800/80">
                <span className="text-slate-500">Modifications: </span>
                {approvalState.modifications}
              </div>
            )}
          </div>
        )}

        {/* APPROVAL ACTION CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Officer:</span>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="Officer Name"
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:outline-hidden focus:border-cyan-500 w-44"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isPending ? (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApproveClick}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve Plan
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowModifyModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 border border-amber-800/60 text-xs font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Modify Plan
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowRejectModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950 hover:bg-red-900 disabled:opacity-50 text-red-300 border border-red-800 text-xs font-semibold cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Plan
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApproveClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Re-Approve Plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODIFY PLAN MODAL */}
      {showModifyModal && (
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-700 text-xs space-y-3 shadow-xl">
          <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Modify Proposed Plan Before Approval
          </div>
          <p className="text-slate-300">
            Specify command-directed modifications (e.g. redirecting backup units, adjusting triage priority):
          </p>
          <textarea
            rows={2}
            value={modificationNotes}
            onChange={(e) => setModificationNotes(e.target.value)}
            placeholder="e.g. Add 1 additional ALS unit to Zone B from regional staging..."
            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-amber-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModifyModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleModifySubmit}
              className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
            >
              Approve with Modifications
            </button>
          </div>
        </div>
      )}

      {/* REJECT PLAN MODAL */}
      {showRejectModal && (
        <div className="p-4 rounded-xl bg-slate-900 border border-red-800 text-xs space-y-3 shadow-xl">
          <div className="font-bold text-sm text-red-300 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Reject Proposed Response Plan
          </div>
          <p className="text-slate-300">
            Provide the operational rationale for rejecting this plan. This will release reserved resources back to inventory:
          </p>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Secondary flash flood risk in Zone C requires immediate fleet repositioning..."
            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-red-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRejectSubmit}
              className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* =====================================================================
   RESPONSE PLAN VIEW COMPONENT
   ===================================================================== */

interface ResponsePlanViewProps {
  state: SystemExecutionState | null;
  onInjectEmergency?: () => void;
  onRunDemo?: () => void;
  onRunCoordinatedResponse?: () => void;
  isLoading?: boolean;
  onStateUpdate?: (newState: SystemExecutionState) => void;
}

export const ResponsePlanView: React.FC<ResponsePlanViewProps> = ({
  state,
  onInjectEmergency,
  onRunDemo,
  onRunCoordinatedResponse,
  isLoading = false,
  onStateUpdate,
}) => {
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Approval status actively reported by the ApprovalWorkflow component
  const [isWorkflowApproved, setIsWorkflowApproved] = useState<boolean>(() => {
    return state?.approvalState?.status === 'PLAN_APPROVED' || state?.approvalState?.status === 'PLAN_MODIFIED';
  });

  if (!state) return null;

  const isDamEmergency = state.activeEmergencyId === 'DAM_FAILURE_ZONE_C';
  const coordinator = state.coordinatorOutput;
  const approvalState = state.approvalState;
  const primaryBackupPlans = state.primaryBackupPlans || [];
  const resources = state.resources || [];

  // Plan is officially approved only if reported approved by ApprovalWorkflow component
  const isPlanApproved = isWorkflowApproved;

  // Resource Impact Preview
  const totalAmbulances = resources.find((r) => r.type === 'Ambulance')?.total || 3;
  const allocatedAmbulances = resources.find((r) => r.type === 'Ambulance')?.allocated || 1;
  const remainingAmbulances = Math.max(0, totalAmbulances - allocatedAmbulances);
  const ambRemainingPercent = Math.round((remainingAmbulances / totalAmbulances) * 100);

  const totalRescueVehicles = resources.find((r) => r.type === 'Rescue Vehicle')?.total || 2;
  const allocatedRescueVehicles = resources.find((r) => r.type === 'Rescue Vehicle')?.allocated || 1;
  const remainingRescueVehicles = Math.max(0, totalRescueVehicles - allocatedRescueVehicles);
  const rvRemainingPercent = Math.round((remainingRescueVehicles / totalRescueVehicles) * 100);

  const totalMedicalTeams = resources.find((r) => r.type === 'Medical Team')?.total || 4;
  const allocatedMedicalTeams = resources.find((r) => r.type === 'Medical Team')?.allocated || 2;
  const remainingMedicalTeams = Math.max(0, totalMedicalTeams - allocatedMedicalTeams);
  const medRemainingPercent = Math.round((remainingMedicalTeams / totalMedicalTeams) * 100);

  const planActions = coordinator?.final_plan || [
    {
      priority: 1,
      target_zone: isDamEmergency ? 'Zone C' : 'Zone B',
      action: isDamEmergency ? 'Immediate Water Evacuation & Boat Triage' : 'Immediate Medical Evacuation & Structural Triage',
      assigned_agent: 'Medical Agent',
      details: isDamEmergency ? '1 Paramedic Ambulance (AMB-01) + 2 Rescue Boats' : '1 Advanced Ambulance (AMB-02) + 2 Medical Teams',
    },
    {
      priority: 2,
      target_zone: isDamEmergency ? 'Zone B' : 'Zone A',
      action: isDamEmergency ? 'Trauma Stabilization' : 'Chemical Perimeter Containment & Secondary Transit',
      assigned_agent: 'Logistics Agent',
      details: isDamEmergency ? 'Paramedic Units + Trauma Kit Deployment' : '1 Heavy Rescue Vehicle (RV-01) via North Highway',
    },
    {
      priority: 3,
      target_zone: 'Zone D',
      action: 'Emergency Supply Depot & Staging Support',
      assigned_agent: 'Logistics Agent',
      details: 'Shelter Central Activation & Supply Logistics',
    },
  ];

  // Proposed items for ApprovalWorkflow
  const proposedItems = [
    {
      incident: isDamEmergency ? 'Flood Inundation' : 'Trauma Casualties',
      destination: isDamEmergency ? 'Zone C' : 'Zone B',
      vehicle: isDamEmergency ? 'AMB-01 + RB-01' : 'AMB-02',
      medicalTeam: 'Team Alpha',
      shelter: 'Central Shelter',
      priority: 'CRITICAL',
      reason: isDamEmergency ? 'Rapid surge rescue' : 'Trauma triage for crush injuries',
      resourceImpact: isDamEmergency ? '1 Ambulance, 2 Boats' : '1 Ambulance, 1 Team',
    },
    {
      incident: isDamEmergency ? 'Structural Isolation' : 'Hazardous Dispersion',
      destination: isDamEmergency ? 'Zone B' : 'Zone A',
      vehicle: 'RV-01',
      medicalTeam: 'Team Beta',
      shelter: 'North High Staging',
      priority: 'HIGH',
      reason: isDamEmergency ? 'Perimeter stabilization' : 'Evacuation corridor perimeter security',
      resourceImpact: '1 Heavy Vehicle, 1 Team',
    },
  ];

  const handleApprovalDecision = async (
    approverName: string,
    role: string,
    decision: 'APPROVED' | 'MODIFIED' | 'REJECTED',
    modifications?: string,
    reason?: string,
    timestamp?: string
  ) => {
    setIsSubmittingApproval(true);
    setActionNotice(null);

    try {
      const res = await fetch('/api/plan/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverName,
          role,
          decision,
          modifications,
          reason,
          timestamp,
        }),
      });
      const json = await res.json();
      if (json.success && onStateUpdate) {
        onStateUpdate(json.data);
        setActionNotice(
          decision === 'APPROVED'
            ? `Plan approved by ${approverName}. Approver identity and timestamp recorded. Resource dispatch unlocked.`
            : decision === 'MODIFIED'
            ? `Plan approved with modifications by ${approverName}. Logged in audit trail.`
            : `Plan rejected by ${approverName}. Resources returned to reserve.`
        );
      }
    } catch (err: any) {
      setActionNotice('Unable to complete the approval. Please try again.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleDispatchResources = async () => {
    if (!isPlanApproved) {
      setActionNotice('RESOURCE DISPATCH BLOCKED: You must approve the plan before dispatching resources.');
      return;
    }

    setIsDispatching(true);
    setActionNotice(null);

    try {
      const res = await fetch('/api/plan/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerName: approvalState?.approverName || 'Cmdr. Elena Vance',
        }),
      });
      const json = await res.json();
      if (json.success && onStateUpdate) {
        onStateUpdate(json.state);
        setActionNotice('All allocated emergency resources (AMB-02, RV-01) successfully dispatched to field sectors.');
      } else {
        setActionNotice(json.error || 'Failed to dispatch resources.');
      }
    } catch (err: any) {
      setActionNotice('Unable to complete dispatch. Please verify plan approval.');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleActivateBackup = async (incidentId: string) => {
    try {
      const res = await fetch('/api/plan/activate-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });
      const json = await res.json();
      if (json.success && onStateUpdate) {
        onStateUpdate(json.data);
        setActionNotice(`Backup plan activated for ${incidentId}.`);
      }
    } catch (err: any) {
      setActionNotice('Unable to activate backup plan. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Proposed Response Plan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Coordinated response directives, officer approval gate, and contingency redundancy
          </p>
        </div>

        <button
          onClick={onRunDemo}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Updating response plan...' : 'RUN ALL AGENTS'}</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white text-xs ml-2 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* APPROVAL WORKFLOW COMPONENT */}
      <ApprovalWorkflow
        approvalState={approvalState}
        resources={resources}
        isSubmitting={isSubmittingApproval}
        onApprove={handleApprovalDecision}
        onApprovalStatusChange={(isApproved) => {
          setIsWorkflowApproved(isApproved);
        }}
        proposedItems={proposedItems}
      />

      {/* FLEET DISPATCH CONTROL & GUARDS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              Resource Dispatch Control
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Physical dispatch of emergency fleet into disaster zones
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
                isPlanApproved
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}
            >
              {isPlanApproved ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> DISPATCH AUTHORIZED
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> DISPATCH LOCKED
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-white block">
              {isPlanApproved
                ? 'All units cleared for immediate departure.'
                : 'Resource dispatch logic is currently disabled.'}
            </span>
            <p className="text-slate-400 text-[11px]">
              {isPlanApproved
                ? `Authorized by ${approvalState?.approverName || 'Response Officer'} at ${
                    approvalState?.timestamp ? new Date(approvalState.timestamp).toLocaleTimeString() : 'Recent'
                  }. Press the button to execute physical fleet deployment.`
                : 'Critical ambulances, rescue vehicles, and medical teams cannot be dispatched until an authorized officer approves the plan.'}
            </p>
          </div>

          <button
            type="button"
            disabled={!isPlanApproved || isDispatching}
            onClick={handleDispatchResources}
            title={
              !isPlanApproved
                ? 'Resource dispatch is disabled until plan approval is registered'
                : 'Dispatch allocated emergency fleet'
            }
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              isPlanApproved
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {isPlanApproved ? <Send className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
            <span>
              {isDispatching
                ? 'Deploying Fleet...'
                : isPlanApproved
                ? 'Dispatch Allocated Fleet'
                : 'Dispatch Disabled (Pending Approval)'}
            </span>
          </button>
        </div>
      </div>

      {/* RESOURCE IMPACT PREVIEW */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
              Resource Impact Preview
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Projected reserve headroom following plan execution
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Headroom Analysis</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Ambulances */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Ambulances</span>
              <span className="font-mono text-slate-400">{remainingAmbulances} / {totalAmbulances} Available</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  ambRemainingPercent < 25 ? 'bg-red-500' : ambRemainingPercent < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${ambRemainingPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-0.5 font-mono">
              <span>Allocated: {allocatedAmbulances}</span>
              <span className={ambRemainingPercent < 35 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {ambRemainingPercent}% Reserve
              </span>
            </div>
          </div>

          {/* Rescue Vehicles */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Rescue Vehicles</span>
              <span className="font-mono text-slate-400">{remainingRescueVehicles} / {totalRescueVehicles} Available</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  rvRemainingPercent < 25 ? 'bg-red-500' : rvRemainingPercent < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${rvRemainingPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-0.5 font-mono">
              <span>Allocated: {allocatedRescueVehicles}</span>
              <span className={rvRemainingPercent < 50 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {rvRemainingPercent}% Reserve
              </span>
            </div>
          </div>

          {/* Medical Teams */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Medical Teams</span>
              <span className="font-mono text-slate-400">{remainingMedicalTeams} / {totalMedicalTeams} Available</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  medRemainingPercent < 25 ? 'bg-red-500' : medRemainingPercent < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${medRemainingPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-0.5 font-mono">
              <span>Allocated: {allocatedMedicalTeams}</span>
              <span className={medRemainingPercent < 40 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
                {medRemainingPercent}% Reserve
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PRIMARY + BACKUP PLAN SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Primary and Backup Plans
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pre-computed contingency plans respecting resource availability
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Contingencies</span>
        </div>

        <div className="space-y-4">
          {primaryBackupPlans.map((pbp) => (
            <div key={pbp.incidentId} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {pbp.incidentId}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {pbp.targetZone || pbp.zone} ({pbp.incidentDescription || pbp.incidentId})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded font-mono ${
                    pbp.activePlan === 'BACKUP'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {pbp.activePlan === 'BACKUP' ? 'BACKUP ACTIVE' : 'PRIMARY ACTIVE'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* PRIMARY PLAN */}
                <div className={`p-3 rounded-lg border ${
                  pbp.activePlan === 'PRIMARY'
                    ? 'bg-slate-900 border-blue-700'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-80'
                } space-y-1.5`}>
                  <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                    <span className="font-bold text-white text-xs">PRIMARY PLAN</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Available</span>
                  </div>

                  <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehicle:</span>
                      <span className="text-white font-semibold">{pbp.primary.vehicle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Medical Team:</span>
                      <span className="text-white font-semibold">{pbp.primary.medicalTeam}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route:</span>
                      <span className="text-slate-300 truncate">{pbp.primary.route}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shelter:</span>
                      <span className="text-slate-300">{pbp.primary.shelter || 'Central Staging Shelter'}</span>
                    </div>
                  </div>

                  {/* Route Risk */}
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Route Risk:</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                      pbp.primary.routeRisk === 'HIGH' || pbp.primary.routeRisk === 'HIGH RISK'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {pbp.primary.routeRisk}
                    </span>
                  </div>
                </div>

                {/* BACKUP PLAN */}
                <div className={`p-3 rounded-lg border ${
                  pbp.activePlan === 'BACKUP'
                    ? 'bg-amber-950/30 border-amber-600'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-80'
                } space-y-1.5`}>
                  <div className="flex justify-between items-center pb-1 border-b border-slate-800">
                    <span className="font-bold text-amber-300 text-xs">BACKUP PLAN</span>
                    <span className="text-[10px] text-slate-400 font-mono">Contingency</span>
                  </div>

                  <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vehicle:</span>
                      <span className="text-white font-semibold">{pbp.backup.vehicle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Medical Team:</span>
                      <span className="text-white font-semibold">{pbp.backup.medicalTeam}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route:</span>
                      <span className="text-slate-300 truncate">{pbp.backup.route}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shelter:</span>
                      <span className="text-slate-300">{pbp.backup.shelter || 'North High Staging'}</span>
                    </div>
                  </div>

                  {/* Route Risk */}
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Route Risk:</span>
                    <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {pbp.backup.routeRisk}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-1 flex justify-end">
                {pbp.activePlan === 'PRIMARY' ? (
                  <button
                    onClick={() => handleActivateBackup(pbp.incidentId)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 transition cursor-pointer"
                  >
                    Activate Backup Plan
                  </button>
                ) : (
                  <span className="text-xs text-amber-400 font-mono flex items-center gap-1">
                    ✓ Contingency Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION DIRECTIVES WITH GUARDS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Action Directives
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {isPlanApproved ? 'Clearance Granted' : 'Awaiting Sign-off'}
          </span>
        </div>

        <div className="space-y-3">
          {planActions.map((action, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                    {action.priority}
                  </span>
                  <span className="font-semibold text-white">{action.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
                    {action.target_zone}
                  </span>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    {action.assigned_agent}
                  </span>
                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isPlanApproved
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isPlanApproved ? 'DISPATCHED' : 'DISPATCH LOCKED'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-7 pt-1">
                <p className="text-slate-400 text-[11px]">{action.details}</p>
                <button
                  type="button"
                  disabled={!isPlanApproved}
                  onClick={() => {
                    if (isPlanApproved) {
                      setActionNotice(`Unit deployment initiated for ${action.target_zone}: ${action.action}`);
                    }
                  }}
                  className="self-start sm:self-auto px-2.5 py-1 rounded text-[11px] font-mono font-medium disabled:opacity-40 disabled:cursor-not-allowed bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  {isPlanApproved ? 'Deploy Unit' : 'Dispatch Locked'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
