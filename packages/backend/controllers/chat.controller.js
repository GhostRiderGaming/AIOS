/**
 * @fileoverview Chat controller — handles chat message requests.
 */

import { chatService } from '../services/chat.service.js';

export const chatController = {
  async sendMessage(req, res, next) {
    try {
      const result = await chatService.processMessage({
        userId: req.user.id,
        message: req.body.message,
        conversationId: req.body.conversationId,
        fileId: req.body.fileId,
      });
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async getConversations(req, res, next) {
    try {
      const conversations = chatService.getConversations(req.user.id);
      res.json({ data: conversations });
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req, res, next) {
    try {
      const messages = chatService.getMessages(req.params.id);
      res.json({ data: messages });
    } catch (error) {
      next(error);
    }
  },
};
