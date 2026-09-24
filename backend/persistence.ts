import type { SystemExecutionState } from '../frontend/src/types/disaster';
import { prisma, isDatabaseConfigured } from './database';

const CURRENT_SNAPSHOT_ID = 'CURRENT_SIMULATION_STATE';

const agentDefinitions = [
  { id: 'medical', name: 'Medical Agent', type: 'AI_AGENT' },
  { id: 'logistics', name: 'Logistics Agent', type: 'AI_AGENT' },
  { id: 'communication', name: 'Communication Agent', type: 'AI_AGENT' },
  { id: 'coordinator', name: 'Coordinator Agent', type: 'AI_AGENT' },
];

function asJson(value: unknown): any {
  return value ?? null;
}

export async function loadPersistedState(): Promise<SystemExecutionState | null> {
  if (!isDatabaseConfigured()) return null;
  const snapshot = await prisma.simulationSnapshot.findUnique({ where: { id: CURRENT_SNAPSHOT_ID } });
  return snapshot?.state ? (snapshot.state as unknown as SystemExecutionState) : null;
}

export async function persistState(state: SystemExecutionState): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const incidentId = state.activeEmergencyId || 'INITIAL_HAZARD';
  const severity = state.zones.some((zone) => zone.severity === 'CRITICAL') ? 'CRITICAL' : state.zones.some((zone) => zone.severity === 'HIGH') ? 'HIGH' : 'MODERATE';
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.disasterIncident.upsert({
      where: { id: incidentId },
      create: { id: incidentId, eventType: state.scenarioTitle, status: state.isRunning ? 'RUNNING' : 'ACTIVE', severity },
      update: { eventType: state.scenarioTitle, status: state.isRunning ? 'RUNNING' : 'ACTIVE', severity },
    });

    for (const zone of state.zones as any[]) {
      await tx.zone.upsert({
        where: { id: zone.id },
        create: {
          id: zone.id,
          incidentId,
          name: zone.name,
          riskLevel: zone.severity || zone.severityLevel || 'UNKNOWN',
          floodStatus: zone.floodStatus || zone.waterLevel || null,
          peopleAtRisk: Number(zone.peopleAtRisk) || 0,
          waterLevel: zone.waterLevel ? String(zone.waterLevel) : null,
          rainfallIntensity: Number.isFinite(zone.rainfallIntensity) ? Number(zone.rainfallIntensity) : null,
          waterSpreadPercentage: Number.isFinite(zone.waterSpread) ? Number(zone.waterSpread) : null,
        },
        update: {
          incidentId,
          name: zone.name,
          riskLevel: zone.severity || zone.severityLevel || 'UNKNOWN',
          floodStatus: zone.floodStatus || zone.waterLevel || null,
          peopleAtRisk: Number(zone.peopleAtRisk) || 0,
          waterLevel: zone.waterLevel ? String(zone.waterLevel) : null,
          rainfallIntensity: Number.isFinite(zone.rainfallIntensity) ? Number(zone.rainfallIntensity) : null,
          waterSpreadPercentage: Number.isFinite(zone.waterSpread) ? Number(zone.waterSpread) : null,
        },
      });
    }

    for (const resource of state.resources as any[]) {
      await tx.resource.upsert({
        where: { id: resource.id },
        create: {
          id: resource.id,
          type: resource.type,
          name: resource.name,
          totalQuantity: Number(resource.total) || 0,
          availableQuantity: Number(resource.available) || 0,
          status: resource.status || 'AVAILABLE',
        },
        update: {
          type: resource.type,
          name: resource.name,
          totalQuantity: Number(resource.total) || 0,
          availableQuantity: Number(resource.available) || 0,
          status: resource.status || 'AVAILABLE',
        },
      });
    }

    const plannedAllocations = ((state.coordinatorOutput as any)?.resource_allocation || []) as any[];
    for (const [index, allocation] of plannedAllocations.entries()) {
      const resource = (state.resources as any[]).find((item) => item.id === allocation.resource || item.type === allocation.resource);
      if (!resource) continue;
      const zoneId = (state.zones as any[]).some((zone) => zone.id === allocation.zone) ? allocation.zone : null;
      const allocationId = `ALLOC-${incidentId}-${index}-${resource.id}`;
      await tx.resourceAllocation.upsert({
        where: { id: allocationId },
        create: {
          id: allocationId,
          resourceId: resource.id,
          zoneId,
          incidentId,
          allocatedQuantity: resource.total === 1 ? 1 : resource.id === 'MED-KITS' ? 5 : 25,
          reason: allocation.reason || allocation.priority || 'Coordinator response plan allocation',
        },
        update: {
          resourceId: resource.id,
          zoneId,
          incidentId,
          reason: allocation.reason || allocation.priority || 'Coordinator response plan allocation',
        },
      });
    }

    for (const agent of agentDefinitions) {
      const status = (state.agentStatuses as any)?.[agent.name];
      await tx.agent.upsert({
        where: { id: agent.id },
        create: { ...agent, status: status?.status || 'IDLE', lastRunAt: status?.updatedAt ? new Date(status.updatedAt) : null },
        update: { name: agent.name, type: agent.type, status: status?.status || 'IDLE', lastRunAt: status?.updatedAt ? new Date(status.updatedAt) : null },
      });
    }

    for (const message of (state.messages || []) as any[]) {
      const agent = agentDefinitions.find((item) => item.name === message.from_agent) || agentDefinitions[3];
      await tx.agentMessage.upsert({
        where: { id: message.message_id },
        create: {
          id: message.message_id,
          agentId: agent.id,
          incidentId,
          messageType: message.message_type || 'UPDATE',
          message: JSON.stringify(message.payload || message.message || {}),
          createdAt: message.timestamp ? new Date(message.timestamp) : now,
        },
        update: {
          agentId: agent.id,
          incidentId,
          messageType: message.message_type || 'UPDATE',
          message: JSON.stringify(message.payload || message.message || {}),
        },
      });
    }

    for (const [index, conflict] of ((state.conflicts || []) as any[]).entries()) {
      const id = conflict.id || `CONFLICT-${incidentId}-${index}`;
      const resourceId = (state.resources as any[]).some((resource) => resource.id === conflict.resource) ? conflict.resource : null;
      await tx.conflict.upsert({
        where: { id },
        create: {
          id,
          incidentId,
          resourceId,
          description: JSON.stringify(conflict),
          severity: conflict.severity || 'HIGH',
          status: conflict.status || 'OPEN',
          resolution: conflict.resolution || null,
        },
        update: { description: JSON.stringify(conflict), severity: conflict.severity || 'HIGH', status: conflict.status || 'OPEN', resolution: conflict.resolution || null },
      });
    }

    const coordinatorOutput = state.coordinatorOutput as any;
    if (coordinatorOutput) {
      await tx.responsePlan.upsert({
        where: { id: `PLAN-${incidentId}` },
        create: {
          id: `PLAN-${incidentId}`,
          incidentId,
          priority: 1,
          decision: coordinatorOutput.decision || 'Pending coordinator decision',
          evidence: JSON.stringify(coordinatorOutput.evidence || []),
          constraint: JSON.stringify(coordinatorOutput.constraints || []),
          tradeoff: JSON.stringify(coordinatorOutput.tradeoffs || []),
          status: state.approvalState?.status || 'PENDING',
        },
        update: {
          decision: coordinatorOutput.decision || 'Pending coordinator decision',
          evidence: JSON.stringify(coordinatorOutput.evidence || []),
          constraint: JSON.stringify(coordinatorOutput.constraints || []),
          tradeoff: JSON.stringify(coordinatorOutput.tradeoffs || []),
          status: state.approvalState?.status || 'PENDING',
        },
      });
      if (coordinatorOutput.public_alert) {
        await tx.publicAlert.upsert({
          where: { id: `ALERT-${incidentId}` },
          create: { id: `ALERT-${incidentId}`, incidentId, alertType: 'COORDINATED_RESPONSE', message: coordinatorOutput.public_alert, severity, createdAt: now },
          update: { message: coordinatorOutput.public_alert, severity },
        });
      }
    }

    for (const entry of (state.history || []) as any[]) {
      await tx.simulationHistory.upsert({
        where: { id: entry.id },
        create: { id: entry.id, incidentId, action: 'RESPONSE_PLAN', description: JSON.stringify(entry) },
        update: { description: JSON.stringify(entry) },
      });
    }

    const monitoring = state.satelliteMonitoring as any;
    for (const observation of monitoring?.observations || []) {
      const zoneId = observation.zoneId || observation.zone;
      if (!zoneId || !(state.zones as any[]).some((zone) => zone.id === zoneId)) continue;
      const observedAt = observation.timestamp ? new Date(observation.timestamp) : now;
      const observationId = `OBS-${zoneId}-${observedAt.getTime()}`;
      await tx.satelliteObservation.upsert({
        where: { id: observationId },
        create: {
          id: observationId,
          zoneId,
          riskLevel: observation.floodStatus || observation.riskLevel || 'UNKNOWN',
          waterSpreadPercentage: Number.isFinite(observation.waterSpread) ? Number(observation.waterSpread) : null,
          waterLevel: observation.waterLevel ? String(observation.waterLevel) : null,
          rainfallIntensity: Number.isFinite(observation.rainfallIntensity) ? Number(observation.rainfallIntensity) : null,
          peopleAtRisk: Number(observation.peopleAtRisk) || 0,
          dataSource: monitoring.source || 'simulation',
          observedAt,
        },
        update: { riskLevel: observation.floodStatus || observation.riskLevel || 'UNKNOWN', dataSource: monitoring.source || 'simulation', observedAt },
      });
    }

    await tx.simulationSnapshot.upsert({
      where: { id: CURRENT_SNAPSHOT_ID },
      create: { id: CURRENT_SNAPSHOT_ID, incidentId, state: asJson(state), version: 1 },
      update: { incidentId, state: asJson(state), version: 1 },
    });
  });
}

export async function persistReport(report: Record<string, unknown>, incidentId: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await prisma.report.create({
    data: {
      id: String(report.reportId || `REPORT-${Date.now()}`),
      incidentId,
      reportType: 'SITUATION_REPORT',
      status: 'GENERATED',
      reportData: report as any,
    },
  });
}
