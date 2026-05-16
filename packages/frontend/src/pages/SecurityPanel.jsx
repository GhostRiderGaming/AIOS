/**
 * @fileoverview Security Panel — audit logs, alerts, and permission matrix.
 */

import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { FileText, AlertTriangle, Key } from 'lucide-react';

const AGENT_COLORS = {
  security: '#ef4444',
  governance: '#3b82f6',
  intelligence: '#a855f7',
  workflow: '#22c55e',
  code: '#f59e0b',
};

export function SecurityPanel() {
  const [tab, setTab] = useState('audit');
  const [auditData, setAuditData] = useState({ data: [], total: 0 });
  const [alerts, setAlerts] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAuditLogs({}).then(setAuditData).catch(() => {}),
      api.getAlerts().then(setAlerts).catch(() => {}),
      api.getPermissions().then(setPermissions).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'audit', label: 'Audit Trail', icon: FileText, count: auditData.total },
    { id: 'alerts', label: 'Security Alerts', icon: AlertTriangle, count: alerts.length },
    { id: 'permissions', label: 'Agent Permissions', icon: Key },
  ];

  return (
    <div className="app-content animate-fade-in">
      <div className="page-header">
        <h1 className="page-header__title">Security & Governance</h1>
        <p className="page-header__subtitle">
          Full audit trail, active alerts, and agent permission management
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '4px', border: '1px solid var(--border-subtle)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setTab(t.id)}
            style={{ flex: 1, borderRadius: 'var(--radius-sm)', border: 'none' }}
          >
            <t.icon size={16} />
            {t.label}
            {t.count !== undefined && (
              <span className="badge badge--info" style={{ marginLeft: '4px' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading security data...</p>}

      {/* Audit Trail */}
      {tab === 'audit' && !loading && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Agent</th>
                <th>Action</th>
                <th>Result</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {auditData.data.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem' }}>{log.event_type}</span>
                  </td>
                  <td>
                    <span style={{ color: AGENT_COLORS[log.agent_type] || 'var(--text-secondary)' }}>
                      {log.agent_type || '—'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-primary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.action}
                  </td>
                  <td>
                    <span className={`badge badge--${log.result === 'success' ? 'low' : log.result === 'blocked' ? 'critical' : 'medium'}`}>
                      {log.result}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge--${log.risk_level}`}>
                      {log.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alerts */}
      {tab === 'alerts' && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alert) => (
            <div key={alert.id} className="glass-card" style={{
              borderLeft: `3px solid var(--severity-${alert.severity})`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span className={`badge badge--${alert.severity}`}>{alert.severity.toUpperCase()}</span>
                  <strong style={{ fontSize: '0.95rem' }}>{alert.title}</strong>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{alert.description}</p>
              </div>
              <span style={{ color: AGENT_COLORS[alert.agent_type], fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                {alert.agent_type}
              </span>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              No active alerts — all systems secure
            </div>
          )}
        </div>
      )}

      {/* Permissions */}
      {tab === 'permissions' && !loading && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Permission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm.id}>
                  <td style={{ color: AGENT_COLORS[perm.agent_type], fontWeight: 500 }}>
                    {perm.agent_type}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {perm.permission}
                  </td>
                  <td>
                    <span className={`badge badge--${perm.allowed ? 'low' : 'critical'}`}>
                      {perm.allowed ? '✅ ALLOWED' : '🚫 DENIED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
