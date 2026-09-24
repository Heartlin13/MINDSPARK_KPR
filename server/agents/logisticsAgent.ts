import { LogisticsOutput, ResourceUnit, Zone, ZoneSeverityAnalysis } from '../../src/types/disaster';
import { generateAgentResponse } from '../geminiClient';

const LOGISTICS_SYSTEM_INSTRUCTION = `You are the Logistics Agent of ResQ-Mind.
Analyze transportation, evacuation, rescue vehicles, rescue boats, shelters, food, water, resource availability, route bottlenecks, and resource shortages.
Analyze ALL affected zones provided in the input.

For EVERY zone, determine:
- zone: exact zone id (e.g. "Zone A", "Zone B", "Zone C", "Zone D")
- severity_score: integer from 0 to 100 based on transit obstacles, evacuation volume, and shelter needs
- level: one of ["NORMAL", "MEDIUM", "DANGER", "CRITICAL"]
- priority: one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
- evacuation_priority: text rating (e.g., "MANDATORY RAPID", "ASSISTED CARE ONLY", "VOLUNTARY", "MONITOR")
- transit_bottlenecks: identified road obstructions, bridges down, debris hazards
- shelter_destination: assigned target shelter (e.g., "Shelter North", "Shelter Central", "Shelter West")
- reason: logistics justification

Crucial Operational Protocol:
- For Zone A evacuation ahead of the toxic chemical plume, request specific vehicle "AMB-02" for elderly assisted transport and "RV-01" for debris clearance on Road Alpha.
- For Dam Failure (Zone C), request swift-water rescue craft "RB-01", "RB-02", and assign evacuations to high-ground "Shelter Central".
- Do NOT directly allocate resources; provide structured recommendations and requests only.

Return ONLY structured JSON conforming to this exact schema:
{
  "agent": "Logistics Agent",
  "overall_status": "HIGH LOGISTICAL STRAIN - Evacuation corridor compromise in Zone A and structural blockades in Zone B",
  "zone_analysis": [
    {
      "zone": "Zone A",
      "severity_score": 75,
      "level": "DANGER",
      "priority": "HIGH",
      "evacuation_priority": "MANDATORY RAPID",
      "transit_bottlenecks": "Road Alpha partially blocked by overturned cargo and seismic debris",
      "shelter_destination": "Shelter North",
      "reason": "Southwesterly wind drift threatens 340 civilians; evacuation must precede toxic threshold."
    }
  ],
  "priority_zones": ["Zone A", "Zone B", "Zone C", "Zone D"],
  "resource_requests": [
    {
      "resource_type": "Ambulance",
      "specific_id": "AMB-02",
      "zone": "Zone A",
      "quantity": 1,
      "urgency": "HIGH",
      "purpose": "Assisted-care rapid medical transit for 14 non-ambulatory residents in Zone A"
    },
    {
      "resource_type": "Rescue Vehicle",
      "specific_id": "RV-01",
      "zone": "Zone A",
      "quantity": 1,
      "urgency": "CRITICAL",
      "purpose": "Debris winch and road-clearing squad to open Highway 4 evacuation arterial"
    }
  ],
  "evacuation_plan": [
    {
      "zone": "Zone A",
      "shelter_id": "SH-North",
      "estimated_people": 340,
      "vehicle_assigned": "RV-01"
    }
  ],
  "transport_recommendations": [
    "Establish one-way contraflow outbound along Highway 4 to Shelter North",
    "Stage heavy tow rigs at Highway 4 junction"
  ],
  "shortages": [
    "High-clearance all-terrain ambulances in reserve",
    "North Arena Shelter approaching 68% capacity"
  ],
  "reason": "Zone A evacuation route is vulnerable to chemical plume expansion; urgent assisted transit required.",
  "confidence": 0.91
}`;

export function getLogisticsFallback(zones: Zone[], isDamFailure: boolean): LogisticsOutput {
  const zoneAnalyses: ZoneSeverityAnalysis[] = [
    {
      zone: 'Zone A',
      severity_score: 78,
      level: 'DANGER',
      priority: 'HIGH',
      peopleAtRisk: zones.find((z) => z.id === 'Zone A')?.peopleAtRisk || 340,
      evacuation_priority: 'MANDATORY RAPID',
      transit_bottlenecks: 'Road Alpha partially obstructed by seismic debris and overturned tanker',
      shelter_destination: 'Shelter North (North Community Arena)',
      reason: 'Toxic chemical vapor plume requires immediate clearance along Highway 4 before wind direction stabilizes.',
    },
    {
      zone: 'Zone B',
      severity_score: 65,
      level: 'DANGER',
      priority: 'HIGH',
      peopleAtRisk: zones.find((z) => z.id === 'Zone B')?.peopleAtRisk || 580,
      evacuation_priority: 'PERIMETER CORDON',
      transit_bottlenecks: 'Subterranean concourse collapse; heavy rubble blocking Main Boulevard',
      shelter_destination: 'Shelter Central',
      reason: 'Heavy urban density requiring specialized shoring vehicles (RV-02) and perimeter cordoning.',
    },
    {
      zone: 'Zone C',
      severity_score: isDamFailure ? 95 : 30,
      level: isDamFailure ? 'CRITICAL' : 'NORMAL',
      priority: isDamFailure ? 'CRITICAL' : 'LOW',
      peopleAtRisk: isDamFailure ? 1350 : (zones.find((z) => z.id === 'Zone C')?.peopleAtRisk || 140),
      evacuation_priority: isDamFailure ? 'IMMEDIATE HIGH-GROUND FLOOD EXTRACTION' : 'STANDBY',
      transit_bottlenecks: isDamFailure ? 'Valley Access Road inundated under 3.5m swift water; impassable to wheeled vehicles' : 'Localized gutter ponding',
      shelter_destination: 'Shelter Central (Central High School - Elevated Ridge)',
      reason: isDamFailure
        ? 'Catastrophic dam breach inundates entire basin. Wheeled transit impossible; aquatic motorized extraction required.'
        : 'River dyke holding at safe operating margins; normal vehicular access.',
    },
    {
      zone: 'Zone D',
      severity_score: 12,
      level: 'NORMAL',
      priority: 'LOW',
      peopleAtRisk: zones.find((z) => z.id === 'Zone D')?.peopleAtRisk || 80,
      evacuation_priority: 'SHELTER-IN-PLACE',
      transit_bottlenecks: 'Clear thoroughfares',
      shelter_destination: 'Shelter West',
      reason: 'Open rural roads; self-evacuation sufficient.',
    },
  ];

  return {
    agent: 'Logistics Agent',
    overall_status: isDamFailure
      ? 'CRITICAL WATER CRISIS - Immediate boat deployment to Zone C flash flood and road-clearing in Zone A'
      : 'ELEVATED TRANSIT RISK - Road Alpha blockage and urgent civilian assisted-evacuation in Zone A',
    zone_analysis: zoneAnalyses,
    priority_zones: isDamFailure ? ['Zone C', 'Zone A', 'Zone B', 'Zone D'] : ['Zone A', 'Zone B', 'Zone C', 'Zone D'],
    resource_requests: isDamFailure
      ? [
          {
            resource_type: 'Rescue Boat',
            specific_id: 'RB-01',
            zone: 'Zone C',
            quantity: 1,
            urgency: 'CRITICAL',
            purpose: 'Swift-water extraction of rooftop-stranded civilians along River Basin',
          },
          {
            resource_type: 'Rescue Boat',
            specific_id: 'RB-02',
            zone: 'Zone C',
            quantity: 1,
            urgency: 'CRITICAL',
            purpose: 'Shuttle evacuation craft to transfer stranded families to Central High Ground Shelter',
          },
          {
            resource_type: 'Rescue Vehicle',
            specific_id: 'RV-01',
            zone: 'Zone A',
            quantity: 1,
            urgency: 'HIGH',
            purpose: 'Maintain corridor opening on Highway 4 for Zone A evacuation',
          },
        ]
      : [
          {
            resource_type: 'Ambulance',
            specific_id: 'AMB-02',
            zone: 'Zone A',
            quantity: 1,
            urgency: 'HIGH',
            purpose: 'Rapid assisted-care evacuation along Highway 4 for non-ambulatory elderly civilians ahead of chemical plume',
          },
          {
            resource_type: 'Rescue Vehicle',
            specific_id: 'RV-01',
            zone: 'Zone A',
            quantity: 1,
            urgency: 'CRITICAL',
            purpose: 'Heavy winch tow rig to remove debris and overturn tanker from Road Alpha',
          },
          {
            resource_type: 'Rescue Vehicle',
            specific_id: 'RV-02',
            zone: 'Zone B',
            quantity: 1,
            urgency: 'HIGH',
            purpose: 'Shoring and trench extrication unit for collapsed commercial concourse',
          },
          {
            resource_type: 'Shelter',
            specific_id: 'SH-North',
            zone: 'Zone A',
            quantity: 1,
            urgency: 'HIGH',
            purpose: 'Open North Community Arena for 340 evacuees',
          },
        ],
    evacuation_plan: [
      {
        zone: 'Zone A',
        shelter_id: 'SH-North',
        estimated_people: 340,
        vehicle_assigned: 'RV-01',
      },
      ...(isDamFailure
        ? [
            {
              zone: 'Zone C',
              shelter_id: 'SH-Central',
              estimated_people: 540,
              vehicle_assigned: 'RB-01 / RB-02',
            },
          ]
        : []),
    ],
    transport_recommendations: [
      'Activate emergency one-way lane reversal along Highway 4 North corridor.',
      'Deploy tow and shoring trucks at primary intersections.',
      ...(isDamFailure ? ['Stage boat launch ramps at North dyke high-water marker.'] : []),
    ],
    shortages: [
      'Zero spare heavy ambulances in reserve fleet.',
      ...(isDamFailure ? ['All aquatic rescue boats (RB-01, RB-02) 100% committed.'] : []),
    ],
    reason: isDamFailure
      ? 'Catastrophic flash flooding in Zone C has cut off land access, demanding 100% of aquatic rescue assets.'
      : 'Zone A evacuation corridor faces chemical plume encroachment, requiring vehicular clearing and assisted transit.',
    confidence: 0.91,
    timestamp: new Date().toISOString(),
  };
}

export async function runLogisticsAgent(
  zones: Zone[],
  resources: ResourceUnit[],
  isDamFailure: boolean
): Promise<{ output: LogisticsOutput; mode: 'AI_GEMINI' | 'SIMULATION_FALLBACK' }> {
  const prompt = `Current Disaster Zones:\n${JSON.stringify(zones, null, 2)}\n\nAvailable Resource Pool:\n${JSON.stringify(
    resources.map((r) => ({ id: r.id, name: r.name, total: r.total, available: r.available })),
    null,
    2
  )}\n\nActive Emergency State: ${isDamFailure ? 'DAM FAILURE ACTIVE IN ZONE C (Catastrophic Flash Flood Surge)' : 'Baseline Seismic and Chemical Plume Incident'}\n\nAnalyze all 4 zones. Calculate severity_score (0-100), classify logistics risk level (NORMAL, MEDIUM, DANGER, CRITICAL), and formulate evacuation and transport requests.`;

  const response = await generateAgentResponse<LogisticsOutput>(
    LOGISTICS_SYSTEM_INSTRUCTION,
    prompt
  );

  if (response.data && response.data.zone_analysis && response.data.zone_analysis.length > 0) {
    response.data.timestamp = new Date().toISOString();
    return { output: response.data, mode: 'AI_GEMINI' };
  }

  return {
    output: getLogisticsFallback(zones, isDamFailure),
    mode: 'SIMULATION_FALLBACK',
  };
}
