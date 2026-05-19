/**
 * @fileoverview Action Planner Tool — Structured remediation planning for WorkflowAgent.
 * Extracts actionable items from pipeline findings and generates prioritized plans.
 */

/**
 * Remediation templates keyed by finding category.
 */
const REMEDIATION_TEMPLATES = {
  authentication: {
    actions: ['Implement MFA for all admin accounts', 'Rotate compromised credentials immediately', 'Review and revoke stale sessions'],
    timeline: '24 hours', priority: 'CRITICAL', owner: 'Security Team',
  },
  brute_force: {
    actions: ['Block attacking IPs at firewall/WAF level', 'Implement progressive lockout (5 attempts → 15min lock)', 'Enable CAPTCHA after 3 failed attempts'],
    timeline: '4 hours', priority: 'CRITICAL', owner: 'DevOps/Security',
  },
  injection: {
    actions: ['Patch vulnerable endpoints with parameterized queries', 'Deploy WAF rules for SQLi/XSS patterns', 'Conduct full codebase audit for injection vectors'],
    timeline: '48 hours', priority: 'CRITICAL', owner: 'Engineering',
  },
  privilege_escalation: {
    actions: ['Audit all sudo/admin access grants', 'Implement least-privilege access model', 'Enable privileged session monitoring'],
    timeline: '24 hours', priority: 'CRITICAL', owner: 'Security Team',
  },
  data_exposure: {
    actions: ['Restrict access to sensitive files immediately', 'Rotate any exposed secrets/keys', 'Implement file integrity monitoring'],
    timeline: '12 hours', priority: 'HIGH', owner: 'DevOps',
  },
  exfiltration: {
    actions: ['Block outbound connections to suspicious destinations', 'Review DLP policies and alerts', 'Forensic analysis of affected systems'],
    timeline: '4 hours', priority: 'CRITICAL', owner: 'Incident Response',
  },
  compliance_fail: {
    actions: ['Document compliance gap and create remediation ticket', 'Assign owner and set SLA for remediation', 'Schedule follow-up compliance audit'],
    timeline: '1 week', priority: 'HIGH', owner: 'Compliance Team',
  },
  compliance_warning: {
    actions: ['Review and assess risk of identified gaps', 'Create improvement plan with timeline', 'Add monitoring for compliance drift'],
    timeline: '2 weeks', priority: 'MEDIUM', owner: 'Compliance Team',
  },
  code_vulnerability: {
    actions: ['Fix identified vulnerabilities in next sprint', 'Add automated SAST scanning to CI/CD pipeline', 'Conduct peer security review of fixes'],
    timeline: '1 sprint', priority: 'HIGH', owner: 'Engineering',
  },
  network: {
    actions: ['Update firewall rules to block malicious IPs', 'Review network segmentation policies', 'Enable enhanced network monitoring'],
    timeline: '24 hours', priority: 'HIGH', owner: 'Network Team',
  },
  general: {
    actions: ['Investigate and assess the finding', 'Document findings in incident tracker', 'Review and update relevant policies'],
    timeline: '1 week', priority: 'MEDIUM', owner: 'Operations',
  },
};

/**
 * Generate a structured action plan from pipeline context.
 * @param {Array} pipelineContext — accumulated results from prior agents
 * @returns {{ plan: Object, summary: Object }}
 */
export function generateActionPlan(pipelineContext) {
  const actions = [];
  let highestPriority = 'LOW';
  const priorityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  for (const ctx of pipelineContext) {
    const meta = ctx.metadata || {};

    // Extract from Security scan findings
    if (ctx.agentType === 'security' && meta.scanReport) {
      const scan = meta.scanReport;
      if (scan.critical > 0) {
        actions.push(...buildActions('injection', scan.critical, 'security scan'));
        actions.push(...buildActions('authentication', scan.critical, 'security scan'));
      }
      if (scan.high > 0) {
        actions.push(...buildActions('data_exposure', scan.high, 'security scan'));
      }
      if (meta.ipReport?.malicious > 0) {
        actions.push(...buildActions('network', meta.ipReport.malicious, 'IP enrichment'));
      }
    }

    // Extract from Governance compliance findings
    if (ctx.agentType === 'governance' && meta.complianceReport) {
      const comp = meta.complianceReport;
      if (comp.summary?.criticalFailures > 0) {
        actions.push(...buildActions('compliance_fail', comp.summary.criticalFailures, 'compliance check'));
      }
      if (comp.summary?.fail > 0) {
        actions.push(...buildActions('compliance_fail', comp.summary.fail, 'compliance check'));
      }
      if (comp.summary?.warning > 0) {
        actions.push(...buildActions('compliance_warning', comp.summary.warning, 'compliance check'));
      }
    }

    // Extract from Code security review
    if (ctx.agentType === 'code' && meta.securityReview) {
      const review = meta.securityReview;
      if (review.summary?.critical > 0 || review.summary?.high > 0) {
        actions.push(...buildActions('code_vulnerability', (review.summary?.critical || 0) + (review.summary?.high || 0), 'code review'));
      }
    }
  }

  // If no specific findings, generate general plan
  if (actions.length === 0) {
    actions.push(...buildActions('general', 1, 'general assessment'));
  }

  // Deduplicate and sort by priority
  const deduped = deduplicateActions(actions);
  deduped.sort((a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0));

  // Assign step numbers
  deduped.forEach((a, i) => { a.step = i + 1; });

  // Determine highest priority
  for (const a of deduped) {
    if ((priorityRank[a.priority] || 0) > (priorityRank[highestPriority] || 0)) {
      highestPriority = a.priority;
    }
  }

  return {
    plan: {
      actions: deduped,
      overallPriority: highestPriority,
      estimatedEffort: estimateEffort(deduped),
    },
    summary: {
      totalActions: deduped.length,
      critical: deduped.filter((a) => a.priority === 'CRITICAL').length,
      high: deduped.filter((a) => a.priority === 'HIGH').length,
      medium: deduped.filter((a) => a.priority === 'MEDIUM').length,
      owners: [...new Set(deduped.map((a) => a.owner))],
      sources: [...new Set(deduped.map((a) => a.source))],
    },
  };
}

/**
 * Build action items from a remediation template.
 */
function buildActions(category, findingCount, source) {
  const template = REMEDIATION_TEMPLATES[category] || REMEDIATION_TEMPLATES.general;
  return template.actions.map((action) => ({
    action,
    priority: template.priority,
    timeline: template.timeline,
    owner: template.owner,
    source,
    category,
    findingCount,
  }));
}

/**
 * Deduplicate actions by action text.
 */
function deduplicateActions(actions) {
  const seen = new Set();
  return actions.filter((a) => {
    if (seen.has(a.action)) return false;
    seen.add(a.action);
    return true;
  });
}

/**
 * Estimate total effort from action timelines.
 */
function estimateEffort(actions) {
  const hasCritical = actions.some((a) => a.priority === 'CRITICAL');
  const hasHigh = actions.some((a) => a.priority === 'HIGH');
  if (hasCritical) return 'Immediate action required — estimated 1-2 days for critical items';
  if (hasHigh) return 'Urgent — estimated 1 week for all remediation';
  return 'Standard — estimated 2 weeks for full remediation';
}

/**
 * Format action plan as markdown.
 * @param {{ plan: Object, summary: Object }} result
 * @returns {string}
 */
export function formatActionPlan(result) {
  const { plan, summary } = result;
  let r = `## ⚙️ Remediation Action Plan\n\n`;
  r += `**Priority:** ${plan.overallPriority}\n`;
  r += `**Actions:** ${summary.totalActions} (🔴${summary.critical} critical, 🟠${summary.high} high, 🟡${summary.medium} medium)\n`;
  r += `**Effort:** ${plan.estimatedEffort}\n`;
  r += `**Teams:** ${summary.owners.join(', ')}\n\n`;

  r += `### Action Items\n\n`;
  r += `| # | Action | Priority | Timeline | Owner |\n|---|--------|----------|----------|-------|\n`;
  for (const a of plan.actions) {
    const icon = a.priority === 'CRITICAL' ? '🔴' : a.priority === 'HIGH' ? '🟠' : '🟡';
    r += `| ${a.step} | ${a.action} | ${icon} ${a.priority} | ${a.timeline} | ${a.owner} |\n`;
  }
  return r;
}
