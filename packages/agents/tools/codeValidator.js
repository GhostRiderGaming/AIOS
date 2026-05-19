/**
 * @fileoverview Code vulnerability validator — static analysis for common security patterns.
 * Used by CodeAgent to review generated or uploaded code before returning results.
 */

/**
 * Vulnerability patterns to detect in source code.
 */
const VULN_PATTERNS = {
  sqlInjection: {
    regex: /(?:query|execute|raw|exec)\s*\(\s*[`'"].*\$\{|(?:query|execute)\s*\(\s*['"].*\+\s*(?:req|input|user|param)/gi,
    severity: 'critical',
    cwe: 'CWE-89',
    description: 'Potential SQL injection — string interpolation in query',
    fix: 'Use parameterized queries or prepared statements',
  },
  xssOutput: {
    regex: /innerHTML\s*=|document\.write\s*\(|\.html\s*\(\s*(?:req|input|user|data|param)/gi,
    severity: 'critical',
    cwe: 'CWE-79',
    description: 'Potential XSS — unsanitized output to DOM',
    fix: 'Use textContent instead of innerHTML, or sanitize with DOMPurify',
  },
  evalUsage: {
    regex: /\beval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*['"`]/gi,
    severity: 'critical',
    cwe: 'CWE-95',
    description: 'Code injection risk — eval() or equivalent detected',
    fix: 'Avoid eval(); use JSON.parse() for data, or pre-compiled functions',
  },
  hardcodedSecrets: {
    regex: /(?:password|secret|api_key|apikey|token|private_key)\s*[:=]\s*['"][^'"]{8,}/gi,
    severity: 'high',
    cwe: 'CWE-798',
    description: 'Hardcoded credential or secret detected',
    fix: 'Use environment variables or a secret manager',
  },
  pathTraversal: {
    regex: /(?:readFile|readFileSync|createReadStream|access)\s*\(.*(?:req\.|input|param|query)/gi,
    severity: 'high',
    cwe: 'CWE-22',
    description: 'Potential path traversal — user input in file path',
    fix: 'Validate and sanitize file paths; use path.resolve() with a whitelist',
  },
  noInputValidation: {
    regex: /req\.(?:body|query|params)\.\w+(?!\s*\?\?|\s*\|\||\s*&&|\s*!=|\s*!==)/g,
    severity: 'medium',
    cwe: 'CWE-20',
    description: 'User input accessed without validation',
    fix: 'Validate all user input with Zod, Joi, or manual checks',
  },
  insecureRandom: {
    regex: /Math\.random\s*\(\)/g,
    severity: 'medium',
    cwe: 'CWE-330',
    description: 'Insecure randomness — Math.random() is not cryptographically secure',
    fix: 'Use crypto.randomBytes() or crypto.getRandomValues()',
  },
  debugLeakage: {
    regex: /console\.log\s*\(.*(?:password|secret|token|key|credential)/gi,
    severity: 'medium',
    cwe: 'CWE-532',
    description: 'Sensitive data in debug output',
    fix: 'Remove console.log() with sensitive data before production',
  },
};

/**
 * Validate code for security vulnerabilities.
 * @param {string} code — source code to analyze
 * @returns {{ findings: Array, score: number, summary: { total: number, critical: number, high: number, medium: number }, safe: boolean }}
 */
export function validateCode(code) {
  const findings = [];
  const lines = code.split('\n');

  for (const [patternName, pattern] of Object.entries(VULN_PATTERNS)) {
    // Reset regex state
    pattern.regex.lastIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Reset for each line
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      const match = regex.exec(line);
      if (match) {
        findings.push({
          line: i + 1,
          pattern: patternName,
          severity: pattern.severity,
          cwe: pattern.cwe,
          description: pattern.description,
          fix: pattern.fix,
          match: match[0].slice(0, 80),
          context: line.trim().slice(0, 120),
        });
      }
    }
  }

  const summary = {
    total: findings.length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
  };

  // Security score: 100 = clean, lower = more issues
  const weights = { critical: 25, high: 15, medium: 5 };
  const penalty = findings.reduce((sum, f) => sum + (weights[f.severity] || 0), 0);
  const score = Math.max(0, 100 - penalty);

  return { findings, score, summary, safe: summary.critical === 0 };
}

/**
 * Format validation results as a readable report.
 * @param {{ findings: Array, score: number, summary: object, safe: boolean }} result
 * @returns {string}
 */
export function formatValidationReport(result) {
  const { findings, score, summary, safe } = result;

  let report = `## 🔒 Code Security Review\n\n`;
  report += `**Security Score:** ${score}/100 ${safe ? '✅' : '⚠️'}\n`;
  report += `**Findings:** ${summary.total} (🔴 ${summary.critical} critical, 🟠 ${summary.high} high, 🟡 ${summary.medium} medium)\n\n`;

  if (findings.length === 0) {
    report += `✅ **No vulnerabilities detected** — code passes static analysis.\n`;
    return report;
  }

  for (const severity of ['critical', 'high', 'medium']) {
    const group = findings.filter((f) => f.severity === severity);
    if (group.length === 0) continue;

    const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
    report += `### ${icon} ${severity.toUpperCase()} (${group.length})\n\n`;

    for (const finding of group) {
      report += `- **Line ${finding.line}** [${finding.cwe}] — ${finding.description}\n`;
      report += `  \`${finding.context}\`\n`;
      report += `  **Fix:** ${finding.fix}\n\n`;
    }
  }

  return report;
}
