/**
 * @fileoverview Correlation Engine Tool — Cross-agent data correlation for IntelligenceAgent.
 * Aggregates structured findings from all prior agents into a unified risk assessment.
 */

/**
 * Risk weight matrix — how each data point contributes to overall risk.
 */
const RISK_WEIGHTS = {
  scanRiskScore: 0.30,       // Weight of security scan risk score
  maliciousIPs: 0.15,        // Weight of malicious IP findings
  criticalFindings: 0.20,    // Weight of critical-severity findings
  complianceFails: 0.20,     // Weight of compliance failures
  codeVulnerabilities: 0.15, // Weight of code security issues
};

/**
 * Correlate structured findings from all pipeline agents into a unified assessment.
 * @param {Array} pipelineContext — results from prior agents with metadata
 * @returns {{ risk: Object, correlations: Array, timeline: Object, summary: Object }}
 */
export function correlateFindings(pipelineContext) {
  const data = extractAllFindings(pipelineContext);
  const correlations = findCorrelations(data);
  const risk = calculateAggregateRisk(data);
  const timeline = buildTimeline(pipelineContext);

  return {
    risk,
    correlations,
    timeline,
    summary: {
      agentsAnalyzed: pipelineContext.length,
      totalDataPoints: data.dataPoints,
      correlationsFound: correlations.length,
      hasData: pipelineContext.length > 0,
    },
  };
}

/**
 * Extract all structured findings from pipeline context.
 */
function extractAllFindings(pipelineContext) {
  const data = {
    dataPoints: 0,
    security: { riskScore: null, findings: 0, critical: 0, high: 0, ips: [], maliciousIPs: 0, categories: [] },
    governance: { complianceScore: null, grade: null, failures: 0, criticalFailures: 0, frameworks: [], failedRules: [] },
    intelligence: { priorRiskScore: null, priorConfidence: null },
    code: { securityScore: null, vulnerabilities: 0, critical: 0, safe: null },
    workflow: { actionCount: 0, priority: null },
  };

  for (const ctx of pipelineContext) {
    const meta = ctx.metadata || {};

    if (ctx.agentType === 'security') {
      if (meta.scanReport) {
        data.security.riskScore = meta.scanReport.riskScore;
        data.security.findings = meta.scanReport.totalFindings || 0;
        data.security.critical = meta.scanReport.critical || 0;
        data.security.high = meta.scanReport.high || 0;
        data.dataPoints += 4;
      }
      if (meta.ipReport) {
        data.security.maliciousIPs = meta.ipReport.malicious || 0;
        data.security.ips = (meta.ipReport.enriched || []).map((e) => ({
          ip: e.ip, reputation: e.reputation, score: e.score, tags: e.tags,
        }));
        data.dataPoints += 2;
      }
      if (meta.toolsUsed) data.dataPoints++;
    }

    if (ctx.agentType === 'governance') {
      if (meta.complianceReport) {
        data.governance.complianceScore = meta.complianceReport.score;
        data.governance.grade = meta.complianceReport.grade;
        data.governance.failures = meta.complianceReport.summary?.fail || 0;
        data.governance.criticalFailures = meta.complianceReport.summary?.criticalFailures || 0;
        data.governance.frameworks = meta.complianceReport.summary?.frameworksCovered || [];
        data.governance.failedRules = (meta.complianceReport.findings || [])
          .filter((f) => f.status === 'fail')
          .map((f) => ({ id: f.id, control: f.control, severity: f.severity }));
        data.dataPoints += 5;
      }
    }

    if (ctx.agentType === 'code') {
      if (meta.securityReview) {
        data.code.securityScore = meta.securityReview.score ?? meta.securityScore;
        data.code.vulnerabilities = meta.securityReview.summary?.total || 0;
        data.code.critical = meta.securityReview.summary?.critical || 0;
        data.code.safe = meta.securityReview.safe;
        data.dataPoints += 3;
      }
    }

    if (ctx.agentType === 'workflow') {
      if (meta.structuredFindings) {
        data.workflow.actionCount = meta.structuredFindings.totalSteps || 0;
        data.workflow.priority = meta.structuredFindings.priority;
        data.dataPoints += 2;
      }
      if (meta.actionPlan) {
        data.workflow.actionCount = meta.actionPlan.summary?.totalActions || 0;
        data.workflow.priority = meta.actionPlan.plan?.overallPriority;
        data.dataPoints += 2;
      }
    }
  }

  return data;
}

/**
 * Find correlations across agent findings.
 */
function findCorrelations(data) {
  const correlations = [];

  // Correlation: High security risk + compliance failures = systemic issue
  if (data.security.riskScore >= 7 && data.governance.failures > 0) {
    correlations.push({
      type: 'systemic_risk',
      severity: 'critical',
      description: `High security risk (${data.security.riskScore}/10) correlates with ${data.governance.failures} compliance failures — indicates systemic security governance gap`,
      agents: ['security', 'governance'],
      confidence: 95,
    });
  }

  // Correlation: Malicious IPs + authentication failures
  if (data.security.maliciousIPs > 0 && data.security.critical > 0) {
    correlations.push({
      type: 'active_attack',
      severity: 'critical',
      description: `${data.security.maliciousIPs} malicious IPs detected alongside ${data.security.critical} critical findings — likely active attack campaign`,
      agents: ['security'],
      confidence: 88,
    });
  }

  // Correlation: Code vulnerabilities + compliance failures = development process issue
  if (data.code.vulnerabilities > 0 && data.governance.failures > 0) {
    correlations.push({
      type: 'dev_process_gap',
      severity: 'high',
      description: `${data.code.vulnerabilities} code vulnerabilities with ${data.governance.failures} compliance failures — development security process needs improvement`,
      agents: ['code', 'governance'],
      confidence: 82,
    });
  }

  // Correlation: Low compliance score + no encryption references
  if (data.governance.complianceScore !== null && data.governance.complianceScore < 60) {
    correlations.push({
      type: 'compliance_risk',
      severity: 'high',
      description: `Compliance score ${data.governance.complianceScore}/100 (Grade: ${data.governance.grade}) — organization is exposed to regulatory penalties`,
      agents: ['governance'],
      confidence: 90,
    });
  }

  // Correlation: Code is safe + low security risk = healthy posture
  if (data.code.safe === true && (data.security.riskScore === null || data.security.riskScore <= 3)) {
    correlations.push({
      type: 'healthy_posture',
      severity: 'info',
      description: 'Code passes security review and no significant threats detected — security posture is healthy',
      agents: ['code', 'security'],
      confidence: 85,
    });
  }

  return correlations;
}

/**
 * Calculate aggregate risk score from all data points.
 */
function calculateAggregateRisk(data) {
  let weightedSum = 0;
  let totalWeight = 0;

  // Security scan risk (0-10 scale, normalize to 0-1)
  if (data.security.riskScore !== null) {
    weightedSum += (data.security.riskScore / 10) * RISK_WEIGHTS.scanRiskScore;
    totalWeight += RISK_WEIGHTS.scanRiskScore;
  }

  // Malicious IPs (cap at 5 for normalization)
  if (data.security.maliciousIPs > 0) {
    weightedSum += Math.min(data.security.maliciousIPs / 5, 1) * RISK_WEIGHTS.maliciousIPs;
    totalWeight += RISK_WEIGHTS.maliciousIPs;
  }

  // Critical findings (cap at 5)
  if (data.security.critical > 0) {
    weightedSum += Math.min(data.security.critical / 5, 1) * RISK_WEIGHTS.criticalFindings;
    totalWeight += RISK_WEIGHTS.criticalFindings;
  }

  // Compliance failures (inverted — failures increase risk)
  if (data.governance.complianceScore !== null) {
    weightedSum += ((100 - data.governance.complianceScore) / 100) * RISK_WEIGHTS.complianceFails;
    totalWeight += RISK_WEIGHTS.complianceFails;
  }

  // Code vulnerabilities (cap at 5)
  if (data.code.vulnerabilities > 0) {
    weightedSum += Math.min(data.code.vulnerabilities / 5, 1) * RISK_WEIGHTS.codeVulnerabilities;
    totalWeight += RISK_WEIGHTS.codeVulnerabilities;
  }

  const normalizedRisk = totalWeight > 0 ? (weightedSum / totalWeight) * 10 : 0;
  const riskScore = Math.round(normalizedRisk * 10) / 10;
  const confidence = Math.round((totalWeight / 1) * 100); // max weight = 1

  return {
    score: Math.min(riskScore, 10),
    confidence: Math.min(confidence, 100),
    level: riskScore >= 8 ? 'CRITICAL' : riskScore >= 6 ? 'HIGH' : riskScore >= 4 ? 'MEDIUM' : riskScore >= 2 ? 'LOW' : 'MINIMAL',
    breakdown: {
      securityScan: data.security.riskScore,
      maliciousIPs: data.security.maliciousIPs,
      criticalFindings: data.security.critical,
      complianceScore: data.governance.complianceScore,
      codeVulnerabilities: data.code.vulnerabilities,
    },
  };
}

/**
 * Build a timeline of agent processing.
 */
function buildTimeline(pipelineContext) {
  return pipelineContext.map((ctx) => ({
    agent: ctx.agentName || ctx.agentType,
    type: ctx.agentType,
    processedAt: ctx.metadata?.processedAt || null,
    toolsUsed: ctx.metadata?.toolsUsed || [],
    hasFindings: !!(ctx.metadata?.scanReport || ctx.metadata?.complianceReport || ctx.metadata?.securityReview),
  }));
}

/**
 * Format correlation results as markdown.
 */
export function formatCorrelationReport(result) {
  const { risk, correlations, summary } = result;
  let r = `## 🔍 Intelligence Correlation Report\n\n`;
  r += `**Aggregate Risk:** ${risk.score}/10 (${risk.level}) — Confidence: ${risk.confidence}%\n`;
  r += `**Data Points:** ${summary.totalDataPoints} from ${summary.agentsAnalyzed} agents\n`;
  r += `**Correlations:** ${summary.correlationsFound} patterns identified\n\n`;

  if (correlations.length > 0) {
    r += `### Cross-Agent Correlations\n\n`;
    for (const c of correlations) {
      const icon = c.severity === 'critical' ? '🔴' : c.severity === 'high' ? '🟠' : c.severity === 'info' ? '✅' : '🟡';
      r += `- ${icon} **${c.type.replace(/_/g, ' ').toUpperCase()}** (${c.confidence}% confidence)\n`;
      r += `  ${c.description}\n  Agents: ${c.agents.join(' ↔ ')}\n\n`;
    }
  }

  r += `### Risk Breakdown\n\n| Factor | Value |\n|--------|-------|\n`;
  for (const [k, v] of Object.entries(risk.breakdown)) {
    if (v !== null && v !== undefined) r += `| ${k} | ${v} |\n`;
  }
  return r;
}
