import { CommunicationOutput, ResourceUnit, Zone, ZoneSeverityAnalysis } from '../../src/types/disaster';
import { generateAgentResponse } from '../geminiClient';

const COMMUNICATION_SYSTEM_INSTRUCTION = `You are the Communication Agent of ResQ-Mind.
Analyze public communication requirements for ALL affected zones.

For EVERY zone, determine:
- zone: exact zone id (e.g., "Zone A", "Zone B", "Zone C", "Zone D")
- severity_score: integer from 0 to 100 based on public panic risk, civilian density at risk, and notification urgency
- level: one of ["NORMAL", "MEDIUM", "DANGER", "CRITICAL"]
- priority: one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
- communication_priority: text rating (e.g., "IMMEDIATE BROADCAST", "URGENT ADVISORY", "INFORMATIONAL", "ROUTINE")
- warning_message: crisp, authoritative public broadcast notice tailored to this sector
- reason: brief communication rationale

Generate clear public-facing emergency messages.
Do NOT expose internal chain-of-thought or reasoning tokens.

Return ONLY structured JSON conforming to this exact schema:
{
  "agent": "Communication Agent",
  "overall_status": "CRITICAL BROADCAST ACTIVE - Multi-sector evacuation and shelter instructions issued",
  "zone_analysis": [
    {
      "zone": "Zone A",
      "severity_score": 72,
      "level": "DANGER",
      "priority": "HIGH",
      "communication_priority": "IMMEDIATE BROADCAST",
      "warning_message": "EVACUATE IMMEDIATELY: Chemical vapor plume spreading north. Proceed via Highway 4 to North Arena Shelter. Seal doors if transit delayed.",
      "reason": "Airborne plume requires rapid civilian compliance before vapor cloud intercepts residential roads."
    }
  ],
  "public_alert": "EMERGENCY DISASTER BROADCAST: Seismic collapse in Downtown Hub and toxic plume in Industrial Corridor. Follow official designated routes only.",
  "evacuation_message": "Civilians in Zone A: Proceed immediately to North Community Arena via Highway 4. Civilians in Zone B: Remain clear of structural facades.",
  "safety_instructions": [
    "Turn off residential HVAC and ventilation systems in Zone A immediately.",
    "Do not enter the subterranean Downtown concourse in Zone B under any circumstance.",
    "Tune emergency transceivers to Band 162.400 MHz for automated coordinate updates."
  ],
  "priority_messages": [
    "Zone A: Mandatory evacuation to North Community Arena Shelter via Highway 4.",
    "Zone B: Establish 300m safety perimeter around collapsed commercial center."
  ],
  "confidence": 0.95
}`;

export function getCommunicationFallback(zones: Zone[], isDamFailure: boolean): CommunicationOutput {
  const zoneAnalyses: ZoneSeverityAnalysis[] = [
    {
      zone: 'Zone A',
      severity_score: 74,
      level: 'DANGER',
      priority: 'HIGH',
      communication_priority: 'IMMEDIATE EVACUATION BROADCAST',
      warning_message:
        'CIVIL EMERGENCY: Toxic chemical plume drifting northeast. Evacuate Zone A immediately via Highway 4 toward North Community Arena. Close windows and turn off ventilation systems.',
      reason: 'Immediate airborne toxic hazard requires rapid civilian compliance to prevent mass inhalation injuries.',
    },
    {
      zone: 'Zone B',
      severity_score: 85,
      level: 'CRITICAL',
      priority: 'CRITICAL',
      communication_priority: 'PERIMETER ACCESS RESTRICTION',
      warning_message:
        'STRUCTURAL COLLAPSE ALERT: Downtown commercial concourse has collapsed. All non-emergency personnel must evacuate a 300-meter radius. Emergency rescue vehicles have right-of-way.',
      reason: 'Active secondary collapse danger and heavy emergency responder traffic.',
    },
    {
      zone: 'Zone C',
      severity_score: isDamFailure ? 96 : 20,
      level: isDamFailure ? 'CRITICAL' : 'NORMAL',
      priority: isDamFailure ? 'CRITICAL' : 'LOW',
      communication_priority: isDamFailure ? 'FLASH FLOOD LIFE SAFETY WARNING' : 'ADVISORY',
      warning_message: isDamFailure
        ? 'EXTREME FLOOD EMERGENCY: Dam failure has breached the River Valley basin. Water surge reaching 4m. Move to highest ground or rooftops immediately. Rescue boats deploying now.'
        : 'Runoff Advisory: Water retention basin stable. Normal precautions advised near shoreline.',
      reason: isDamFailure
        ? 'Sudden catastrophic surge requires life-safety evacuation warnings to prevent drowning.'
        : 'Water conditions normal with low risk.',
    },
    {
      zone: 'Zone D',
      severity_score: 10,
      level: 'NORMAL',
      priority: 'LOW',
      communication_priority: 'INFORMATIONAL BULLETIN',
      warning_message:
        'Public Advisory: Power grid maintenance active in West Hills. Roads remain open. Self-shelter available at West Hill Gymnasium.',
      reason: 'Isolated electrical disruption with low panic index.',
    },
  ];

  return {
    agent: 'Communication Agent',
    overall_status: isDamFailure
      ? 'MAXIMUM LEVEL 4 BROADCAST - Catastrophic Dam Breach in Zone C & Ongoing Zone B/A Operations'
      : 'LEVEL 3 EMERGENCY BROADCAST - Industrial Plume Evacuation & Downtown Structural Collapse Active',
    zone_analysis: zoneAnalyses,
    public_alert: isDamFailure
      ? 'CRITICAL ALERT: Catastrophic Dam Failure in Zone C. River Valley residents must seek immediate high ground or rooftop sanctuary. Do not attempt road transit. Rescue Boats RB-01 and RB-02 are deploying.'
      : 'EMERGENCY SAFETY DIRECTIVE: Structural collapse in Zone B Commercial Hub and chemical vapor dispersal in Zone A. Zone A residents must evacuate immediately to North Community Arena via Highway 4.',
    evacuation_message: isDamFailure
      ? 'Zone C: Abandon all low-lying vehicles and move vertically to roofs or elevated terrain. Zone A: Evacuate via Highway 4 North corridor.'
      : 'Zone A Civilians: Proceed northward along Highway 4 to North Community Arena Shelter. Follow heavy emergency escort.',
    safety_instructions: [
      'Zone A: Cover airways with damp cloths and seal residential intake vents.',
      'Zone B: Do not enter underground parking or transit stations; stay 300m clear of facades.',
      isDamFailure
        ? 'Zone C: Never attempt to walk or drive through moving water currents; await rescue boats.'
        : 'Keep mobile lines clear for 911 dispatch; tune transceivers to 162.400 MHz.',
    ],
    priority_messages: [
      isDamFailure
        ? 'Zone C: URGENT ROOFTOP RESCUE TEAMS ACTIVATED ALONG RIVER CORRIDOR.'
        : 'Zone A: MANDATORY EVACUATION CONVOY IN PROGRESS.',
      'Zone B: SEARCH & RESCUE ACCESS CORRIDOR SECURED.',
    ],
    confidence: 0.95,
    timestamp: new Date().toISOString(),
  };
}

export async function runCommunicationAgent(
  zones: Zone[],
  resources: ResourceUnit[],
  isDamFailure: boolean
): Promise<{ output: CommunicationOutput; mode: 'AI_GEMINI' | 'SIMULATION_FALLBACK' }> {
  const prompt = `Current Disaster Zones:\n${JSON.stringify(zones, null, 2)}\n\nActive Emergency State: ${
    isDamFailure ? 'DAM FAILURE ACTIVE IN ZONE C (Catastrophic Flash Flood Surge)' : 'Baseline Seismic and Chemical Plume Incident'
  }\n\nAnalyze all 4 zones. Calculate severity_score (0-100), classify level (NORMAL, MEDIUM, DANGER, CRITICAL), and formulate clear public alerts and safety instructions.`;

  const response = await generateAgentResponse<CommunicationOutput>(
    COMMUNICATION_SYSTEM_INSTRUCTION,
    prompt
  );

  if (response.data && response.data.zone_analysis && response.data.zone_analysis.length > 0) {
    response.data.timestamp = new Date().toISOString();
    return { output: response.data, mode: 'AI_GEMINI' };
  }

  return {
    output: getCommunicationFallback(zones, isDamFailure),
    mode: 'SIMULATION_FALLBACK',
  };
}
