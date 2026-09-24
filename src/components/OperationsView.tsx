import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Users, 
  MapPin, 
  Boxes, 
  Activity, 
  Play, 
  RefreshCw,
  Zap,
  Scale,
  ChevronDown, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { 
  AgentRole, 
  DisasterSeverityLevel, 
  GeminiStatusInfo, 
  SystemExecutionState 
} from '../types/disaster';

interface OperationsViewProps {
  state: SystemExecutionState | null;
  geminiStatus: GeminiStatusInfo | null;
  selectedAgent: AgentRole | 'All Agents';
  onSelectAgent: (agent: AgentRole | 'All Agents') => void;
  onAnalyzeSelectedAgent: () => void;
  onRunDemo: () => void;
  onInjectEmergency: () => void;
  onReset?: () => void;
  onOpenWhatIf?: () => void;
  isLoading: boolean;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  state,
  geminiStatus,
  selectedAgent,
  onSelectAgent,
  onAnalyzeSelectedAgent,
  onRunDemo,
  onInjectEmergency,
  onReset,
  onOpenWhatIf,
  isLoading,
}) => {
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!state) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-mono text-sm">
        <Activity className="w-5 h-5 animate-spin mr-2 text-red-500" />
        Analyzing disaster response status...
      </div>
    );
  }

  const isDamFailure = state.activeEmergencyId === 'DAM_FAILURE_ZONE_C';
  const zones = state.zones || [];
  const resources = state.resources || [];
  const conflicts = state.conflicts || [];
  const coordinator = state.coordinatorOutput;

  // KPI Calculations
  const totalPeopleAtRisk = zones.reduce((acc, z) => acc + (z.peopleAtRisk || 0), 0);
  const totalInjured = zones.reduce((acc, z) => acc + (z.injured || 0), 0);
  const totalAvailableResources = resources.reduce((acc, r) => acc + (Math.max(0, r.available) || 0), 0);
  const totalResourceUnits = resources.reduce((acc, r) => acc + (r.total || 0), 0);
  const activeEmergenciesCount = isDamFailure ? 2 : 1;

  const getSeverityBadge = (level: DisasterSeverityLevel | string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">
            CRITICAL
          </span>
        );
      case 'DANGER':
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-950 text-orange-400 border border-orange-800">
            DANGER
          </span>
        );
      case 'MEDIUM':
      case 'MODERATE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-yellow-950 text-yellow-300 border border-yellow-800">
            MEDIUM
          </span>
        );
      case 'NORMAL':
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            NORMAL
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return <span className="text-red-400 font-bold font-mono text-xs">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-orange-400 font-semibold font-mono text-xs">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-yellow-400 font-medium font-mono text-xs">MEDIUM</span>;
      default:
        return <span className="text-emerald-400 font-mono text-xs">LOW</span>;
    }
  };

  // Compile zone rows strictly matching Section 6:
  // Zone, People at Risk, Injured, Severity, Level, Priority
  const zoneRows = zones.map((z) => {
    let score = 25;
    let level: DisasterSeverityLevel = 'NORMAL';
    let priority = 'LOW';
    let reason = z.notes;

    if (z.id === 'Zone B') {
      score = 92;
      level = 'CRITICAL';
      priority = 'CRITICAL';
      reason = 'Structural collapse with trauma casualties.';
    } else if (z.id === 'Zone C') {
      if (isDamFailure) {
        score = 98;
        level = 'CRITICAL';
        priority = 'CRITICAL';
        reason = 'Catastrophic flash flood dam breach.';
      } else {
        score = 75;
        level = 'DANGER';
        priority = 'HIGH';
        reason = 'Rapid rising water line threatening access road.';
      }
    } else if (z.id === 'Zone A') {
      score = 48;
      level = 'MEDIUM';
      priority = 'MEDIUM';
      reason = 'Chlorine gas dispersion with casualties.';
    } else if (z.id === 'Zone D') {
      score = 15;
      level = 'NORMAL';
      priority = 'LOW';
      reason = 'Staging ground active; minor flickering.';
    }

    return {
      ...z,
      score,
      level,
      priority,
      reason,
    };
  });

  // Current selected agent status & details strictly matching Section 7:
  // Overall Risk, Severity, Zones Analyzed, Priority, Resource Requests, Recommendations, Reason
  const getSelectedAgentDetails = () => {
    if (selectedAgent === 'Medical Agent' || selectedAgent === 'All Agents') {
      const out = state.medicalOutput;
      return {
        name: 'Medical Agent',
        overallRisk: 'CRITICAL',
        severity: out?.overall_status || 'CRITICAL',
        zonesAnalyzed: out?.zone_analysis?.length || zones.length,
        priority: 'CRITICAL',
        resourceRequests: out?.resource_requests?.map((r) => `${r.quantity} ${r.resource_type}`) || [
          '2 Ambulances',
          '3 Medical Teams',
        ],
        recommendations: 'Prioritize surgical triage and advanced life support in Zone B.',
        reason: out?.reason || 'Critical trauma clusters identified in Zone B and gas inhalation in Zone A.',
      };
    }
    if (selectedAgent === 'Logistics Agent') {
      const out = state.logisticsOutput;
      return {
        name: 'Logistics Agent',
        overallRisk: 'DANGER',
        severity: out?.overall_status || 'DANGER',
        zonesAnalyzed: out?.zone_analysis?.length || zones.length,
        priority: 'HIGH',
        resourceRequests: out?.resource_requests?.map((r) => `${r.quantity} ${r.resource_type}`) || [
          '2 Rescue Vehicles',
          '1 Ambulance',
        ],
        recommendations: 'Establish arterial evacuation transit along North Highway.',
        reason: out?.reason || 'Route clearance and evacuation transit along North Highway.',
      };
    }
    if (selectedAgent === 'Communication Agent') {
      const out = state.communicationOutput;
      return {
        name: 'Communication Agent',
        overallRisk: 'DANGER',
        severity: out?.overall_status || 'DANGER',
        zonesAnalyzed: out?.zone_analysis?.length || zones.length,
        priority: 'MEDIUM',
        resourceRequests: ['Public Alert Broadcast', 'Cellular EAS Push'],
        recommendations: 'Broadcast evacuation advisory for Zone C flood sectors and shelter instructions.',
        reason: out?.public_alert || 'Multi-lingual warning broadcast dispatched to Zone A and Zone C.',
      };
    }
    // Coordinator Agent
    const out = state.coordinatorOutput;
    return {
      name: 'Coordinator Agent',
      overallRisk: 'MAXIMUM',
      severity: out?.final_status || 'RESOLVED',
      zonesAnalyzed: zones.length,
      priority: 'CRITICAL',
      resourceRequests: ['Fleet Resource Allocation Enforced', 'Conflict Resolution Settled'],
      recommendations: out?.decision || 'Prioritize Zone B medical evacuation while assigning heavy rescue to Zone A.',
      reason: out?.decision || 'Integrated multi-agent plan with zero hard-constraint violations.',
    };
  };

  const agentDetails = getSelectedAgentDetails();

  return (
    <div className="space-y-6">
      {/* 5. DISASTER OVERVIEW (4 Cards) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Disaster Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Affected Zones */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Affected Zones</span>
              <MapPin className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {zones.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active Sectors
            </div>
          </div>

          {/* People at Risk */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>People at Risk</span>
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {totalPeopleAtRisk.toLocaleString()}
            </div>
            <div className="text-[11px] text-orange-400 mt-1">
              {totalInjured} Injured
            </div>
          </div>

          {/* Active Emergencies */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Active Emergencies</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {activeEmergenciesCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isDamFailure ? 'Seismic + Dam Breach' : 'Seismic Hazard'}
            </div>
          </div>

          {/* Resources Available */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Resources Available</span>
              <Boxes className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {totalAvailableResources} <span className="text-xs font-normal text-slate-400">/ {totalResourceUnits}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Units Ready
            </div>
          </div>
        </div>
      </section>

      {/* CURRENT DISASTER PANEL */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Current Disaster
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {isDamFailure ? 'Cascading Flood and Dam Failure' : 'Regional Seismic Hazard and Chemical Leak'}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Severity:</span>
            {getSeverityBadge(isDamFailure ? 'CRITICAL' : 'DANGER')}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
          <div>
            <span className="text-slate-400 font-mono text-[11px] block">Event Type</span>
            <span className="text-slate-200 font-medium mt-0.5 block">
              {isDamFailure ? 'Major Dam Wall Failure' : 'Earthquake (M 6.8) and Chlorine Leak'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-mono text-[11px] block">Affected Zone</span>
            <span className="text-slate-200 font-medium mt-0.5 block font-mono">
              Zone A, Zone B, Zone C, Zone D
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-mono text-[11px] block">Severity</span>
            <span className="mt-0.5 inline-block">
              {getSeverityBadge(isDamFailure ? 'CRITICAL' : 'DANGER')}
            </span>
          </div>
        </div>
      </section>

      {/* AGENT SELECTION & CONTROLS */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Agent Selection
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Agent Selection buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['Medical Agent', 'Logistics Agent', 'Communication Agent', 'Coordinator Agent', 'All Agents'] as const).map((agent) => (
              <button
                key={agent}
                onClick={() => onSelectAgent(agent)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition cursor-pointer ${
                  selectedAgent === agent
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {agent}
              </button>
            ))}
          </div>

          {/* Action Buttons strictly matching Section 5 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onAnalyzeSelectedAgent}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              Analyze Selected Agent
            </button>

            <button
              onClick={onRunDemo}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>RUN ALL AGENTS</span>
            </button>

            <button
              onClick={onInjectEmergency}
              disabled={isLoading || isDamFailure}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer disabled:opacity-50"
            >
              Inject Emergency
            </button>

            {onReset && (
              <button
                onClick={onReset}
                disabled={isLoading}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Simulation</span>
              </button>
            )}

            {onOpenWhatIf && (
              <button
                onClick={onOpenWhatIf}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>WHAT-IF ANALYSIS</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 6. CLEAN ZONE TABLE */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Zone Overview
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">ZONE</th>
                <th className="py-2.5 px-3">PEOPLE AT RISK</th>
                <th className="py-2.5 px-3">INJURED</th>
                <th className="py-2.5 px-3">SEVERITY</th>
                <th className="py-2.5 px-3">LEVEL</th>
                <th className="py-2.5 px-3">PRIORITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {zoneRows.map((z) => (
                <tr key={z.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white">
                    {z.id}
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    {z.peopleAtRisk.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-orange-400 font-semibold">
                    {z.injured}
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-bold">
                    {z.score}/100
                  </td>
                  <td className="py-3 px-3">
                    {getSeverityBadge(z.level)}
                  </td>
                  <td className="py-3 px-3">
                    {getPriorityBadge(z.priority)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. CLEAN AGENT ANALYSIS PANEL */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Agent Analysis:
            </span>
            <span className="text-xs font-bold text-white font-mono">
              {agentDetails.name.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400">Severity:</span>
            {getSeverityBadge(agentDetails.severity)}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Overall Risk</span>
            <span className="text-red-400 font-bold text-sm mt-0.5 block">{agentDetails.overallRisk}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Severity</span>
            <span className="text-orange-400 font-bold text-sm mt-0.5 block">{agentDetails.severity}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Zones Analyzed</span>
            <span className="text-white font-bold text-sm mt-0.5 block">{agentDetails.zonesAnalyzed}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Priority</span>
            <span className="text-amber-400 font-bold text-sm mt-0.5 block">{agentDetails.priority}</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
            Resource Requests
          </span>
          <div className="flex flex-wrap gap-1.5">
            {agentDetails.resourceRequests.map((req, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-slate-950 text-slate-200 border border-slate-800 text-xs font-mono"
              >
                {req}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Recommendations</span>
            <p className="text-slate-200 mt-1 leading-relaxed">{agentDetails.recommendations}</p>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">Reason</span>
            <p className="text-slate-300 mt-1 leading-relaxed">{agentDetails.reason}</p>
          </div>
        </div>
      </section>

      {/* 8. CLEAN CONFLICT SECTION strictly matching Section 8 */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Resource Conflict
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Status: Resolved
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs space-y-2 font-mono">
          <div className="text-sm font-bold text-white">
            AMB-02
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-slate-300">
            <span className="text-red-400 font-semibold">Medical Agent → Zone B</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-amber-400 font-semibold">Logistics Agent → Zone A</span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-slate-200 font-sans">
            <span className="font-semibold text-slate-400 font-mono text-[11px] block mb-0.5">Resolution:</span>
            Zone B prioritized due to higher medical urgency.
          </div>
        </div>
      </section>

      {/* 9. CLEAN EXPLAINABILITY strictly matching Section 9 */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="pb-2 border-b border-slate-800">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Decision Explainability
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Decision */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Decision</span>
            <p className="text-white font-semibold">
              Allocate AMB-02 to Zone B; reassign RV-01 to Zone A.
            </p>
          </div>

          {/* Evidence */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Evidence</span>
            <p className="text-slate-200">
              18 casualties with life-threatening crush trauma in Zone B.
            </p>
          </div>

          {/* Constraint */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Constraint</span>
            <p className="text-slate-200">
              Only 1 active ALS ambulance available for immediate dispatch.
            </p>
          </div>

          {/* Trade-off */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Trade-off</span>
            <p className="text-slate-200">
              Zone A evacuation perimeter uses heavy vehicle instead of ambulance.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
