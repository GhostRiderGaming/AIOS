/**
 * @fileoverview AIOS Comprehensive Test Suite
 * Tests ALL tools (including new ones), negative cases, rate limiter,
 * RBAC enforcement, and edge cases. No fake assertions.
 *
 * Usage: node tests/pipeline.test.js
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

// Force demo mode for deterministic tests
process.env.DEMO_MODE = 'true';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
    failures.push(message);
  }
}

async function runTests() {
  console.log('\n═══ AIOS Comprehensive Test Suite ═══\n');
  const startTime = Date.now();

  // ═══════════════════════════════════════════════════════════
  // TEST 1: Agent Registry
  // ═══════════════════════════════════════════════════════════
  console.log('🧪 1. Agent Registry');
  const { registry } = await import('../packages/agents/core/registry.js');

  assert(registry.getAll().length === 5, 'Registry has 5 agents');
  assert(registry.get('security') !== undefined, 'SecurityAgent registered');
  assert(registry.get('governance') !== undefined, 'GovernanceAgent registered');
  assert(registry.get('intelligence') !== undefined, 'IntelligenceAgent registered');
  assert(registry.get('workflow') !== undefined, 'WorkflowAgent registered');
  assert(registry.get('code') !== undefined, 'CodeAgent registered');

  // Negative: unknown agent returns undefined
  assert(registry.get('nonexistent') === undefined, 'Unknown agent returns undefined');

  // ═══════════════════════════════════════════════════════════
  // TEST 2: ALL agents declare tools
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 2. All Agents Have Real Tools');
  const agents = registry.getAll();
  for (const agent of agents) {
    assert(agent.tools?.length > 0, `${agent.name} has tools: [${agent.tools?.join(', ')}]`);
  }

  const secAgent = registry.get('security');
  assert(secAgent.tools.includes('logScanner'), 'SecurityAgent has logScanner');
  assert(secAgent.tools.includes('ipEnrichment'), 'SecurityAgent has ipEnrichment');

  const govAgent = registry.get('governance');
  assert(govAgent.tools.includes('complianceChecker'), 'GovernanceAgent has complianceChecker');

  const intelAgent = registry.get('intelligence');
  assert(intelAgent.tools.includes('correlationEngine'), 'IntelligenceAgent has correlationEngine');

  const wfAgent = registry.get('workflow');
  assert(wfAgent.tools.includes('actionPlanner'), 'WorkflowAgent has actionPlanner');

  const codeAgent = registry.get('code');
  assert(codeAgent.tools.includes('codeValidator'), 'CodeAgent has codeValidator');

  // ═══════════════════════════════════════════════════════════
  // TEST 3: LogScanner Tool
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 3. LogScanner Tool');
  const { scanLogs } = await import('../packages/agents/tools/logScanner.js');

  const logSample = `
    2026-01-15 03:14:22 WARN  Failed login from 203.0.113.42
    2026-01-15 03:14:25 WARN  Failed login from 203.0.113.42
    2026-01-15 03:14:28 WARN  Failed login from 203.0.113.42
    2026-01-15 04:22:11 ERROR SQL injection attempt: ' OR 1=1 --
    2026-01-15 05:00:00 INFO  Scheduled backup completed
  `;
  const scanResult = scanLogs(logSample);

  assert(scanResult.riskScore > 0, `Risk score: ${scanResult.riskScore}/10`);
  assert(scanResult.summary.totalFindings > 0, `Found ${scanResult.summary.totalFindings} issues`);
  assert(scanResult.summary.uniqueIPs.length > 0, `Detected ${scanResult.summary.uniqueIPs.length} unique IP(s)`);
  assert(typeof scanResult.riskScore === 'number', 'Risk score is a number');

  // Negative: empty input
  const emptyResult = scanLogs('');
  assert(emptyResult.riskScore === 0, 'Empty input produces risk score 0');
  assert(emptyResult.summary.totalFindings === 0, 'Empty input produces 0 findings');

  // Negative: benign input
  const benignResult = scanLogs('INFO: All systems healthy. Uptime 99.9%');
  assert(benignResult.riskScore <= 2, `Benign log has low risk: ${benignResult.riskScore}/10`);

  // ═══════════════════════════════════════════════════════════
  // TEST 4: IP Enrichment Tool
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 4. IP Enrichment Tool');
  const { enrichIPs } = await import('../packages/agents/tools/ipEnrichment.js');

  const ipResult = enrichIPs(['203.0.113.42', '192.168.1.1', '185.220.100.5']);
  assert(ipResult.summary.total === 3, `Analyzed ${ipResult.summary.total} IPs`);
  assert(ipResult.enriched.some((e) => e.reputation === 'internal'), 'Detected internal IP');
  assert(ipResult.enriched.some((e) => e.reputation === 'suspicious' || e.reputation === 'malicious'), 'Detected threat IP');

  // Negative: empty array
  const emptyIPs = enrichIPs([]);
  assert(emptyIPs.summary.total === 0, 'Empty IP array returns 0 total');

  // Negative: invalid IPs
  const invalidIPs = enrichIPs(['not-an-ip', '999.999.999.999']);
  assert(invalidIPs.summary.total === 2, 'Invalid IPs still processed');

  // ═══════════════════════════════════════════════════════════
  // TEST 5: Code Validator Tool
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 5. Code Validator Tool');
  const { validateCode } = await import('../packages/agents/tools/codeValidator.js');

  const unsafeCode = `
    const query = "SELECT * FROM users WHERE id = " + req.body.id;
    element.innerHTML = req.body.content;
    eval(userInput);
    const password = "hardcoded-secret-123";
  `;
  const validation = validateCode(unsafeCode);

  assert(validation.findings.length >= 3, `Found ${validation.findings.length} vulnerabilities`);
  assert(validation.safe === false, 'Unsafe code flagged');
  assert(validation.score < 100, `Score: ${validation.score}/100`);

  // Positive: safe code
  const safeCode = `const data = await db.query('SELECT * FROM users WHERE id = ?', [userId]);`;
  const safeValidation = validateCode(safeCode);
  assert(safeValidation.safe === true, 'Safe code passes validation');
  assert(safeValidation.score === 100, `Safe code scores 100, got ${safeValidation.score}`);

  // Negative: empty input
  const emptyCode = validateCode('');
  assert(emptyCode.safe === true, 'Empty input is safe');

  // ═══════════════════════════════════════════════════════════
  // TEST 6: Compliance Checker Tool (NEW)
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 6. Compliance Checker Tool');
  const { checkCompliance, SUPPORTED_FRAMEWORKS } = await import('../packages/agents/tools/complianceChecker.js');

  assert(SUPPORTED_FRAMEWORKS.length >= 6, `${SUPPORTED_FRAMEWORKS.length} frameworks supported`);

  // Test with violations
  const violationText = `
    The system uses http://api.example.com for data transfer.
    User passwords are stored in plaintext in the database.
    All employees share a single admin account.
    We collect all browsing history and track every user action.
  `;
  const compResult = checkCompliance(violationText);

  assert(compResult.score < 70, `Violation text scores low: ${compResult.score}/100`);
  assert(compResult.grade !== 'A', `Grade reflects violations: ${compResult.grade}`);
  assert(compResult.summary.fail > 0, `${compResult.summary.fail} failures detected`);
  assert(compResult.findings.length > 0, `${compResult.findings.length} findings generated`);
  assert(typeof compResult.score === 'number', 'Score is a number');
  assert(compResult.score >= 0 && compResult.score <= 100, 'Score in 0-100 range');

  // Test with compliant text
  const compliantText = `
    All connections use HTTPS with TLS 1.3.
    Authentication via OAuth 2.0 with RBAC access control.
    Data encrypted at rest using AES-256. Consent is required.
    User data deletion API available for GDPR requests.
    CI/CD pipeline with code review and staging.
    Structured logging with audit trails and monitoring.
  `;
  const compliantResult = checkCompliance(compliantText);
  assert(compliantResult.score >= 70, `Compliant text scores high: ${compliantResult.score}/100`);
  assert(compliantResult.summary.pass > compliantResult.summary.fail, 'More passes than fails');

  // Test framework filtering
  const gdprOnly = checkCompliance(violationText, { frameworks: ['GDPR'] });
  assert(gdprOnly.summary.frameworksCovered.length === 1, 'Framework filtering works');
  assert(gdprOnly.summary.frameworksCovered[0] === 'GDPR', 'Only GDPR checked');

  // Negative: empty input
  const emptyCompliance = checkCompliance('');
  assert(typeof emptyCompliance.score === 'number', 'Empty input returns valid score');

  // ═══════════════════════════════════════════════════════════
  // TEST 7: Correlation Engine Tool (NEW)
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 7. Correlation Engine Tool');
  const { correlateFindings } = await import('../packages/agents/tools/correlationEngine.js');

  // Test with rich pipeline context
  const mockPipelineContext = [
    {
      agentType: 'security', agentName: 'Security Sentinel',
      content: 'Threat analysis complete.',
      metadata: {
        toolsUsed: ['logScanner', 'ipEnrichment'],
        scanReport: { riskScore: 8, totalFindings: 12, critical: 3, high: 5, medium: 4 },
        ipReport: { totalIPs: 5, malicious: 2, suspicious: 1 },
      },
    },
    {
      agentType: 'governance', agentName: 'Compliance Guardian',
      content: 'Compliance assessed.',
      metadata: {
        toolsUsed: ['complianceChecker'],
        complianceReport: {
          score: 45, grade: 'F',
          summary: { fail: 4, pass: 2, warning: 2, criticalFailures: 2, frameworksCovered: ['SOC2', 'GDPR'] },
          findings: [{ id: 'SOC2-CC6.1', status: 'fail', severity: 'critical', control: 'Access Control' }],
        },
      },
    },
    {
      agentType: 'code', agentName: 'Code Engineer',
      content: 'Review complete.',
      metadata: {
        toolsUsed: ['codeValidator'],
        securityReview: { score: 40, safe: false, summary: { total: 5, critical: 2, high: 2, medium: 1 } },
      },
    },
  ];

  const correlation = correlateFindings(mockPipelineContext);

  assert(correlation.risk.score > 5, `Aggregate risk: ${correlation.risk.score}/10`);
  assert(correlation.risk.level === 'CRITICAL' || correlation.risk.level === 'HIGH', `Risk level: ${correlation.risk.level}`);
  assert(correlation.risk.confidence > 0, `Confidence: ${correlation.risk.confidence}%`);
  assert(correlation.correlations.length > 0, `${correlation.correlations.length} correlations found`);
  assert(correlation.summary.agentsAnalyzed === 3, '3 agents analyzed');
  assert(correlation.summary.totalDataPoints > 5, `${correlation.summary.totalDataPoints} data points`);

  // Negative: empty context
  const emptyCorrelation = correlateFindings([]);
  assert(emptyCorrelation.risk.score === 0, 'Empty context produces 0 risk');
  assert(emptyCorrelation.correlations.length === 0, 'No correlations from empty context');

  // ═══════════════════════════════════════════════════════════
  // TEST 8: Action Planner Tool (NEW)
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 8. Action Planner Tool');
  const { generateActionPlan } = await import('../packages/agents/tools/actionPlanner.js');

  const actionResult = generateActionPlan(mockPipelineContext);

  assert(actionResult.plan.actions.length > 0, `${actionResult.plan.actions.length} actions generated`);
  assert(actionResult.plan.overallPriority !== 'LOW', `Priority: ${actionResult.plan.overallPriority}`);
  assert(actionResult.summary.owners.length > 0, `${actionResult.summary.owners.length} teams assigned`);
  assert(typeof actionResult.plan.estimatedEffort === 'string', 'Effort estimate present');

  // Each action has required fields
  for (const action of actionResult.plan.actions) {
    assert(action.action?.length > 0, `Action ${action.step}: "${action.action.slice(0, 40)}..."`);
    assert(action.priority, `  → has priority: ${action.priority}`);
    assert(action.owner, `  → has owner: ${action.owner}`);
    assert(action.timeline, `  → has timeline: ${action.timeline}`);
  }

  // Negative: empty context
  const emptyActions = generateActionPlan([]);
  assert(emptyActions.plan.actions.length > 0, 'Empty context still generates general actions');

  // ═══════════════════════════════════════════════════════════
  // TEST 9: Full Pipeline Orchestration
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 9. Full Pipeline Orchestration');
  const { orchestrate } = await import('../packages/agents/core/orchestrator.js');

  const result = await orchestrate({
    input: 'Analyze this access log for security threats and compliance issues',
    userId: 1,
    conversationId: 'test-conv-1',
  });

  assert(result.plan !== undefined, 'Orchestrator generates a plan');
  assert(result.results.length >= 2, `${result.results.length} agent results`);
  assert(result.pipeline === true, 'Pipeline flag set');

  for (const r of result.results) {
    assert(r.content?.length > 10, `${r.agentName} produced content`);
    assert(r.agentType !== undefined, `${r.agentName} has agentType`);
    assert(r.metadata?.provider !== undefined, `${r.agentName} has provider`);
    assert(r.metadata?.toolsUsed?.length > 0, `${r.agentName} used tools: [${r.metadata?.toolsUsed?.join(', ')}]`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 10: Streaming Orchestration
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 10. Streaming Orchestration');
  const { orchestrateStreaming } = await import('../packages/agents/core/orchestrator.js');

  const events = [];
  await orchestrateStreaming(
    { input: 'Analyze this log for threats: Failed login from 203.0.113.42 WARN brute force attempt SQL injection detected at endpoint /api/users access denied for role viewer', userId: 1, conversationId: 'test-conv-2' },
    {
      onPipelineStart: (data) => events.push({ type: 'start', data }),
      onAgentStart: (data) => events.push({ type: 'agentStart', data }),
      onAgentComplete: (data) => events.push({ type: 'agentComplete', data }),
      onPipelineDone: (data) => events.push({ type: 'done', data }),
    },
  );

  assert(events.some((e) => e.type === 'start'), 'Pipeline start event fired');
  assert(events.some((e) => e.type === 'agentComplete'), 'Agent complete event fired');
  assert(events.some((e) => e.type === 'done'), 'Pipeline done event fired');
  assert(events.filter((e) => e.type === 'agentStart').length >= 2, 'Multiple agents started');

  // Verify tool metadata in streaming results
  const completedEvents = events.filter((e) => e.type === 'agentComplete');
  for (const evt of completedEvents) {
    assert(evt.data.metadata?.toolsUsed?.length > 0, `Streaming: ${evt.data.agentName} reports tools used`);
  }

  // ═══════════════════════════════════════════════════════════
  // TEST 11: Rate Limiter
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 11. Rate Limiter');
  const { rateLimit, _testInternals } = await import('../packages/backend/middleware/rateLimit.js');

  // Clear state for test
  _testInternals.rateLimitMap.clear();

  const mockRes = {
    status: (code) => ({ json: (body) => ({ statusCode: code, body }) }),
    set: () => {},
  };
  const mockNext = () => 'next_called';

  // Should allow requests under the limit
  const mockReq = { user: { id: 'test-user-1' }, ip: '127.0.0.1' };
  let nextCalled = false;
  rateLimit(mockReq, { ...mockRes, set: () => {} }, () => { nextCalled = true; });
  assert(nextCalled, 'First request passes rate limit');

  // Should block after exceeding limit
  _testInternals.rateLimitMap.clear();
  const key = 'rl:test-flood-user';
  const now = Date.now();
  _testInternals.rateLimitMap.set(key, Array(_testInternals.RATE_LIMIT_MAX).fill(now));

  let wasBlocked = false;
  const blockRes = {
    status: (code) => ({
      json: (body) => { wasBlocked = code === 429; return { statusCode: code, body }; },
    }),
    set: () => {},
  };
  rateLimit({ user: { id: 'test-flood-user' }, ip: '127.0.0.2' }, blockRes, () => {});
  assert(wasBlocked, 'Rate limiter blocks after threshold');

  // Cleanup works
  _testInternals.rateLimitMap.clear();

  // ═══════════════════════════════════════════════════════════
  // TEST 12: Edge Cases & Robustness
  // ═══════════════════════════════════════════════════════════
  console.log('\n🧪 12. Edge Cases');

  // Very long input
  const longInput = 'A'.repeat(100_000);
  const longScan = scanLogs(longInput);
  assert(typeof longScan.riskScore === 'number', 'Handles 100K char input');

  // Special characters
  const specialInput = '<script>alert("xss")</script> \' OR 1=1; DROP TABLE; --';
  const specialScan = scanLogs(specialInput);
  assert(specialScan.summary.totalFindings > 0, 'Detects threats in special char input');

  // Unicode input
  const unicodeInput = '日本語テスト 사용자 тест пользователь';
  const unicodeScan = scanLogs(unicodeInput);
  assert(typeof unicodeScan.riskScore === 'number', 'Handles unicode input');

  // Compliance with all frameworks
  const allFrameworks = checkCompliance('some test text');
  assert(allFrameworks.summary.frameworksCovered.length >= 5, 'All frameworks checked by default');

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  const duration = Date.now() - startTime;
  console.log('\n' + '═'.repeat(55));
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`Duration: ${duration}ms`);
  console.log('═'.repeat(55));

  if (failures.length > 0) {
    console.log('\n❌ Failures:');
    failures.forEach((f) => console.log(`   - ${f}`));
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
