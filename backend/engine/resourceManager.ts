import { ResourceUnit, ResourceAllocationRecord } from '../../frontend/src/types/disaster';
import { getInitialResources } from './disasterSimulator';

export class ResourceManager {
  private resources: ResourceUnit[];

  constructor() {
    this.resources = getInitialResources();
  }

  public getAllResources(): ResourceUnit[] {
    return this.resources;
  }

  public reset(): ResourceUnit[] {
    this.resources = getInitialResources();
    return this.resources;
  }

  public allocateResource(resourceIdOrCategory: string, zone: string, agent: string) {
    this.resources = ResourceManager.applyAllocations(this.resources, [
      {
        zone,
        resource: resourceIdOrCategory,
        agent,
        priority: 'P1 - High',
        status: 'COMMITTED',
      },
    ]);
  }

  /**
   * Applies approved coordinator allocations to the resource pool.
   */
  static applyAllocations(
    initialPool: ResourceUnit[],
    allocations: ResourceAllocationRecord[]
  ): ResourceUnit[] {
    // Clone pool
    const updated = initialPool.map((res) => ({ ...res }));

    for (const alloc of allocations) {
      // Find matching resource by ID or category
      let target = updated.find((r) => r.id === alloc.resource);

      if (!target) {
        // Find available unit in that category
        target = updated.find((r) => r.type === alloc.resource && r.available > 0);
      }

      if (target) {
        if (target.total === 1) {
          // Discrete vehicle/team unit
          target.allocated = 1;
          target.available = 0;
          target.assignedZone = alloc.zone;
          target.assignedAgent = alloc.agent;
          target.status = 'DEPLOYED';
        } else {
          // Bulk resource like kits or rations
          const countToDeduct = target.id === 'MED-KITS' ? 5 : 25;
          const actualDeduct = Math.min(target.available, countToDeduct);
          target.allocated += actualDeduct;
          target.available = Math.max(0, target.available - actualDeduct);
          target.assignedZone = alloc.zone;
          target.assignedAgent = alloc.agent;
          target.status = target.available === 0 ? 'DEPLETED' : 'DEPLOYED';
        }
      }
    }

    return updated;
  }

  /**
   * Calculates scarcity warning metrics.
   */
  static getScarcityReport(resources: ResourceUnit[]) {
    const scarceItems = resources.filter(
      (r) => r.available === 0 || (r.total > 1 && r.available / r.total <= 0.25)
    );
    return {
      scarceCount: scarceItems.length,
      scarceItems: scarceItems.map((s) => ({
        id: s.id,
        name: s.name,
        available: s.available,
        total: s.total,
        status: s.status,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}
