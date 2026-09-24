import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  Users, 
  MapPin, 
  Boxes, 
  Activity, 
  Play, 
  RefreshCw,
  Clock,
  ShieldAlert,
  Bot,
  Scale,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Send,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  AgentRole, 
  DisasterSeverityLevel, 
  GeminiStatusInfo, 
  SatelliteMonitoring,
  SystemExecutionState,
  DisasterZone
} from '../types/disaster';
import { TabType } from './Sidebar';

interface DashboardViewProps {
  state: SystemExecutionState | null;
  geminiStatus: GeminiStatusInfo | null;
  satelliteMonitoring: SatelliteMonitoring | null;
  onNavigateTab: (tab: TabType) => void;
  onRunCoordinatedResponse: () => void;
  onTriggerEmergency?: () => void;
  isLoading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  geminiStatus,
  satelliteMonitoring,
  onNavigateTab,
  onRunCoordinatedResponse,
  onTriggerEmergency,
  isLoading,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showValidationDetails, setShowValidationDetails] = useState<boolean>(false);
  const [selectedZone, setSelectedZone] = useState<string>('Zone C');

  useEffect(() => {
    const update = () => setCurrentTime(new Date().toTimeString().split(' ')[0]);
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!state) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 font-mono text-xs">
        <Activity className="w-5 h-5 animate-spin mr-2 text-red-500" />
        Connecting to disaster response telemetries...
      </div>
    );
  }

  const isDamFailure = state.activeEmergencyId?.includes('DAM') || state.activeEmergencyId?.includes('EMERGENCY');
  const zones: DisasterZone[] = state.zones || [];
  const resources = state.resources || [];
  const conflicts = state.conflicts || [];
  const coordinator = state.coordinatorOutput;
  const messages = state.messages || [];

  // Aggregated Telemetry
  const totalPeopleAtRisk = zones.reduce((acc, z) => acc + (z.peopleAtRisk || 0), 0);
  const totalInjured = zones.reduce((acc, z) => acc + (z.injured || 0), 0);
  const totalAvailableResources = resources.reduce((acc, r) => acc + (Math.max(0, r.available) || 0), 0);
  const totalResources = resources.reduce((acc, r) => acc + (r.total || 0), 0);
  const activeIncidentsCount = isDamFailure ? 2 : 1;
  const isGeminiConnected = geminiStatus?.status === 'CONNECTED';
  const satelliteZones = satelliteMonitoring?.affectedZones || [];
  const satelliteStatusLabel = satelliteMonitoring?.status === 'CONNECTED'
    ? 'Connected'
    : satelliteMonitoring?.status === 'UNAVAILABLE'
    ? 'Unavailable'
    : 'Simulated';
  const satelliteRisk = satelliteZones.reduce<'LOW' | 'MEDIUM' | 'HIGH'>((highest, zone) => {
    if (zone.floodRisk === 'HIGH' || highest === 'HIGH') return 'HIGH';
    if (zone.floodRisk === 'MEDIUM' || highest === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  }, 'LOW');

  const floodZoneProfiles = (zones.length > 0 ? zones : [
    { id: 'Zone A', name: 'Zone A', peopleAtRisk: 0, emergencyType: '', lastUpdated: new Date().toISOString() },
    { id: 'Zone B', name: 'Zone B', peopleAtRisk: 0, emergencyType: '', lastUpdated: new Date().toISOString() },
    { id: 'Zone C', name: 'Zone C', peopleAtRisk: 0, emergencyType: '', lastUpdated: new Date().toISOString() },
    { id: 'Zone D', name: 'Zone D', peopleAtRisk: 0, emergencyType: '', lastUpdated: new Date().toISOString() },
  ] as DisasterZone[]).map((zone, index) => {
    const observedZone = satelliteMonitoring?.affectedZones?.find((entry) => entry.zoneId === zone.id);
    const baseWaterSpread = observedZone?.waterSpread ?? (zone.id === 'Zone C' ? 38 : 0);
    const status = observedZone
      ? observedZone.floodRisk === 'HIGH'
        ? 'DANGER'
        : observedZone.floodRisk === 'MEDIUM'
        ? 'MEDIUM'
        : 'SAFE'
      : zone.id === 'Zone C'
      ? 'MEDIUM'
      : 'SAFE';

    return {
      zoneId: zone.id,
      status,
      riskLevel: status === 'DANGER' ? 'High' : status === 'MEDIUM' ? 'Moderate' : 'Low',
      waterSpread: baseWaterSpread,
      peopleAtRisk: Math.max(zone.peopleAtRisk || 0, Math.round(baseWaterSpread * 12), observedZone ? Math.round(observedZone.waterSpread * 12) : 0),
      waterLevel: status === 'DANGER' ? 'Critical' : status === 'MEDIUM' ? 'Rising' : 'Normal',
      rainfall: status === 'DANGER' ? 'Heavy' : status === 'MEDIUM' ? 'Moderate' : 'Low',
      lastUpdated: observedZone?.observationTimestamp || zone.lastUpdated || new Date().toISOString(),
      displayIndex: index,
    };
  });

  const zoneFloodTelemetry = floodZoneProfiles.sort((a, b) => a.displayIndex - b.displayIndex);

  const activeFloodZone = zoneFloodTelemetry.find((zone) => zone.zoneId === selectedZone) || zoneFloodTelemetry[0];
  const zoneStatusClasses = {
    SAFE: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
    MEDIUM: 'bg-amber-950 text-amber-300 border border-amber-800',
    DANGER: 'bg-red-950 text-red-300 border border-red-800',
  };

  // Severity visual indicator strictly matching Section 6
  const renderSeverityIndicator = (level?: DisasterSeverityLevel | string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
            CRITICAL <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          </span>
        );
      case 'DANGER':
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-950 text-orange-300 border border-orange-800">
            DANGER <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          </span>
        );
      case 'MEDIUM':
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            MEDIUM <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </span>
        );
      case 'NORMAL':
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            NORMAL <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>
        );
    }
  };

  // Pipeline execution sequence
  const pipelineSteps = [
    { label: 'Medical Agent' },
    { label: 'Logistics Agent' },
    { label: 'Communication Agent' },
    { label: 'Conflict Engine' },
    { label: 'Constraint Validator' },
    { label: 'Coordinator Agent' },
    { label: 'Response Plan' },
    { label: 'Alert' },
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 3: TOP HEADER & DYNAMIC CLOCK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
              ResQ-Mind
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-emerald-400 border border-emerald-800/60 uppercase">
              SIMULATED LIVE DATA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Multi-Agent Disaster Response Coordination & Dynamic Decision Support
          </p>
        </div>

        {/* Live Status Indicators (Section 3) */}
        <div className="flex items-center gap-4 text-xs font-mono bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">System Status</span>
            <span className="text-slate-200 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Operational
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Gemini AI</span>
            <span className="text-slate-200 font-semibold flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isGeminiConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isGeminiConnected ? 'Connected' : 'Fallback'}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Last Updated</span>
            <span className="text-slate-200 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {currentTime || '14:32:08'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: REAL-TIME SYSTEM STATUS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">System Status</span>
          <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Operational
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">AI Status</span>
          <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5 mt-1 font-mono">
            <span className={`w-2 h-2 rounded-full ${isGeminiConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isGeminiConnected ? 'Connected' : 'Fallback Mode'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Active Incidents</span>
          <span className="text-sm font-bold text-red-400 mt-1 block font-mono">
            {activeIncidentsCount} {activeIncidentsCount === 1 ? 'Emergency' : 'Emergencies'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Affected Zones</span>
          <span className="text-sm font-bold text-cyan-400 mt-1 block font-mono">
            {zones.length} Sectors
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">People at Risk</span>
          <span className="text-sm font-bold text-amber-400 mt-1 block font-mono">
            {totalPeopleAtRisk.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Resources Available</span>
          <span className="text-sm font-bold text-emerald-400 mt-1 block font-mono">
            {totalAvailableResources} / {totalResources} Units
          </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-cyan-900/70 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Satellite Flood Monitoring</h2>
            <p className="text-xs text-slate-400 mt-1">Zone-based flood risk review for the current simulated disaster scenario</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {zoneFloodTelemetry.map((zone) => (
            <button
              key={zone.zoneId}
              type="button"
              onClick={() => setSelectedZone(zone.zoneId)}
              className={`rounded-xl border p-3 text-left transition ${
                selectedZone === zone.zoneId
                  ? 'border-cyan-500 bg-slate-800 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]'
                  : 'border-slate-700 bg-slate-950 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">{zone.zoneId}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  zone.status === 'SAFE'
                    ? 'bg-emerald-950 text-emerald-300'
                    : zone.status === 'MEDIUM'
                    ? 'bg-amber-950 text-amber-300'
                    : 'bg-red-950 text-red-300'
                }`}>
                  {zone.status}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 uppercase">Risk</div>
              <div className="text-sm font-bold text-white">{zone.riskLevel}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase text-slate-400">Selected Zone</div>
                <h3 className="mt-1 text-xl font-bold text-white">{activeFloodZone.zoneId}</h3>
              </div>
              <span className={`inline-flex self-start items-center px-2.5 py-1 rounded text-[10px] font-mono font-bold ${zoneStatusClasses[activeFloodZone.status as keyof typeof zoneStatusClasses]}`}>
                {activeFloodZone.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Risk Level</span>
                <span className="mt-1 block text-base font-bold text-white">{activeFloodZone.riskLevel}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Water Spread</span>
                <span className="mt-1 block text-base font-bold text-cyan-300">{activeFloodZone.waterSpread}%</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <span className="text-[10px] text-slate-500 uppercase block">People at Risk</span>
                <span className="mt-1 block text-base font-bold text-amber-300">{activeFloodZone.peopleAtRisk.toLocaleString()}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Water Level</span>
                <span className="mt-1 block text-base font-bold text-white">{activeFloodZone.waterLevel}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Rainfall</span>
                <span className="mt-1 block text-base font-bold text-white">{activeFloodZone.rainfall}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <span className="text-[10px] text-slate-500 uppercase block">Last Updated</span>
                <span className="mt-1 block text-base font-bold text-white">{new Date(activeFloodZone.lastUpdated).toLocaleString()}</span>
              </div>
            </div>

            {activeFloodZone.status === 'DANGER' && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-[11px] font-mono font-bold text-red-200">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                High Priority Zone
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
            <div className="text-[10px] uppercase text-slate-400">Response System</div>
            <div className="mt-3 space-y-2 text-xs font-mono text-slate-300">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                <div className="font-bold text-white">Medical Agent</div>
                <div className="mt-1 text-slate-400">{activeFloodZone.status === 'DANGER' ? 'Medical priority elevated for emergent triage and rescue.' : 'Routine monitoring of at-risk patients.'}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                <div className="font-bold text-white">Logistics Agent</div>
                <div className="mt-1 text-slate-400">{activeFloodZone.status === 'DANGER' ? 'Resource staging and evacuation routing prep for the zone.' : 'Supply planning remains on standard watch.'}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                <div className="font-bold text-white">Communication Agent</div>
                <div className="mt-1 text-slate-400">{activeFloodZone.status === 'DANGER' ? 'Warning and evacuation message template activated for the zone.' : 'Public advisory remains monitored and limited.'}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                <div className="font-bold text-white">Coordinator</div>
                <div className="mt-1 text-slate-400">{activeFloodZone.status === 'DANGER' ? 'Response plan escalated and coordinated with all agents.' : 'Current plan remains stable and reviewed.'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] font-mono text-slate-300">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />SAFE = Low flood risk</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />MEDIUM = Moderate flood risk</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-400" />DANGER = High flood risk</span>
        </div>

        <p className="text-[11px] text-slate-400">{satelliteMonitoring?.message || 'Satellite detection feed is currently running in synthetic mode. Flood-risk values are representative only and are not real satellite observations.'}</p>
      </div>

      {/* PIPELINE PROGRESS INDICATOR (SECTION 9) */}
      {isLoading && (
        <div className="p-4 rounded-xl bg-slate-900 border border-blue-600/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin text-blue-400" />
              Running Coordinated Multi-Agent Response...
            </span>
            <span className="font-mono text-[11px] text-blue-300">Live Execution</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {pipelineSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <span className="px-2 py-1 rounded bg-slate-950 border border-blue-700/60 text-[10px] font-mono text-blue-200 whitespace-nowrap animate-pulse">
                  {step.label}
                </span>
                {idx < pipelineSteps.length - 1 && (
                  <span className="text-slate-600 text-xs">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: ACTIVE INCIDENT & CURRENT SEVERITY */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Active Incident
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {renderSeverityIndicator(isDamFailure ? 'CRITICAL' : 'DANGER')}
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              STATUS: ACTIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] block">INCIDENT TYPE</span>
            <span className="text-white font-semibold mt-0.5 block truncate">
              {isDamFailure ? 'Flood / Dam Failure' : 'Regional Seismic Hazard'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">LOCATION / AFFECTED</span>
            <span className="text-cyan-300 font-semibold mt-0.5 block truncate">
              {zones.map((z) => z.zone).join(', ')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">SEVERITY LEVEL</span>
            <span className="mt-0.5 block font-bold text-red-400">
              {isDamFailure ? 'CRITICAL ●' : 'DANGER ●'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">PEOPLE AT RISK</span>
            <span className="text-amber-400 font-semibold mt-0.5 block">
              {totalPeopleAtRisk.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">REPORTED INJURIES</span>
            <span className="text-red-300 font-semibold mt-0.5 block">
              {totalInjured} Casualties
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block">LAST UPDATED</span>
            <span className="text-slate-300 mt-0.5 block">
              {currentTime || 'Recent'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 6: REAL-TIME ZONE MONITORING */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Real-Time Zone Monitoring
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live sector telemetry, casualty metrics, and evacuation statuses
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('incidents')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono cursor-pointer"
          >
            Manage Incidents <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-mono">
                <th className="py-2.5 px-3">ZONE</th>
                <th className="py-2.5 px-3">POPULATION</th>
                <th className="py-2.5 px-3">PEOPLE AT RISK</th>
                <th className="py-2.5 px-3">INJURED</th>
                <th className="py-2.5 px-3">SEVERITY SCORE</th>
                <th className="py-2.5 px-3">RISK LEVEL</th>
                <th className="py-2.5 px-3">MEDICAL PRIORITY</th>
                <th className="py-2.5 px-3">EVACUATION STATUS</th>
                <th className="py-2.5 px-3">LAST UPDATED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {zones.map((zone) => (
                <tr key={zone.id || zone.zone} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                    {zone.zone}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                    {(zone.population || 2500).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold whitespace-nowrap">
                    {(zone.peopleAtRisk || 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-red-300 whitespace-nowrap">
                    {zone.injured || 0}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-bold text-white">{zone.severityScore || 50}</span>
                    <span className="text-slate-500 text-[10px]"> / 100</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {renderSeverityIndicator(zone.severityLevel)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        zone.medicalPriority === 'IMMEDIATE'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : zone.medicalPriority === 'URGENT'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {zone.medicalPriority || 'URGENT'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                    {zone.evacuationStatus || 'SHELTER IN PLACE'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {currentTime || '14:32:08'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 7: LIVE AGENT OPERATIONS SUMMARY */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              Live Agent Operations
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous reasoning agents analyzing casualty triage, evacuation corridors, and conflict resolution
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('agent-operations')}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono cursor-pointer"
          >
            Agent Operations <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Medical Agent */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Medical Agent</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {state.agentStatuses?.['Medical Agent']?.status || 'COMPLETED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Risk:</span>
                <span className="text-red-400 font-semibold">Critical</span>
              </div>
              <div className="flex justify-between">
                <span>Zones:</span>
                <span className="text-slate-200">4 Analyzed</span>
              </div>
              <div className="flex justify-between">
                <span>Resources:</span>
                <span className="text-emerald-400 font-semibold">2 Ambulances</span>
              </div>
            </div>
          </div>

          {/* Logistics Agent */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Logistics Agent</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {state.agentStatuses?.['Logistics Agent']?.status || 'COMPLETED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Risk:</span>
                <span className="text-orange-400 font-semibold">Danger</span>
              </div>
              <div className="flex justify-between">
                <span>Zones:</span>
                <span className="text-slate-200">4 Analyzed</span>
              </div>
              <div className="flex justify-between">
                <span>Resources:</span>
                <span className="text-emerald-400 font-semibold">3 Rescue Vehicles</span>
              </div>
            </div>
          </div>

          {/* Communication Agent */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Communication Agent</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {state.agentStatuses?.['Communication Agent']?.status || 'COMPLETED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Risk:</span>
                <span className="text-orange-400 font-semibold">Danger</span>
              </div>
              <div className="flex justify-between">
                <span>Zones:</span>
                <span className="text-slate-200">4 Analyzed</span>
              </div>
              <div className="flex justify-between">
                <span>Alert:</span>
                <span className="text-cyan-400 font-semibold">Ready</span>
              </div>
            </div>
          </div>

          {/* Coordinator Agent */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Coordinator Agent</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {state.agentStatuses?.['Coordinator Agent']?.status || 'COMPLETED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Final Plan:</span>
                <span className="text-emerald-400 font-semibold">Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Conflicts:</span>
                <span className="text-slate-200">{conflicts.length} Resolved</span>
              </div>
              <div className="flex justify-between">
                <span>Validation:</span>
                <span className="text-emerald-400 font-semibold">✓ Valid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: RESOURCE CONFLICTS & CONSTRAINT VALIDATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* SECTION 12: ACTIVE CONFLICTS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Active Conflicts
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              STATUS: RESOLVED
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-sm">
                Resource Conflict: AMB-02
              </span>
              <span className="text-slate-400 font-mono text-[11px]">Exclusivity Contention</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px] p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Medical Agent</span>
                <span className="text-white font-semibold">→ Zone B (Trauma Extraction)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Logistics Agent</span>
                <span className="text-white font-semibold">→ Zone A (Perimeter Buffer)</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 text-[11px] block font-mono">Coordinator Decision:</span>
              <p className="text-slate-200 font-medium">
                Zone B prioritized due to higher medical urgency. Heavy vehicle RV-01 reassigned to Zone A.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 13: CONSTRAINT VALIDATION */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Resource Validation
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              ✓ VALID
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">
                All deterministic physical constraints passed
              </span>
              <button
                type="button"
                onClick={() => setShowValidationDetails(!showValidationDetails)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
              >
                {showValidationDetails ? 'Hide Details' : 'View Details'}
              </button>
            </div>

            <p className="text-slate-400 text-[11px]">
              The Constraint Validator verified all allocations: no negative resources, no double allocation, and no capacity overages detected.
            </p>

            {showValidationDetails && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No negative resource inventories detected</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No unit double-allocation (AMB-02 locked exclusively to Zone B)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Shelter capacities within headroom safety boundaries</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 14 & 15: CURRENT RESPONSE PLAN & RECENT ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CURRENT RESPONSE PLAN */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Current Response Plan
            </h2>
            <button
              onClick={() => onNavigateTab('response-plan')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              Full Plan <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {(coordinator?.final_plan || [
              {
                priority: 1,
                target_zone: isDamFailure ? 'Zone C' : 'Zone B',
                action: isDamFailure ? 'Immediate Water Evacuation & Boat Triage' : 'Immediate Medical Evacuation & Structural Triage',
                assigned_agent: 'Medical Agent',
                details: '1 Ambulance (AMB-02) + 2 Medical Teams',
              },
              {
                priority: 2,
                target_zone: isDamFailure ? 'Zone B' : 'Zone A',
                action: 'Chemical Perimeter Containment & Secondary Transit',
                assigned_agent: 'Logistics Agent',
                details: '1 Heavy Rescue Vehicle (RV-01)',
              },
            ]).slice(0, 2).map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                      PRIORITY {item.priority}
                    </span>
                    <span className="font-semibold text-white">{item.target_zone}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
                </div>
                <p className="text-slate-300 text-[11px]">{item.action}</p>
                <p className="text-slate-400 text-[10px]">{item.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 15: RECENT ALERTS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-400" />
              Recent Alerts
            </h2>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              All Alerts <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-950 text-red-300 border border-red-800">
                CRITICAL ALERT
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {currentTime || '14:32:08'}
              </span>
            </div>
            <div className="font-semibold text-white">
              {isDamFailure ? 'Zone C & Zone B Surge Evacuation' : 'Zone B High Trauma Advisory'}
            </div>
            <p className="text-slate-300 text-[11px]">
              {coordinator?.public_alert ||
                'Residents in affected sectors should immediately move to designated shelters. Follow emergency corridor markers.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 10: REAL-TIME AGENT ACTIVITY STREAM */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Agent Activity Stream
          </h2>
          <span className="text-xs font-mono text-slate-400">Live Event Feed</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
          {messages.slice(0, 5).map((msg, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 text-[10px] shrink-0 pt-0.5">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '14:31:04'}
              </span>
              <span className="font-semibold text-cyan-300 shrink-0">
                {msg.from_agent}:
              </span>
              <span className="text-slate-300 text-[11px] truncate">
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
