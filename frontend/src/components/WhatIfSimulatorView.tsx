import React, { useState } from 'react';
import {
  Zap,
  Play,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  Truck,
  Radio,
  Compass,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SystemExecutionState, WhatIfScenario } from '../types/disaster';

interface WhatIfSimulatorViewProps {
  state: SystemExecutionState;
  onStateUpdate: (newState: SystemExecutionState) => void;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({ state, onStateUpdate }) => {
  const scenarios = state.whatIfScenarios || [];
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    state.activeWhatIfScenarioId || scenarios[0]?.id || ''
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [officerName, setOfficerName] = useState('Cmdr. Elena Vance');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const simulatedPlan = state.simulatedWhatIfPlan || selectedScenario?.simulatedPlan || [];
  const currentPlan = state.coordinatorOutput?.final_plan || [
    { priority: 1, action: 'Dispatch ALS Ambulance AMB-02 to Zone B', target_zone: 'Zone B', assigned_agent: 'Medical Agent', details: 'Direct transit for 18 crush casualties' },
    { priority: 2, action: 'Dispatch Extrication Rig RV-01 to Zone A', target_zone: 'Zone A', assigned_agent: 'Logistics Agent', details: 'Evacuate perimeter ahead of chemical drift' },
  ];

  const handleSimulate = async (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setIsSimulating(true);
    setActionNotice(null);
    try {
      const res = await fetch('/api/what-if/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      const json = await res.json();
      if (json.success) {
        onStateUpdate(json.data);
        setActionNotice(`Simulated contingency "${selectedScenario?.name}". Review comparison below.`);
      }
    } catch (err: any) {
      setActionNotice(`Simulation error: ${err?.message || err}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedScenario) return;
    setIsCommitting(true);
    try {
      const res = await fetch('/api/what-if/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          officerName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onStateUpdate(json.data);
        setActionNotice(
          `Contingency plan committed! Operational response plan updated with "${selectedScenario.name}".`
        );
      }
    } catch (err: any) {
      setActionNotice(`Commit error: ${err?.message || err}`);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">What-If Crisis Simulator</h1>
          </div>
          <p className="text-xs text-slate-400">
            Simulate secondary disruptions, unexpected casualty spikes, and asset breakdowns without altering live operations until authorized.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Sandbox Mode:</span>
          <span className="px-2.5 py-1 rounded bg-amber-950/70 border border-amber-800 text-xs font-mono text-amber-300">
            ISOLATED FROM FIELD
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

      {/* SCENARIO SELECTION GRID */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          Select What-If Contingency Scenario
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((s) => {
            const isSelected = s.id === selectedScenarioId;
            return (
              <div
                key={s.id}
                onClick={() => handleSimulate(s.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/40 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {s.type}
                  </span>
                  {isSelected && <span className="text-amber-400 text-xs font-bold">Active</span>}
                </div>
                <h3 className="font-semibold text-xs text-slate-200 leading-snug line-clamp-2">{s.name}</h3>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{s.description}</p>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Reserve Impact:</span>
                  <span
                    className={`font-semibold ${
                      s.resourceImpact.capacityState === 'CRITICAL'
                        ? 'text-red-400'
                        : s.resourceImpact.capacityState === 'TIGHT'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {s.resourceImpact.capacityState}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedScenario && (
        <div className="space-y-6">
          {/* COMPARISON BAR: BEFORE VS WHAT-IF */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Contingency Impact Assessment: {selectedScenario.name}
                </h2>
              </div>
              <button
                disabled={isSimulating}
                onClick={() => handleSimulate(selectedScenario.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                [ ⚡ RE-RUN WHAT-IF ANALYSIS ]
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] block">
                  Current Field Baseline
                </span>
                <p className="text-slate-200 text-sm font-medium">{selectedScenario.currentCondition}</p>
                <div className="text-[11px] text-slate-400 pt-1">
                  Status: <span className="text-emerald-400 font-semibold font-mono">Live Operations Active</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-2">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  What-If Disruption Scenario
                </span>
                <p className="text-slate-100 text-sm font-semibold">{selectedScenario.simulatedCondition}</p>
                <div className="text-[11px] text-amber-300 pt-1 font-mono">
                  Impact: {selectedScenario.resourceImpact.vehicleDiff} | {selectedScenario.resourceImpact.medicDiff}
                </div>
              </div>
            </div>

            {/* 4 AGENT CASCADE IMPACTS */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Multi-Agent Response Adaptation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-blue-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> Medical Agent
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{selectedScenario.agentImpact.medical}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-amber-400 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Logistics Agent
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{selectedScenario.agentImpact.logistics}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-purple-400 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" /> Communication Agent
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{selectedScenario.agentImpact.communication}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" /> Coordinator Agent
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{selectedScenario.agentImpact.coordinator}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CURRENT PLAN VS NEW POSSIBLE PLAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Operational Plan */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  Current Operational Plan
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  LIVE IN FIELD
                </span>
              </div>
              <div className="space-y-2">
                {currentPlan.map((act, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {act.priority}. {act.action}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">{act.target_zone}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{act.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New Possible Simulated Plan */}
            <div className="bg-slate-900 border border-amber-800/70 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  New Possible Plan (Simulated)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                  PENDING CONFIRMATION
                </span>
              </div>
              <div className="space-y-2">
                {simulatedPlan.map((act, i) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-200">
                        {act.priority}. {act.action}
                      </span>
                      <span className="font-mono text-amber-400 text-[11px]">{act.target_zone}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{act.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COMMIT CONTINGENCY PLAN TO REAL FIELD OPERATIONS */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Promote Simulated Plan to Field Directives?</h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Rule: Do not modify the actual operational plan until an authorized Emergency Response Officer confirms it.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400">Authorizing Officer:</span>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              disabled={isCommitting}
              onClick={handleCommit}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors shrink-0"
            >
              <Check className="w-4 h-4" />
              [ Commit to Operational Plan ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
