import React, { useState } from 'react';
import { 
  GitCompare, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Activity, 
  Truck, 
  Radio, 
  Compass, 
  Gauge, 
  Layers, 
  Cpu, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { SystemExecutionState } from '../types/disaster';

interface AgentCoordinationViewProps {
  state: SystemExecutionState;
  onNavigatePlan?: () => void;
}

export const AgentCoordinationView: React.FC<AgentCoordinationViewProps> = ({ state, onNavigatePlan }) => {
  const [selectedAgent, setSelectedAgent] = useState<'ALL' | 'MEDICAL' | 'LOGISTICS' | 'COMMUNICATION'>('ALL');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const conflicts = state.conflicts || [];
  const hasConflict = conflicts.length > 0;
  const coordinatorOutput = state.coordinatorOutput;

  // Evaluation criteria used by Coordinator to resolve conflict deterministically & ethically
  const evaluationFactors = [
    { label: 'Medical Priority', value: 'High Mortality / Crush Trauma', status: 'CRITICAL', score: '98/100' },
    { label: 'Resource Availability', value: '2 ALS Ambulances (1 Committed)', status: 'TIGHT', score: '50/100' },
    { label: 'Transit Distance', value: 'Zone B: 4.2 km vs Zone A: 5.1 km', status: 'BALANCED', score: '82/100' },
    { label: 'Route Risk', value: 'Zone B: Low (Arterial) | Zone A: Med (Debris)', status: 'FAVOR_B', score: '88/100' },
    { label: 'Communication Status', value: 'All repeater channels operational', status: 'NOMINAL', score: '95/100' },
    { label: 'Current Usage', value: '3 Vehicles allocated / 2 Active Reserves', status: 'STABLE', score: '70/100' },
    { label: 'Future Reserve Capacity', value: '1 Ambulance held for surge events', status: 'CAUTION', score: '60/100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <GitCompare className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Agent Coordination</h1>
          </div>
          <p className="text-xs text-slate-400">
            Cross-agent contention analysis, recommendation triangulation, and deterministic Coordinator synthesis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasConflict ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800/80 text-xs font-semibold text-red-300 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              ⚠ {conflicts.length} Contention Detected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              All Recommendations Harmonized
            </span>
          )}
        </div>
      </div>

      {/* CONFLICT BANNER IF ACTIVE */}
      {hasConflict && (
        <div className="rounded-xl border border-red-800/80 bg-red-950/40 p-5 backdrop-blur-xs shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-red-900/60 text-red-200 shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base font-bold text-red-200 tracking-wide uppercase flex items-center gap-2">
                  <span>⚠ AGENT CONFLICT DETECTED</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-red-900/80 border border-red-700 text-red-100 font-mono">
                    PHYSICAL ASSET CONTENTION
                  </span>
                </h3>
                <span className="text-xs text-red-300/80 font-mono">
                  Engine: Deterministic Asset Exclusivity Check
                </span>
              </div>

              {conflicts.map((conf, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-red-900/50 rounded-lg p-3.5 space-y-2">
                  <div className="text-sm font-semibold text-slate-100">
                    Conflict: <span className="text-red-400 font-mono">{conf.resource}</span> requested simultaneously by{' '}
                    <span className="text-amber-300 font-medium">{conf.requested_zones.join(' and ')}</span>.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                      <span className="font-semibold text-blue-400 block mb-1">Medical Agent Request:</span>
                      <p className="text-slate-300">
                        {conf.resource} required for <span className="font-semibold text-white">Zone B</span> for immediate surgical triage of critical crush casualties.
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                      <span className="font-semibold text-amber-400 block mb-1">Logistics Agent Request:</span>
                      <p className="text-slate-300">
                        {conf.resource} required for <span className="font-semibold text-white">Zone A</span> for priority perimeter evacuation convoy.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3 SPECIALIZED AGENT RECOMMENDATIONS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Specialized Agent Recommendations
          </h2>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setSelectedAgent('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                selectedAgent === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All (3)
            </button>
            <button
              onClick={() => setSelectedAgent('MEDICAL')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                selectedAgent === 'MEDICAL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Medical
            </button>
            <button
              onClick={() => setSelectedAgent('LOGISTICS')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                selectedAgent === 'LOGISTICS' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Logistics
            </button>
            <button
              onClick={() => setSelectedAgent('COMMUNICATION')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                selectedAgent === 'COMMUNICATION' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Comms
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Medical Agent */}
          {(selectedAgent === 'ALL' || selectedAgent === 'MEDICAL') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Activity className="w-4 h-4" />
                    </span>
                    <h3 className="font-semibold text-sm text-white">Medical Agent</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-950 text-red-300 border border-red-800">
                    CRITICAL CASUALTIES
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block">Core Recommendation:</span>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    “Zone B requires ALS Ambulance AMB-02 and Surgical Team Alpha immediately to treat 18 crush trauma victims.”
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Target Sector:</span>
                    <span className="font-semibold text-white">Zone B (Downtown)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Demanded Resource:</span>
                    <span className="font-mono text-red-400 font-bold">AMB-02 + MED-T1</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Triage Priority:</span>
                    <span className="font-semibold text-red-300">Mortality Level 1</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Confidence: 94%</span>
                <span className="text-blue-400 font-mono">Triage Verified</span>
              </div>
            </div>
          )}

          {/* Logistics Agent */}
          {(selectedAgent === 'ALL' || selectedAgent === 'LOGISTICS') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Truck className="w-4 h-4" />
                    </span>
                    <h3 className="font-semibold text-sm text-white">Logistics Agent</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-950 text-amber-300 border border-amber-800">
                    TRANSIT BOTTLENECK
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block">Core Recommendation:</span>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    “Vehicle AMB-02 and Rescue Vehicle RV-01 required for Zone A perimeter evacuation before toxic plume expands.”
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Target Sector:</span>
                    <span className="font-semibold text-white">Zone A (Industrial)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Demanded Resource:</span>
                    <span className="font-mono text-amber-400 font-bold">AMB-02 + RV-01</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Evacuation Urgency:</span>
                    <span className="font-semibold text-amber-300">High Plume Risk</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Confidence: 91%</span>
                <span className="text-amber-400 font-mono">Route Analyzed</span>
              </div>
            </div>
          )}

          {/* Communication Agent */}
          {(selectedAgent === 'ALL' || selectedAgent === 'COMMUNICATION') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Radio className="w-4 h-4" />
                    </span>
                    <h3 className="font-semibold text-sm text-white">Communication Agent</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-950 text-purple-300 border border-purple-800">
                    MULTI-CHANNEL EAS
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block">Core Recommendation:</span>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    “Broadcast evacuation orders for Zone A & sheltering-in-place instructions for Zone B. Keep arterial roads clear.”
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Primary Channel:</span>
                    <span className="font-semibold text-white">Cellular EAS & VHF</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Civilian Directives:</span>
                    <span className="text-emerald-300 font-medium">Bypass Central Corridor</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Language Coverage:</span>
                    <span className="font-mono text-purple-300">En / Es / Zh</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Confidence: 95%</span>
                <span className="text-purple-400 font-mono">Advisories Ready</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COORDINATOR RESOLUTION ENGINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              Coordinator Resolution & Holistic Evaluation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The Coordinator evaluates 7 multi-dimensional parameters rather than arbitrarily favoring one agent.
            </p>
          </div>
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
          >
            {showTechnicalDetails ? 'Hide Evaluation Weights' : 'View Evaluation Weights'}
          </button>
        </div>

        {/* 7-Factor Evaluation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {evaluationFactors.map((f, i) => (
            <div key={i} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-medium text-slate-300">{f.label}</span>
                <span className="font-mono text-[11px] text-slate-400">{f.score}</span>
              </div>
              <p className="text-slate-200 font-medium truncate" title={f.value}>{f.value}</p>
              <div className="pt-1">
                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  f.status === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                  f.status === 'TIGHT' || f.status === 'CAUTION' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {f.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Coordinated Resolution Decision Box */}
        <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Synthesized Operational Compromise
            </span>
            <span className="text-[11px] text-emerald-300 font-mono">
              Status: Feasible & Physically Validated
            </span>
          </div>

          <div className="text-sm font-semibold text-white leading-relaxed">
            {coordinatorOutput?.decision || (
              <span>
                Prioritize <strong className="text-emerald-400">ALS Ambulance AMB-02</strong> to <strong className="text-white">Zone B</strong> due to life-threatening crush trauma and hypovolemic shock. Reassign <strong className="text-emerald-400">Heavy Rescue Vehicle RV-01</strong> to <strong className="text-white">Zone A</strong> to establish the evacuation perimeter and clear debris without risking ambulance assets.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
            <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-0.5">Asset Allocation:</span>
              <span className="font-semibold text-white">AMB-02 ➔ Zone B | RV-01 ➔ Zone A</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-0.5">Physical Conflict Status:</span>
              <span className="font-semibold text-emerald-400">RESOLVED (Zero Asset Duplication)</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-0.5">Secondary Contingency:</span>
              <span className="font-semibold text-white">AMB-01 held in Stage 4 reserve</span>
            </div>
          </div>

          {onNavigatePlan && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={onNavigatePlan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Review Proposed Response Plan for Approval
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
