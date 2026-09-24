import { MedicalOutput, ResourceUnit, Zone, ZoneSeverityAnalysis } from '../../frontend/src/types/disaster';
import { generateAgentResponse } from '../geminiClient';

const MEDICAL_SYSTEM_INSTRUCTION = `You are the Medical Agent of ResQ-Mind.
Analyze the medical impact of the current disaster.
Analyze ALL affected zones provided in the input.

For EVERY zone, determine:
- zone: exact zone id (e.g., "Zone A", "Zone B", "Zone C", "Zone D")
- severity_score: integer from 0 to 100 based on casualties, trauma severity, and medical risk
- level: one of ["NORMAL", "MEDIUM", "DANGER", "CRITICAL"]
- injured: count of injured individuals
- priority: one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
- triage_urgency: text description of triage urgency (e.g. "IMMEDIATE SURGICAL", "DELAYED", "MINIMAL")
- ambulance_requirement: number of ambulances needed
- medical_team_requirement: number of specialized medical teams needed
- medical_kit_requirement: number of trauma first aid kits needed
- medical_risks: summary of primary health hazards (e.g., crush syndrome, smoke inhalation, chemical burns, hypothermia)
- reason: brief clinical explanation of this zone's assessment

Crucial Operational Protocol:
- Use floodStatus, floodRisk, floodWaterSpread, floodConfidence, and floodDataSource from each zone as one input to medical prioritization when present. Treat satellite-derived values as observed evidence, not a prediction of future flooding; treat simulation values as SIMULATED DATA.
- If Zone B has structural collapse with severe casualties, request specific ambulance "AMB-02" and medical team "MED-T1" for Zone B.
- Do NOT directly allocate resources; provide structured recommendations and requests only.

Return ONLY structured JSON conforming to this exact schema:
{
  "agent": "Medical Agent",
  "overall_status": "HIGH MEDICAL ALERT - Severe casualty concentration in structural collapse sector",
  "zone_analysis": [
    {
      "zone": "Zone A",
      "severity_score": 45,
      "level": "MEDIUM",
      "injured": 6,
      "priority": "MEDIUM",
      "triage_urgency": "MODERATE",
      "ambulance_requirement": 1,
      "medical_team_requirement": 1,
      "medical_kit_requirement": 4,
      "medical_risks": "Chemical plume inhalation and dermal irritations",
      "reason": "Vapor cloud causing localized respiratory symptoms; non-fatal if treated early."
    }
  ],
  "priority_zones": ["Zone B", "Zone A"],
  "resource_requests": [
    {
      "resource_type": "Ambulance",
      "specific_id": "AMB-02",
      "zone": "Zone B",
      "quantity": 1,
      "urgency": "CRITICAL",
      "purpose": "Mobile ICU transport for crushed victims requiring continuous mechanical ventilation"
    }
  ],
  "triage_recommendations": [
    "Establish Advanced Medical Post (AMP) adjacent to Zone B concourse perimeter",
    "Deploy rapid airway clearing kits to Zone A triage staging"
  ],
  "medical_priorities": [
    "Zone B: Immediate extrication and stabilization of 18 crush trauma victims",
    "Zone A: Nebulized bronchodilator triage for chemical plume exposed civilians"
  ],
  "reason": "Zone B exhibits catastrophic trauma severity with impending crush-related mortality, requiring advanced mobile intensive care.",
  "confidence": 0.94
}`;

export function getMedicalFallback(zones: Zone[], isDamFailure: boolean): MedicalOutput {
  const zoneAnalyses: ZoneSeverityAnalysis[] = [
    {
      zone: 'Zone A',
      severity_score: 48,
      level: 'MEDIUM',
      injured: zones.find((z) => z.id === 'Zone A')?.injured || 6,
      peopleAtRisk: zones.find((z) => z.id === 'Zone A')?.peopleAtRisk || 340,
      priority: 'MEDIUM',
      triage_urgency: 'MODERATE',
      ambulance_requirement: 1,
      medical_team_requirement: 1,
      medical_kit_requirement: 5,
      medical_risks: 'Chemical plume vapor exposure, airway irritation, corneal burns',
      reason: 'Toxic fumes require decontamination and paramedic bronchodilator staging.',
    },
    {
      zone: 'Zone B',
      severity_score: 92,
      level: 'CRITICAL',
      injured: zones.find((z) => z.id === 'Zone B')?.injured || 18,
      peopleAtRisk: zones.find((z) => z.id === 'Zone B')?.peopleAtRisk || 580,
      priority: 'CRITICAL',
      triage_urgency: 'IMMEDIATE SURGICAL',
      ambulance_requirement: 1,
      medical_team_requirement: 2,
      medical_kit_requirement: 10,
      medical_risks: 'Traumatic crush injuries, hypovolemic shock, multiple limb fractures',
      reason: 'Commercial concourse collapse produced severe multi-trauma casualties needing emergency ICU transit.',
    },
    {
      zone: 'Zone C',
      severity_score: isDamFailure ? 88 : 25,
      level: isDamFailure ? 'CRITICAL' : 'NORMAL',
      injured: isDamFailure ? 14 : (zones.find((z) => z.id === 'Zone C')?.injured || 2),
      peopleAtRisk: isDamFailure ? 1350 : (zones.find((z) => z.id === 'Zone C')?.peopleAtRisk || 140),
      priority: isDamFailure ? 'CRITICAL' : 'LOW',
      triage_urgency: isDamFailure ? 'IMMEDIATE HYPOTHERMIA / RESUSCITATION' : 'MINIMAL',
      ambulance_requirement: isDamFailure ? 1 : 0,
      medical_team_requirement: isDamFailure ? 1 : 0,
      medical_kit_requirement: isDamFailure ? 6 : 2,
      medical_risks: isDamFailure ? 'Submersion asphyxia, acute hypothermia, contaminated water ingestion' : 'Minor sprains from drainage overflow',
      reason: isDamFailure
        ? 'Catastrophic dam breach produced massive flash flooding with submerged civilian casualties.'
        : 'Water runoff contained by embankment; minor ambulatory abrasions only.',
    },
    {
      zone: 'Zone D',
      severity_score: 15,
      level: 'NORMAL',
      injured: zones.find((z) => z.id === 'Zone D')?.injured || 1,
      peopleAtRisk: zones.find((z) => z.id === 'Zone D')?.peopleAtRisk || 80,
      priority: 'LOW',
      triage_urgency: 'MINIMAL',
      ambulance_requirement: 0,
      medical_team_requirement: 0,
      medical_kit_requirement: 1,
      medical_risks: 'Minor smoke inhalation from transformer spark',
      reason: 'Low population density with isolated power outage and minimal clinical demand.',
    },
  ];

  return {
    agent: 'Medical Agent',
    overall_status: isDamFailure
      ? 'CRITICAL DUAL-DISASTER - Extreme trauma in Zone B and active water casualties in Zone C'
      : 'CRITICAL MEDICAL ALERT - Severe casualty concentration in Zone B commercial collapse',
    zone_analysis: zoneAnalyses,
    priority_zones: isDamFailure ? ['Zone B', 'Zone C', 'Zone A', 'Zone D'] : ['Zone B', 'Zone A', 'Zone C', 'Zone D'],
    resource_requests: isDamFailure
      ? [
          {
            resource_type: 'Ambulance',
            specific_id: 'AMB-02',
            zone: 'Zone B',
            quantity: 1,
            urgency: 'CRITICAL',
            purpose: 'Mobile ICU transport for high-acuity crush trauma victims in Zone B',
          },
          {
            resource_type: 'Ambulance',
            specific_id: 'AMB-01',
            zone: 'Zone C',
            quantity: 1,
            urgency: 'CRITICAL',
            purpose: 'Resuscitation and hypothermia stabilization for extracted water surge casualties',
          },
          {
            resource_type: 'Medical Team',
            specific_id: 'MED-T1',
            zone: 'Zone B',
            quantity: 1,
            urgency: 'CRITICAL',
            purpose: 'Field amputation and critical trauma stabilization squad',
          },
        ]
      : [
          {
            resource_type: 'Ambulance',
            specific_id: 'AMB-02',
            zone: 'Zone B',
            quantity: 1,
            urgency: 'CRITICAL',
            purpose: 'Advanced Life Support (ALS) ICU transport for building collapse crush victims',
          },
          {
            resource_type: 'Medical Team',
            specific_id: 'MED-T1',
            zone: 'Zone B',
            quantity: 1,
            urgency: 'HIGH',
            purpose: 'Surgical triage team for severe crush injuries and hemorrhage control',
          },
          {
            resource_type: 'Medical Kit',
            specific_id: 'MED-KITS',
            zone: 'Zone A',
            quantity: 4,
            urgency: 'MEDIUM',
            purpose: 'Trauma respiratory and burn treatment kits for chemical plume exposure',
          },
        ],
    triage_recommendations: [
      'Prioritize surgical stabilization for 18 trapped crush victims in Zone B concourse.',
      'Deploy mobile decontamination and bronchodilator treatment kits to Zone A.',
      ...(isDamFailure ? ['Establish warm resuscitation shelters along Zone C northern dyke.'] : []),
    ],
    medical_priorities: [
      'Zone B: Prevent mortality from crush-syndrome induced renal failure via early fluid resuscitation.',
      isDamFailure ? 'Zone C: Emergency hypothermia and near-drowning resuscitation triage.' : 'Zone A: Respiratory triage and oxygen therapy for plume inhalation.',
    ],
    reason: isDamFailure
      ? 'Zone B maintains highest mortality acuity per patient (18 trauma casualties), while Zone C requires immediate water resuscitation.'
      : 'Zone B presents the highest immediate mortality risk with 18 critical casualties needing intensive care.',
    confidence: 0.94,
    timestamp: new Date().toISOString(),
  };
}

export async function runMedicalAgent(
  zones: Zone[],
  resources: ResourceUnit[],
  isDamFailure: boolean
): Promise<{ output: MedicalOutput; mode: 'AI_GEMINI' | 'SIMULATION_FALLBACK' }> {
  const prompt = `Current Disaster Zones (including any satellite-derived flood observations or explicitly labeled simulation fallback fields):\n${JSON.stringify(zones, null, 2)}\n\nAvailable Resource Pool:\n${JSON.stringify(
    resources.map((r) => ({ id: r.id, name: r.name, total: r.total, available: r.available })),
    null,
    2
  )}\n\nActive Emergency State: ${isDamFailure ? 'DAM FAILURE ACTIVE IN ZONE C (Catastrophic Flash Flood Surge)' : 'Baseline Seismic and Chemical Plume Incident'}\n\nAnalyze all 4 zones (Zone A, Zone B, Zone C, Zone D). Calculate severity_score (0-100), classify level (NORMAL, MEDIUM, DANGER, CRITICAL), and formulate medical resource requests.`;

  const response = await generateAgentResponse<MedicalOutput>(
    MEDICAL_SYSTEM_INSTRUCTION,
    prompt
  );

  if (response.data && response.data.zone_analysis && response.data.zone_analysis.length > 0) {
    response.data.timestamp = new Date().toISOString();
    return { output: response.data, mode: 'AI_GEMINI' };
  }

  // Fallback to deterministic model
  return {
    output: getMedicalFallback(zones, isDamFailure),
    mode: 'SIMULATION_FALLBACK',
  };
}
