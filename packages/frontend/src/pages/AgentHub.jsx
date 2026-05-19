/**
 * @fileoverview Agent Hub — detailed agent profiles, capabilities, and permissions.
 */

import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Shield, FileCheck, Brain, Cog, Code, ChevronDown, ChevronUp } from 'lucide-react';

const AGENT_ICONS = {
  security: Shield,
  governance: FileCheck,
  intelligence: Brain,
  workflow: Cog,
  code: Code,
};

const AGENT_CAPABILITIES = {
  security: [
    '🔧 Tool: LogScanner — regex-based log threat detection (MITRE ATT&CK mapping)',
    '🔧 Tool: IPEnrichment — local threat intel, Tor exit node detection, geo-location',
    'Failed Login & Brute Force Pattern Analysis',
    'Privilege Escalation Detection',
    'Network Anomaly Correlation',
    'Structured Finding Extraction (IPs, severities, MITRE IDs)',
  ],
  governance: [
    '🔧 Tool: ComplianceChecker — 16-rule policy engine across 6 frameworks',
    'SOC 2 / GDPR / HIPAA / PCI-DSS / ISO 27001 / NIST CSF evaluation',
    'Per-framework scoring with pass/fail/warning breakdown',
    'Compliance Grade (A-F) with remediation guidance',
    'Critical failure detection with specific control IDs',
    'Audit-Ready Report Generation',
  ],
  intelligence: [
    '🔧 Tool: CorrelationEngine — weighted cross-agent risk aggregation',
    'Reads structured findings from Security (scan report, IP report)',
    'Reads structured findings from Governance (compliance score, frameworks)',
    'Aggregate Risk Score with confidence percentage',
    'Cross-agent correlation detection (systemic risk, active attack, dev process gaps)',
    'Risk breakdown by factor with weighted scoring',
  ],
  workflow: [
    '🔧 Tool: ActionPlanner — structured remediation from pipeline findings',
    'Reads all prior agent findings to generate prioritized action items',
    'Team assignment (Security, DevOps, Engineering, Compliance, Network)',
    'Timeline estimation per action with effort assessment',
    'Priority ranking (CRITICAL → HIGH → MEDIUM → LOW)',
    'Deduplication and cross-agent action consolidation',
  ],
  code: [
    '🔧 Tool: CodeValidator — static vulnerability scanning (CWE-tagged)',
    'Detects: SQL Injection, XSS, eval(), hardcoded secrets, path traversal',
    'Security Score Computation (0-100) for generated code',
    'Production-Quality Code Generation',
    'Architecture Design Patterns',
    'Auto-reviews its own generated code for vulnerabilities',
  ],
};

export function AgentHub() {
  const [agents, setAgents] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getMetrics(), api.getPermissions()])
      .then(([metrics, perms]) => {
        setAgents(metrics.agents || []);
        setPermissions(perms || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleAgent = (type) => {
    setExpandedAgent((prev) => (prev === type ? null : type));
  };

  if (loading) {
    return (
      <div className="app-content animate-fade-in">
        <div className="page-header">
          <h1 className="page-header__title">Agent Hub</h1>
          <p className="page-header__subtitle">Loading agent profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-content animate-fade-in">
      <div className="page-header">
        <h1 className="page-header__title">Agent Hub</h1>
        <p className="page-header__subtitle">
          5 specialized agents working in a sequential pipeline — each building on prior findings
        </p>
      </div>

      {/* Pipeline Visualization */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
          PIPELINE ORDER
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {agents.map((agent, i) => (
            <div key={agent.type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: `${agent.color}20`,
                border: `1px solid ${agent.color}40`,
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: agent.color,
              }}>
                {agent.emoji} {agent.name}
              </span>
              {i < agents.length - 1 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {agents.map((agent) => {
          const AgentIcon = AGENT_ICONS[agent.type] || Shield;
          const isExpanded = expandedAgent === agent.type;
          const agentPerms = permissions.filter((p) => p.agent_type === agent.type);
          const capabilities = AGENT_CAPABILITIES[agent.type] || [];

          return (
            <div
              key={agent.type}
              className="glass-card"
              style={{
                overflow: 'hidden',
                borderLeft: `3px solid ${agent.color}`,
                transition: 'all 0.3s ease',
              }}
            >
              {/* Header */}
              <div
                onClick={() => toggleAgent(agent.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '8px 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${agent.color}15`,
                    fontSize: '1.5rem',
                  }}>
                    {agent.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{agent.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {agent.description}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className={`agent-card__status agent-card__status--${agent.status}`}>
                    <span className="agent-card__status-dot" />
                    {agent.status}
                  </div>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }} className="animate-fade-in">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Capabilities */}
                    <div>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: agent.color }}>
                        CAPABILITIES
                      </h3>
                      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {capabilities.map((cap) => (
                          <li key={cap} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: agent.color, marginTop: '2px' }}>✓</span>
                            {cap}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Permissions */}
                    <div>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-muted)' }}>
                        PERMISSIONS
                      </h3>
                      {agentPerms.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {agentPerms.map((perm) => (
                            <div key={perm.permission} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: perm.granted ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                              fontSize: '0.8rem',
                            }}>
                              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{perm.permission}</code>
                              <span style={{ color: perm.granted ? 'var(--status-success)' : 'var(--severity-critical)', fontWeight: 600 }}>
                                {perm.granted ? '✅ Granted' : '🚫 Denied'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No explicit permission rules defined.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
