import React from 'react';
import { 
  LayoutDashboard,
  Flame,
  Bot,
  Truck,
  ShieldAlert,
  Radio,
  FileBarChart2,
  GitBranch,
  FileCheck2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { SystemExecutionState } from '../types/disaster';

export type TabType = 
  | 'dashboard'
  | 'incidents'
  | 'agent-operations'
  | 'resources'
  | 'response-plan'
  | 'alerts'
  | 'history'
  | 'architecture'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  state: SystemExecutionState | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onTabChange, 
  state,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const isDamFailure = state?.activeEmergencyId?.includes('DAM') || state?.activeEmergencyId?.includes('EMERGENCY');
  const activeConflictsCount = state?.conflicts?.length || 0;
  const activeAlertsCount = state?.coordinatorOutput?.public_alert ? 1 : 0;

  // Grouped navigation categories according to the requested information architecture:
  // 1. Operations (Live command, tactical agents, resource logistics & active dispatch)
  // 2. Analysis (Audit history, architectural telemetry & situation reports)
  // 3. Administration (System parameters, configuration & model thresholds)
  const navGroups: NavGroup[] = [
    {
      category: 'Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'incidents',
          label: 'Live Incidents',
          icon: Flame,
          badge: isDamFailure ? 'CRITICAL' : 'ACTIVE',
          badgeColor: isDamFailure 
            ? 'bg-red-500/20 text-red-300 border border-red-500/40 ring-1 ring-red-500/30' 
            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        },
        {
          id: 'agent-operations',
          label: 'Agent Operations',
          icon: Bot,
          badge: '4 Active',
          badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
        },
        {
          id: 'resources',
          label: 'Resources',
          icon: Truck,
        },
        {
          id: 'response-plan',
          label: 'Response Plan',
          icon: ShieldAlert,
          badge: state?.approvalState?.status === 'PLAN_APPROVED' 
            ? 'APPROVED' 
            : activeConflictsCount > 0 
            ? 'CONFLICT' 
            : 'READY',
          badgeColor: state?.approvalState?.status === 'PLAN_APPROVED' 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
            : activeConflictsCount > 0
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'bg-slate-800 text-slate-300 border border-slate-700',
        },
        {
          id: 'alerts',
          label: 'Alerts & Broadcasts',
          icon: Radio,
          badge: activeAlertsCount > 0 ? 'BROADCAST' : undefined,
          badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse',
        },
      ],
    },
    {
      category: 'Analysis',
      items: [
        {
          id: 'history',
          label: 'Response History',
          icon: FileBarChart2,
        },
        {
          id: 'architecture',
          label: 'Architecture',
          icon: GitBranch,
        },
        {
          id: 'reports',
          label: 'Situation Reports',
          icon: FileCheck2,
        },
      ],
    },
    {
      category: 'Administration',
      items: [
        {
          id: 'settings',
          label: 'System Settings',
          icon: Sliders,
        },
      ],
    },
  ];

  const handleNavClick = (id: TabType) => {
    onTabChange(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-slate-950 border-r border-slate-800/90 transition-all duration-200 select-none shadow-2xl md:shadow-none ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className={`hidden md:flex items-center border-b border-slate-800/90 ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-4'}`}>
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-red-950">
            <ShieldAlert className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-extrabold text-base tracking-wide font-mono text-white leading-tight">ResQ-Mind</span>
                <span className="rounded border border-emerald-800/60 bg-slate-900 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wide text-emerald-400">Simulated Live Data</span>
              </div>
              <span className="block truncate text-[10px] leading-tight text-slate-400 whitespace-nowrap">Real-Time Disaster Response Coordination</span>
            </div>
          )}
        </div>

        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 md:hidden bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="font-mono font-bold text-sm tracking-wide text-white">ResQ-Mind</span>
          </div>
          <button 
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation List */}
        <div className="flex-1 py-4 px-2.5 space-y-5 overflow-y-auto custom-scrollbar">
          {navGroups.map((group, groupIdx) => (
            <div key={group.category} className="space-y-1">
              {/* Category Header */}
              {!isCollapsed ? (
                <div className="px-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>{group.category}</span>
                  {groupIdx === 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  )}
                </div>
              ) : (
                <div className="my-2 border-t border-slate-800/80 mx-2" />
              )}

              {/* Items in Category */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      title={isCollapsed ? `${item.label} (${group.category})` : undefined}
                      className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-red-500/15 text-white font-semibold border-l-4 border-red-500 shadow-md shadow-red-950/40 ring-1 ring-red-500/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon 
                          className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                            isActive ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'text-slate-400 group-hover:text-slate-200'
                          }`} 
                        />
                        {!isCollapsed && (
                          <span className={`truncate text-xs ${isActive ? 'text-white font-bold tracking-tight' : 'text-slate-300 group-hover:text-white'}`}>
                            {item.label}
                          </span>
                        )}
                      </div>

                      {/* Active glow indicator on collapsed mode */}
                      {isCollapsed && isActive && (
                        <span className="absolute right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                      )}

                      {/* Expanded Badge */}
                      {!isCollapsed && item.badge && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Operational Footer / Collapse Button */}
        <div className="p-3 border-t border-slate-800/90 bg-slate-950/90">
          {!isCollapsed && (
            <div className="mb-2.5 px-2 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800/60 text-[11px] text-slate-300 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-400">Tactical Net</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">ONLINE</span>
            </div>
          )}

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center w-full py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-xs transition border border-transparent hover:border-slate-800 cursor-pointer"
              title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Collapse Menu</span>
                </div>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
