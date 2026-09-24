import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { globalExecutionEngine } from './engine/executionEngine';
import { isGeminiConfigured, verifyGeminiConnection, generateAgentResponse } from './geminiClient';
import { ResourceManager } from './engine/resourceManager';
import { AgentRole } from '../frontend/src/types/disaster';
import { globalSystemConfig } from './config/systemConfigManager';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const allowedOrigin = process.env.CORS_ORIGIN || process.env.APP_URL;

app.use(express.json());

// Allow same-origin requests by default, with an explicit origin for external clients.
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (requestOrigin && allowedOrigin && requestOrigin === allowedOrigin) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const adminProtectedRoutes = [
  '/api/run-all-agents',
  '/api/run-agent',
  '/api/reset',
  '/api/emergency/trigger',
  '/api/plan/approve',
  '/api/plan/dispatch',
  '/api/config/system',
  '/api/reports/email',
];

function requireAdminApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const configuredKey = process.env.ADMIN_API_KEY?.trim();
  if (!configuredKey) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ success: false, error: 'Admin API is not configured.' });
    }
    return next();
  }

  const requestOrigin = req.headers.origin;
  const sameOrigin = Boolean(requestOrigin) && (requestOrigin === `${req.protocol}://${req.get('host')}` || requestOrigin === allowedOrigin);
  if (sameOrigin) {
    return next();
  }

  const authorization = req.header('authorization');
  const bearerKey = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : undefined;
  const providedKey = req.header('x-admin-api-key') || bearerKey;

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({ success: false, error: 'Valid admin API key required.' });
  }

  next();
}

app.use(adminProtectedRoutes, requireAdminApiKey);

// =========================================================================
// API ENDPOINTS (As specified in requirement 21 & 3)
// =========================================================================

// 1. Gemini Connection Status (Safe test, never exposes secrets)
app.get('/api/gemini/status', async (req, res) => {
  try {
    const status = await verifyGeminiConnection();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.json({
      success: true,
      data: {
        status: 'ERROR',
        message: error?.message || 'Error checking Gemini API',
        model: 'gemini-3.8-flash',
      },
    });
  }
});

// 2. Generic Gemini Analyze Endpoint (Backend service proxy)
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required.' });
    }
    const result = await generateAgentResponse<any>(
      systemInstruction || 'You are an emergency response AI agent. Return valid JSON only.',
      prompt
    );
    res.json({ success: true, data: result.data, mode: result.mode, error: result.error });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. GET /api/agents
app.get('/api/agents', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    res.json({ success: true, data: state.agentStatuses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. GET /api/agent-messages
app.get('/api/agent-messages', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    res.json({ success: true, data: state.messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. GET /api/conflicts
app.get('/api/conflicts', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    res.json({ success: true, data: state.conflicts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. GET /api/resources
app.get('/api/resources', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    res.json({ success: true, data: state.resources });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. GET /api/zones
app.get('/api/zones', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    res.json({ success: true, data: state.zones });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. GET /api/response-plan
app.get('/api/response-plan', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    res.json({
      success: true,
      data: {
        plan: state.coordinatorOutput?.final_plan || [],
        allocation: state.coordinatorOutput?.resource_allocation || [],
        decision: state.coordinatorOutput?.decision || '',
        publicAlert: state.coordinatorOutput?.public_alert || '',
        coordinatorOutput: state.coordinatorOutput,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. GET /api/history
app.get('/api/history', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    res.json({ success: true, data: state.history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. GET /api/architecture
app.get('/api/architecture', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'RESQ-MIND Architecture',
      version: '2.5.0',
      agents: [
        {
          id: 'medical',
          name: 'Medical Agent',
          role: 'Analyze casualty triage, calculate zone severity scores, request trauma units & ALS transport.',
          type: 'AI_AGENT',
        },
        {
          id: 'logistics',
          name: 'Logistics Agent',
          role: 'Analyze evacuation corridors, transport assets, boats, shelter capacities, road clearance.',
          type: 'AI_AGENT',
        },
        {
          id: 'communication',
          name: 'Communication Agent',
          role: 'Formulate official public warnings, evacuation messages, and zone-specific safety advisories.',
          type: 'AI_AGENT',
        },
        {
          id: 'coordinator',
          name: 'Coordinator Agent',
          role: 'Synthesize cross-agent proposals, resolve contention, evaluate trade-offs, issue final plan.',
          type: 'AI_AGENT',
        },
      ],
      deterministicEngines: [
        { name: 'Disaster Simulator', role: 'Maintains ground-truth telemetry and scenario injections.' },
        { name: 'Agent Message Bus', role: 'Decoupled event broker managing agent communication.' },
        { name: 'Conflict Engine', role: 'Algorithmic detection of mutual asset contention.' },
        { name: 'Constraint Validator', role: 'Hard physical invariance gatekeeper (rejects impossible allocations).' },
        { name: 'Resource Manager', role: 'Physical ledger enforcing non-negative stocks and deployments.' },
      ],
    },
  });
});

// 11. POST /api/run-agent
app.post('/api/run-agent', async (req, res) => {
  try {
    const agentParam = req.body.agent || req.body.agentRole;
    let mappedRole: AgentRole = 'Medical Agent';

    if (typeof agentParam === 'string') {
      const lower = agentParam.toLowerCase();
      if (lower.includes('logistics')) mappedRole = 'Logistics Agent';
      else if (lower.includes('comm')) mappedRole = 'Communication Agent';
      else if (lower.includes('coord')) mappedRole = 'Coordinator Agent';
      else mappedRole = 'Medical Agent';
    }

    const result = await globalExecutionEngine.runSingleAgent(mappedRole);
    res.json({
      success: true,
      agent: mappedRole,
      data: result.state,
      agentOutput: result.agentOutput,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. POST /api/run-all-agents
app.post('/api/run-all-agents', async (req, res) => {
  try {
    const state = await globalExecutionEngine.runFullResponse();
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 13. POST /api/inject-emergency
app.post('/api/inject-emergency', (req, res) => {
  try {
    const state = globalExecutionEngine.injectDamFailure();
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/emergency/trigger (Dynamic New Emergency Handling)
app.post('/api/emergency/trigger', async (req, res) => {
  try {
    const { emergencyType, targetZone, severityIncrease } = req.body;
    const state = await globalExecutionEngine.triggerNewEmergency(
      emergencyType || 'Dam Failure',
      targetZone || 'Zone C',
      Number(severityIncrease) || 25
    );
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 14. POST /api/reset
app.post('/api/reset', (req, res) => {
  try {
    const state = globalExecutionEngine.resetSimulation();
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// FEATURE 2: POST /api/plan/approve (Human-in-the-Loop Approval)
app.post('/api/plan/approve', (req, res) => {
  try {
    const { approverName, role, decision, modifications, reason } = req.body;
    const state = globalExecutionEngine.approvePlan(
      approverName || 'Cmdr. Elena Vance',
      role || 'Authorized Emergency Response Officer',
      decision || 'APPROVED',
      modifications,
      reason
    );
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/plan/dispatch (Guarded Resource Dispatch - Disabled for Unapproved Plans)
app.post('/api/plan/dispatch', (req, res) => {
  try {
    const { officerName } = req.body;
    const result = globalExecutionEngine.dispatchResources(officerName);
    if (!result.success) {
      return res.status(403).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// FEATURE 4: POST /api/passport/verify (Help Received Verification & Resource Reuse)
app.post('/api/passport/verify', (req, res) => {
  try {
    const { incidentId, status, notes } = req.body;
    if (!incidentId || !status) {
      return res.status(400).json({ success: false, error: 'incidentId and status are required' });
    }
    const state = globalExecutionEngine.verifyHelpReceived(incidentId, status, notes);
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// FEATURE 6: POST /api/plan/activate-backup
app.post('/api/plan/activate-backup', (req, res) => {
  try {
    const { incidentId } = req.body;
    if (!incidentId) {
      return res.status(400).json({ success: false, error: 'incidentId is required' });
    }
    const state = globalExecutionEngine.activateBackupPlan(incidentId);
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// FEATURE 7: POST /api/what-if/simulate
app.post('/api/what-if/simulate', (req, res) => {
  try {
    const { scenarioId } = req.body;
    if (!scenarioId) {
      return res.status(400).json({ success: false, error: 'scenarioId is required' });
    }
    const state = globalExecutionEngine.runWhatIfSimulation(scenarioId);
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// FEATURE 7: POST /api/what-if/commit
app.post('/api/what-if/commit', (req, res) => {
  try {
    const { scenarioId, officerName } = req.body;
    if (!scenarioId) {
      return res.status(400).json({ success: false, error: 'scenarioId is required' });
    }
    const state = globalExecutionEngine.commitWhatIfPlan(scenarioId, officerName);
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// FEATURE 15: POST /api/intel/verify-gap
app.post('/api/intel/verify-gap', (req, res) => {
  try {
    const { zoneId } = req.body;
    const state = globalExecutionEngine.verifyDataGap(zoneId || 'Zone D');
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 15. POST /api/reports/generate
app.post('/api/reports/generate', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    const report = {
      reportId: `REP-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      scenarioTitle: state.scenarioTitle,
      activeEmergency: state.activeEmergencyId,
      executionMode: state.executionMode,
      zones: state.zones,
      medicalAnalysis: state.medicalOutput,
      logisticsAnalysis: state.logisticsOutput,
      communicationAnalysis: state.communicationOutput,
      conflicts: state.conflicts,
      constraintValidation: state.constraintResult,
      coordinatorPlan: state.coordinatorOutput,
      resourcesAllocated: state.resources.filter((r) => r.status === 'DEPLOYED'),
      tradeoffs: state.coordinatorOutput?.tradeoffs || [],
      publicAlert: state.coordinatorOutput?.public_alert || '',
    };
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 16. POST /api/reports/email (Uses env-backed SMTP config, never leaks secrets)
app.post('/api/reports/email', async (req, res) => {
  try {
    const { email, reportId, reportSummary } = req.body;
    const targetEmail = email || process.env.REPORT_EMAIL_TO;
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid recipient email address required.' });
    }

    const result = await globalSystemConfig.sendReport(
      targetEmail,
      reportId || 'LATEST-INCIDENT-PLAN',
      reportSummary || 'Automated coordinated multi-agent disaster response directive.'
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 17. GET /api/config/system (Retrieves safe system & comms config without secrets)
app.get('/api/config/system', (req, res) => {
  try {
    const config = globalSystemConfig.getSafeConfig();
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 18. POST /api/config/system (Updates SMTP and communication settings in environment storage)
app.post('/api/config/system', async (req, res) => {
  try {
    const updatedConfig = await globalSystemConfig.updateConfig(req.body);
    res.json({ 
      success: true, 
      message: 'System configuration saved successfully to environment storage.',
      data: updatedConfig 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 19. POST /api/config/smtp/test (Tests SMTP handshake safely without exposing credentials)
app.post('/api/config/smtp/test', async (req, res) => {
  try {
    const { testRecipient } = req.body;
    const result = await globalSystemConfig.testSmtpConnection(testRecipient);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 20. POST /api/config/communication/test (Tests communication channel and webhook dispatch)
app.post('/api/config/communication/test', async (req, res) => {
  try {
    const result = await globalSystemConfig.testCommunicationDispatch();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// =========================================================================
// Aliases for legacy & UI consistency
// =========================================================================
app.get('/api/simulation/state', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    res.json({ success: true, data: state });
  } catch (error: any) {
    console.error('Error in /api/simulation/state:', error);
    try {
      const fallbackState = globalExecutionEngine.resetSimulation();
      res.json({ success: true, data: fallbackState });
    } catch (fallbackError: any) {
      res.status(500).json({ success: false, error: error?.message || 'Server error' });
    }
  }
});

app.post('/api/simulation/reset', (req, res) => {
  try {
    const state = globalExecutionEngine.resetSimulation();
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/simulation/inject-emergency', (req, res) => {
  try {
    const state = globalExecutionEngine.injectDamFailure();
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/agents/run-all', async (req, res) => {
  try {
    const state = await globalExecutionEngine.runFullResponse();
    res.json({ success: true, data: state });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  try {
    const state = globalExecutionEngine.getState();
    const scarcity = ResourceManager.getScarcityReport(state.resources);
    const geminiActive = isGeminiConfigured();

    res.json({
      success: true,
      data: {
        status: 'HEALTHY',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        geminiConfigured: geminiActive,
        activeMode: geminiActive ? 'AI_GEMINI' : 'SIMULATION_FALLBACK',
        agentStatuses: state.agentStatuses,
        activeEmergency: state.activeEmergencyId,
        scarcity,
        totalMessages: state.messages.length,
        totalLogs: state.logs.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mount Vite middleware in development or static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, '..', 'frontend', 'vite.config.ts'),
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, '..', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, '..', 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[RESQ-MIND] Operational command server active on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('[RESQ-MIND Server Startup Error]', err);
});
