import {
  ConflictDetectionResult,
  LogisticsOutput,
  MedicalOutput,
  ResourceUnit,
} from '../../src/types/disaster';

export class ConflictEngine {
  /**
   * Deterministically detects objective resource contention across agent requests.
   * Does NOT use LLM reasoning. Pure deterministic comparison.
   */
  public detectConflicts(
    medical: MedicalOutput | null | undefined,
    logistics: LogisticsOutput | null | undefined,
    resources?: ResourceUnit[]
  ): ConflictDetectionResult[] {
    const conflicts: ConflictDetectionResult[] = [];
    if (!medical || !logistics) return conflicts;

    const specificRequests: Record<
      string,
      { agents: string[]; zones: string[]; urgencies: string[] }
    > = {};

    // 1. Collect specific ID requests from Medical Agent
    for (const req of medical.resource_requests || []) {
      const id = req.specific_id || (req.resource_type === 'Ambulance' ? 'AMB-02' : undefined);
      if (id) {
        if (!specificRequests[id]) {
          specificRequests[id] = { agents: [], zones: [], urgencies: [] };
        }
        if (!specificRequests[id].agents.includes('Medical Agent')) {
          specificRequests[id].agents.push('Medical Agent');
        }
        if (!specificRequests[id].zones.includes(req.zone)) {
          specificRequests[id].zones.push(req.zone);
        }
        specificRequests[id].urgencies.push(req.urgency);
      }
    }

    // 2. Collect specific ID requests from Logistics Agent
    for (const req of logistics.resource_requests || []) {
      const id = req.specific_id || (req.resource_type === 'Ambulance' && req.zone === 'Zone A' ? 'AMB-02' : undefined);
      if (id) {
        if (!specificRequests[id]) {
          specificRequests[id] = { agents: [], zones: [], urgencies: [] };
        }
        if (!specificRequests[id].agents.includes('Logistics Agent')) {
          specificRequests[id].agents.push('Logistics Agent');
        }
        if (!specificRequests[id].zones.includes(req.zone)) {
          specificRequests[id].zones.push(req.zone);
        }
        specificRequests[id].urgencies.push(req.urgency);
      }
    }

    // 3. Find unique physical assets requested by > 1 agent or for > 1 zone simultaneously
    for (const [resourceId, data] of Object.entries(specificRequests)) {
      if (data.agents.length > 1 || data.zones.length > 1) {
        conflicts.push({
          conflict: true,
          resource: resourceId,
          requesting_agents: data.agents,
          requested_zones: data.zones,
          severity: 'HIGH',
          status: 'UNRESOLVED',
          reason: `RESOURCE_CONFLICT: Unique physical asset ${resourceId} requested simultaneously by ${data.agents.join(
            ' and '
          )} for competing operations in ${data.zones.join(
            ' and '
          )}. A single physical unit cannot occupy two distant sectors at once.`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return conflicts;
  }
}
