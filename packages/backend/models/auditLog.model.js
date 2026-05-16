/**
 * @fileoverview Audit log and security alert data access models.
 */

import { queryAll, queryOne, execute, getDb } from '../config/database.js';

export const auditLogModel = {
  create({ eventType, agentType, userId, action, details, result, riskLevel }) {
    const { lastId } = execute(
      'INSERT INTO audit_logs (event_type, agent_type, user_id, action, details, result, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
      eventType,
      agentType || null,
      userId || null,
      action,
      JSON.stringify(details || {}),
      result || null,
      riskLevel || 'low',
    );
    return queryOne('SELECT * FROM audit_logs WHERE id = ?', lastId);
  },

  query({ agentType, eventType, page = 1, pageSize = 20 } = {}) {
    let where = 'WHERE 1=1';
    const params = [];

    if (agentType) {
      where += ' AND agent_type = ?';
      params.push(agentType);
    }
    if (eventType) {
      where += ' AND event_type = ?';
      params.push(eventType);
    }

    const countResult = queryOne(
      `SELECT COUNT(*) as count FROM audit_logs ${where}`,
      ...params,
    );
    const total = countResult?.count || 0;

    const offset = (page - 1) * pageSize;
    const data = queryAll(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      ...params,
      pageSize,
      offset,
    );

    return { data, total, page, pageSize };
  },

  getRecent(limit = 10) {
    return queryAll(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?',
      limit,
    );
  },

  countByRiskLevel() {
    const rows = queryAll(
      'SELECT risk_level, COUNT(*) as count FROM audit_logs GROUP BY risk_level',
    );
    return rows.reduce((acc, row) => ({ ...acc, [row.risk_level]: row.count }), {});
  },
};

export const securityAlertModel = {
  getActive() {
    return queryAll(
      'SELECT * FROM security_alerts WHERE resolved = 0 ORDER BY created_at DESC',
    );
  },

  query({ page = 1, pageSize = 20 } = {}) {
    const countResult = queryOne('SELECT COUNT(*) as count FROM security_alerts');
    const total = countResult?.count || 0;

    const data = queryAll(
      'SELECT * FROM security_alerts ORDER BY created_at DESC LIMIT ? OFFSET ?',
      pageSize,
      (page - 1) * pageSize,
    );

    return { data, total, page, pageSize };
  },

  create({ severity, title, description, agentType }) {
    const { lastId } = execute(
      'INSERT INTO security_alerts (severity, title, description, agent_type) VALUES (?, ?, ?, ?)',
      severity,
      title,
      description,
      agentType || null,
    );
    return queryOne('SELECT * FROM security_alerts WHERE id = ?', lastId);
  },
};
