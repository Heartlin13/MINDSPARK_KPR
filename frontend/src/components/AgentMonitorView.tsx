import React, { useState } from 'react';
import { 
  HeartPulse, 
  Truck, 
  Radio, 
  BrainCircuit, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';
import { SystemExecutionState, AgentRole } from '../types/disaster';

interface AgentMonitorViewProps {
  state: SystemExecutionState | null;
}

export const AgentMonitorView: React.FC<AgentMonitorViewProps> = ({ state }) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  if (!state) return null;

  const totalZones = state.zones?.length || 4;

  const getStatusDisplay = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ANALYZING':
        return 'Analyzing';
      case 'RECOMMENDING':
        return 'Recommending';
      case 'CONFLICTED':
        return 'Contended';
      case 'RESOLVING':
      case 'COMPLETED':
        return 'Completed';
      case 'WAITING':
      case 'IDLE':
      default:
        return 'Ready';
    }
  };

  const filteredMessages = (state.messages || []).filter((msg) => {
    const matchesType = selectedType === 'ALL' || msg.message_type === selectedType;
    const matchesAgent =
      selectedAgent === 'ALL' ||
      msg.from_agent.toLowerCase().includes(selectedAgent.toLowerCase()) ||
      msg.to_agent.toLowerCase().includes(selectedAgent.toLowerCase());
    return matchesType && matchesAgent;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Agent Monitor
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Autonomous multi-agent domain monitoring and coordination status
        </p>
      </div>

      {/* 4 AGENT CARDS STRICTLY MATCHING SECTION 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Medical Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-red-950/60 border border-red-800 text-red-400">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Medical Agent</h3>
            </div>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-semibold">
                {getStatusDisplay(state.agentStatuses['Medical Agent']?.status || 'COMPLETED')}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Risk:</span>
              <span className="text-red-400 font-bold">Critical</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Zones:</span>
              <span className="text-slate-200">{totalZones}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Resources:</span>
              <span className="text-cyan-300 font-semibold">2 Ambulances</span>
            </div>
          </div>
        </div>

        {/* Logistics Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-400">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Logistics Agent</h3>
            </div>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-semibold">
                {getStatusDisplay(state.agentStatuses['Logistics Agent']?.status || 'COMPLETED')}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Risk:</span>
              <span className="text-orange-400 font-bold">Danger</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Zones:</span>
              <span className="text-slate-200">{totalZones}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Resources:</span>
              <span className="text-cyan-300 font-semibold">3 Rescue Vehicles</span>
            </div>
          </div>
        </div>

        {/* Communication Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Communication Agent</h3>
            </div>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-semibold">
                {getStatusDisplay(state.agentStatuses['Communication Agent']?.status || 'COMPLETED')}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Risk:</span>
              <span className="text-orange-400 font-bold">Danger</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Zones:</span>
              <span className="text-slate-200">{totalZones}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Alert:</span>
              <span className="text-emerald-300 font-semibold">Ready</span>
            </div>
          </div>
        </div>

        {/* Coordinator Agent */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-400">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Coordinator Agent</h3>
            </div>
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-semibold">
                {getStatusDisplay(state.agentStatuses['Coordinator Agent']?.status || 'COMPLETED')}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Risk:</span>
              <span className="text-red-400 font-bold">Critical</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Zones:</span>
              <span className="text-slate-200">{totalZones}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Final Plan:</span>
              <span className="text-emerald-300 font-semibold">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* AGENT ACTIVITY FEED */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Agent Activity Feed
            </h2>
            <span className="text-[11px] text-slate-400">
              Coordinated message stream
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL">All Types</option>
              <option value="REQUEST">Requests</option>
              <option value="RECOMMENDATION">Recommendations</option>
              <option value="CONFLICT">Conflicts</option>
              <option value="DECISION">Decisions</option>
              <option value="ALERT">Alerts</option>
            </select>

            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="ALL">All Agents</option>
              <option value="Medical">Medical</option>
              <option value="Logistics">Logistics</option>
              <option value="Communication">Communication</option>
              <option value="Coordinator">Coordinator</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">AGENT</th>
                <th className="py-2.5 px-3">TARGET</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">SUMMARY</th>
                <th className="py-2.5 px-3 text-right">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMessages.map((msg, index) => (
                <tr key={index} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                    {msg.from_agent}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                    {msg.to_agent}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {msg.message_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200 font-sans max-w-sm truncate">
                    {msg.payload.summary}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
