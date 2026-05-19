/**
 * @fileoverview Specialized agents — EVERY agent uses REAL tools.
 * No empty shells. No LLM-output regex parsing pretending to be tools.
 *
 * SecurityAgent  → LogScanner + IPEnrichment
 * GovernanceAgent → ComplianceChecker (16 rules, 6 frameworks)
 * IntelligenceAgent → CorrelationEngine (weighted risk, cross-agent correlations)
 * WorkflowAgent → ActionPlanner (remediation plans from pipeline findings)
 * CodeAgent → CodeValidator (static SAST with CWE tags)
 */

import { BaseAgent } from './base.agent.js';
import { AGENT_TYPES } from '@aios/shared/constants';
import { scanLogs, formatScanReport } from '../tools/logScanner.js';
import { enrichIPs } from '../tools/ipEnrichment.js';
import { validateCode, formatValidationReport } from '../tools/codeValidator.js';
import { checkCompliance, formatComplianceReport } from '../tools/complianceChecker.js';
import { correlateFindings, formatCorrelationReport } from '../tools/correlationEngine.js';
import { generateActionPlan, formatActionPlan } from '../tools/actionPlanner.js';

// ═══════════════════════════════════════════════════════════════
//  SecurityAgent — LogScanner + IPEnrichment
// ═══════════════════════════════════════════════════════════════
export class SecurityAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.SECURITY);
    this.tools = ['logScanner', 'ipEnrichment'];
  }

  async _execute(input, options) {
    const { aiEngine, pipelineContext, fileContents } = options;
    const toolResults = { toolsUsed: [], scanReport: null, ipReport: null };

    // ─── TOOL 1: Log Scanner ─────────────────────────────────
    let scanData = null;
    const contentToScan = fileContents || input;
    if (contentToScan.length > 50) {
      scanData = scanLogs(contentToScan);
      toolResults.toolsUsed.push('logScanner');
      toolResults.scanReport = {
        riskScore: scanData.riskScore,
        totalFindings: scanData.summary.totalFindings,
        critical: scanData.summary.critical,
        high: scanData.summary.high,
        medium: scanData.summary.medium,
        uniqueIPs: scanData.summary.uniqueIPs,
      };
    }

    // ─── TOOL 2: IP Enrichment ───────────────────────────────
    let ipData = null;
    const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
    const ips = (contentToScan.match(ipRegex) || []);
    if (ips.length > 0) {
      ipData = enrichIPs(ips);
      toolResults.toolsUsed.push('ipEnrichment');
      toolResults.ipReport = {
        totalIPs: ipData.summary.total,
        malicious: ipData.summary.malicious,
        suspicious: ipData.summary.suspicious,
        enriched: ipData.enriched.slice(0, 5),
      };
    }

    // ─── Build enriched prompt for LLM ───────────────────────
    let enrichedPrompt = input;
    if (scanData) {
      enrichedPrompt += `\n\n--- TOOL OUTPUT: LOG SCANNER ---\n${formatScanReport(scanData)}`;
    }
    if (ipData) {
      const ipSummary = ipData.enriched
        .map((e) => `  ${e.ip}: ${e.reputation} (score: ${e.score}/100, tags: ${e.tags.join(', ')}, geo: ${e.geo})`)
        .join('\n');
      enrichedPrompt += `\n\n--- TOOL OUTPUT: IP ENRICHMENT ---\n${ipSummary}`;
    }

    if (aiEngine) {
      const result = await aiEngine.agentResponse(this.type, enrichedPrompt, { pipelineContext, fileContents });
      return {
        content: result.content,
        metadata: { ...result.metadata, toolsUsed: toolResults.toolsUsed, scanReport: toolResults.scanReport, ipReport: toolResults.ipReport },
      };
    }

    let content = `${this.emoji} ${this.name}: Tool-based analysis complete.\n\n`;
    if (scanData) content += formatScanReport(scanData);
    if (ipData) content += `\n**IP Analysis:** ${ipData.summary.malicious} malicious, ${ipData.summary.suspicious} suspicious out of ${ipData.summary.total} IPs.\n`;
    return { content, metadata: toolResults };
  }
}

// ═══════════════════════════════════════════════════════════════
//  GovernanceAgent — ComplianceChecker (REAL tool, not regex parsing)
// ═══════════════════════════════════════════════════════════════
export class GovernanceAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.GOVERNANCE);
    this.tools = ['complianceChecker'];
  }

  async _execute(input, options) {
    const { aiEngine, pipelineContext, fileContents } = options;

    // ─── TOOL: Compliance Checker ────────────────────────────
    const contentToCheck = fileContents || input;
    const complianceResult = checkCompliance(contentToCheck);

    // Build enriched prompt with real compliance data
    let enrichedPrompt = input;
    enrichedPrompt += `\n\n--- TOOL OUTPUT: COMPLIANCE CHECKER ---\n${formatComplianceReport(complianceResult)}`;

    if (aiEngine) {
      const result = await aiEngine.agentResponse(this.type, enrichedPrompt, { pipelineContext, fileContents });
      return {
        content: result.content,
        metadata: {
          ...result.metadata,
          toolsUsed: ['complianceChecker'],
          complianceReport: {
            score: complianceResult.score,
            grade: complianceResult.grade,
            summary: complianceResult.summary,
            findings: complianceResult.findings.filter((f) => f.status !== 'info').slice(0, 10),
          },
        },
      };
    }

    return {
      content: `${this.emoji} ${this.name}: Compliance assessment complete.\n\n${formatComplianceReport(complianceResult)}`,
      metadata: {
        toolsUsed: ['complianceChecker'],
        complianceReport: { score: complianceResult.score, grade: complianceResult.grade, summary: complianceResult.summary },
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════
//  IntelligenceAgent — CorrelationEngine (REAL cross-agent analysis)
// ═══════════════════════════════════════════════════════════════
export class IntelligenceAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.INTELLIGENCE);
    this.tools = ['correlationEngine'];
  }

  async _execute(input, options) {
    const { aiEngine, pipelineContext, fileContents } = options;

    // ─── TOOL: Correlation Engine ────────────────────────────
    const correlation = correlateFindings(pipelineContext || []);

    let enrichedPrompt = input;
    enrichedPrompt += `\n\n--- TOOL OUTPUT: CORRELATION ENGINE ---\n${formatCorrelationReport(correlation)}`;

    if (aiEngine) {
      const result = await aiEngine.agentResponse(this.type, enrichedPrompt, { pipelineContext, fileContents });
      return {
        content: result.content,
        metadata: {
          ...result.metadata,
          toolsUsed: ['correlationEngine'],
          correlationReport: {
            riskScore: correlation.risk.score,
            riskLevel: correlation.risk.level,
            confidence: correlation.risk.confidence,
            correlationsFound: correlation.correlations.length,
            correlations: correlation.correlations,
            breakdown: correlation.risk.breakdown,
          },
        },
      };
    }

    return {
      content: `${this.emoji} ${this.name}: Correlation analysis complete.\n\n${formatCorrelationReport(correlation)}`,
      metadata: { toolsUsed: ['correlationEngine'], correlationReport: correlation },
    };
  }
}

// ═══════════════════════════════════════════════════════════════
//  WorkflowAgent — ActionPlanner (REAL structured remediation)
// ═══════════════════════════════════════════════════════════════
export class WorkflowAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.WORKFLOW);
    this.tools = ['actionPlanner'];
  }

  async _execute(input, options) {
    const { aiEngine, pipelineContext, fileContents } = options;

    // ─── TOOL: Action Planner ────────────────────────────────
    const actionResult = generateActionPlan(pipelineContext || []);

    let enrichedPrompt = input;
    enrichedPrompt += `\n\n--- TOOL OUTPUT: ACTION PLANNER ---\n${formatActionPlan(actionResult)}`;

    if (aiEngine) {
      const result = await aiEngine.agentResponse(this.type, enrichedPrompt, { pipelineContext, fileContents });
      return {
        content: result.content,
        metadata: {
          ...result.metadata,
          toolsUsed: ['actionPlanner'],
          actionPlan: { plan: actionResult.plan, summary: actionResult.summary },
        },
      };
    }

    return {
      content: `${this.emoji} ${this.name}: Action plan generated.\n\n${formatActionPlan(actionResult)}`,
      metadata: { toolsUsed: ['actionPlanner'], actionPlan: actionResult },
    };
  }
}

// ═══════════════════════════════════════════════════════════════
//  CodeAgent — CodeValidator (static SAST)
// ═══════════════════════════════════════════════════════════════
export class CodeAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.CODE);
    this.tools = ['codeValidator'];
  }

  async _execute(input, options) {
    const { aiEngine, pipelineContext, fileContents } = options;

    let result;
    if (aiEngine) {
      result = await aiEngine.agentResponse(this.type, input, { pipelineContext, fileContents });
    } else {
      result = { content: `${this.emoji} ${this.name}: Code generation complete.`, metadata: {} };
    }

    // ─── TOOL: Code Validator on generated output ────────────
    const codeBlocks = this._extractCodeBlocks(result.content);
    let validationReport = null;
    let securityScore = 100;

    if (codeBlocks.length > 0) {
      const allCode = codeBlocks.join('\n');
      const validation = validateCode(allCode);
      validationReport = { score: validation.score, safe: validation.safe, summary: validation.summary, findings: validation.findings.slice(0, 10) };
      securityScore = validation.score;
      if (validation.findings.length > 0) {
        result.content += `\n\n${formatValidationReport(validation)}`;
      } else {
        result.content += `\n\n✅ **Security Review:** Code passes static analysis (Score: ${validation.score}/100).`;
      }
    }

    // Validate uploaded file too
    if (fileContents && fileContents.length > 20) {
      const fileValidation = validateCode(fileContents);
      if (fileValidation.findings.length > 0) {
        result.content += `\n\n### 📁 Uploaded File Review\n${formatValidationReport(fileValidation)}`;
        validationReport = validationReport || {};
        validationReport.fileScore = fileValidation.score;
        validationReport.fileSafe = fileValidation.safe;
      }
    }

    return {
      content: result.content,
      metadata: { ...result.metadata, toolsUsed: ['codeValidator'], securityReview: validationReport, securityScore },
    };
  }

  _extractCodeBlocks(text) {
    const blocks = [];
    const regex = /```(?:\w+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) blocks.push(match[1]);
    return blocks;
  }
}
