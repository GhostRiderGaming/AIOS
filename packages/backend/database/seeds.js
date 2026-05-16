/**
 * @fileoverview Demo seed data for presentations.
 */

import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { execute, queryOne } from '../config/database.js';
import {
  BCRYPT_ROUNDS,
  AGENT_TYPES,
  PERMISSIONS,
  AUDIT_EVENTS,
} from '@aios/shared/constants';

/**
 * Seed all demo data.
 */
export function seedDemoData() {
  const passwordHash = bcryptjs.hashSync('demo1234', BCRYPT_ROUNDS);

  // ── Demo Users ──────────────────────────────────────────
  const users = [
    ['admin@aios.local', passwordHash, 'AIOS Admin', 'admin'],
    ['analyst@aios.local', passwordHash, 'Security Analyst', 'analyst'],
    ['demo@aios.local', passwordHash, 'Demo User', 'viewer'],
  ];

  for (const [email, hash, name, role] of users) {
    const existing = queryOne('SELECT id FROM users WHERE email = ?', email);
    if (!existing) {
      execute(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        email, hash, name, role,
      );
    }
  }

  // ── Agent Permissions ───────────────────────────────────
  const perms = [
    [AGENT_TYPES.SECURITY, PERMISSIONS.FILE_READ, 1],
    [AGENT_TYPES.SECURITY, PERMISSIONS.FILE_WRITE, 0],
    [AGENT_TYPES.SECURITY, PERMISSIONS.DB_READ, 1],
    [AGENT_TYPES.SECURITY, PERMISSIONS.DB_WRITE, 0],
    [AGENT_TYPES.SECURITY, PERMISSIONS.NETWORK_REQUEST, 1],
    [AGENT_TYPES.GOVERNANCE, PERMISSIONS.FILE_READ, 1],
    [AGENT_TYPES.GOVERNANCE, PERMISSIONS.DB_READ, 1],
    [AGENT_TYPES.GOVERNANCE, PERMISSIONS.NETWORK_REQUEST, 0],
    [AGENT_TYPES.INTELLIGENCE, PERMISSIONS.FILE_READ, 1],
    [AGENT_TYPES.INTELLIGENCE, PERMISSIONS.DB_READ, 1],
    [AGENT_TYPES.INTELLIGENCE, PERMISSIONS.NETWORK_REQUEST, 1],
    [AGENT_TYPES.WORKFLOW, PERMISSIONS.FILE_READ, 1],
    [AGENT_TYPES.WORKFLOW, PERMISSIONS.FILE_WRITE, 1],
    [AGENT_TYPES.WORKFLOW, PERMISSIONS.DB_READ, 1],
    [AGENT_TYPES.WORKFLOW, PERMISSIONS.DB_WRITE, 1],
    [AGENT_TYPES.CODE, PERMISSIONS.FILE_READ, 1],
    [AGENT_TYPES.CODE, PERMISSIONS.FILE_WRITE, 0],
    [AGENT_TYPES.CODE, PERMISSIONS.CODE_EXECUTE, 1],
    [AGENT_TYPES.CODE, PERMISSIONS.DB_READ, 1],
  ];

  for (const [agentType, permission, allowed] of perms) {
    const existing = queryOne(
      'SELECT id FROM agent_permissions WHERE agent_type = ? AND permission = ?',
      agentType, permission,
    );
    if (!existing) {
      execute(
        'INSERT INTO agent_permissions (agent_type, permission, allowed) VALUES (?, ?, ?)',
        agentType, permission, allowed,
      );
    }
  }

  // ── Sample Audit Logs ───────────────────────────────────
  const audits = [
    [AUDIT_EVENTS.AGENT_ACTIVATED, AGENT_TYPES.SECURITY, 1, 'Threat scan initiated', '{"trigger":"access_log_upload"}', 'success', 'low'],
    [AUDIT_EVENTS.PERMISSION_DENIED, AGENT_TYPES.CODE, 1, 'File write blocked', '{"path":"/etc/config","reason":"Code Architect lacks file:write permission"}', 'blocked', 'high'],
    [AUDIT_EVENTS.GUARDRAIL_TRIGGERED, AGENT_TYPES.SECURITY, 1, 'PII detected in output', '{"type":"email_address","redacted":true}', 'filtered', 'medium'],
    [AUDIT_EVENTS.AGENT_COMPLETED, AGENT_TYPES.GOVERNANCE, 1, 'Compliance check passed', '{"framework":"SOC2","sections":["CC6.1","CC7.2"]}', 'success', 'low'],
    [AUDIT_EVENTS.INFERENCE_COMPLETE, AGENT_TYPES.INTELLIGENCE, 1, 'Pattern analysis completed', '{"patterns_found":3,"confidence":0.87}', 'success', 'low'],
    [AUDIT_EVENTS.AGENT_ACTIVATED, AGENT_TYPES.WORKFLOW, 1, 'Remediation plan generated', '{"steps":4,"estimated_time":"2h"}', 'success', 'low'],
    [AUDIT_EVENTS.PERMISSION_GRANTED, AGENT_TYPES.SECURITY, 1, 'Network access approved', '{"target":"threat_intel_db"}', 'success', 'low'],
    [AUDIT_EVENTS.AGENT_ERROR, AGENT_TYPES.INTELLIGENCE, 1, 'External correlation timeout', '{"service":"mitre_att_ck","timeout_ms":5000}', 'error', 'medium'],
  ];

  for (const [eventType, agentType, userId, action, details, result, riskLevel] of audits) {
    execute(
      'INSERT INTO audit_logs (event_type, agent_type, user_id, action, details, result, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      eventType, agentType, userId, action, details, result, riskLevel,
    );
  }

  // ── Security Alerts ─────────────────────────────────────
  const alerts = [
    ['critical', 'Brute Force Detected', '47 failed auth attempts from IP 203.0.113.42 in 12 minutes', AGENT_TYPES.SECURITY, 0],
    ['high', 'Privilege Escalation Attempt', 'Unauthorized access to /admin/config endpoint', AGENT_TYPES.SECURITY, 0],
    ['medium', 'Agent Permission Violation', 'Code Architect attempted file:write without authorization', AGENT_TYPES.CODE, 1],
    ['high', 'Anomalous Login Pattern', 'Login from new geography during non-business hours', AGENT_TYPES.INTELLIGENCE, 0],
    ['low', 'Compliance Check Scheduled', 'Quarterly SOC 2 audit review initiated', AGENT_TYPES.GOVERNANCE, 0],
  ];

  for (const [severity, title, description, agentType, resolved] of alerts) {
    execute(
      'INSERT INTO security_alerts (severity, title, description, agent_type, resolved) VALUES (?, ?, ?, ?, ?)',
      severity, title, description, agentType, resolved,
    );
  }

  // ── Demo Conversation ───────────────────────────────────
  const convId = uuidv4();
  execute(
    'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)',
    convId, 3, 'Security Threat Analysis',
  );

  const msgs = [
    ['user', null, 'Analyze this enterprise access log for security anomalies'],
    ['system', null, 'Orchestrator: Task decomposed into 4 subtasks. Dispatching to 🛡️ Security Sentinel, 📋 Governance Auditor, 🔍 Intelligence Analyst, ⚙️ Workflow Coordinator.'],
    ['agent', AGENT_TYPES.SECURITY, '⚠️ ALERT: 3 anomalies detected in access log.\n- Unusual login from IP 203.0.113.42 at 03:14 UTC (outside business hours)\n- Privilege escalation attempt on /admin/config endpoint\n- 47 failed authentication attempts from single source in 12 minutes\nThreat Level: HIGH. Recommend immediate session termination and IP block.'],
    ['agent', AGENT_TYPES.GOVERNANCE, 'Compliance Check Complete:\n- SOC 2 Section CC6.1: Access control violation detected\n- GDPR Article 32: Security of processing may be compromised\n- Remediation required within 24 hours per incident response SLA\nAudit Reference: AUD-2026-05-16-0042'],
    ['agent', AGENT_TYPES.INTELLIGENCE, 'Pattern Analysis:\n- IP 203.0.113.42 maps to a known proxy network (confidence: 87%)\n- Attack signature matches credential stuffing pattern MITRE ATT&CK T1110.004\n- Similar pattern observed in 3 other enterprise incidents this quarter\nRisk Score: 8.4/10'],
    ['agent', AGENT_TYPES.WORKFLOW, 'Remediation Plan Generated:\n1. ✅ Immediate: Block IP 203.0.113.42 at firewall level\n2. ✅ Short-term: Force password reset for affected accounts\n3. ✅ Medium-term: Implement adaptive MFA for admin endpoints\n4. 📋 Documentation: Incident report auto-generated (IR-2026-0042)\nEstimated resolution time: 2 hours'],
  ];

  for (const [role, agentType, content] of msgs) {
    execute(
      'INSERT INTO messages (conversation_id, role, agent_type, content) VALUES (?, ?, ?, ?)',
      convId, role, agentType, content,
    );
  }
}
