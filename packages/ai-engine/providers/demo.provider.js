/**
 * @fileoverview Demo provider — deterministic, pre-scripted AI responses.
 * This is the PRIMARY provider for the hackathon MVP.
 *
 * All agent responses are vetted, fast, and reproducible.
 * No external dependencies required.
 */

import { BaseProvider } from './base.provider.js';
import { AGENT_TYPES, AGENT_PROFILES } from '@aios/shared/constants';

/**
 * Pre-scripted demo scenarios.
 * Each scenario maps trigger keywords to agent-specific responses.
 */
const DEMO_RESPONSES = {
  // ── SEC-001: Security Threat Analysis ─────────────────────
  security_threat: {
    triggers: ['security', 'access log', 'threat', 'attack', 'breach', 'suspicious', 'anomal'],
    responses: {
      [AGENT_TYPES.SECURITY]: {
        content: `⚠️ ALERT: 3 anomalies detected in access log.

• Unusual login from IP 203.0.113.42 at 03:14 UTC (outside business hours)
• Privilege escalation attempt on /admin/config endpoint
• 47 failed authentication attempts from single source in 12 minutes

Threat Level: HIGH
Recommendation: Immediate session termination and IP block.`,
        metadata: { threatLevel: 'high', anomaliesFound: 3, confidence: 0.94 },
      },
      [AGENT_TYPES.GOVERNANCE]: {
        content: `Compliance Check Complete:

• SOC 2 Section CC6.1: Access control violation detected
• GDPR Article 32: Security of processing may be compromised
• HIPAA §164.312: Electronic access controls potentially breached
• Remediation required within 24 hours per incident response SLA

Audit Reference: AUD-2026-05-16-0042`,
        metadata: { frameworks: ['SOC2', 'GDPR', 'HIPAA'], auditRef: 'AUD-2026-05-16-0042' },
      },
      [AGENT_TYPES.INTELLIGENCE]: {
        content: `Pattern Analysis:

• IP 203.0.113.42 maps to a known proxy network (confidence: 87%)
• Attack signature matches credential stuffing pattern MITRE ATT&CK T1110.004
• Similar pattern observed in 3 other enterprise incidents this quarter
• Geographic anomaly: Source traces to unrecognized ASN

Risk Score: 8.4/10`,
        metadata: { riskScore: 8.4, mitreId: 'T1110.004', confidence: 0.87 },
      },
      [AGENT_TYPES.WORKFLOW]: {
        content: `Remediation Plan Generated:

1. ✅ Immediate: Block IP 203.0.113.42 at firewall level
2. ✅ Short-term: Force password reset for affected accounts
3. ✅ Medium-term: Implement adaptive MFA for admin endpoints
4. 📋 Documentation: Incident report auto-generated (IR-2026-0042)

Estimated resolution time: 2 hours
Priority: CRITICAL`,
        metadata: { steps: 4, estimatedTime: '2h', incidentRef: 'IR-2026-0042' },
      },
    },
  },

  // ── DATA-001: Data Analysis ───────────────────────────────
  data_analysis: {
    triggers: ['analyze data', 'report', 'metrics', 'dashboard', 'trends', 'forecast'],
    responses: {
      [AGENT_TYPES.INTELLIGENCE]: {
        content: `Data Analysis Complete:

📊 Key Findings:
• Revenue trend: +12.3% QoQ growth across 3 business units
• Anomaly detected: Marketing spend increased 340% with only 8% conversion uplift
• Customer churn risk: 847 accounts flagged (confidence: 91%)
• Forecast: Q3 pipeline suggests 18% below target

Recommendation: Prioritize retention over acquisition this quarter.`,
        metadata: { dataPoints: 12847, confidence: 0.91 },
      },
      [AGENT_TYPES.WORKFLOW]: {
        content: `Action Plan:

1. 📊 Generate detailed churn risk report for CS team
2. 📧 Auto-draft retention campaign targeting 847 at-risk accounts
3. 💰 Flag marketing ROI anomaly for finance review
4. 📅 Schedule quarterly business review with updated forecasts

Timeline: All actions queued for execution within 24 hours.`,
        metadata: { actions: 4, timeline: '24h' },
      },
      [AGENT_TYPES.GOVERNANCE]: {
        content: `Data Governance Check:

• Data sources verified: 4/4 authenticated
• PII handling: Compliant — all personal data masked in analysis
• Data retention: Within 90-day policy window
• Access audit: 3 analysts accessed this dataset (all authorized)

Compliance Status: ✅ PASSED`,
        metadata: { sourcesVerified: 4, complianceStatus: 'passed' },
      },
    },
  },

  // ── CODE-001: Code Generation ─────────────────────────────
  code_generation: {
    triggers: ['generate code', 'build', 'script', 'implement', 'function', 'api'],
    responses: {
      [AGENT_TYPES.CODE]: {
        content: `Implementation Ready:

\`\`\`javascript
/**
 * Enterprise-grade rate limiter with sliding window.
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Window duration in milliseconds
 */
export function createRateLimiter(maxRequests = 100, windowMs = 60000) {
  const windows = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!windows.has(key)) windows.set(key, []);
    const hits = windows.get(key).filter(t => t > windowStart);
    hits.push(now);
    windows.set(key, hits);

    if (hits.length > maxRequests) {
      return res.status(429).json({ error: 'Rate limited' });
    }
    next();
  };
}
\`\`\`

Security review: ✅ No injection vectors. Memory-safe with automatic cleanup.`,
        metadata: { language: 'javascript', linesOfCode: 22, securityReview: 'passed' },
      },
      [AGENT_TYPES.SECURITY]: {
        content: `Security Review of Generated Code:

✅ No SQL injection vectors
✅ No XSS vulnerabilities
✅ Input validation present
⚠️ Note: Map-based storage — ensure periodic cleanup for memory safety in production

Verdict: APPROVED for staging deployment.`,
        metadata: { verdict: 'approved', issues: 0, warnings: 1 },
      },
    },
  },

  // ── GOV-001: Compliance Check ─────────────────────────────
  compliance_check: {
    triggers: ['compliance', 'audit', 'regulation', 'policy', 'governance', 'gdpr', 'soc'],
    responses: {
      [AGENT_TYPES.GOVERNANCE]: {
        content: `Comprehensive Compliance Audit:

📋 SOC 2 Type II:
• CC6.1 Logical Access: ⚠️ 2 findings (elevated privileges)
• CC6.2 System Operations: ✅ Compliant
• CC7.2 Monitoring: ✅ Compliant
• CC8.1 Change Management: ⚠️ 1 finding (undocumented change)

📋 GDPR:
• Article 5 (Data Principles): ✅ Compliant
• Article 32 (Security): ✅ Compliant
• Article 35 (Impact Assessment): ⚠️ Due for renewal

Overall Score: 87/100 — CONDITIONALLY COMPLIANT
Remediation deadline: 14 business days`,
        metadata: { score: 87, findings: 3, deadline: '14 days' },
      },
      [AGENT_TYPES.SECURITY]: {
        content: `Security Posture Assessment:

🔒 Access Controls:
• Multi-factor authentication: Enabled (94% adoption)
• Privileged access management: 2 accounts need review
• Session management: Compliant

🛡️ Infrastructure:
• Encryption at rest: Enabled (AES-256)
• Network segmentation: Verified
• Vulnerability scan: 0 critical, 3 medium findings

Recommendation: Address the 2 privileged access findings within 48 hours.`,
        metadata: { mfaAdoption: 0.94, criticalFindings: 0 },
      },
    },
  },

  // ── MULTI-001: Full Coordination ──────────────────────────
  full_coordination: {
    triggers: ['coordinate', 'plan', 'workflow', 'orchestrate', 'help', 'what can you do'],
    responses: {
      [AGENT_TYPES.SECURITY]: {
        content: `🛡️ Security Status: All systems nominal.

• Active monitoring: 24/7 threat detection enabled
• Last scan: 0 critical vulnerabilities
• Agent permissions: All within authorized bounds
• Audit trail: 847 events logged today`,
        metadata: { status: 'nominal', events: 847 },
      },
      [AGENT_TYPES.GOVERNANCE]: {
        content: `📋 Governance Dashboard:

• Compliance score: 87/100
• Upcoming audits: SOC 2 renewal (T-30 days)
• Policy updates: 2 pending review
• Data retention: All within policy windows`,
        metadata: { complianceScore: 87 },
      },
      [AGENT_TYPES.INTELLIGENCE]: {
        content: `🔍 Intelligence Brief:

• Threat landscape: Moderate risk level
• Industry alerts: 3 relevant CVEs published this week
• Trend analysis: 15% increase in credential-based attacks
• Recommendation: Review authentication policies`,
        metadata: { riskLevel: 'moderate', cves: 3 },
      },
      [AGENT_TYPES.WORKFLOW]: {
        content: `⚙️ Operational Summary:

• Pending tasks: 7 (3 high priority)
• Agent utilization: 62% average
• System uptime: 99.97% (30-day)
• Next scheduled: Quarterly security review (T-5 days)

All agents coordinated and ready for tasking.`,
        metadata: { pendingTasks: 7, uptime: 99.97 },
      },
      [AGENT_TYPES.CODE]: {
        content: `💻 Development Status:

• Code quality score: 94/100
• Open PRs: 3 (all reviewed)
• Test coverage: 78% (+2% from last week)
• Dependency vulnerabilities: 0 critical, 1 low

Ready to generate, review, or refactor code on demand.`,
        metadata: { qualityScore: 94, coverage: 78 },
      },
    },
  },
};


export class DemoProvider extends BaseProvider {
  constructor() {
    super('demo');
  }

  async isAvailable() {
    return true; // Always available
  }

  async complete(prompt) {
    // Simple echo for generic completions
    await this._simulateDelay();
    return {
      content: `[Demo Mode] Processed: "${prompt.slice(0, 100)}"`,
      provider: 'demo',
      metadata: { demoMode: true },
    };
  }

  /**
   * Generate agent-specific demo response by matching input against scenarios.
   * @param {string} agentType
   * @param {string} input
   * @returns {Promise<{ content: string, agentType: string, metadata: object }>}
   */
  async agentResponse(agentType, input) {
    await this._simulateDelay();

    const scenario = this._matchScenario(input);

    if (scenario?.responses[agentType]) {
      const response = scenario.responses[agentType];
      return {
        content: response.content,
        agentType,
        metadata: { ...response.metadata, provider: 'demo', demoMode: true },
      };
    }

    // Fallback: personality-driven generic response
    const profile = AGENT_PROFILES[agentType];
    return {
      content: `${profile.emoji} ${profile.name}: I've analyzed your request. Based on my ${profile.personality.toLowerCase()}, I recommend a thorough review of the relevant systems and processes. Full analysis available on request.`,
      agentType,
      metadata: { provider: 'demo', demoMode: true, fallback: true },
    };
  }

  /**
   * Get all agents that should respond to a given input.
   * @param {string} input
   * @returns {string[]} Array of agent types
   */
  getRespondingAgents(input) {
    const scenario = this._matchScenario(input);
    if (scenario) {
      return Object.keys(scenario.responses);
    }
    // Default: all agents respond for full coordination
    return Object.values(AGENT_TYPES);
  }

  /**
   * Match user input against demo scenarios via fuzzy keyword matching.
   * @param {string} input
   * @returns {Object|null}
   * @private
   */
  _matchScenario(input) {
    const lower = input.toLowerCase();

    let bestMatch = null;
    let bestScore = 0;

    for (const scenario of Object.values(DEMO_RESPONSES)) {
      const score = scenario.triggers.reduce((acc, trigger) => {
        return acc + (lower.includes(trigger) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = scenario;
      }
    }

    return bestScore > 0 ? bestMatch : null;
  }

  /**
   * Simulate realistic AI processing delay.
   * @private
   */
  async _simulateDelay() {
    const delay = 200 + Math.random() * 600; // 200-800ms
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
