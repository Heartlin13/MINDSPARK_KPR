import React, { useState } from 'react';
import { 
  Bot, 
  HeartPulse, 
  Truck, 
  Radio, 
  BrainCircuit, 
  Play, 
  Activity, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Layers,
  Scale
} from 'lucide-react';
import { 
  AgentRole, 
  DisasterSeverityLevel, 
  SystemExecutionState,
  MedicalAnalysisOutput,
  LogisticsAnalysisOutput,
  CommunicationAnalysisOutput,
  CoordinatorAnalysisOutput
} from '../types/disaster';

interface AgentOperationsViewProps {
  state: SystemExecutionState | null;
  selectedAgent: AgentRole;
  onSelectAgent: (agent: AgentRole) => void;
  onAnalyzeSelectedAgent: () => void;
  isLoading: boolean;
}

export const AgentOperationsView: React.FC<AgentOperationsViewProps> = ({
  state,
  selectedAgent,
  onSelectAgent,
  onAnalyzeSelectedAgent,
  isLoading,
}) => {
  if (!state) return null;

  const agentStatuses = state.agentStatuses || {};
  const medicalOutput = state.medicalOutput as MedicalAnalysisOutput;
  const logisticsOutput = state.logisticsOutput as LogisticsAnalysisOutput;
  const communicationOutput = state.communicationOutput as CommunicationAnalysisOutput;
  const coordinatorOutput = state.coordinatorOutput as CoordinatorAnalysisOutput;
  const messages = state.messages || [];

  const agents: { role: AgentRole; title: string; icon: React.ElementType; color: string }[] = [
    { role: 'Medical Agent', title: 'Medical Agent', icon: HeartPulse, color: 'text-red-400' },
    { role: 'Logistics Agent', title: 'Logistics Agent', icon: Truck, color: 'text-amber-400' },
    { role: 'Communication Agent', title: 'Communication Agent', icon: Radio, color: 'text-cyan-400' },
    { role: 'Coordinator Agent', title: 'Coordinator Agent', icon: BrainCircuit, color: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Agent Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring of autonomous reasoning agents, sector assessments, and conflict resolution
          </p>
        </div>
      </div>

      {/* SECTION 7: LIVE AGENT OPERATIONS (4 AGENTS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const statusInfo = agentStatuses[agent.role];
          const isSelected = selectedAgent === agent.role;
          const status = statusInfo?.status || 'COMPLETED';

          return (
            <div
              key={agent.role}
              onClick={() => onSelectAgent(agent.role)}
              className={`p-4 rounded-xl border transition cursor-pointer select-none space-y-3 ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-950/40'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${agent.color}`} />
                  <span className="font-semibold text-white text-xs">{agent.title}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    status === 'ANALYZING'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                      : status === 'CONFLICTED'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : status === 'ERROR'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {status}
                </span>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Current Task:</span>
                  <span className="text-slate-200 truncate max-w-[140px] text-right">
                    {statusInfo?.currentTask || 'Sector Analysis'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Zones Analyzed:</span>
                  <span className="text-slate-200">4 Zones</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk Level:</span>
                  <span className={agent.role === 'Medical Agent' ? 'text-red-400 font-bold' : 'text-orange-400 font-bold'}>
                    {agent.role === 'Medical Agent' ? 'Critical' : 'Danger'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span className="text-slate-400 text-[10px]">
                    {statusInfo?.updatedAt ? new Date(statusInfo.updatedAt).toLocaleTimeString() : '14:32:08'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 8: INDIVIDUAL AGENT ANALYSIS PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              Individual Agent Analysis: {selectedAgent}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute specialized sector evaluation focusing on domain priorities
            </p>
          </div>

          <button
            onClick={onAnalyzeSelectedAgent}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Analyze Selected Agent'}</span>
          </button>
        </div>

        {/* RESULTS ACCORDING TO AGENT ROLE */}
        {selectedAgent === 'Medical Agent' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">OVERALL RISK</span>
                <span className="text-red-400 font-bold text-sm mt-0.5 block font-mono">CRITICAL</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">PRIMARY TRIAGE TARGET</span>
                <span className="text-white font-bold text-sm mt-0.5 block font-mono">Zone B (Trauma Crush)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">RESOURCE REQUESTS</span>
                <span className="text-emerald-400 font-bold text-sm mt-0.5 block font-mono">2 Ambulances, 2 Teams</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3">ZONE</th>
                    <th className="py-2 px-3">SEVERITY SCORE</th>
                    <th className="py-2 px-3">RISK LEVEL</th>
                    <th className="py-2 px-3">MEDICAL PRIORITY</th>
                    <th className="py-2 px-3">INJURED</th>
                    <th className="py-2 px-3">RESOURCES REQUIRED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(medicalOutput?.zone_analysis || [
                    { zone: 'Zone B', severity_score: 92, risk_level: 'CRITICAL', casualties_estimate: 24 },
                    { zone: 'Zone C', severity_score: 75, risk_level: 'DANGER', casualties_estimate: 12 },
                    { zone: 'Zone A', severity_score: 65, risk_level: 'DANGER', casualties_estimate: 6 },
                    { zone: 'Zone D', severity_score: 30, risk_level: 'MEDIUM', casualties_estimate: 0 },
                  ]).map((z: any) => (
                    <tr key={z.zone}>
                      <td className="py-2 px-3 font-semibold text-white">{z.zone}</td>
                      <td className="py-2 px-3 text-red-400 font-bold">{z.severity_score}/100</td>
                      <td className="py-2 px-3">{z.risk_level}</td>
                      <td className="py-2 px-3 text-amber-300">IMMEDIATE</td>
                      <td className="py-2 px-3 text-slate-200">{z.casualties_estimate}</td>
                      <td className="py-2 px-3 text-emerald-400">1 Ambulance + Paramedics</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedAgent === 'Logistics Agent' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">EVACUATION ARTERY</span>
                <span className="text-white font-bold text-sm mt-0.5 block font-mono">North Highway Corridor</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">VEHICLES ALLOCATED</span>
                <span className="text-cyan-400 font-bold text-sm mt-0.5 block font-mono">3 Rescue Vehicles</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">RESCUE BOATS</span>
                <span className="text-blue-400 font-bold text-sm mt-0.5 block font-mono">2 Watercraft</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">SHELTER CAPACITY</span>
                <span className="text-emerald-400 font-bold text-sm mt-0.5 block font-mono">Central Shelter (68% Cap)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
              <span className="text-slate-400 block">Corridor Clearance & Bottleneck Assessment:</span>
              <p className="text-slate-200">
                Zone A arterial road partially blocked by debris; heavy rescue vehicle RV-01 assigned with bypass route via Highway 102.
              </p>
            </div>
          </div>
        )}

        {selectedAgent === 'Communication Agent' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">PUBLIC RISK RATING</span>
                <span className="text-red-400 font-bold text-sm mt-0.5 block font-mono">HIGH PRIORITY</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">COMMUNICATION PRIORITY</span>
                <span className="text-white font-bold text-sm mt-0.5 block font-mono">Level 1 Emergency Warning</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">ACTIVE BROADCAST CHANNELS</span>
                <span className="text-cyan-400 font-bold text-sm mt-0.5 block font-mono">SMS, Sirens, Local Radio</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
              <span className="text-slate-400 block">Zone-Specific Advisory:</span>
              <p className="text-slate-200">
                {communicationOutput?.public_warning ||
                  'Residents in Zone B and Zone C must seek higher ground and await emergency vehicle transport. Avoid coastal roadway.'}
              </p>
            </div>
          </div>
        )}

        {selectedAgent === 'Coordinator Agent' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">SYNTHESIS STATUS</span>
                <span className="text-emerald-400 font-bold text-sm mt-0.5 block font-mono">Complete</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">CONFLICTS RESOLVED</span>
                <span className="text-white font-bold text-sm mt-0.5 block font-mono">{state.conflicts?.length || 1} Resolved</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">CONSTRAINT VALIDATION</span>
                <span className="text-emerald-400 font-bold text-sm mt-0.5 block font-mono">✓ Passed</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-mono">DECISION CONFIDENCE</span>
                <span className="text-cyan-400 font-bold text-sm mt-0.5 block font-mono">96%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <span className="text-slate-400 block font-bold">Executive Coordinator Directive:</span>
              <p className="text-white font-medium">
                {coordinatorOutput?.decision || 'Prioritize Zone B surgical trauma extraction; deploy RV-01 to Zone A for perimeter clearance.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 10: REAL-TIME AGENT ACTIVITY FEED */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Agent Activity Stream
          </h2>
          <span className="text-xs font-mono text-slate-400">Live Agent Bus</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
          {messages.map((msg, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] shrink-0 pt-0.5">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '14:31:04'}
              </span>
              <span className="font-semibold text-cyan-300 shrink-0">
                {msg.from_agent}:
              </span>
              <span className="text-slate-300 text-[11px]">
                {msg.payload?.summary || msg.message_type}
              </span>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-slate-400 text-xs p-3">No activity logged yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
