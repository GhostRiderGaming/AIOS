/**
 * @fileoverview System and security service — metrics, audit, alerts.
 */

import { auditLogModel, securityAlertModel } from '../models/auditLog.model.js';
import { queryAll } from '../config/database.js';
import { AGENT_PROFILES } from '@aios/shared/constants';
import { getAIEngine } from '@aios/ai-engine';
import config from '../config/index.js';

export const systemService = {
  /**
   * Get system health status.
   * @returns {Promise<Object>}
   */
  async getHealth() {
    const aiEngine = getAIEngine();
    const providerStatus = await aiEngine.getStatus();

    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      demoMode: config.demo.enabled,
      activeProvider: providerStatus.activeProvider,
      version: '0.1.0',
    };
  },

  /**
   * Get system metrics overview.
   * @returns {Promise<Object>}
   */
  async getMetrics() {
    const riskCounts = auditLogModel.countByRiskLevel();
    const recentLogs = auditLogModel.getRecent(5);
    const activeAlerts = securityAlertModel.getActive();

    // Get AI provider status
    let providerStatus = { activeProvider: 'demo' };
    try {
      const aiEngine = getAIEngine();
      providerStatus = await aiEngine.getStatus();
    } catch {
      // AI engine may not be initialized yet
    }

    return {
      agents: Object.entries(AGENT_PROFILES).map(([type, profile]) => ({
        type,
        name: profile.name,
        emoji: profile.emoji,
        color: profile.color,
        description: profile.description,
        status: 'idle',
      })),
      auditSummary: riskCounts,
      recentActivity: recentLogs,
      activeAlerts: activeAlerts.length,
      alertsList: activeAlerts,
      demoMode: config.demo.enabled,
      providerStatus,
    };
  },
};


export const securityService = {
  /**
   * Query audit logs with filtering.
   * @param {Object} query
   * @returns {Object}
   */
  getAuditLogs(query) {
    return auditLogModel.query(query);
  },

  /**
   * Get active security alerts.
   * @returns {Array}
   */
  getAlerts() {
    return securityAlertModel.getActive();
  },

  /**
   * Get agent permission matrix.
   * @returns {Array}
   */
  getPermissions() {
    return queryAll(
      'SELECT * FROM agent_permissions ORDER BY agent_type, permission',
    );
  },
};
