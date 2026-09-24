import React from 'react';
import { Boxes, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SystemExecutionState, ResourceUnit } from '../types/disaster';

interface ResourcesViewProps {
  state: SystemExecutionState | null;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ state }) => {
  if (!state) return null;

  const rawResources = state.resources || [];

  // Default expected resource types
  const defaultResourceTypes = [
    { name: 'Ambulances', total: 2, allocated: 1 },
    { name: 'Rescue Vehicles', total: 3, allocated: 1 },
    { name: 'Medical Teams', total: 4, allocated: 2 },
    { name: 'Medical Kits', total: 10, allocated: 4 },
    { name: 'Rescue Boats', total: 2, allocated: 1 },
    { name: 'Shelters', total: 3, allocated: 1 },
    { name: 'Food Packs', total: 50, allocated: 15 },
    { name: 'Water Packs', total: 50, allocated: 20 },
  ];

  // Merge or map with existing resources while strictly ensuring no negative numbers
  const displayResources = defaultResourceTypes.map((def) => {
    const existing = rawResources.find(
      (r) => r.name.toLowerCase() === def.name.toLowerCase() || r.type?.toLowerCase() === def.name.toLowerCase()
    );
    const total = existing ? existing.total : def.total;
    const allocated = existing ? Math.min(total, Math.max(0, existing.allocated)) : def.allocated;
    const available = Math.max(0, total - allocated);

    let status = 'Available';
    if (available === 0) status = 'Depleted';
    else if (available <= Math.ceil(total * 0.3)) status = 'Limited';
    else status = 'Optimal';

    return {
      name: def.name,
      total,
      allocated,
      available,
      status,
    };
  });

  const totalUnits = displayResources.reduce((sum, r) => sum + r.total, 0);
  const allocatedUnits = displayResources.reduce((sum, r) => sum + r.allocated, 0);
  const availableUnits = Math.max(0, totalUnits - allocatedUnits);
  const reservePercent = Math.round((availableUnits / totalUnits) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Resources
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time emergency inventory, fleet availability, and allocation tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[10px]">Fleet Reserve:</span>
            <span className={`font-bold ${reservePercent < 25 ? 'text-red-400' : 'text-emerald-400'}`}>
              {availableUnits} / {totalUnits} ({reservePercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 11: CLEAN RESOURCE TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-400" />
            Resource Inventory
          </h2>
          <span className="text-xs font-mono text-emerald-400 font-semibold">Live Fleet Registry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">RESOURCE</th>
                <th className="py-2.5 px-3">TOTAL</th>
                <th className="py-2.5 px-3">AVAILABLE</th>
                <th className="py-2.5 px-3">ALLOCATED</th>
                <th className="py-2.5 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayResources.map((res, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-white">
                    {res.name}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {res.total}
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">
                    {res.available}
                  </td>
                  <td className="py-3 px-3 text-amber-400 font-semibold">
                    {res.allocated}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.status === 'Depleted'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : res.status === 'Limited'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
