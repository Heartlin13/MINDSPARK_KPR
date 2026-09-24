import {
  AgentMessage,
  CommunicationOutput,
  ConflictDetectionResult,
  CoordinatorOutput,
  LogisticsOutput,
  MedicalOutput,
  ResourceUnit,
  Zone,
} from '../../src/types/disaster';
import { generateAgentResponse } from '../geminiClient';

const COORDINATOR_SYSTEM_INSTRUCTION = `You are the Coordinator Agent of ResQ-Mind.
You receive structured proposals from the Medical Agent, Logistics Agent, and Communication Agent, along with detected conflicts and hard physical resource constraints.

Responsibilities:
1. Compare agent recommendations across all zones.
2. Identify and resolve resource contention conflicts deterministically.
3. Prioritize critical life-safety zones based on clinical mortality evidence.
4. Respect all hard physical constraints (e.g. max 2 ambulances total, single physical location per unit).
5. Explain trade-offs explicitly: what was prioritized, what was alternative, and why.
6. Create the final authoritative response plan and field resource allocation.
7. Generate the official public alert.

Do NOT expose internal chain-of-thought or raw reasoning tokens.

Return ONLY structured JSON conforming to this exact schema:
{
  "agent": "Coordinator Agent",
  "final_status": "COORDINATED MULTI-AGENT RESPONSE AUTHORIZED",
  "final_plan": [
    {
      "priority": 1,
      "action": "Deploy Mobile ICU Ambulance AMB-02 & Surgical Team MED-T1 to Zone B",
      "target_zone": "Zone B",
      "assigned_agent": "Medical Agent",
      "details": "Immediate advanced life support for 18 trapped crush victims."
    },
    {
      "priority": 2,
      "action": "Open Highway 4 Evacuation Corridor with Heavy Tow RV-01 to Shelter North",
      "target_zone": "Zone A",
      "assigned_agent": "Logistics Agent",
      "details": "Clear road obstructions and escort 340 evacuees ahead of chemical plume."
    }
  ],
  "resource_allocation": [
    { "zone": "Zone B", "resource": "AMB-02", "agent": "Medical Agent", "priority": "P1 - Critical", "status": "COMMITTED" },
    { "zone": "Zone B", "resource": "MED-T1", "agent": "Medical Agent", "priority": "P1 - Critical", "status": "COMMITTED" },
    { "zone": "Zone A", "resource": "RV-01", "agent": "Logistics Agent", "priority": "P2 - High", "status": "COMMITTED" },
    { "zone": "Zone A", "resource": "SH-North", "agent": "Logistics Agent", "priority": "P2 - High", "status": "COMMITTED" }
  ],
  "resolved_conflicts": [
    {
      "resource": "AMB-02",
      "winner_agent": "Medical Agent",
      "winner_zone": "Zone B",
      "alternative_for_loser": "Assigned Heavy Rescue Transporter RV-01 to Zone A evacuation corridor",
      "rationale": "Zone B presents higher acute mortality risk with 18 crushed casualties needing advanced life support."
    }
  ],
  "decision": "AMB-02 assigned to Zone B.",
  "evidence": [
    "Zone B has higher medical severity with 18 critical casualties requiring immediate advanced life support versus Zone A evacuation requirements.",
    "Zone A residents can be safely evacuated via heavy transporter RV-01."
  ],
  "constraints": [
    "Only one AMB-02 exists in operational inventory.",
    "Double allocation not allowed by Constraint Validator."
  ],
  "tradeoffs": [
    "Logistics evacuation request receives an alternative resource (RV-01 heavy squad rather than dedicated ICU ambulance AMB-02)."
  ],
  "public_alert": "COORDINATED DIRECTIVE: Advanced ICU units deploying to Zone B concourse. Highway 4 contraflow active for Zone A civilian evacuation to North Community Arena."
}`;

export function getCoordinatorFallback(
  med: MedicalOutput,
  log: LogisticsOutput,
  comm: CommunicationOutput,
  isDamFailure: boolean
): CoordinatorOutput {
  if (isDamFailure) {
    return {
      agent: 'Coordinator Agent',
      final_status: 'COORDINATED EMERGENCY ESCALATION AUTHORIZED (DAM FAILURE IN ZONE C)',
      final_plan: [
        {
          priority: 1,
          action: 'Launch Swift-Water Extraction with RB-01 and RB-02 in Zone C',
          target_zone: 'Zone C',
          assigned_agent: 'Logistics Agent',
          details: 'Direct boat crews to rooftops and water-isolated civilian pockets in River Valley basin.',
        },
        {
          priority: 2,
          action: 'Maintain ICU Triage Ambulance AMB-02 in Zone B',
          target_zone: 'Zone B',
          assigned_agent: 'Medical Agent',
          details: 'Continue life support and extrication for 18 severe crush casualties in commercial concourse collapse.',
        },
        {
          priority: 3,
          action: 'Deploy Paramedic Unit AMB-01 to Zone C Water Rescue Staging Point',
          target_zone: 'Zone C',
          assigned_agent: 'Medical Agent',
          details: 'Immediate hypothermia and resuscitation post-extraction from flood waters.',
        },
        {
          priority: 4,
          action: 'Sustain Road Alpha Corridor Evacuation to Shelter North via RV-01',
          target_zone: 'Zone A',
          assigned_agent: 'Logistics Agent',
          details: 'Prevent chemical vapor casualties while aquatic operation continues in Zone C.',
        },
      ],
      resource_allocation: [
        { zone: 'Zone C', resource: 'RB-01', agent: 'Logistics Agent', priority: 'P1 - Critical', status: 'COMMITTED' },
        { zone: 'Zone C', resource: 'RB-02', agent: 'Logistics Agent', priority: 'P1 - Critical', status: 'COMMITTED' },
        { zone: 'Zone C', resource: 'AMB-01', agent: 'Medical Agent', priority: 'P1 - Critical', status: 'COMMITTED' },
        { zone: 'Zone B', resource: 'AMB-02', agent: 'Medical Agent', priority: 'P1 - Critical', status: 'COMMITTED' },
        { zone: 'Zone B', resource: 'MED-T1', agent: 'Medical Agent', priority: 'P1 - Critical', status: 'COMMITTED' },
        { zone: 'Zone A', resource: 'RV-01', agent: 'Logistics Agent', priority: 'P2 - High', status: 'COMMITTED' },
        { zone: 'Zone A', resource: 'SH-North', agent: 'Logistics Agent', priority: 'P2 - High', status: 'COMMITTED' },
        { zone: 'Zone C', resource: 'SH-Central', agent: 'Logistics Agent', priority: 'P1 - Critical', status: 'COMMITTED' },
      ],
      resolved_conflicts: [
        {
          resource: 'AMB-02',
          winner_agent: 'Medical Agent',
          winner_zone: 'Zone B',
          alternative_for_loser: 'Zone C assigned Paramedic Unit AMB-01; Zone A assigned Heavy Transporter RV-01',
          rationale: 'Zone B patient mortality profile (18 multi-trauma crush victims) requires advanced surgical ICU equipment on AMB-02.',
        },
      ],
      decision: 'Priority Shift: RB-01/02 and AMB-01 deployed to Zone C; AMB-02 sustained in Zone B.',
      evidence: [
        'Zone C presents imminent drowning threat to 1,350 civilians following structural dam breach.',
        'Zone B maintains 18 critical casualties that cannot be stabilized without AMB-02 and MED-T1.',
      ],
      constraints: [
        'Total ambulance capacity capped at 2 units (AMB-01 and AMB-02).',
        'Rescue boats (RB-01, RB-02) cannot navigate dry terrain and are strictly allocated to flood sector Zone C.',
        'Constraint Validator prevents duplicate assignments across zones.',
      ],
      tradeoffs: [
        'Zone C receives both rescue boats and ambulance AMB-01; Zone A continues evacuation under heavy transporter RV-01 without dedicated ALS ambulance.',
      ],
      public_alert:
        'CRITICAL ESCALATION: Rescue Boats RB-01 and RB-02 active in Zone C River Valley. Rooftop stranded civilians must remain stationary and signal crews. Zone A evacuation continues to Shelter North.',
    };
  }

  // Baseline Scenario Resolution
  return {
    agent: 'Coordinator Agent',
    final_status: 'COORDINATED RESPONSE AUTHORIZED (BASELINE CONSENSUS)',
    final_plan: [
      {
        priority: 1,
        action: 'Deploy Mobile ICU Ambulance AMB-02 and Disaster Surgical Team MED-T1 to Zone B',
        target_zone: 'Zone B',
        assigned_agent: 'Medical Agent',
        details: 'Immediate advanced life support and field triage for 18 trapped crush victims in collapsed commercial concourse.',
      },
      {
        priority: 2,
        action: 'Open Highway 4 Evacuation Corridor with Heavy Tow Rig RV-01 to Shelter North',
        target_zone: 'Zone A',
        assigned_agent: 'Logistics Agent',
        details: 'Clear road obstacles on Road Alpha and escort 340 civilians away from spreading chemical plume.',
      },
      {
        priority: 3,
        action: 'Deploy Technical Rescue Truck RV-02 to Zone B Commercial Hub',
        target_zone: 'Zone B',
        assigned_agent: 'Logistics Agent',
        details: 'Structural shoring and trench extrication to support medical extraction.',
      },
      {
        priority: 4,
        action: 'Stage General Paramedic Unit AMB-01 at Shelter North Perimeter',
        target_zone: 'Zone A',
        assigned_agent: 'Medical Agent',
        details: 'Screening and respiratory nebulization for plume evacuees.',
      },
    ],
    resource_allocation: [
      { zone: 'Zone B', resource: 'AMB-02', agent: 'Medical Agent', priority: 'P1 - Critical', status: 'COMMITTED' },
      { zone: 'Zone B', resource: 'MED-T1', agent: 'Medical Agent', priority: 'P1 - Critical', status: 'COMMITTED' },
      { zone: 'Zone B', resource: 'RV-02', agent: 'Logistics Agent', priority: 'P2 - High', status: 'COMMITTED' },
      { zone: 'Zone A', resource: 'RV-01', agent: 'Logistics Agent', priority: 'P2 - High', status: 'COMMITTED' },
      { zone: 'Zone A', resource: 'AMB-01', agent: 'Medical Agent', priority: 'P2 - High', status: 'COMMITTED' },
      { zone: 'Zone A', resource: 'SH-North', agent: 'Logistics Agent', priority: 'P2 - High', status: 'COMMITTED' },
    ],
    resolved_conflicts: [
      {
        resource: 'AMB-02',
        winner_agent: 'Medical Agent',
        winner_zone: 'Zone B',
        alternative_for_loser: 'Assigned Heavy Rescue Transporter RV-01 to Zone A assisted evacuation corridor.',
        rationale: 'Zone B presents higher immediate mortality risk with 18 crushed casualties needing advanced mobile ICU care.',
      },
    ],
    decision: 'AMB-02 assigned to Zone B.',
    evidence: [
      'Zone B has higher medical severity with 18 critical casualties requiring immediate advanced life support versus Zone A evacuation requirements.',
      'Zone A residents can be safely evacuated via heavy transporter RV-01 with general paramedic staging AMB-01.',
    ],
    constraints: [
      'Only one AMB-02 exists.',
      'Double allocation not allowed by Constraint Validator.',
    ],
    tradeoffs: [
      'Logistics evacuation request receives an alternative resource (RV-01 heavy squad rather than dedicated ICU ambulance AMB-02).',
    ],
    public_alert:
      'COORDINATED RESPONSE DIRECTIVE: AMB-02 and MED-T1 deployed to Zone B structural emergency. Zone A evacuation initiated via RV-01 convoy toward North Arena Shelter.',
  };
}

export async function runCoordinatorAgent(
  med: MedicalOutput,
  log: LogisticsOutput,
  comm: CommunicationOutput,
  conflicts: ConflictDetectionResult[],
  resources: ResourceUnit[],
  zones: Zone[],
  messages: AgentMessage[],
  isDamFailure: boolean
): Promise<{ output: CoordinatorOutput; mode: 'AI_GEMINI' | 'SIMULATION_FALLBACK' }> {
  const prompt = `Medical Agent Submission:\n${JSON.stringify(med, null, 2)}\n\nLogistics Agent Submission:\n${JSON.stringify(
    log,
    null,
    2
  )}\n\nCommunication Agent Submission:\n${JSON.stringify(
    comm,
    null,
    2
  )}\n\nDetected Resource Contention:\n${JSON.stringify(
    conflicts,
    null,
    2
  )}\n\nMaster Resource State:\n${JSON.stringify(
    resources.map((r) => ({ id: r.id, name: r.name, total: r.total, available: r.available })),
    null,
    2
  )}\n\nOperational Zones:\n${JSON.stringify(zones, null, 2)}\n\nEmergency Status: ${
    isDamFailure ? 'DAM FAILURE ACTIVE IN ZONE C' : 'Baseline Seismic/Plume Incident'
  }\n\nResolve all conflicts, ensure zero duplicate allocations, and generate the final coordinated response plan.`;

  const response = await generateAgentResponse<CoordinatorOutput>(
    COORDINATOR_SYSTEM_INSTRUCTION,
    prompt
  );

  if (response.data && response.data.resource_allocation && response.data.resource_allocation.length > 0) {
    response.data.timestamp = new Date().toISOString();
    return { output: response.data, mode: 'AI_GEMINI' };
  }

  return {
    output: getCoordinatorFallback(med, log, comm, isDamFailure),
    mode: 'SIMULATION_FALLBACK',
  };
}
