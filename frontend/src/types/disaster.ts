export type DisasterSeverityLevel = 'NORMAL' | 'MEDIUM' | 'DANGER' | 'CRITICAL';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface Zone {
  id: string; // 'Zone A', 'Zone B', 'Zone C', 'Zone D'
  name: string;
  zone?: string;
  population: number;
  peopleAtRisk: number;
  injured: number;
  severity: SeverityLevel;
  severityScore?: number;
  severityLevel?: DisasterSeverityLevel;
  medicalPriority?: string;
  evacuationStatus?: string;
  emergencyType: string;
  requiredResources: string[];
  coordinates: { x: number; y: number };
  notes: string;
  lastUpdated?: string;
  floodStatus?: 'low' | 'medium' | 'high';
  floodRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  floodRiskScore?: number;
  floodWaterSpread?: number;
  floodConfidence?: number;
  floodDataSource?: 'satellite' | 'simulation';
  floodObservationTimestamp?: string;
  floodEvidence?: string;
}

export type DisasterZone = Zone;

export interface ZoneSeverityAnalysis {
  zone: string;
  severity_score: number; // 0 - 100
  level: DisasterSeverityLevel;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  injured?: number;
  peopleAtRisk?: number;
  triage_urgency?: string;
  ambulance_requirement?: number;
  medical_team_requirement?: number;
  medical_kit_requirement?: number;
  medical_risks?: string;
  evacuation_priority?: string;
  transit_bottlenecks?: string;
  shelter_destination?: string;
  communication_priority?: string;
  warning_message?: string;
}

export type ResourceCategory =
  | 'Ambulance'
  | 'Rescue Vehicle'
  | 'Medical Team'
  | 'Medical Kit'
  | 'Rescue Boat'
  | 'Shelter'
  | 'Food Pack'
  | 'Water Pack';

export type ResourceReservationStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'UNAVAILABLE';

export type ReservationStatus = ResourceReservationStatus;

export interface ResourceCapabilityProfile {
  offRoad?: boolean;
  medicalSupport?: string | boolean;
  fuelPercent?: number;
  locationGps?: string;
  membersCount?: number;
  traumaCapability?: boolean;
}

export interface ResourceUnit {
  id: string; // e.g., 'AMB-01', 'AMB-02', 'RV-01', etc.
  type: ResourceCategory;
  name: string;
  total: number;
  available: number;
  allocated: number;
  assignedZone?: string | null;
  assignedAgent?: string | null;
  status: 'AVAILABLE' | 'DEPLOYED' | 'MAINTENANCE' | 'DEPLETED';
  capacity?: number; // for shelters or vehicles
  offRoad?: boolean;
  medicalSupport?: boolean;
  fuelPercent?: number;
  locationGps?: string;
  membersCount?: number;
  traumaCapability?: boolean;
  capabilities?: ResourceCapabilityProfile;
  reservationStatus?: ResourceReservationStatus;
  assignedIncidentId?: string | null;
}

export type AgentRole = 'Medical Agent' | 'Logistics Agent' | 'Communication Agent' | 'Coordinator Agent';

export type AgentStatus =
  | 'IDLE'
  | 'ANALYZING'
  | 'WAITING'
  | 'RECOMMENDING'
  | 'CONFLICTED'
  | 'RESOLVING'
  | 'COMPLETED'
  | 'ERROR';

export type MessageType =
  | 'REQUEST'
  | 'RECOMMENDATION'
  | 'CONFLICT'
  | 'RESPONSE'
  | 'UPDATE'
  | 'ALERT'
  | 'DECISION';

export interface AgentMessage {
  message_id: string;
  from_agent: string;
  to_agent: string;
  message_type: MessageType;
  timestamp: string;
  payload: {
    summary: string;
    details?: any;
    resource?: string;
    zone?: string;
    priority?: string;
  };
}

export interface ResourceRequest {
  resource_type: string;
  specific_id?: string;
  zone: string;
  quantity: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  purpose: string;
}

export interface MedicalOutput {
  agent: 'Medical Agent';
  overall_status: string;
  zone_analysis: ZoneSeverityAnalysis[];
  priority_zones: string[];
  resource_requests: ResourceRequest[];
  triage_recommendations: string[];
  medical_priorities: string[];
  reason: string;
  confidence: number;
  timestamp?: string;
}

export interface LogisticsOutput {
  agent: 'Logistics Agent';
  overall_status: string;
  zone_analysis: ZoneSeverityAnalysis[];
  priority_zones: string[];
  resource_requests: ResourceRequest[];
  evacuation_plan: {
    zone: string;
    shelter_id: string;
    estimated_people: number;
    vehicle_assigned?: string;
  }[];
  transport_recommendations: string[];
  shortages: string[];
  reason: string;
  confidence: number;
  timestamp?: string;
}

export interface CommunicationOutput {
  agent: 'Communication Agent';
  overall_status: string;
  zone_analysis: ZoneSeverityAnalysis[];
  public_alert: string;
  public_warning?: string;
  evacuation_message: string;
  safety_instructions: string[];
  priority_messages: string[];
  confidence: number;
  timestamp?: string;
}

export type MedicalAnalysisOutput = MedicalOutput;
export type LogisticsAnalysisOutput = LogisticsOutput;
export type CommunicationAnalysisOutput = CommunicationOutput;
export type CoordinatorAnalysisOutput = CoordinatorOutput;

export interface ConflictDetectionResult {
  conflict: boolean;
  resource: string;
  requesting_agents: string[];
  requested_zones: string[];
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  status: 'UNRESOLVED' | 'RESOLVED';
  reason?: string;
  timestamp?: string;
}

export interface ConstraintValidationResult {
  valid: boolean;
  violations: string[];
  warnings: string[];
  checked_constraints: string[];
  timestamp?: string;
}

export interface ResolvedConflict {
  resource: string;
  winner_agent: string;
  winner_zone: string;
  alternative_for_loser: string;
  rationale: string;
}

export interface PlanAction {
  priority: number;
  action: string;
  target_zone: string;
  assigned_agent: string;
  details: string;
}

export interface ResourceAllocationRecord {
  zone: string;
  resource: string;
  agent: string;
  priority: string;
  status: string;
}

export interface CoordinatorOutput {
  agent: 'Coordinator Agent';
  final_status: string;
  final_plan: PlanAction[];
  resource_allocation: ResourceAllocationRecord[];
  resolved_conflicts: ResolvedConflict[];
  decision: string;
  evidence: string[];
  constraints: string[];
  tradeoffs: string[];
  public_alert: string;
  timestamp?: string;
}

export interface GeminiStatusInfo {
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  message: string;
  model: string;
}

export interface SatelliteObservation {
  zoneId: string;
  floodStatus: 'low' | 'medium' | 'high';
  waterSpread: number;
  confidence: number;
  timestamp: string;
  evidence?: string;
}

export interface SatelliteAffectedZone {
  zoneId: string;
  floodStatus: 'low' | 'medium' | 'high';
  floodRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  floodRiskScore: number;
  waterSpread: number;
  confidence: number;
  source: 'satellite' | 'simulation';
  observationTimestamp: string;
  evidence: string;
}

export interface SatelliteMonitoring {
  status: 'CONNECTED' | 'UNAVAILABLE' | 'SIMULATED_FALLBACK';
  source: 'satellite' | 'simulation';
  dataLabel: 'REAL SATELLITE DATA' | 'SIMULATED DATA';
  provider: string;
  message: string;
  timestamp: string;
  observations: SatelliteObservation[];
  affectedZones: SatelliteAffectedZone[];
}

export type RescuePassportStage =
  | 'PLAN'
  | 'APPROVAL'
  | 'DISPATCH'
  | 'IN_TRANSIT'
  | 'ARRIVAL'
  | 'HELP_RECEIVED'
  | 'COMPLETED';

export type StageProgressStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FAILED' | 'DELAYED';

export interface RescuePassport {
  incidentId: string;
  location: string;
  affectedPeople: number | 'Unknown';
  reportedInjuries: number | 'Unknown';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignedVehicle: string;
  assignedMedicalTeam: string;
  assignedShelter: string;
  stage: RescuePassportStage;
  stageStatus: Record<RescuePassportStage, StageProgressStatus>;
  helpReceivedStatus: 'CONFIRMED' | 'NOT_CONFIRMED' | 'PENDING_VERIFICATION' | 'DELAYED' | 'FAILED';
  verificationNotes?: string;
  failurePoint?: RescuePassportStage | null;
  failureReason?: string | null;
  updatedAt: string;
}

export interface ApprovalState {
  status: 'PENDING_APPROVAL' | 'PLAN_APPROVED' | 'PLAN_MODIFIED' | 'PLAN_REJECTED';
  approverName?: string;
  approverRole?: string;
  timestamp?: string;
  decision?: string;
  modifications?: string;
  reason?: string;
}

export interface PlanVariant {
  vehicle: string;
  medicalTeam: string;
  route: string;
  shelter?: string;
  routeRisk: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'LOW' | 'MEDIUM' | 'HIGH';
  distanceKm: number;
  etaMinutes: number;
  available: boolean;
  hazardDetails?: string;
}

export interface PrimaryBackupPlan {
  incidentId: string;
  targetZone: string;
  zone?: string;
  incidentDescription?: string;
  primary: PlanVariant;
  backup: PlanVariant;
  activePlan: 'PRIMARY' | 'BACKUP';
  activationReason?: string;
  activatedAt?: string;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  type:
    | 'VEHICLE_FAILURE'
    | 'ROAD_CLOSURE'
    | 'INJURY_SURGE'
    | 'SHELTER_FULL'
    | 'COMMS_LOSS'
    | 'MEDIC_UNAVAILABLE'
    | 'NEW_ZONE';
  currentCondition: string;
  simulatedCondition: string;
  agentImpact: {
    medical: string;
    logistics: string;
    communication: string;
    coordinator: string;
  };
  simulatedPlan: PlanAction[];
  resourceImpact: {
    vehicleDiff: string;
    medicDiff: string;
    capacityState: 'ADEQUATE' | 'TIGHT' | 'CRITICAL';
  };
}

export interface DataHealthField {
  id: string;
  field: string;
  zone: string;
  value: string;
  status: 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN' | 'STALE' | 'CONFLICTING';
  source: string;
  timestamp: string;
  isUnknown: boolean;
}

export interface ConflictingReport {
  id: string;
  topic: string;
  zone: string;
  sources: {
    source: string;
    reportedValue: string | number;
    timestamp: string;
    reliabilityScore: number;
  }[];
  reportedRange: string;
  status: 'VERIFICATION_REQUIRED' | 'RESOLVED';
  recommendedAction: string;
}

export interface IncidentMemoryEntry {
  id: string;
  location: string;
  historicalIssue: string;
  relevanceToCurrent: string;
  timestamp: string;
  matchedIncidentName?: string;
  year?: number | string;
  matchConfidencePercent?: number;
  pastMistakes?: string[];
  coordinatorAdjustments?: string[];
}

export interface CauseChainNode {
  id?: string;
  step: number;
  title: string;
  type?: 'ROOT_CAUSE' | 'INTERMEDIATE' | 'CONSEQUENCE';
  impactedZone?: string;
  description: string;
  severity: DisasterSeverityLevel;
  active: boolean;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  status: 'COMPLETED' | 'PENDING' | 'ALERT' | 'RESOLVED' | 'FAILED';
  details?: string;
}

export interface SystemExecutionState {
  scenarioTitle: string;
  activeEmergencyId: string;
  executionMode: 'AI_GEMINI' | 'SIMULATION_FALLBACK';
  stepIndex: number;
  isRunning: boolean;
  zones: Zone[];
  resources: ResourceUnit[];
  agentStatuses: Record<AgentRole, {
    status: AgentStatus;
    currentTask: string;
    latestRecommendation: string;
    lastMessage: string;
    updatedAt: string;
    confidence?: number;
    overallSeverity?: DisasterSeverityLevel;
    zonesAnalyzedCount?: number;
  }>;
  messages: AgentMessage[];
  medicalOutput?: MedicalOutput | null;
  logisticsOutput?: LogisticsOutput | null;
  communicationOutput?: CommunicationOutput | null;
  conflicts: ConflictDetectionResult[];
  constraintResult?: ConstraintValidationResult | null;
  coordinatorOutput?: CoordinatorOutput | null;
  history: ResponseHistoryEntry[];
  logs: SystemLogEntry[];
  selectedAgent?: AgentRole | 'All Agents';

  // NEW ADVANCED FEATURES STATE
  approvalState: ApprovalState;
  rescuePassports: RescuePassport[];
  primaryBackupPlans: PrimaryBackupPlan[];
  whatIfScenarios: WhatIfScenario[];
  activeWhatIfScenarioId?: string | null;
  simulatedWhatIfPlan?: PlanAction[] | null;
  dataHealthFields: DataHealthField[];
  conflictingReports: ConflictingReport[];
  incidentMemory: IncidentMemoryEntry[];
  causeChain: CauseChainNode[];
  auditTrail: AuditTrailEntry[];
  satelliteMonitoring: SatelliteMonitoring;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'AGENT' | 'RULE';
  service: string;
  message: string;
}

export interface ResponseHistoryEntry {
  id: string;
  timestamp: string;
  scenarioName: string;
  emergencyInjected: boolean;
  conflictsDetected: number;
  allocatedResourceCount: number;
  executiveDecision: string;
  decisionReasoning: {
    decision: string;
    evidence: string[];
    constraints: string[];
    tradeoffs: string[];
  };
  coordinatorOutput: CoordinatorOutput;
  zonesSnapshot: Zone[];
  resourceSnapshot: ResourceUnit[];
}

export interface SmtpConfigSafe {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  isPasswordSet: boolean;
  fromName: string;
  fromEmail: string;
  defaultRecipient: string;
}

export interface CommunicationConfigSafe {
  broadcastChannel: string;
  autoDispatchCritical: boolean;
  alertWebhookUrl: string;
  isWebhookSecretSet: boolean;
  retryLimit: number;
  timeoutSeconds: number;
  quietHoursEnabled: boolean;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

export interface SystemConfigSafe {
  smtp: SmtpConfigSafe;
  communication: CommunicationConfigSafe;
  storageType: 'ENVIRONMENT_VARIABLES';
  lastUpdated: string;
}

export interface UpdateConfigPayload {
  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    fromName?: string;
    fromEmail?: string;
    defaultRecipient?: string;
  };
  communication?: {
    broadcastChannel?: string;
    autoDispatchCritical?: boolean;
    alertWebhookUrl?: string;
    webhookSecret?: string;
    retryLimit?: number;
    timeoutSeconds?: number;
    quietHoursEnabled?: boolean;
    logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  };
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  service: 'SMTP_RELAY' | 'COMMUNICATION_DISPATCH';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

