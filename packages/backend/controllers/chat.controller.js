/**
 * @fileoverview Chat controller — handles chat message requests.
 * Includes both standard REST and SSE streaming endpoints.
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

  /**
   * SSE streaming endpoint — streams each agent's response as it completes.
   * The frontend sees agents appear one-by-one with a live pipeline tracker.
   */
  async sendMessageStream(req, res) {
    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx compatibility
    });

    const send = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await chatService.processMessageStreaming(
        {
          userId: req.user.id,
          message: req.body.message,
          conversationId: req.body.conversationId,
          fileId: req.body.fileId,
        },
        {
          onPipelineStart: (data) => send('pipeline:start', {
            plan: data.plan,
            agents: data.agents,
            conversationId: data.conversation?.id,
          }),
          onAgentStart: (data) => send('agent:start', data),
          onAgentComplete: (data) => send('agent:complete', {
            agentType: data.agentType,
            agentName: data.agentName,
            emoji: data.emoji,
            content: data.content,
            metadata: data.metadata,
            messageId: data.messageId,
          }),
          onPipelineDone: (data) => send('pipeline:done', data),
        },
      );
    } catch (error) {
      send('error', { message: error.message });
    } finally {
      res.end();
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
