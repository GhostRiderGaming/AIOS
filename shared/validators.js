/**
 * @fileoverview Shared Zod validation schemas for AIOS.
 * Import from '@aios/shared/validators'.
 *
 * Note: Zod is a dependency of the backend package.
 * These schemas are imported by backend services and controllers.
 */

import { z } from 'zod';
import { AGENT_TYPES, ROLES, PERMISSIONS } from './constants.js';


// ─── Auth Schemas ───────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(Object.values(ROLES)).optional().default(ROLES.VIEWER),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});


// ─── Chat Schemas ───────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000),
  conversationId: z.string().uuid().optional().nullable(),
  agentTarget: z.enum(Object.values(AGENT_TYPES)).optional().nullable(),
  fileId: z.string().uuid().optional().nullable(),
});


// ─── Agent Schemas ──────────────────────────────────────────

export const agentInvokeSchema = z.object({
  input: z.string().min(1, 'Input is required').max(4000),
  context: z.record(z.any()).optional().default({}),
});

export const agentPermissionSchema = z.object({
  agentType: z.enum(Object.values(AGENT_TYPES)),
  permission: z.enum(Object.values(PERMISSIONS)),
  allowed: z.boolean(),
});


// ─── System Schemas ─────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const auditLogQuerySchema = paginationSchema.extend({
  agentType: z.enum(Object.values(AGENT_TYPES)).optional(),
  eventType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
