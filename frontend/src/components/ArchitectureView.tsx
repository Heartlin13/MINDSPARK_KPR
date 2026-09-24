import React from 'react';
import { 
  ArrowDown, 
  HeartPulse, 
  Truck, 
  Radio, 
  BrainCircuit, 
  Bell, 
  FileText, 
  ShieldAlert, 
  Boxes, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Architecture
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Visual workflow of the real-time multi-agent disaster response pipeline
        </p>
      </div>

      {/* SECTION 20: VISUAL PIPELINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
        <div className="max-w-md mx-auto flex flex-col items-center space-y-2 text-xs font-mono">
          {/* Step 1: Incident */}
          <div className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <Activity className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <span className="font-bold text-white text-xs block">Incident</span>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Step 2: Situation Analysis */}
          <div className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <Layers className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="font-bold text-white text-xs block">Situation Analysis</span>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Step 3: Medical / Logistics / Communication Agents */}
          <div className="w-full grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <HeartPulse className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <span className="font-semibold text-white text-[11px] block">Medical Agent</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <Truck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="font-semibold text-white text-[11px] block">Logistics Agent</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <Radio className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <span className="font-semibold text-white text-[11px] block">Communication Agent</span>
            </div>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Step 4: Agent Message Bus */}
          <div className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="font-bold text-white text-xs block">Agent Message Bus</span>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Step 5: Conflict Engine */}
          <div className="w-full p-3.5 rounded-xl bg-slate-950 border border-amber-800/60 text-center">
            <ShieldAlert className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="font-bold text-amber-300 text-xs block">Conflict Engine</span>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Step 6: Constraint Validator */}
          <div className="w-full p-3.5 rounded-xl bg-slate-950 border border-cyan-800/60 text-center">
            <Boxes className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="font-bold text-cyan-300 text-xs block">Constraint Validator</span>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Step 7: Coordinator Agent */}
          <div className="w-full p-3.5 rounded-xl bg-slate-950 border border-indigo-800/60 text-center">
            <BrainCircuit className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <span className="font-bold text-indigo-300 text-xs block">Coordinator Agent</span>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Step 8: Resource Allocation */}
          <div className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="font-bold text-white text-xs block">Resource Allocation</span>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Step 9: Response Plan */}
          <div className="w-full p-3.5 rounded-xl bg-slate-950 border border-emerald-800/60 text-center">
            <FileText className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="font-bold text-emerald-300 text-xs block">Response Plan</span>
          </div>

          <ArrowDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Step 10: Public Alert */}
          <div className="w-full p-3.5 rounded-xl bg-slate-950 border border-red-800/60 text-center">
            <Bell className="w-4 h-4 text-red-400 mx-auto mb-1" />
            <span className="font-bold text-red-300 text-xs block">Public Alert</span>
          </div>
        </div>
      </div>
    </div>
  );
};
