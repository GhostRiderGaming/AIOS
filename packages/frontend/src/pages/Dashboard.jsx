/**
 * @fileoverview Dashboard page — system overview with agent grid, metrics, and charts.
 */

import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Shield, AlertTriangle, Activity, Bot, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const AGENT_COLORS = {
  security: '#ef4444',
  governance: '#3b82f6',
  intelligence: '#a855f7',
  workflow: '#22c55e',
  code: '#f59e0b',
};

const RISK_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app-content animate-fade-in">
        <div className="page-header">
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  // Build chart data from alerts
  const alertData = [
    { name: 'Critical', value: metrics?.alertsList?.filter(a => a.severity === 'critical').length || 0, color: '#ef4444' },
    { name: 'High', value: metrics?.alertsList?.filter(a => a.severity === 'high').length || 0, color: '#f59e0b' },
    { name: 'Medium', value: metrics?.alertsList?.filter(a => a.severity === 'medium').length || 0, color: '#3b82f6' },
    { name: 'Low', value: metrics?.alertsList?.filter(a => a.severity === 'low').length || 0, color: '#22c55e' },
  ].filter(d => d.value > 0);

  const auditTotal = Object.values(metrics?.auditSummary || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="app-content animate-fade-in">
      <div className="page-header">
        <h1 className="page-header__title">System Dashboard</h1>
        <p className="page-header__subtitle">
          Multi-agent orchestration overview — all systems operational
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid stagger-children">
        <div className="glass-card metric-card animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Bot size={18} color="var(--accent-secondary)" />
            <span className="metric-card__label">Active Agents</span>
          </div>
          <span className="metric-card__value">{metrics?.agents?.length || 5}</span>
        </div>
        <div className="glass-card metric-card animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="var(--severity-critical)" />
            <span className="metric-card__label">Active Alerts</span>
          </div>
          <span className="metric-card__value" style={{ color: metrics?.activeAlerts > 0 ? 'var(--severity-critical)' : 'var(--status-success)' }}>
            {metrics?.activeAlerts || 0}
          </span>
        </div>
        <div className="glass-card metric-card animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={18} color="var(--status-success)" />
            <span className="metric-card__label">Audit Events</span>
          </div>
          <span className="metric-card__value">{auditTotal}</span>
        </div>
        <div className="glass-card metric-card animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={18} color="var(--agent-intelligence)" />
            <span className="metric-card__label">AI Provider</span>
          </div>
          <span className="metric-card__value" style={{ color: 'var(--status-success)', fontSize: '1.3rem' }}>
            {metrics?.providerStatus?.activeProvider === 'gemini' ? '🧠 Gemini' : metrics?.providerStatus?.activeProvider === 'ollama' ? '🦙 Ollama' : '🎭 Demo'}
          </span>
        </div>
      </div>

      {/* Charts + Agent Grid Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginTop: '24px' }}>
        {/* Risk Distribution Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Alert Severity</h2>
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={alertData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={800}
                >
                  {alertData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {alertData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Roster */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Agent Roster</h2>
          <div className="agent-grid stagger-children">
            {(metrics?.agents || []).map((agent) => (
              <div
                key={agent.type}
                className="glass-card glass-card--interactive agent-card animate-slide-up"
                style={{ '--agent-color': AGENT_COLORS[agent.type] || 'var(--accent-primary)' }}
              >
                <div className="agent-card__header">
                  <div className="agent-card__avatar">
                    <span>{agent.emoji}</span>
                    <div className="agent-card__pulse" />
                  </div>
                  <div>
                    <div className="agent-card__name">{agent.name}</div>
                    <div className="agent-card__role" style={{ color: AGENT_COLORS[agent.type] }}>
                      {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} Agent
                    </div>
                  </div>
                </div>
                <div className={`agent-card__status agent-card__status--${agent.status}`}>
                  <span className="agent-card__status-dot" />
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Alerts Table */}
      {metrics?.alertsList?.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Active Alerts</h2>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Title</th>
                  <th>Agent</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {metrics.alertsList.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <span className={`badge badge--${alert.severity}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{alert.title}</td>
                    <td>{alert.agent_type || '—'}</td>
                    <td>{new Date(alert.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
