/**
 * @fileoverview Compliance Checker — Rule-based policy engine for GovernanceAgent.
 * Evaluates input against SOC2, GDPR, HIPAA, PCI-DSS, ISO 27001, NIST rules.
 */

const RULES = [
  // SOC 2
  { id: 'SOC2-CC6.1', framework: 'SOC2', control: 'CC6.1 — Logical Access', severity: 'critical',
    check: (t) => {
      if (/(?:hardcoded|plaintext\s+password)/i.test(t)) return { status: 'fail', detail: 'Hardcoded credentials violate access controls' };
      if (/(?:no\s+auth|unauthenticated|anonymous\s+access)/i.test(t)) return { status: 'fail', detail: 'Unauthenticated access to protected resources' };
      if (/(?:auth|jwt|oauth|rbac|role|session|sso)/i.test(t)) return { status: 'pass', detail: 'Authentication mechanism referenced' };
      return { status: 'warning', detail: 'No access control references found' };
    }, fix: 'Implement RBAC with JWT/OAuth. Never hardcode credentials.' },
  { id: 'SOC2-CC6.3', framework: 'SOC2', control: 'CC6.3 — Encryption in Transit', severity: 'high',
    check: (t) => {
      if (/\bhttp:\/\//i.test(t) && !/\bhttps:\/\//i.test(t)) return { status: 'fail', detail: 'Unencrypted HTTP detected' };
      if (/\bftp:\/\//i.test(t)) return { status: 'fail', detail: 'Unencrypted FTP detected' };
      if (/(?:tls|ssl|https)/i.test(t)) return { status: 'pass', detail: 'TLS/HTTPS referenced' };
      return { status: 'info', detail: 'No transport references' };
    }, fix: 'Use HTTPS with TLS 1.2+ for all connections.' },
  { id: 'SOC2-CC7.2', framework: 'SOC2', control: 'CC7.2 — System Monitoring', severity: 'high',
    check: (t) => {
      if (/(?:no\s+log|disable\s+log)/i.test(t)) return { status: 'fail', detail: 'Logging disabled' };
      if (/(?:log(?:ging|s)?|audit|monitor|siem|alert)/i.test(t)) return { status: 'pass', detail: 'Monitoring referenced' };
      return { status: 'warning', detail: 'No monitoring references' };
    }, fix: 'Implement structured logging with centralized log management.' },
  { id: 'SOC2-CC8.1', framework: 'SOC2', control: 'CC8.1 — Change Management', severity: 'medium',
    check: (t) => {
      if (/(?:direct\s+to\s+prod|skip\s+review)/i.test(t)) return { status: 'fail', detail: 'Uncontrolled production changes' };
      if (/(?:git|ci\/cd|pipeline|staging|review)/i.test(t)) return { status: 'pass', detail: 'Change management referenced' };
      return { status: 'info', detail: 'No change management references' };
    }, fix: 'Implement CI/CD with code review and staging.' },
  // GDPR
  { id: 'GDPR-Art5', framework: 'GDPR', control: 'Art.5 — Data Minimization', severity: 'high',
    check: (t) => {
      if (/(?:collect\s+(?:all|every)|track\s+(?:all|every)|full\s+browsing)/i.test(t)) return { status: 'fail', detail: 'Excessive data collection' };
      if (/(?:minim|only\s+necessary|purpose\s+limit|retention)/i.test(t)) return { status: 'pass', detail: 'Data minimization referenced' };
      return { status: 'info', detail: 'No data collection references' };
    }, fix: 'Collect only necessary data. Implement retention policies.' },
  { id: 'GDPR-Art7', framework: 'GDPR', control: 'Art.7 — Consent', severity: 'critical',
    check: (t) => {
      if (/(?:without\s+consent|pre-checked|implied\s+consent)/i.test(t)) return { status: 'fail', detail: 'Processing without explicit consent' };
      if (/(?:consent|opt[- ]?in|privacy\s+policy|cookie\s+banner)/i.test(t)) return { status: 'pass', detail: 'Consent mechanism referenced' };
      return { status: 'info', detail: 'No consent references' };
    }, fix: 'Implement explicit opt-in with clear purpose statement.' },
  { id: 'GDPR-Art17', framework: 'GDPR', control: 'Art.17 — Right to Erasure', severity: 'high',
    check: (t) => {
      if (/(?:cannot\s+delete|no\s+delete|permanent|irrevocable)/i.test(t)) return { status: 'fail', detail: 'No deletion capability' };
      if (/(?:delete|erase|purge|right\s+to\s+forget|data\s+subject)/i.test(t)) return { status: 'pass', detail: 'Erasure mechanism referenced' };
      return { status: 'warning', detail: 'No data deletion references' };
    }, fix: 'Implement data deletion endpoints for GDPR subject requests.' },
  { id: 'GDPR-Art32', framework: 'GDPR', control: 'Art.32 — Security of Processing', severity: 'critical',
    check: (t) => {
      if (/(?:plain\s*text|md5|sha1\s+hash|base64\s+.*password)/i.test(t)) return { status: 'fail', detail: 'Weak security measures' };
      if (/(?:encrypt|bcrypt|scrypt|argon|aes|sha[- ]?256)/i.test(t)) return { status: 'pass', detail: 'Encryption/hashing referenced' };
      return { status: 'warning', detail: 'No security measure references' };
    }, fix: 'Use bcrypt/argon2 for passwords. AES-256 for data at rest.' },
  // HIPAA
  { id: 'HIPAA-312a', framework: 'HIPAA', control: '§164.312(a) — Access Control', severity: 'critical',
    check: (t) => {
      const phi = /(?:patient|medical|health|diagnosis|phi|ehr)/i.test(t);
      const access = /(?:auth|rbac|role|access\s+control)/i.test(t);
      if (phi && !access) return { status: 'fail', detail: 'PHI without access controls' };
      if (phi && access) return { status: 'pass', detail: 'PHI access controls present' };
      return { status: 'info', detail: 'No PHI references' };
    }, fix: 'Implement RBAC with audit logging for all PHI access.' },
  { id: 'HIPAA-312e', framework: 'HIPAA', control: '§164.312(e) — Transmission Security', severity: 'critical',
    check: (t) => {
      const phi = /(?:patient|medical|health|phi|ehr)/i.test(t);
      if (phi && /(?:http:|ftp:|plain\s*text)/i.test(t)) return { status: 'fail', detail: 'PHI over unencrypted channel' };
      if (phi && /(?:tls|ssl|https|encrypt)/i.test(t)) return { status: 'pass', detail: 'PHI encryption referenced' };
      return { status: 'info', detail: 'No PHI transmission references' };
    }, fix: 'Encrypt all PHI transmissions with TLS 1.2+.' },
  // PCI-DSS
  { id: 'PCI-3.4', framework: 'PCI-DSS', control: 'Req 3.4 — Render PAN Unreadable', severity: 'critical',
    check: (t) => {
      const pan = /(?:credit\s*card|card\s*number|pan|payment\s*card|\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b)/i.test(t);
      if (pan && /(?:plain\s*text|store\s+card|log\s+card)/i.test(t)) return { status: 'fail', detail: 'Card data in plaintext' };
      if (pan && /(?:encrypt|tokenize|mask|hash)/i.test(t)) return { status: 'pass', detail: 'Card encryption referenced' };
      if (pan) return { status: 'warning', detail: 'Card data without encryption context' };
      return { status: 'info', detail: 'No payment card references' };
    }, fix: 'Never store full PAN. Use tokenization or AES-256.' },
  { id: 'PCI-6.5', framework: 'PCI-DSS', control: 'Req 6.5 — Secure Development', severity: 'high',
    check: (t) => {
      const vulns = /(?:sql\s*inject|xss|cross[- ]site|eval\s*\(|command\s*inject)/i.test(t);
      const sec = /(?:sanitiz|validat|prepared\s+statement|parameterized|owasp)/i.test(t);
      if (vulns && !sec) return { status: 'fail', detail: 'Vulnerabilities without mitigations' };
      if (vulns && sec) return { status: 'pass', detail: 'Security mitigations referenced' };
      if (sec) return { status: 'pass', detail: 'Secure development practices referenced' };
      return { status: 'info', detail: 'No security dev references' };
    }, fix: 'Follow OWASP Top 10. Use parameterized queries.' },
  // ISO 27001
  { id: 'ISO-A9', framework: 'ISO27001', control: 'A.9 — Access Control Policy', severity: 'high',
    check: (t) => {
      if (/(?:shared\s+account|shared\s+password|everyone\s+has\s+access)/i.test(t)) return { status: 'fail', detail: 'Access policy violation' };
      if (/(?:access\s+(?:control\s+)?policy|least\s+privilege|segregation)/i.test(t)) return { status: 'pass', detail: 'Access policy referenced' };
      return { status: 'info', detail: 'No access policy references' };
    }, fix: 'Enforce least privilege. Document access control policy.' },
  { id: 'ISO-A12', framework: 'ISO27001', control: 'A.12 — Operations Security', severity: 'medium',
    check: (t) => {
      if (/(?:no\s+backup|no\s+recovery)/i.test(t)) return { status: 'fail', detail: 'Missing operational procedures' };
      if (/(?:backup|disaster\s+recovery|incident\s+response|runbook)/i.test(t)) return { status: 'pass', detail: 'Ops procedures referenced' };
      return { status: 'info', detail: 'No ops security references' };
    }, fix: 'Document backup, DR, and incident response procedures.' },
  // NIST CSF
  { id: 'NIST-PR.DS', framework: 'NIST', control: 'PR.DS — Data Security', severity: 'high',
    check: (t) => {
      if (/(?:unencrypted\s+stor|public\s+bucket|exposed\s+database)/i.test(t)) return { status: 'fail', detail: 'Data exposure risk' };
      if (/(?:encrypt|at[- ]rest|in[- ]transit|kms|vault)/i.test(t)) return { status: 'pass', detail: 'Data protection referenced' };
      return { status: 'warning', detail: 'No data protection references' };
    }, fix: 'Encrypt data at rest (AES-256) and in transit (TLS 1.2+).' },
];

export const SUPPORTED_FRAMEWORKS = ['SOC2', 'GDPR', 'HIPAA', 'PCI-DSS', 'ISO27001', 'NIST'];

/**
 * Run compliance check against input text.
 * @param {string} text
 * @param {{ frameworks?: string[] }} options
 * @returns {{ score: number, grade: string, findings: Array, frameworks: Object, summary: Object }}
 */
export function checkCompliance(text, options = {}) {
  const selected = options.frameworks?.length
    ? new Set(options.frameworks.map((f) => f.toUpperCase().replace(/[\s-]/g, '')))
    : new Set(SUPPORTED_FRAMEWORKS.map((f) => f.replace(/[\s-]/g, '')));

  const findings = [];
  const fwResults = {};

  for (const rule of RULES) {
    const norm = rule.framework.replace(/-/g, '');
    if (!selected.has(norm)) continue;

    const result = rule.check(text);
    findings.push({
      id: rule.id, framework: rule.framework, control: rule.control,
      severity: rule.severity, status: result.status, detail: result.detail,
      remediation: result.status === 'fail' ? rule.fix : undefined,
    });

    if (!fwResults[rule.framework]) fwResults[rule.framework] = { total: 0, pass: 0, fail: 0, warning: 0, info: 0 };
    fwResults[rule.framework].total++;
    fwResults[rule.framework][result.status]++;
  }

  const scorable = findings.filter((f) => f.status !== 'info');
  const total = scorable.length || 1;
  const passed = scorable.filter((f) => f.status === 'pass').length;
  const warns = scorable.filter((f) => f.status === 'warning').length;
  const score = Math.round(Math.max(0, Math.min(100, ((passed + warns * 0.5) / total) * 100)));
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return {
    score, grade, findings, frameworks: fwResults,
    summary: {
      totalRules: findings.length,
      pass: findings.filter((f) => f.status === 'pass').length,
      fail: findings.filter((f) => f.status === 'fail').length,
      warning: findings.filter((f) => f.status === 'warning').length,
      info: findings.filter((f) => f.status === 'info').length,
      frameworksCovered: Object.keys(fwResults),
      criticalFailures: findings.filter((f) => f.status === 'fail' && f.severity === 'critical').length,
    },
  };
}

/**
 * Format compliance result as markdown.
 * @param {{ score: number, grade: string, findings: Array, frameworks: Object, summary: Object }} result
 * @returns {string}
 */
export function formatComplianceReport(result) {
  const { score, grade, findings, frameworks, summary } = result;
  let r = `## 📋 Compliance Report\n\n`;
  r += `**Score:** ${score}/100 (Grade: **${grade}**)\n`;
  r += `**Rules:** ${summary.totalRules} across ${summary.frameworksCovered.length} frameworks\n`;
  r += `**Results:** ✅${summary.pass} ❌${summary.fail} ⚠️${summary.warning} ℹ️${summary.info}\n`;
  if (summary.criticalFailures > 0) r += `\n🔴 **${summary.criticalFailures} CRITICAL** requiring immediate remediation\n`;

  r += `\n### Framework Scores\n\n| Framework | Score | Pass | Fail | Warn |\n|-----------|-------|------|------|------|\n`;
  for (const [fw, d] of Object.entries(frameworks)) {
    const s = Math.round(((d.pass + d.warning * 0.5) / Math.max(d.total - d.info, 1)) * 100);
    r += `| ${fw} | ${s}/100 | ${d.pass} | ${d.fail} | ${d.warning} |\n`;
  }

  const fails = findings.filter((f) => f.status === 'fail');
  if (fails.length > 0) {
    r += `\n### ❌ Failures\n\n`;
    for (const f of fails) {
      const icon = f.severity === 'critical' ? '🔴' : '🟠';
      r += `- ${icon} **[${f.id}]** ${f.control} — ${f.detail}\n  **Fix:** ${f.remediation}\n\n`;
    }
  }
  return r;
}
