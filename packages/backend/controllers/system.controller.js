/**
 * @fileoverview System and security controller.
 */

import { systemService, securityService } from '../services/system.service.js';

export const systemController = {
  async health(_req, res) {
    res.json({ data: await systemService.getHealth() });
  },

  async metrics(_req, res, next) {
    try {
      res.json({ data: await systemService.getMetrics() });
    } catch (error) {
      next(error);
    }
  },
};

export const securityController = {
  async getAuditLogs(req, res, next) {
    try {
      const result = securityService.getAuditLogs(req.query);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async getAlerts(_req, res, next) {
    try {
      const alerts = securityService.getAlerts();
      res.json({ data: alerts });
    } catch (error) {
      next(error);
    }
  },

  async getPermissions(_req, res, next) {
    try {
      const permissions = securityService.getPermissions();
      res.json({ data: permissions });
    } catch (error) {
      next(error);
    }
  },
};
