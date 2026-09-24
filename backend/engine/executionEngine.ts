import {
  AgentMessage,
  AgentRole,
  ConflictDetectionResult,
  ConstraintValidationResult,
  CoordinatorOutput,
  DisasterSeverityLevel,
  MedicalOutput,
  LogisticsOutput,
  CommunicationOutput,
  ResourceUnit,
  ResponseHistoryEntry,
  SystemExecutionState,
  SystemLogEntry,
  Zone,
  AuditTrailEntry,
  RescuePassport,
} from '../../frontend/src/types/disaster';
import {
  INITIAL_APPROVAL_STATE,
  INITIAL_AUDIT_TRAIL,
  INITIAL_CAUSE_CHAIN,
  INITIAL_CONFLICTING_REPORTS,
  INITIAL_DATA_HEALTH,
  INITIAL_INCIDENT_MEMORY,
  INITIAL_PASS_PORTS,
  INITIAL_PRIMARY_BACKUP_PLANS,
  INITIAL_WHAT_IF_SCENARIOS,
} from '../../frontend/src/utils/defaultState';
import { runCommunicationAgent } from '../agents/communicationAgent';
import { runCoordinatorAgent } from '../agents/coordinatorAgent';
import { runLogisticsAgent } from '../agents/logisticsAgent';
import { runMedicalAgent } from '../agents/medicalAgent';
import { ConflictEngine } from './conflictEngine';
import { ConstraintValidator } from './constraintValidator';
import { DisasterSimulator } from './disasterSimulator';
import { ResourceManager } from './resourceManager';

export class ExecutionEngine {
  private simulator: DisasterSimulator;
  private resourceManager: ResourceManager;
  private conflictEngine: ConflictEngine;
  private constraintValidator: ConstraintValidator;
  private state: SystemExecutionState;
  private messageCounter = 1;
  private logCounter = 1;

  constructor() {
    this.simulator = new DisasterSimulator();
    this.resourceManager = new ResourceManager();
    this.conflictEngine = new ConflictEngine();
    this.constraintValidator = new ConstraintValidator();

    this.state = this.buildInitialState();
  }

  private buildInitialState(): SystemExecutionState {
    const zones = this.simulator.getZones();
    const resources = this.resourceManager.getAllResources();

    return {
      scenarioTitle: 'Scenario Alpha: Regional Seismic Hazard & Hazardous Leak',
      activeEmergencyId: 'INITIAL_HAZARD',
      executionMode: 'SIMULATION_FALLBACK',
      stepIndex: 0,
      isRunning: false,
      zones,
      resources,
      agentStatuses: {
        'Medical Agent': {
          status: 'IDLE',
          currentTask: 'Standby for triage feed',
          latestRecommendation: 'Awaiting deployment assessment',
          lastMessage: 'Ready on bus channel MED-01',
          updatedAt: new Date().toISOString(),
          confidence: 0.94,
          overallSeverity: 'CRITICAL',
          zonesAnalyzedCount: 4,
        },
        'Logistics Agent': {
          status: 'IDLE',
          currentTask: 'Standby for transit route analysis',
          latestRecommendation: 'Awaiting evacuation orders',
          lastMessage: 'Ready on bus channel LOG-01',
          updatedAt: new Date().toISOString(),
          confidence: 0.91,
          overallSeverity: 'DANGER',
          zonesAnalyzedCount: 4,
        },
        'Communication Agent': {
          status: 'IDLE',
          currentTask: 'Monitoring public safety frequencies',
          latestRecommendation: 'Standby for broadcast directives',
          lastMessage: 'Ready on bus channel COM-01',
          updatedAt: new Date().toISOString(),
          confidence: 0.95,
          overallSeverity: 'DANGER',
          zonesAnalyzedCount: 4,
        },
        'Coordinator Agent': {
          status: 'IDLE',
          currentTask: 'Standby for cross-agent synthesis',
          latestRecommendation: 'Awaiting multi-agent submissions',
          lastMessage: 'Central bus broker initialized',
          updatedAt: new Date().toISOString(),
          confidence: 0.96,
        },
      },
      messages: [
        {
          message_id: 'MSG-INIT-001',
          from_agent: 'System Bus',
          to_agent: 'All Agents',
          message_type: 'UPDATE',
          timestamp: new Date().toISOString(),
          payload: {
            summary: 'RESQ-MIND Message Bus online. 4 independent agents connected to broker.',
          },
        },
      ],
      medicalOutput: null,
      logisticsOutput: null,
      communicationOutput: null,
      conflicts: [],
      constraintResult: null,
      coordinatorOutput: null,
      history: [],
      logs: [
        {
          id: 'LOG-001',
          timestamp: new Date().toISOString(),
          level: 'INFO',
          service: 'MessageBus',
          message: 'Zero-latency event broker bound to disaster stream.',
        },
      ],
      selectedAgent: 'All Agents',
      approvalState: JSON.parse(JSON.stringify(INITIAL_APPROVAL_STATE)),
      rescuePassports: JSON.parse(JSON.stringify(INITIAL_PASS_PORTS)),
      primaryBackupPlans: JSON.parse(JSON.stringify(INITIAL_PRIMARY_BACKUP_PLANS)),
      whatIfScenarios: JSON.parse(JSON.stringify(INITIAL_WHAT_IF_SCENARIOS)),
      activeWhatIfScenarioId: null,
      simulatedWhatIfPlan: null,
      dataHealthFields: JSON.parse(JSON.stringify(INITIAL_DATA_HEALTH)),
      conflictingReports: JSON.parse(JSON.stringify(INITIAL_CONFLICTING_REPORTS)),
      incidentMemory: JSON.parse(JSON.stringify(INITIAL_INCIDENT_MEMORY)),
      causeChain: JSON.parse(JSON.stringify(INITIAL_CAUSE_CHAIN)),
      auditTrail: JSON.parse(JSON.stringify(INITIAL_AUDIT_TRAIL)),
    };
  }

  public getState(): SystemExecutionState {
    return this.state;
  }

  private addAuditTrail(source: string, action: string, status: AuditTrailEntry['status'], details?: string) {
    const entry: AuditTrailEntry = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      source,
      action,
      status,
      details,
    };
    this.state.auditTrail.unshift(entry);
    if (this.state.auditTrail.length > 50) this.state.auditTrail.pop();
  }

  private addLog(level: SystemLogEntry['level'], service: string, message: string) {
    const entry: SystemLogEntry = {
      id: `LOG-${String(this.logCounter++).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
    };
    this.state.logs.unshift(entry);
    if (this.state.logs.length > 50) this.state.logs.pop();
  }

  private postMessage(
    from: string,
    to: string,
    type: AgentMessage['message_type'],
    summary: string,
    payloadDetails?: any
  ): AgentMessage {
    const msg: AgentMessage = {
      message_id: `MSG-${String(this.messageCounter++).padStart(4, '0')}`,
      from_agent: from,
      to_agent: to,
      message_type: type,
      timestamp: new Date().toISOString(),
      payload: {
        summary,
        details: payloadDetails,
      },
    };
    this.state.messages.unshift(msg);
    if (this.state.messages.length > 50) this.state.messages.pop();
    return msg;
  }

  public injectDamFailure(): SystemExecutionState {
    this.simulator.injectDamFailure();
    this.state.zones = this.simulator.getZones();
    this.state.activeEmergencyId = 'DAM_FAILURE_ZONE_C';
    this.state.scenarioTitle = 'CRITICAL ALERT: Regional Seismic Hazard & Zone C Catastrophic Dam Breach';

    this.addLog('WARN', 'Simulator', 'DYNAMIC EMERGENCY INJECTION TRIGGERED: Upstream Dam breach reported in Zone C!');
    this.postMessage(
      'Disaster Simulator',
      'All Agents',
      'ALERT',
      'DAM FAILURE IN ZONE C: Rapid flash flood surge in progress. 1,350 civilians at risk. Re-planning required.'
    );

    return this.state;
  }

  public async triggerNewEmergency(
    emergencyType: string,
    targetZone: string,
    severityIncrease: number = 25
  ): Promise<SystemExecutionState> {
    // 1. Update incident state
    this.state.activeEmergencyId = `EMERGENCY_${targetZone.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`;
    this.state.scenarioTitle = `CRITICAL ALERT: ${emergencyType} in ${targetZone}`;

    // 2. Recalculate target zone severity
    this.state.zones = this.state.zones.map((z: any) => {
      if (z.id === targetZone || z.name === targetZone || z.zone === targetZone) {
        const newInjured = (z.injured || 0) + Math.round(severityIncrease * 0.8);
        const newAtRisk = (z.peopleAtRisk || 0) + Math.round(severityIncrease * 15);
        const currentScore = z.severityScore || (z.severity === 'CRITICAL' ? 85 : z.severity === 'HIGH' ? 65 : 45);
        const newScore = Math.min(100, currentScore + severityIncrease);
        return {
          ...z,
          injured: newInjured,
          peopleAtRisk: newAtRisk,
          severityScore: newScore,
          severity: newScore >= 80 ? 'CRITICAL' : newScore >= 60 ? 'HIGH' : 'MODERATE',
          severityLevel: (newScore >= 80 ? 'CRITICAL' : newScore >= 60 ? 'DANGER' : 'MEDIUM') as DisasterSeverityLevel,
          medicalPriority: 'IMMEDIATE',
          evacuationStatus: 'EVACUATION ORDERED',
        };
      }
      return z;
    });

    this.addLog(
      'WARN',
      'Incident Commander',
      `NEW EMERGENCY TRIGGERED: ${emergencyType} impacting ${targetZone}. Casualty estimate surge: +${severityIncrease}%.`
    );
    this.addAuditTrail(
      'Incident Commander',
      `Emergency Triggered: ${emergencyType} in ${targetZone}`,
      'ALERT',
      `Severity surged by ${severityIncrease} points. Automated re-planning pipeline engaged.`
    );
    this.postMessage(
      'Emergency Dispatch',
      'All Units',
      'ALERT',
      `PRIORITY 1 DISASTER ESCALATION: ${emergencyType} reported in ${targetZone}. Initiating immediate multi-agent coordinated response.`
    );

    // 3. Re-run affected agents, detect conflicts, validate constraints, and create revised response plan
    return await this.runFullResponse();
  }

  public resetSimulation(): SystemExecutionState {
    this.simulator = new DisasterSimulator();
    this.resourceManager.reset();
    this.state = this.buildInitialState();
    this.addLog('INFO', 'Simulator', 'Disaster simulation state and resource inventory reset to factory baseline.');
    return this.state;
  }

  /**
   * Run an individual agent on demand (Medical, Logistics, Communication, or Coordinator)
   */
  public async runSingleAgent(agentRole: AgentRole): Promise<{ state: SystemExecutionState; agentOutput: any }> {
    const isDamFailure = this.state.activeEmergencyId === 'DAM_FAILURE_ZONE_C';
    this.state.agentStatuses[agentRole].status = 'ANALYZING';
    this.state.agentStatuses[agentRole].currentTask = `Running independent zone evaluation across all sectors`;
    this.addLog('AGENT', agentRole, `Initiating standalone comprehensive zone analysis`);

    let agentOutput: any = null;

    if (agentRole === 'Medical Agent') {
      const res = await runMedicalAgent(this.state.zones, this.state.resources, isDamFailure);
      this.state.medicalOutput = res.output;
      agentOutput = res.output;
      this.state.executionMode = res.mode;

      const topZone = res.output.priority_zones[0] || 'Zone B';
      const highestScore = Math.max(...res.output.zone_analysis.map((z) => z.severity_score));
      const overallLevel: DisasterSeverityLevel = highestScore >= 80 ? 'CRITICAL' : highestScore >= 60 ? 'DANGER' : highestScore >= 35 ? 'MEDIUM' : 'NORMAL';

      this.state.agentStatuses['Medical Agent'] = {
        status: 'RECOMMENDING',
        currentTask: `Evaluated 4 zones. Top priority: ${topZone}`,
        latestRecommendation: res.output.triage_recommendations?.[0] || 'Prioritize surgical triage',
        lastMessage: `Submitted ${res.output.resource_requests.length} medical requests`,
        updatedAt: new Date().toISOString(),
        confidence: res.output.confidence,
        overallSeverity: overallLevel,
        zonesAnalyzedCount: res.output.zone_analysis.length,
      };

      this.postMessage(
        'Medical Agent',
        'Coordinator Agent',
        'RECOMMENDATION',
        `Medical assessment complete: ${res.output.overall_status}. Requested ${res.output.resource_requests.map((r) => r.specific_id || r.resource_type).join(', ')}`,
        res.output
      );
    } else if (agentRole === 'Logistics Agent') {
      const res = await runLogisticsAgent(this.state.zones, this.state.resources, isDamFailure);
      this.state.logisticsOutput = res.output;
      agentOutput = res.output;
      this.state.executionMode = res.mode;

      const topZone = res.output.priority_zones[0] || 'Zone A';
      const highestScore = Math.max(...res.output.zone_analysis.map((z) => z.severity_score));
      const overallLevel: DisasterSeverityLevel = highestScore >= 80 ? 'CRITICAL' : highestScore >= 60 ? 'DANGER' : highestScore >= 35 ? 'MEDIUM' : 'NORMAL';

      this.state.agentStatuses['Logistics Agent'] = {
        status: 'RECOMMENDING',
        currentTask: `Transit bottlenecks identified in ${topZone}`,
        latestRecommendation: res.output.transport_recommendations?.[0] || 'Highway contraflow active',
        lastMessage: `Submitted ${res.output.resource_requests.length} transit requests`,
        updatedAt: new Date().toISOString(),
        confidence: res.output.confidence,
        overallSeverity: overallLevel,
        zonesAnalyzedCount: res.output.zone_analysis.length,
      };

      this.postMessage(
        'Logistics Agent',
        'Coordinator Agent',
        'RECOMMENDATION',
        `Logistics evaluation complete: ${res.output.overall_status}. Requested ${res.output.resource_requests.map((r) => r.specific_id || r.resource_type).join(', ')}`,
        res.output
      );
    } else if (agentRole === 'Communication Agent') {
      const res = await runCommunicationAgent(this.state.zones, this.state.resources, isDamFailure);
      this.state.communicationOutput = res.output;
      agentOutput = res.output;
      this.state.executionMode = res.mode;

      const highestScore = Math.max(...res.output.zone_analysis.map((z) => z.severity_score));
      const overallLevel: DisasterSeverityLevel = highestScore >= 80 ? 'CRITICAL' : highestScore >= 60 ? 'DANGER' : highestScore >= 35 ? 'MEDIUM' : 'NORMAL';

      this.state.agentStatuses['Communication Agent'] = {
        status: 'COMPLETED',
        currentTask: `Safety directives issued across all sectors`,
        latestRecommendation: res.output.priority_messages?.[0] || 'Tune to emergency band 162.400 MHz',
        lastMessage: 'Disaster warning bulletins dispatched',
        updatedAt: new Date().toISOString(),
        confidence: res.output.confidence,
        overallSeverity: overallLevel,
        zonesAnalyzedCount: res.output.zone_analysis.length,
      };

      this.postMessage(
        'Communication Agent',
        'All Agents',
        'ALERT',
        `Public directives prepared: ${res.output.public_alert.substring(0, 90)}...`,
        res.output
      );
    } else if (agentRole === 'Coordinator Agent') {
      // Coordinator needs medical, logistics, comm outputs; if null, generate defaults
      if (!this.state.medicalOutput) {
        const medRes = await runMedicalAgent(this.state.zones, this.state.resources, isDamFailure);
        this.state.medicalOutput = medRes.output;
      }
      if (!this.state.logisticsOutput) {
        const logRes = await runLogisticsAgent(this.state.zones, this.state.resources, isDamFailure);
        this.state.logisticsOutput = logRes.output;
      }
      if (!this.state.communicationOutput) {
        const commRes = await runCommunicationAgent(this.state.zones, this.state.resources, isDamFailure);
        this.state.communicationOutput = commRes.output;
      }

      this.state.conflicts = this.conflictEngine.detectConflicts(
        this.state.medicalOutput,
        this.state.logisticsOutput
      );

      const coordRes = await runCoordinatorAgent(
        this.state.medicalOutput,
        this.state.logisticsOutput,
        this.state.communicationOutput,
        this.state.conflicts,
        this.state.resources,
        this.state.zones,
        this.state.messages,
        isDamFailure
      );

      this.state.coordinatorOutput = coordRes.output;
      agentOutput = coordRes.output;
      this.state.executionMode = coordRes.mode;

      this.state.agentStatuses['Coordinator Agent'] = {
        status: 'RESOLVING',
        currentTask: 'Synthesized multi-agent priorities & resolved resource contention',
        latestRecommendation: coordRes.output.decision,
        lastMessage: `Issued plan with ${coordRes.output.final_plan.length} actions`,
        updatedAt: new Date().toISOString(),
        confidence: 0.96,
      };

      this.postMessage(
        'Coordinator Agent',
        'All Agents',
        'DECISION',
        `Executive resolution: ${coordRes.output.decision}`,
        coordRes.output
      );
    }

    this.addLog('INFO', agentRole, `Analysis complete. Returned structured decision with verified metrics.`);
    return { state: this.state, agentOutput };
  }

  /**
   * Complete 14-Step Multi-Agent Execution Pipeline
   */
  public async runFullResponse(): Promise<SystemExecutionState> {
    this.state.isRunning = true;
    this.state.stepIndex = 1;
    const isDamFailure = this.state.activeEmergencyId === 'DAM_FAILURE_ZONE_C';

    this.addLog(
      'INFO',
      'ExecutionEngine',
      `Starting 14-Step Multi-Agent Coordinated Response pipeline. Emergency: ${this.state.activeEmergencyId}`
    );

    try {
      // STEP 1: Load current disaster scenario
      this.state.zones = this.simulator.getZones();
      this.state.resources = this.resourceManager.getAllResources();

      // STEP 2: Run Medical Agent
      this.state.agentStatuses['Medical Agent'].status = 'ANALYZING';
      this.state.agentStatuses['Medical Agent'].currentTask = 'Evaluating casualties across all 4 zones';
      this.addLog('AGENT', 'Medical Agent', 'Evaluating casualties in Zone A, B, C, D');

      const medResult = await runMedicalAgent(this.state.zones, this.state.resources, isDamFailure);
      this.state.medicalOutput = medResult.output;
      this.state.executionMode = medResult.mode;

      const medHighestScore = Math.max(...medResult.output.zone_analysis.map((z) => z.severity_score));
      this.state.agentStatuses['Medical Agent'] = {
        status: 'RECOMMENDING',
        currentTask: `Identified critical casualties in ${medResult.output.priority_zones[0] || 'Zone B'}`,
        latestRecommendation: medResult.output.triage_recommendations?.[0] || 'Prioritize surgical triage',
        lastMessage: `Submitted ${medResult.output.resource_requests.length} resource requests`,
        updatedAt: new Date().toISOString(),
        confidence: medResult.output.confidence,
        overallSeverity: medHighestScore >= 80 ? 'CRITICAL' : 'DANGER',
        zonesAnalyzedCount: medResult.output.zone_analysis.length,
      };
      this.state.stepIndex = 2;

      // STEP 3: Run Logistics Agent
      this.state.agentStatuses['Logistics Agent'].status = 'ANALYZING';
      this.state.agentStatuses['Logistics Agent'].currentTask = 'Evaluating evacuation corridors and fleet capacity';
      this.addLog('AGENT', 'Logistics Agent', 'Evaluating evacuation corridors and vehicle fleet');

      const logResult = await runLogisticsAgent(this.state.zones, this.state.resources, isDamFailure);
      this.state.logisticsOutput = logResult.output;
      if (logResult.mode === 'AI_GEMINI') this.state.executionMode = 'AI_GEMINI';

      const logHighestScore = Math.max(...logResult.output.zone_analysis.map((z) => z.severity_score));
      this.state.agentStatuses['Logistics Agent'] = {
        status: 'RECOMMENDING',
        currentTask: `Identified bottlenecks in ${logResult.output.priority_zones[0] || 'Zone A'}`,
        latestRecommendation: logResult.output.transport_recommendations?.[0] || 'Deploy heavy tow rigs',
        lastMessage: `Submitted ${logResult.output.resource_requests.length} resource requests`,
        updatedAt: new Date().toISOString(),
        confidence: logResult.output.confidence,
        overallSeverity: logHighestScore >= 80 ? 'CRITICAL' : 'DANGER',
        zonesAnalyzedCount: logResult.output.zone_analysis.length,
      };
      this.state.stepIndex = 3;

      // STEP 4: Run Communication Agent
      this.state.agentStatuses['Communication Agent'].status = 'ANALYZING';
      this.state.agentStatuses['Communication Agent'].currentTask = 'Drafting public safety announcements';
      this.addLog('AGENT', 'Communication Agent', 'Drafting public safety announcements and evacuation advisories');

      const commResult = await runCommunicationAgent(this.state.zones, this.state.resources, isDamFailure);
      this.state.communicationOutput = commResult.output;
      if (commResult.mode === 'AI_GEMINI') this.state.executionMode = 'AI_GEMINI';

      const commHighestScore = Math.max(...commResult.output.zone_analysis.map((z) => z.severity_score));
      this.state.agentStatuses['Communication Agent'] = {
        status: 'RECOMMENDING',
        currentTask: 'Broadcasting emergency warnings across sectors',
        latestRecommendation: commResult.output.public_alert.substring(0, 60) + '...',
        lastMessage: 'Safety instructions generated',
        updatedAt: new Date().toISOString(),
        confidence: commResult.output.confidence,
        overallSeverity: commHighestScore >= 80 ? 'CRITICAL' : 'DANGER',
        zonesAnalyzedCount: commResult.output.zone_analysis.length,
      };
      this.state.stepIndex = 4;

      // STEP 5: Send outputs to Agent Message Bus
      this.postMessage(
        'Medical Agent',
        'Coordinator Agent',
        'REQUEST',
        `Medical request: ${medResult.output.resource_requests.map((r) => `${r.specific_id || r.resource_type} -> ${r.zone}`).join(', ')}`,
        medResult.output.resource_requests
      );
      this.postMessage(
        'Logistics Agent',
        'Coordinator Agent',
        'REQUEST',
        `Logistics request: ${logResult.output.resource_requests.map((r) => `${r.specific_id || r.resource_type} -> ${r.zone}`).join(', ')}`,
        logResult.output.resource_requests
      );
      this.postMessage(
        'Communication Agent',
        'Coordinator Agent',
        'UPDATE',
        `Public alert prepared: ${commResult.output.public_alert.substring(0, 80)}...`,
        commResult.output
      );

      // STEP 6: Run Conflict Engine
      this.addLog('RULE', 'ConflictEngine', 'Executing deterministic contention analysis on agent requests');
      this.state.conflicts = this.conflictEngine.detectConflicts(
        this.state.medicalOutput,
        this.state.logisticsOutput
      );

      if (this.state.conflicts.length > 0) {
        this.state.agentStatuses['Medical Agent'].status = 'CONFLICTED';
        this.state.agentStatuses['Logistics Agent'].status = 'CONFLICTED';
        const conflict = this.state.conflicts[0];
        this.postMessage(
          'Conflict Engine',
          'Coordinator Agent',
          'CONFLICT',
          `RESOURCE_CONFLICT DETECTED: Resource ${conflict.resource} requested simultaneously by ${conflict.requesting_agents.join(' and ')} for zones ${conflict.requested_zones.join(' and ')}.`,
          conflict
        );
      }
      this.state.stepIndex = 5;

      // STEP 7: Run Constraint Validator
      this.addLog('RULE', 'ConstraintValidator', 'Verifying physical asset exclusivity rules and fleet capacity');
      const allRequests = [
        ...(this.state.medicalOutput.resource_requests || []),
        ...(this.state.logisticsOutput.resource_requests || []),
      ];
      this.state.constraintResult = this.constraintValidator.validateRequests(
        allRequests,
        this.state.resources,
        this.state.conflicts
      );

      if (!this.state.constraintResult.valid) {
        this.postMessage(
          'Constraint Validator',
          'Coordinator Agent',
          'ALERT',
          `REJECT PLAN: Double allocation or fleet limit violation detected: ${this.state.constraintResult.violations.join('; ')}`,
          this.state.constraintResult
        );
      }
      this.state.stepIndex = 6;

      // STEP 8: Send results to Coordinator Agent
      // STEP 9: Coordinator synthesizes final response plan & resolves conflicts
      this.state.agentStatuses['Coordinator Agent'].status = 'RESOLVING';
      this.state.agentStatuses['Coordinator Agent'].currentTask = 'Synthesizing final response plan and resolving conflicts';
      this.addLog('AGENT', 'Coordinator Agent', 'Synthesizing final response plan and resolving conflicts');

      const coordResult = await runCoordinatorAgent(
        this.state.medicalOutput,
        this.state.logisticsOutput,
        this.state.communicationOutput,
        this.state.conflicts,
        this.state.resources,
        this.state.zones,
        this.state.messages,
        isDamFailure
      );

      this.state.coordinatorOutput = coordResult.output;
      if (coordResult.mode === 'AI_GEMINI') this.state.executionMode = 'AI_GEMINI';

      // STEP 10: Validate Final Plan again against physical constraints
      const finalAllocationPlan = coordResult.output.resource_allocation || [];
      const postValidation = this.constraintValidator.validatePlan(finalAllocationPlan, this.state.resources);

      if (!postValidation.valid) {
        this.addLog('WARN', 'ConstraintValidator', `Coordinator plan had warnings: ${postValidation.violations.join(', ')}`);
      }

      // STEP 11: Stage Resource Allocation into RESERVED state (Do not dispatch before human approval)
      this.resourceManager.reset();
      for (const item of finalAllocationPlan) {
        this.resourceManager.allocateResource(item.resource, item.zone, item.agent);
      }
      this.state.resources = this.resourceManager.getAllResources().map((r) => {
        if (r.allocated > 0) {
          return { ...r, reservationStatus: 'RESERVED' };
        }
        return { ...r, reservationStatus: 'AVAILABLE' };
      });

      // Human-in-the-loop initial proposal
      this.state.approvalState = {
        status: 'PENDING_APPROVAL',
        timestamp: new Date().toISOString(),
        approverName: 'Cmdr. Elena Vance',
        approverRole: 'Authorized Emergency Response Officer',
        reason: 'Coordinator generated final operational compromise; waiting for officer authorization before vehicle deployment.',
      };

      // Set rescue passports to APPROVAL stage
      this.state.rescuePassports = this.state.rescuePassports.map((p) => ({
        ...p,
        stage: 'APPROVAL',
        stageStatus: {
          ...p.stageStatus,
          PLAN: 'COMPLETED',
          APPROVAL: 'IN_PROGRESS',
        },
      }));

      this.addAuditTrail(
        'Coordinator Agent',
        'PROPOSED RESPONSE PLAN synthesized. Awaiting authorized officer approval before dispatch.',
        'PENDING',
        coordResult.output.decision
      );

      this.addLog(
        'INFO',
        'ResourceManager',
        `Staged ${finalAllocationPlan.length} resource allocations in RESERVED lock pending human authorization.`
      );

      // STEP 12: Update Dashboard state & Agent statuses
      this.state.agentStatuses['Medical Agent'].status = 'COMPLETED';
      this.state.agentStatuses['Logistics Agent'].status = 'COMPLETED';
      this.state.agentStatuses['Communication Agent'].status = 'COMPLETED';
      this.state.agentStatuses['Coordinator Agent'] = {
        status: 'COMPLETED',
        currentTask: 'Proposed response plan ready for officer authorization',
        latestRecommendation: coordResult.output.decision,
        lastMessage: `Resolved conflict. Directive: ${coordResult.output.decision}`,
        updatedAt: new Date().toISOString(),
        confidence: 0.96,
      };

      // STEP 13: Generate and broadcast public alert
      this.postMessage(
        'Coordinator Agent',
        'All Units',
        'DECISION',
        `PROPOSED PLAN GENERATED: ${coordResult.output.decision}. Awaiting officer signoff.`,
        coordResult.output
      );

      // STEP 14: Save Response History
      const historyEntry: ResponseHistoryEntry = {
        id: `PLAN-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        scenarioName: this.state.scenarioTitle,
        emergencyInjected: isDamFailure,
        conflictsDetected: this.state.conflicts.length,
        allocatedResourceCount: finalAllocationPlan.length,
        executiveDecision: coordResult.output.decision,
        decisionReasoning: {
          decision: coordResult.output.decision,
          evidence: coordResult.output.evidence,
          constraints: coordResult.output.constraints,
          tradeoffs: coordResult.output.tradeoffs,
        },
        coordinatorOutput: coordResult.output,
        zonesSnapshot: JSON.parse(JSON.stringify(this.state.zones)),
        resourceSnapshot: JSON.parse(JSON.stringify(this.state.resources)),
      };
      this.state.history.unshift(historyEntry);

      this.addLog(
        'INFO',
        'ExecutionEngine',
        '14-Step Multi-Agent Response cycle complete. Verified against deterministic physical constraints.'
      );

      this.state.stepIndex = 7;
      this.state.isRunning = false;
      return this.state;
    } catch (err: any) {
      console.error('[ExecutionEngine Error]', err);
      this.addLog('ERROR', 'ExecutionEngine', `Pipeline error: ${err?.message || err}`);
      this.state.isRunning = false;
      return this.state;
    }
  }

  /**
   * FEATURE 2 — Human-in-the-loop Approval
   */
  public approvePlan(
    approverName: string,
    role: string,
    decision: 'APPROVED' | 'MODIFIED' | 'REJECTED',
    modifications?: string,
    reason?: string
  ): SystemExecutionState {
    const timestamp = new Date().toISOString();

    if (decision === 'APPROVED' || decision === 'MODIFIED') {
      this.state.approvalState = {
        status: decision === 'APPROVED' ? 'PLAN_APPROVED' : 'PLAN_MODIFIED',
        approverName: approverName || 'Cmdr. Elena Vance',
        approverRole: role || 'Authorized Emergency Response Officer',
        timestamp,
        decision,
        modifications,
        reason: reason || 'Verified and approved by Incident Commander.',
      };

      // FEATURE 11: Lock resources from RESERVED -> DISPATCHED
      this.state.resources = this.state.resources.map((r) => {
        if (r.allocated > 0) {
          return {
            ...r,
            reservationStatus: 'DISPATCHED',
            status: 'DEPLOYED',
          };
        }
        return r;
      });

      // FEATURE 3 & 5: Transition Rescue Passports to DISPATCH -> IN TRANSIT -> ARRIVAL
      this.state.rescuePassports = this.state.rescuePassports.map((p) => ({
        ...p,
        stage: 'ARRIVAL',
        stageStatus: {
          ...p.stageStatus,
          APPROVAL: 'COMPLETED',
          DISPATCH: 'COMPLETED',
          IN_TRANSIT: 'COMPLETED',
          ARRIVAL: 'COMPLETED',
          HELP_RECEIVED: 'IN_PROGRESS',
        },
        helpReceivedStatus: 'PENDING_VERIFICATION',
        updatedAt: timestamp,
      }));

      this.addAuditTrail(
        'Human Response Officer',
        `Plan ${decision} by ${approverName} (${role})`,
        'COMPLETED',
        reason || modifications || 'Official field authorization issued.'
      );

      this.postMessage(
        'Incident Commander',
        'All Units',
        'DECISION',
        `PLAN AUTHORIZED BY ${approverName}. Resources dispatched to target sectors. Verification required upon arrival.`
      );
    } else {
      // REJECTED
      this.state.approvalState = {
        status: 'PLAN_REJECTED',
        approverName: approverName || 'Cmdr. Elena Vance',
        approverRole: role || 'Authorized Emergency Response Officer',
        timestamp,
        decision: 'REJECTED',
        reason: reason || 'Officer requested immediate re-evaluation due to tactical considerations.',
      };

      // Release reserved allocations
      this.state.resources = this.state.resources.map((r) => ({
        ...r,
        allocated: 0,
        available: r.total,
        status: 'AVAILABLE',
        reservationStatus: 'AVAILABLE',
      }));

      this.addAuditTrail(
        'Human Response Officer',
        `Plan REJECTED by ${approverName}`,
        'ALERT',
        reason || 'Plan aborted by human commander.'
      );
    }

    return this.state;
  }

  /**
   * Dispatches allocated resources only if plan is already approved
   */
  public dispatchResources(officerName?: string): { success: boolean; state: SystemExecutionState; error?: string } {
    const isApproved =
      this.state.approvalState?.status === 'PLAN_APPROVED' ||
      this.state.approvalState?.status === 'PLAN_MODIFIED';

    if (!isApproved) {
      this.addAuditTrail(
        'Dispatcher',
        'Resource Dispatch BLOCKED: Plan pending approval',
        'FAILED',
        'Attempted to dispatch resources before human-in-the-loop authorization was registered.'
      );
      return {
        success: false,
        state: this.state,
        error: 'Resource dispatch blocked. Plan must be approved by an authorized Emergency Response Officer first.',
      };
    }

    // Update resources to DISPATCHED
    this.state.resources = this.state.resources.map((r) => {
      if (r.allocated > 0) {
        return {
          ...r,
          reservationStatus: 'DISPATCHED',
          status: 'DEPLOYED',
        };
      }
      return r;
    });

    this.addAuditTrail(
      'Dispatcher',
      `Physical resource fleet deployed to field sectors`,
      'COMPLETED',
      `Authorized by ${this.state.approvalState?.approverName || officerName || 'Incident Commander'}.`
    );

    return { success: true, state: this.state };
  }

  /**
   * FEATURE 4 — Help Received Verification & FEATURE 17 Dynamic Resource Reuse
   */
  public verifyHelpReceived(
    incidentId: string,
    status: 'CONFIRMED' | 'DELAYED' | 'FAILED',
    notes?: string
  ): SystemExecutionState {
    const timestamp = new Date().toISOString();
    const passport = this.state.rescuePassports.find((p) => p.incidentId === incidentId);

    if (!passport) {
      this.addLog('WARN', 'Verification', `Incident ${incidentId} not found in rescue passports.`);
      return this.state;
    }

    if (status === 'CONFIRMED') {
      passport.helpReceivedStatus = 'CONFIRMED';
      passport.stage = 'COMPLETED';
      passport.stageStatus.HELP_RECEIVED = 'COMPLETED';
      passport.stageStatus.COMPLETED = 'COMPLETED';
      passport.verificationNotes = notes || 'On-scene medical triage confirmed help delivered.';
      passport.failurePoint = null;
      passport.failureReason = null;
      passport.updatedAt = timestamp;

      // FEATURE 17: Dynamic Resource Reuse: Free resource and recommend reuse
      const assignedVehicleId = passport.assignedVehicle.split(' ')[0];
      const targetRes = this.state.resources.find((r) => r.id === assignedVehicleId);
      if (targetRes) {
        targetRes.allocated = Math.max(0, targetRes.allocated - 1);
        targetRes.available = Math.min(targetRes.total, targetRes.available + 1);
        targetRes.reservationStatus = 'AVAILABLE';
        targetRes.status = 'AVAILABLE';
      }

      this.addAuditTrail(
        'Field Responder',
        `Help Received CONFIRMED for ${incidentId} in ${passport.location}. Incident marked COMPLETED.`,
        'COMPLETED',
        notes || 'Assistance delivered successfully to affected civilians.'
      );

      this.postMessage(
        'System Bus',
        'Coordinator Agent',
        'UPDATE',
        `DYNAMIC RESOURCE REUSE: ${passport.assignedVehicle} has completed operations in ${passport.location} and is now AVAILABLE for immediate redeployment to next priority sector.`
      );
    } else if (status === 'DELAYED') {
      passport.helpReceivedStatus = 'DELAYED';
      passport.stageStatus.HELP_RECEIVED = 'DELAYED';
      passport.verificationNotes = notes || 'Transit obstruction or high casualty volume delay reported.';
      passport.updatedAt = timestamp;

      this.addAuditTrail(
        'Field Responder',
        `Assistance DELAYED at ${incidentId}`,
        'ALERT',
        notes || 'Field team reported transit corridor delay.'
      );
    } else {
      // FAILED — FEATURE 5 Response Chain Broken & Trigger Replanning
      passport.helpReceivedStatus = 'FAILED';
      passport.stageStatus.HELP_RECEIVED = 'FAILED';
      passport.failurePoint = 'HELP_RECEIVED';
      passport.failureReason = notes || 'Responder team unable to access coordinates; response chain broken.';
      passport.updatedAt = timestamp;

      this.addAuditTrail(
        'Response Monitor',
        `RESPONSE CHAIN BROKEN at ${incidentId}! Failure at HELP_RECEIVED.`,
        'FAILED',
        notes || 'Rescue team contact lost or impassable barrier encountered.'
      );

      this.postMessage(
        'Response Chain Monitor',
        'Coordinator Agent',
        'ALERT',
        `RESPONSE CHAIN BROKEN for ${incidentId}: ${passport.failureReason}. Immediate replanning triggered.`
      );
    }

    return this.state;
  }

  /**
   * FEATURE 6 — Activate Backup Plan
   */
  public activateBackupPlan(incidentId: string): SystemExecutionState {
    const backupPlan = this.state.primaryBackupPlans.find((p) => p.incidentId === incidentId);
    if (!backupPlan) {
      this.addLog('WARN', 'BackupPlan', `No primary/backup configuration for incident ${incidentId}`);
      return this.state;
    }

    backupPlan.activePlan = 'BACKUP';
    backupPlan.activatedAt = new Date().toISOString();
    backupPlan.activationReason = 'Primary vehicle path obstructed or unit reallocated by command.';

    // Update passport assigned vehicle & team
    const passport = this.state.rescuePassports.find((p) => p.incidentId === incidentId);
    if (passport) {
      passport.assignedVehicle = `${backupPlan.backup.vehicle} (Backup Plan)`;
      passport.assignedMedicalTeam = `${backupPlan.backup.medicalTeam} (Backup Team)`;
      passport.updatedAt = new Date().toISOString();
    }

    this.addAuditTrail(
      'Logistics Coordinator',
      `BACKUP PLAN ACTIVATED for ${incidentId}: ${backupPlan.backup.vehicle} via ${backupPlan.backup.route}`,
      'COMPLETED',
      `ETA: ${backupPlan.backup.etaMinutes} min | Route Risk: ${backupPlan.backup.routeRisk}`
    );

    this.postMessage(
      'Logistics Coordinator',
      'All Agents',
      'ALERT',
      `Backup plan activated for ${incidentId}. Dispatched ${backupPlan.backup.vehicle} via ${backupPlan.backup.route}.`
    );

    return this.state;
  }

  /**
   * FEATURE 7 — What-If Crisis Simulator
   */
  public runWhatIfSimulation(scenarioId: string): SystemExecutionState {
    const scenario = this.state.whatIfScenarios.find((s) => s.id === scenarioId);
    if (!scenario) {
      this.addLog('WARN', 'Simulator', `What-If scenario ${scenarioId} not found.`);
      return this.state;
    }

    this.state.activeWhatIfScenarioId = scenarioId;
    this.state.simulatedWhatIfPlan = scenario.simulatedPlan;

    this.addAuditTrail(
      'Crisis Simulator',
      `What-If analysis simulated: "${scenario.name}" (Scenario: ${scenario.type})`,
      'COMPLETED',
      `Current Plan vs Simulated Plan comparison generated for command review.`
    );

    return this.state;
  }

  /**
   * FEATURE 7 — Commit What-If Plan to Real Operational State
   */
  public commitWhatIfPlan(scenarioId: string, officerName: string): SystemExecutionState {
    const scenario = this.state.whatIfScenarios.find((s) => s.id === scenarioId);
    if (!scenario) return this.state;

    if (this.state.coordinatorOutput) {
      this.state.coordinatorOutput.final_plan = [...scenario.simulatedPlan];
      this.state.coordinatorOutput.decision = `What-If Contingency Committed: ${scenario.name}. Directives updated.`;
    }

    this.state.activeWhatIfScenarioId = null;
    this.state.simulatedWhatIfPlan = null;

    this.addAuditTrail(
      'Human Response Officer',
      `What-If scenario "${scenario.name}" committed to operational pipeline by ${officerName || 'Cmdr. Elena Vance'}`,
      'COMPLETED',
      'Operational response plan updated based on simulated contingency.'
    );

    this.postMessage(
      'Incident Commander',
      'All Units',
      'DECISION',
      `OPERATIONAL DIRECTIVE UPDATED: Contingency plan for "${scenario.name}" committed to execution.`
    );

    return this.state;
  }

  /**
   * FEATURE 15 — Verify Data Gap / Scout Reconnaissance
   */
  public verifyDataGap(zoneId: string): SystemExecutionState {
    // Update data health fields for Zone D
    this.state.dataHealthFields = this.state.dataHealthFields.map((dh) => {
      if (dh.zone === zoneId) {
        return {
          ...dh,
          status: 'VERIFIED',
          value: dh.field === 'Population Density' ? '120 residents verified' : '2 minor casualties',
          source: 'Reconnaissance UAV Drone FLIR Sensor Scan',
          timestamp: 'Just now',
          isUnknown: false,
        };
      }
      return dh;
    });

    const targetZone = this.state.zones.find((z) => z.id === zoneId);
    if (targetZone) {
      targetZone.notes = 'Drone scout reconnaissance completed. Sector status updated with verified telemetry.';
      targetZone.peopleAtRisk = 120;
      targetZone.injured = 2;
    }

    this.addAuditTrail(
      'Reconnaissance Drone',
      `DATA GAP RESOLVED for ${zoneId}. FLIR thermal imaging verified civilian cluster.`,
      'COMPLETED',
      'Unknown values replaced with real ground-truth telemetry.'
    );

    return this.state;
  }

  public injectDamFailureEmergency(): SystemExecutionState {
    return this.injectDamFailure();
  }
}

export const globalExecutionEngine = new ExecutionEngine();
