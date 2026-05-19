/**
 * @fileoverview System and security routes — /api/v1/system/* and /api/v1/security/*
 */

import { Router } from 'express';
import {
  systemController,
  securityController,
} from '../controllers/system.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const systemRouter = Router();
systemRouter.get('/health', systemController.health);
systemRouter.get('/metrics', requireAuth, systemController.metrics);

const securityRouter = Router();
securityRouter.get('/audit-log', requireAuth, requireRole('admin'), securityController.getAuditLogs);
securityRouter.get('/alerts', requireAuth, securityController.getAlerts);
securityRouter.get('/permissions', requireAuth, requireRole('admin', 'analyst'), securityController.getPermissions);

export { systemRouter, securityRouter };
