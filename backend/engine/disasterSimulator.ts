import { Zone, ResourceUnit } from '../../frontend/src/types/disaster';

export function getInitialZones(): Zone[] {
  return [
    {
      id: 'Zone A',
      name: 'Industrial Corridor & North Residential',
      population: 4200,
      peopleAtRisk: 340,
      injured: 6,
      severity: 'HIGH',
      emergencyType: 'Toxic Plume Dispersion & Road Obstruction',
      requiredResources: ['Rescue Vehicle', 'Ambulance', 'Medical Kits', 'Shelter North'],
      coordinates: { x: 22, y: 30 },
      notes: 'Chemical plant storage tank rupture. Southwesterly wind blowing airborne particulates toward residential sectors. Road Alpha partially blocked by debris.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'Zone B',
      name: 'Downtown Commercial / Transit Hub',
      population: 6800,
      peopleAtRisk: 580,
      injured: 18,
      severity: 'CRITICAL',
      emergencyType: 'Multi-Story Structural Collapse & Fire',
      requiredResources: ['Ambulance (AMB-02)', 'Medical Team (MED-T1)', 'Rescue Vehicle', 'Medical Kits'],
      coordinates: { x: 68, y: 28 },
      notes: 'Building facade and subterranean concourse collapse during seismic tremor. Multiple trapped victims with crush injuries and severe hypovolemic trauma.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'Zone C',
      name: 'River Valley & Waterfront Basin',
      population: 3100,
      peopleAtRisk: 140,
      injured: 2,
      severity: 'MODERATE',
      emergencyType: 'Rising Water Table & Drainage Backflow',
      requiredResources: ['Rescue Boats', 'Food & Water Packs'],
      coordinates: { x: 38, y: 72 },
      notes: 'Lowland storm drain surcharge. Retaining dyke holding stable at 78% capacity prior to upstream reservoir alert.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'Zone D',
      name: 'West Hills Suburbs & Forest Margin',
      population: 2900,
      peopleAtRisk: 80,
      injured: 1,
      severity: 'LOW',
      emergencyType: 'Isolated Power Grid Outage',
      requiredResources: ['Food Packs', 'Water Packs'],
      coordinates: { x: 80, y: 78 },
      notes: 'Transformer fire isolated. Minimal structural hazard; local shelter capable of supporting self-evacuees.',
      lastUpdated: new Date().toISOString(),
    },
  ];
}

export function getDamFailureZoneC(currentZones: Zone[]): Zone[] {
  return currentZones.map((z) => {
    if (z.id === 'Zone C') {
      return {
        ...z,
        name: 'River Valley & Waterfront Basin [DAM BREACH]',
        peopleAtRisk: 1350,
        injured: 38,
        severity: 'CRITICAL',
        emergencyType: 'Catastrophic Dam Structural Failure & Flash Flood Inundation',
        requiredResources: [
          'Rescue Boat (RB-01, RB-02)',
          'Ambulance (AMB-01)',
          'Medical Team (MED-T1, MED-T2)',
          'Rescue Vehicle',
          'Shelter Central',
        ],
        notes: 'UPSTREAM DAM GATES CRACKED. 4-meter water wall surging through lower basin. Over 400 structures flooded to second floor; critical drowning, hypothermia, and rooftop stranding.',
        lastUpdated: new Date().toISOString(),
      };
    }
    return z;
  });
}

export function getInitialResources(): ResourceUnit[] {
  return [
    // 2 Ambulances
    {
      id: 'AMB-01',
      type: 'Ambulance',
      name: 'Paramedic Unit 01 (Type III ALS Ambulance)',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },
    {
      id: 'AMB-02',
      type: 'Ambulance',
      name: 'Critical Trauma Intensive Care Ambulance 02',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },

    // 3 Rescue Vehicles
    {
      id: 'RV-01',
      type: 'Rescue Vehicle',
      name: 'Heavy Rescue Squad 01 (Debris Clearance & Winch)',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },
    {
      id: 'RV-02',
      type: 'Rescue Vehicle',
      name: 'Technical Rescue Truck 02 (Shoring & Trench Extrication)',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },
    {
      id: 'RV-03',
      type: 'Rescue Vehicle',
      name: 'All-Terrain Rapid Evacuation Transporter 03',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },

    // 5 Medical Teams
    {
      id: 'MED-T1',
      type: 'Medical Team',
      name: 'Disaster Surgical Triage Team Alpha',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },
    {
      id: 'MED-T2',
      type: 'Medical Team',
      name: 'Critical Care Trauma Unit Bravo',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },
    {
      id: 'MED-T3',
      type: 'Medical Team',
      name: 'Field Resuscitation Team Charlie',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },
    {
      id: 'MED-T4',
      type: 'Medical Team',
      name: 'Emergency Medical Service Squad Delta',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },
    {
      id: 'MED-T5',
      type: 'Medical Team',
      name: 'Pediatric & Geriatric Care Unit Echo',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },

    // 20 Medical Kits
    {
      id: 'MED-KITS',
      type: 'Medical Kit',
      name: 'Trauma & Airway Burn First-Aid Kits',
      total: 20,
      available: 20,
      allocated: 0,
      status: 'AVAILABLE',
    },

    // 2 Rescue Boats
    {
      id: 'RB-01',
      type: 'Rescue Boat',
      name: 'Swift-Water Inflatable Jet Boat 01',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },
    {
      id: 'RB-02',
      type: 'Rescue Boat',
      name: 'Rigid-Hull Flood Evacuation Craft 02',
      total: 1,
      available: 1,
      allocated: 0,
      status: 'AVAILABLE',
    },

    // 3 Shelters
    {
      id: 'SH-North',
      type: 'Shelter',
      name: 'North Community Arena Shelter',
      total: 1,
      available: 1,
      allocated: 0,
      capacity: 500,
      status: 'AVAILABLE',
    },
    {
      id: 'SH-Central',
      type: 'Shelter',
      name: 'Central High School High-Ground Shelter',
      total: 1,
      available: 1,
      allocated: 0,
      capacity: 800,
      status: 'AVAILABLE',
    },
    {
      id: 'SH-West',
      type: 'Shelter',
      name: 'West Hill Civic Gymnasium Shelter',
      total: 1,
      available: 1,
      allocated: 0,
      capacity: 400,
      status: 'AVAILABLE',
    },

    // 100 Food Packs
    {
      id: 'FOOD-PK',
      type: 'Food Pack',
      name: 'High-Calorie Ready-to-Eat Ration Bundles',
      total: 100,
      available: 100,
      allocated: 0,
      status: 'AVAILABLE',
    },

    // 100 Water Packs
    {
      id: 'WATER-PK',
      type: 'Water Pack',
      name: 'Potable Water Filtration & Canteen Crates',
      total: 100,
      available: 100,
      allocated: 0,
      status: 'AVAILABLE',
    },
  ];
}

export class DisasterSimulator {
  private zones: Zone[];

  constructor() {
    this.zones = getInitialZones();
  }

  public getZones(): Zone[] {
    return this.zones;
  }

  public injectDamFailure(): Zone[] {
    this.zones = getDamFailureZoneC(this.zones);
    return this.zones;
  }

  public reset(): Zone[] {
    this.zones = getInitialZones();
    return this.zones;
  }
}
