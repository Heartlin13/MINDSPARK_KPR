import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Radio, 
  Key, 
  Server, 
  Send, 
  RefreshCw, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Eye, 
  EyeOff, 
  Wifi, 
  Zap, 
  Clock, 
  Sliders, 
  HelpCircle,
  Cpu
} from 'lucide-react';
import { 
  SystemConfigSafe, 
  UpdateConfigPayload, 
  TestConnectionResult 
} from '../types/disaster';

interface ConfigurationViewProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ onNotify }) => {
  const [config, setConfig] = useState<SystemConfigSafe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Editable Form States
  // SMTP
  const [host, setHost] = useState<string>('');
  const [port, setPort] = useState<number>(587);
  const [secure, setSecure] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fromName, setFromName] = useState<string>('');
  const [fromEmail, setFromEmail] = useState<string>('');
  const [defaultRecipient, setDefaultRecipient] = useState<string>('');
  const [testRecipient, setTestRecipient] = useState<string>('');

  // Communication
  const [broadcastChannel, setBroadcastChannel] = useState<string>('VHF_CH9_AND_SATELLITE');
  const [autoDispatchCritical, setAutoDispatchCritical] = useState<boolean>(true);
  const [alertWebhookUrl, setAlertWebhookUrl] = useState<string>('');
  const [webhookSecret, setWebhookSecret] = useState<string>('');
  const [showWebhookSecret, setShowWebhookSecret] = useState<boolean>(false);
  const [retryLimit, setRetryLimit] = useState<number>(3);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(15);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(false);
  const [logLevel, setLogLevel] = useState<'DEBUG' | 'INFO' | 'WARN' | 'ERROR'>('INFO');

  // Test Connection States
  const [testingSmtp, setTestingSmtp] = useState<boolean>(false);
  const [smtpTestResult, setSmtpTestResult] = useState<TestConnectionResult | null>(null);

  const [testingComm, setTestingComm] = useState<boolean>(false);
  const [commTestResult, setCommTestResult] = useState<TestConnectionResult | null>(null);

  // Fetch Safe Config from Server
  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config/system');
      const json = await res.json();
      if (json.success && json.data) {
        const d: SystemConfigSafe = json.data;
        setConfig(d);

        // Populate fields
        setHost(d.smtp.host);
        setPort(d.smtp.port);
        setSecure(d.smtp.secure);
        setUsername(d.smtp.username);
        setPassword(''); // Always empty client-side; secret never revealed
        setFromName(d.smtp.fromName);
        setFromEmail(d.smtp.fromEmail);
        setDefaultRecipient(d.smtp.defaultRecipient);
        setTestRecipient(d.smtp.defaultRecipient);

        setBroadcastChannel(d.communication.broadcastChannel);
        setAutoDispatchCritical(d.communication.autoDispatchCritical);
        setAlertWebhookUrl(d.communication.alertWebhookUrl);
        setWebhookSecret(''); // Secret never revealed to client
        setRetryLimit(d.communication.retryLimit);
        setTimeoutSeconds(d.communication.timeoutSeconds);
        setQuietHoursEnabled(d.communication.quietHoursEnabled);
        setLogLevel(d.communication.logLevel);
      }
    } catch (err: any) {
      console.error('Failed to load system config:', err);
      setSaveStatus({ message: 'Failed to retrieve configuration from server.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save Configuration to Server
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    const payload: UpdateConfigPayload = {
      smtp: {
        host,
        port: Number(port),
        secure,
        username,
        fromName,
        fromEmail,
        defaultRecipient,
        ...(password.trim() ? { password: password.trim() } : {}),
      },
      communication: {
        broadcastChannel,
        autoDispatchCritical,
        alertWebhookUrl,
        retryLimit: Number(retryLimit),
        timeoutSeconds: Number(timeoutSeconds),
        quietHoursEnabled,
        logLevel,
        ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
      },
    };

    try {
      const res = await fetch('/api/config/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setConfig(json.data);
        setPassword('');
        setWebhookSecret('');
        setSaveStatus({
          message: 'Configuration successfully committed to environment-variable storage.',
          type: 'success',
        });
        if (onNotify) onNotify('Configuration updated successfully.', 'success');
      } else {
        throw new Error(json.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setSaveStatus({
        message: `Save failed: ${err.message}`,
        type: 'error',
      });
      if (onNotify) onNotify(`Save failed: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Test SMTP Connection
  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch('/api/config/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testRecipient }),
      });
      const json = await res.json();
      if (json.data) {
        setSmtpTestResult(json.data);
      } else {
        setSmtpTestResult({
          success: false,
          latencyMs: 0,
          service: 'SMTP_RELAY',
          message: json.error || 'Unexpected error testing SMTP transport.',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        latencyMs: 0,
        service: 'SMTP_RELAY',
        message: `Network error: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  // Test Communication Webhook / Channel
  const handleTestCommunication = async () => {
    setTestingComm(true);
    setCommTestResult(null);

    try {
      const res = await fetch('/api/config/communication/test', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.data) {
        setCommTestResult(json.data);
      } else {
        setCommTestResult({
          success: false,
          latencyMs: 0,
          service: 'COMMUNICATION_DISPATCH',
          message: json.error || 'Unexpected error testing communications channel.',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setCommTestResult({
        success: false,
        latencyMs: 0,
        service: 'COMMUNICATION_DISPATCH',
        message: `Network error: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTestingComm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex items-center space-x-3 text-cyan-400 font-mono text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Synchronizing environment storage configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & METADATA BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                TACTICAL INFRASTRUCTURE SETTINGS
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">Environment-Variable Storage</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center space-x-2.5">
              <span>System Communications & SMTP Relay Config</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Securely configure emergency dispatch channels, SMTP notification relays, and crisis webhook endpoints.
              All secret credentials remain strictly isolated in server-side environment variables and are never exposed to browser bundles.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={() => fetchConfig()}
              disabled={isLoading || isSaving}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-semibold transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Reload Env</span>
            </button>
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/40 uppercase tracking-wider transition active:scale-95 flex items-center space-x-2"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Saving to Env...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Storage Backend</span>
            <div className="flex items-center space-x-1.5 mt-1 text-cyan-300 font-bold">
              <Server className="w-3.5 h-3.5" />
              <span>process.env & .env</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Secret Isolation</span>
            <div className="flex items-center space-x-1.5 mt-1 text-emerald-300 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero Client Exposure</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">SMTP Auth State</span>
            <div className="flex items-center space-x-1.5 mt-1 font-bold">
              {config?.smtp.isPasswordSet ? (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Password Configured</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>No Password Set</span>
                </span>
              )}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Last Synchronized</span>
            <div className="flex items-center space-x-1.5 mt-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{new Date(config?.lastUpdated || Date.now()).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Notification Toast/Banner */}
      {saveStatus && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-start space-x-3 transition-all ${
            saveStatus.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-200'
              : 'bg-red-950/70 border-red-700/80 text-red-200'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-sans text-xs">
            <p className="font-bold">{saveStatus.message}</p>
          </div>
          <button
            onClick={() => setSaveStatus(null)}
            className="text-slate-400 hover:text-white text-xs font-mono ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. MAIN CONFIGURATION FORMS (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: SMTP RELAY SETTINGS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider font-mono">
                  SMTP Relay & Action Plan Email Dispatch
                </h2>
                <p className="text-[11px] text-slate-400">
                  Configure the outbound mail transport for automatic Incident Action Plan dispatches.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
            {/* Host & Port */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="e.g. smtp.example.com or smtp.gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 px-3 py-2 rounded-xl transition"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="587"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 px-3 py-2 rounded-xl transition"
                />
              </div>
            </div>

            {/* TLS / SSL Security Option */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-200 block">Require Secure TLS/SSL Transport</span>
                <span className="text-[10px] text-slate-400">Enable for port 465 (SMTPS) or direct TLS handshakes</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={secure}
                  onChange={(e) => setSecure(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* Username */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                SMTP Auth Username / Identity
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ops-relay@resq-mind.gov"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 px-3 py-2 rounded-xl transition"
              />
            </div>

            {/* Password (Secret - Write-only) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>SMTP Auth Password / App Password</span>
                </label>
                {config?.smtp.isPasswordSet && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                    Existing Password Stored
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    config?.smtp.isPasswordSet
                      ? '•••••••• (Leave blank to keep existing password)'
                      : 'Enter SMTP server authentication password'
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 px-3 py-2 pr-10 rounded-xl transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Secured via write-only environment persistence. Value is written directly to server process environment and never returned to the browser.
              </p>
            </div>

            {/* Sender Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Sender From Name
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="RESQ-MIND Tactical Command"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 px-3 py-2 rounded-xl transition"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Sender From Address
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="alerts@resq-mind.gov"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 px-3 py-2 rounded-xl transition"
                />
              </div>
            </div>

            {/* Default Operational Recipient */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Default Incident Commander Recipient Email
              </label>
              <input
                type="email"
                value={defaultRecipient}
                onChange={(e) => setDefaultRecipient(e.target.value)}
                placeholder="incident.commander@disaster.gov"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 px-3 py-2 rounded-xl transition"
              />
            </div>

            {/* Test Connection Sub-Panel */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                Transport Verification & Handshake Test
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="Recipient for test ping (optional)"
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp}
                  className="px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Send className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-spin' : ''}`} />
                  <span>{testingSmtp ? 'Testing...' : 'Test SMTP'}</span>
                </button>
              </div>

              {smtpTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    smtpTestResult.success
                      ? 'bg-emerald-950/60 border-emerald-700/70 text-emerald-200'
                      : 'bg-amber-950/60 border-amber-700/70 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      {smtpTestResult.success ? '✓ Handshake Verified' : '⚠ Verification Notice'}
                    </span>
                    <span className="text-[10px] font-mono opacity-80">
                      {smtpTestResult.latencyMs}ms latency
                    </span>
                  </div>
                  <p className="font-sans leading-relaxed">{smtpTestResult.message}</p>
                  {smtpTestResult.details?.warning && (
                    <p className="mt-1 text-[11px] text-amber-300 font-sans italic">
                      Note: {smtpTestResult.details.warning}
                    </p>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: COMMUNICATION & WEBHOOK SETTINGS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider font-mono">
                  Tactical Communication & Crisis Webhooks
                </h2>
                <p className="text-[11px] text-slate-400">
                  Manage civil defense broadcasting links, radio channels, and incident webhooks.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
            {/* Crisis Broadcast Channel */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Primary Crisis Broadcast Channel
              </label>
              <select
                value={broadcastChannel}
                onChange={(e) => setBroadcastChannel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 px-3 py-2 rounded-xl transition"
              >
                <option value="VHF_CH9_AND_SATELLITE">VHF Channel 9 & Satellite Relay (Default Tactical)</option>
                <option value="CIVIL_DEFENSE_CELL_BROADCAST">Civil Defense Cell Broadcast (WEA / EU-Alert)</option>
                <option value="REGIONAL_EOC_WEBHOOK">Regional Emergency Operations Center (EOC API)</option>
                <option value="HF_EMERGENCY_RADIO_NET">HF Emergency Inter-Agency Radio Net (Disaster Fallback)</option>
                <option value="STARLINK_TACTICAL_DATA">Starlink Tactical Data Mesh (High-Bandwidth)</option>
              </select>
            </div>

            {/* Auto Dispatch Critical Alerts */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-200 block">Auto-Dispatch Critical Alerts</span>
                <span className="text-[10px] text-slate-400">
                  Automatically broadcast messages whenever CRITICAL/DANGER severity is committed
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDispatchCritical}
                  onChange={(e) => setAutoDispatchCritical(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Alert Webhook URL */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                Emergency Integration Webhook Endpoint URL
              </label>
              <input
                type="url"
                value={alertWebhookUrl}
                onChange={(e) => setAlertWebhookUrl(e.target.value)}
                placeholder="https://emergency-dispatch.local/webhook"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 px-3 py-2 rounded-xl transition"
              />
            </div>

            {/* Webhook Secret Token (Secret - Write-only) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 font-semibold flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Webhook Authentication Token / Signature Secret</span>
                </label>
                {config?.communication.isWebhookSecretSet && (
                  <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                    Secret Active
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder={
                    config?.communication.isWebhookSecretSet
                      ? '•••••••• (Leave blank to keep existing secret)'
                      : 'Enter secret token for HMAC payload signing'
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 px-3 py-2 pr-10 rounded-xl transition"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Server-side environment variable `COMM_WEBHOOK_SECRET`. Never bundled into client artifacts.
              </p>
            </div>

            {/* Retry Policy & Timeout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Dispatch Retries
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={retryLimit}
                  onChange={(e) => setRetryLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 px-3 py-2 rounded-xl transition"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Timeout (Seconds)
                </label>
                <input
                  type="number"
                  min="3"
                  max="120"
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 px-3 py-2 rounded-xl transition"
                />
              </div>
            </div>

            {/* Quiet Hours & Log Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">Quiet Hours Filter</span>
                  <span className="text-[10px] text-slate-400">Suppress non-critical info</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quietHoursEnabled}
                    onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Diagnostic Log Level
                </label>
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-200 px-3 py-2 rounded-xl transition"
                >
                  <option value="DEBUG">DEBUG (All Packet Logs)</option>
                  <option value="INFO">INFO (Normal Operations)</option>
                  <option value="WARN">WARN (Degraded Comms Only)</option>
                  <option value="ERROR">ERROR (Severe Outages Only)</option>
                </select>
              </div>
            </div>

            {/* Test Communication Channel Button */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">
                  Channel & Webhook Endpoint Ping
                </span>
                <button
                  type="button"
                  onClick={handleTestCommunication}
                  disabled={testingComm}
                  className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-700/60 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Wifi className={`w-3.5 h-3.5 ${testingComm ? 'animate-spin' : ''}`} />
                  <span>{testingComm ? 'Testing...' : 'Test Webhook & Channel'}</span>
                </button>
              </div>

              {commTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    commTestResult.success
                      ? 'bg-emerald-950/60 border-emerald-700/70 text-emerald-200'
                      : 'bg-red-950/60 border-red-700/70 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      {commTestResult.success ? '✓ Dispatch Route Active' : '✕ Route Unreachable'}
                    </span>
                    <span className="text-[10px] font-mono opacity-80">
                      {commTestResult.latencyMs}ms response
                    </span>
                  </div>
                  <p className="font-sans leading-relaxed">{commTestResult.message}</p>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 3. SECURITY & ENVIRONMENT-VARIABLE STORAGE ARCHITECTURE CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
            Environment-Variable Isolation & Zero-Leaked Secrets Protocol
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] uppercase text-cyan-400 font-bold block mb-1">
              1. Sanitized Client Queries
            </span>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              When querying <span className="font-mono text-cyan-300">GET /api/config/system</span>, sensitive fields like passwords and webhook tokens are strictly omitted and replaced with boolean verification flags (<span className="font-mono text-emerald-400">isPasswordSet</span>).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] uppercase text-amber-400 font-bold block mb-1">
              2. Write-Only Secret Commits
            </span>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              New credentials submitted via <span className="font-mono text-amber-300">POST /api/config/system</span> are written directly to <span className="font-mono text-slate-200">process.env</span> and synced to <span className="font-mono text-slate-200">.env</span> on disk without overwriting other keys like <span className="font-mono text-purple-300">GEMINI_API_KEY</span>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] uppercase text-emerald-400 font-bold block mb-1">
              3. Server-Bound Execution
            </span>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              The <span className="font-mono text-emerald-300">nodemailer</span> transport runs exclusively on the Node.js backend proxy. Network handshakes and email transmissions never occur directly from client web workers or the DOM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
