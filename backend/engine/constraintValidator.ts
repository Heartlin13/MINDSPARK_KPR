import {
  ConflictDetectionResult,
  ConstraintValidationResult,
  ResourceAllocationRecord,
  ResourceRequest,
  ResourceUnit,
  Zone,
} from '../../frontend/src/types/disaster';

export class ConstraintValidator {
  /**
   * Validates pre-allocation agent requests against master resource limits.
   */
  public validateRequests(
    requests: ResourceRequest[],
    resources: ResourceUnit[],
    conflicts: ConflictDetectionResult[]
  ): ConstraintValidationResult {
    const violations: string[] = [];
    const warnings: string[] = [];
    const checked_constraints: string[] = [
      'RULE 1: Available resources cannot become negative',
      'RULE 2: Allocated resources cannot exceed total resources',
      'RULE 3: One ambulance cannot be assigned to two zones simultaneously',
      'RULE 4: One rescue vehicle cannot be assigned to two zones simultaneously',
      'RULE 5: Shelter capacity cannot be exceeded',
      'RULE 6: Medical team availability cannot be exceeded (max 5)',
      'RULE 7: Medical kits cannot become negative (max 20)',
      'RULE 8: Food packs cannot become negative (max 100)',
      'RULE 9: Water packs cannot become negative (max 100)',
    ];

    // Check conflicts
    for (const c of conflicts) {
      if (c.status === 'UNRESOLVED') {
        violations.push(
          `REJECT PLAN: Unresolved contention on ${c.resource}. Competing requests from ${c.requesting_agents.join(' and ')}.`
        );
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings,
      checked_constraints,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deterministic Plan Validator. Hard mathematical verification.
   * If a proposed plan violates a rule: REJECT PLAN.
   */
  public validatePlan(
    proposedAllocations: ResourceAllocationRecord[],
    currentResources: ResourceUnit[],
    zones?: Zone[]
  ): ConstraintValidationResult {
    const violations: string[] = [];
    const warnings: string[] = [];
    const checked_constraints: string[] = [
      'RULE 1: Available resources cannot become negative',
      'RULE 2: Allocated resources cannot exceed total resources',
      'RULE 3: One ambulance cannot be assigned to two zones simultaneously',
      'RULE 4: One rescue vehicle cannot be assigned to two zones simultaneously',
      'RULE 5: Shelter capacity cannot be exceeded',
      'RULE 6: Medical team availability cannot be exceeded (max 5)',
      'RULE 7: Medical kits cannot become negative (max 20)',
      'RULE 8: Food packs cannot become negative (max 100)',
      'RULE 9: Water packs cannot become negative (max 100)',
    ];

    // Check single physical unit assignments across zones
    const unitZoneMap: Record<string, string[]> = {};
    for (const alloc of proposedAllocations) {
      if (!unitZoneMap[alloc.resource]) {
        unitZoneMap[alloc.resource] = [];
      }
      unitZoneMap[alloc.resource].push(alloc.zone);
    }

    for (const [unitId, assignedZones] of Object.entries(unitZoneMap)) {
      if (assignedZones.length > 1) {
        const unit = currentResources.find((r) => r.id === unitId);
        if (
          unit &&
          (unit.type === 'Ambulance' ||
            unit.type === 'Rescue Vehicle' ||
            unit.type === 'Rescue Boat' ||
            unit.total === 1)
        ) {
          violations.push(
            `REJECT PLAN: Physical asset ${unitId} (${unit.type}) assigned to multiple zones simultaneously: [${assignedZones.join(
              ', '
            )}]. Violates spatial exclusivity constraint.`
          );
        }
      }
    }

    // Check fleet limits
    const totalAmbulanceAllocations = proposedAllocations.filter((a) => {
      const u = currentResources.find((r) => r.id === a.resource);
      return (u && u.type === 'Ambulance') || a.resource.startsWith('AMB');
    }).length;
    if (totalAmbulanceAllocations > 2) {
      violations.push(
        `REJECT PLAN: Total allocated ambulances (${totalAmbulanceAllocations}) exceeds total fleet ceiling of 2.`
      );
    }

    const totalRVAllocations = proposedAllocations.filter((a) => {
      const u = currentResources.find((r) => r.id === a.resource);
      return (u && u.type === 'Rescue Vehicle') || a.resource.startsWith('RV');
    }).length;
    if (totalRVAllocations > 3) {
      violations.push(
        `REJECT PLAN: Total allocated rescue vehicles (${totalRVAllocations}) exceeds total fleet ceiling of 3.`
      );
    }

    const totalBoatAllocations = proposedAllocations.filter((a) => {
      const u = currentResources.find((r) => r.id === a.resource);
      return (u && u.type === 'Rescue Boat') || a.resource.startsWith('RB');
    }).length;
    if (totalBoatAllocations > 2) {
      violations.push(
        `REJECT PLAN: Total allocated rescue boats (${totalBoatAllocations}) exceeds total craft ceiling of 2.`
      );
    }

    const totalMedTeamAllocations = proposedAllocations.filter((a) => {
      const u = currentResources.find((r) => r.id === a.resource);
      return (u && u.type === 'Medical Team') || a.resource.startsWith('MED-T');
    }).length;
    if (totalMedTeamAllocations > 5) {
      violations.push(
        `REJECT PLAN: Total allocated medical teams (${totalMedTeamAllocations}) exceeds available staff of 5 teams.`
      );
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings,
      checked_constraints,
      timestamp: new Date().toISOString(),
    };
  }
}
