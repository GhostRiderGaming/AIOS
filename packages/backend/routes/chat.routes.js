/**
 * @fileoverview Chat routes — /api/v1/chat/*
 * Rate limiting applied AFTER auth so it uses userId, not IP.
 */

import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatMessageSchema } from '@aios/shared/validators';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Viewers can read conversations but NOT send messages
// rateLimit runs AFTER requireAuth so req.user.id is available
router.post('/message', requireAuth, requireRole('admin', 'analyst'), rateLimit, validate(chatMessageSchema), chatController.sendMessage);
router.post('/stream', requireAuth, requireRole('admin', 'analyst'), rateLimit, validate(chatMessageSchema), chatController.sendMessageStream);
router.get('/conversations', requireAuth, chatController.getConversations);
router.get('/conversations/:id', requireAuth, chatController.getMessages);

export default router;
