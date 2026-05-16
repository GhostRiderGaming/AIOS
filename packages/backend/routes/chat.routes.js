/**
 * @fileoverview Chat routes — /api/v1/chat/*
 */

import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatMessageSchema } from '@aios/shared/validators';

const router = Router();

router.post('/message', requireAuth, validate(chatMessageSchema), chatController.sendMessage);
router.get('/conversations', requireAuth, chatController.getConversations);
router.get('/conversations/:id', requireAuth, chatController.getMessages);

export default router;
