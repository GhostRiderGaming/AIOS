/**
 * @fileoverview Log scanner tool — regex-based analysis for security agents.
 * Scans text content for security patterns, failed logins, privilege escalation, etc.
 */

/**
 * Security patterns to detect in log files.
 */
const PATTERNS = {
  failedLogins: {
    regex: /(?:failed|invalid|unauthorized|denied|rejected)\s+(?:login|auth|password|credential|access)/gi,
    severity: 'high',
    category: 'authentication',
    description: 'Failed authentication attempt',
  },
  bruteForce: {
    regex: /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}).*(?:failed|denied).*(?:failed|denied)/gi,
    severity: 'critical',
    category: 'brute_force',
    description: 'Potential brute force attack from repeated IPs',
  },
  privilegeEscalation: {
    regex: /(?:sudo|su\s|privilege|escalat|root|admin|chmod\s+[0-7]{3,4}|chown)/gi,
    severity: 'critical',
    category: 'privilege_escalation',
    description: 'Privilege escalation attempt',
  },
  suspiciousIPs: {
    regex: /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g,
    severity: 'info',
    category: 'network',
    description: 'IP address detected',
  },
  sqlInjection: {
    regex: /(?:union\s+select|or\s+1\s*=\s*1|drop\s+table|;\s*delete|'\s*or\s*'|--\s*$)/gi,
    severity: 'critical',
    category: 'injection',
    description: 'SQL injection pattern detected',
  },
  xss: {
    regex: /(?:<script|javascript:|on(?:load|error|click)\s*=|eval\s*\()/gi,
    severity: 'high',
    category: 'injection',
    description: 'XSS/script injection pattern detected',
  },
  sensitiveFiles: {
    regex: /(?:\/etc\/(?:passwd|shadow|hosts)|\.env|\.ssh|\.git|private\.key|credentials|secrets)/gi,
    severity: 'high',
    category: 'data_exposure',
    description: 'Sensitive file access',
  },
  exfiltration: {
    regex: /(?:curl|wget|scp|ftp|nc\s|netcat|base64|xxd|exfil|pastebin|ngrok)/gi,
    severity: 'critical',
    category: 'exfiltration',
    description: 'Data exfiltration pattern',
  },
  errorCodes: {
    regex: /(?:HTTP\/\d\.\d["'\s]+[45]\d{2}|status[:\s]+[45]\d{2}|\b[45]\d{2}\s+(?:error|forbidden|not found|unauthorized))/gi,
    severity: 'medium',
    category: 'errors',
    description: 'HTTP error response',
  },
  timestamps: {
    regex: /\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/g,
    severity: 'info',
    category: 'timeline',
    description: 'Timestamp',
  },
};

/**
 * Scan text content for security-relevant patterns.
 * @param {string} content — raw text content to scan
 * @returns {{ findings: Array, summary: object, riskScore: number }}
 */
export function scanLogs(content) {
  const findings = [];
  const lines = content.split('\n');

  for (const [patternName, pattern] of Object.entries(PATTERNS)) {
    if (patternName === 'timestamps' || patternName === 'suspiciousIPs') continue; // skip info-only

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(pattern.regex);
      if (matches) {
        findings.push({
          line: i + 1,
          pattern: patternName,
          severity: pattern.severity,
          category: pattern.category,
          description: pattern.description,
          match: matches[0].slice(0, 100),
          context: line.trim().slice(0, 200),
        });
      }
    }
  }

  // Extract unique IPs
  const ipMatches = content.match(PATTERNS.suspiciousIPs.regex) || [];
  const uniqueIPs = [...new Set(ipMatches)];

  // Extract timestamps for timeline
  const timeMatches = content.match(PATTERNS.timestamps.regex) || [];

  // Calculate risk score (0-10)
  const severityWeights = { critical: 3, high: 2, medium: 1, low: 0.5, info: 0 };
  const totalWeight = findings.reduce((sum, f) => sum + (severityWeights[f.severity] || 0), 0);
  const riskScore = Math.min(10, Math.round((totalWeight / Math.max(lines.length, 1)) * 100 * 10) / 10);

  const summary = {
    totalLines: lines.length,
    totalFindings: findings.length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    uniqueIPs,
    timeRange: timeMatches.length > 1 ? { start: timeMatches[0], end: timeMatches[timeMatches.length - 1] } : null,
  };

  return { findings, summary, riskScore };
}

/**
 * Format scan results as a human-readable report.
 * @param {{ findings: Array, summary: object, riskScore: number }} scanResult
 * @returns {string}
 */
export function formatScanReport(scanResult) {
  const { findings, summary, riskScore } = scanResult;

  let report = `## 📊 Log Scan Report\n\n`;
  report += `**Risk Score:** ${riskScore}/10\n`;
  report += `**Lines Scanned:** ${summary.totalLines}\n`;
  report += `**Findings:** ${summary.totalFindings} (🔴 ${summary.critical} critical, 🟠 ${summary.high} high, 🟡 ${summary.medium} medium)\n`;

  if (summary.uniqueIPs.length > 0) {
    report += `**Unique IPs:** ${summary.uniqueIPs.slice(0, 10).join(', ')}\n`;
  }

  if (summary.timeRange) {
    report += `**Time Range:** ${summary.timeRange.start} → ${summary.timeRange.end}\n`;
  }

  report += `\n### Findings\n\n`;

  // Group by severity
  for (const severity of ['critical', 'high', 'medium']) {
    const group = findings.filter((f) => f.severity === severity);
    if (group.length === 0) continue;

    const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
    report += `#### ${icon} ${severity.toUpperCase()} (${group.length})\n\n`;

    for (const finding of group.slice(0, 5)) {
      report += `- **Line ${finding.line}** — ${finding.description}\n`;
      report += `  \`${finding.context}\`\n`;
    }
    if (group.length > 5) {
      report += `- ... and ${group.length - 5} more\n`;
    }
    report += `\n`;
  }

  return report;
}
