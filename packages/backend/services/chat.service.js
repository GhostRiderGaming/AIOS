/**
 * @fileoverview Chat service — orchestrates message handling, file analysis, and agent dispatch.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  conversationModel,
  messageModel,
} from '../models/conversation.model.js';
import { auditLogModel } from '../models/auditLog.model.js';
import { AUDIT_EVENTS } from '@aios/shared/constants';
import fs from 'fs';
import path from 'path';
import config from '../config/index.js';

export const chatService = {
  /**
   * Process an incoming chat message.
   * Creates conversation if needed, saves user message, dispatches to agent system.
   * @param {{ userId: number, message: string, conversationId?: string, fileId?: string }} data
   * @returns {{ conversation: Object, userMessage: Object, agentResponses: Array, pipeline: boolean }}
   */
  async processMessage({ userId, message, conversationId, fileId }) {
    // Create or retrieve conversation
    let conversation;
    if (conversationId) {
      conversation = conversationModel.findById(conversationId);
    }
    if (!conversation) {
      conversationId = uuidv4();
      const title = message.slice(0, 60) + (message.length > 60 ? '...' : '');
      conversation = conversationModel.create({
        id: conversationId,
        userId,
        title,
      });
    }

    // Load file contents if fileId provided
    let fileContents = null;
    if (fileId) {
      fileContents = this._loadFileContents(fileId);
      if (fileContents) {
        auditLogModel.create({
          eventType: AUDIT_EVENTS.FILE_SCANNED,
          userId,
          action: `File ${fileId} attached to chat for agent analysis`,
          details: { fileId, size: fileContents.length },
          result: 'success',
        });
      }
    }

    // Save user message
    const userMessage = messageModel.create({
      conversationId: conversation.id,
      role: 'user',
      content: message,
      metadata: fileId ? { fileId } : undefined,
    });

    // Dispatch to agent orchestrator
    const { orchestrate } = await import('@aios/agents');
    const orchestrationResult = await orchestrate({
      input: message,
      userId,
      conversationId: conversation.id,
      fileContents,
    });

    // Save agent responses
    const agentResponses = [];

    // Save system message (orchestrator pipeline plan)
    if (orchestrationResult.plan) {
      messageModel.create({
        conversationId: conversation.id,
        role: 'system',
        content: orchestrationResult.plan,
      });
    }

    // Save each agent response
    for (const agentResult of orchestrationResult.results) {
      const saved = messageModel.create({
        conversationId: conversation.id,
        role: 'agent',
        agentType: agentResult.agentType,
        content: agentResult.content,
        metadata: agentResult.metadata,
      });
      agentResponses.push(saved);

      // Audit log
      auditLogModel.create({
        eventType: AUDIT_EVENTS.AGENT_COMPLETED,
        agentType: agentResult.agentType,
        userId,
        action: `Processed task: ${message.slice(0, 80)}`,
        details: {
          messageId: saved.id,
          provider: agentResult.metadata?.provider,
          pipeline: true,
        },
        result: agentResult.metadata?.error ? 'error' : 'success',
      });
    }

    // Update conversation timestamp
    conversationModel.updateTitle(conversation.id, conversation.title);

    return {
      conversation,
      userMessage,
      agentResponses,
      pipeline: orchestrationResult.pipeline,
    };
  },

  /**
   * Load file contents from disk by fileId.
   * @param {string} fileId
   * @returns {string|null}
   * @private
   */
  _loadFileContents(fileId) {
    try {
      const uploadDir = path.resolve(config.upload.dir);
      if (!fs.existsSync(uploadDir)) return null;

      const files = fs.readdirSync(uploadDir);
      const match = files.find((f) => f.startsWith(fileId));
      if (!match) return null;

      const content = fs.readFileSync(path.join(uploadDir, match), 'utf-8');
      // Cap at 50KB for context window
      return content.slice(0, 50000);
    } catch {
      return null;
    }
  },

  /**
   * Get all conversations for a user.
   * @param {number} userId
   * @returns {Array}
   */
  getConversations(userId) {
    return conversationModel.findByUserId(userId);
  },

  /**
   * Get messages for a conversation.
   * @param {string} conversationId
   * @returns {Array}
   */
  getMessages(conversationId) {
    return messageModel.findByConversation(conversationId);
  },

  /**
   * Process a message with streaming callbacks for SSE.
   * Each agent result is streamed as it completes.
   * @param {{ userId: number, message: string, conversationId?: string, fileId?: string }} data
   * @param {{ onPipelineStart: Function, onAgentStart: Function, onAgentComplete: Function, onPipelineDone: Function }} callbacks
   * @returns {Promise<{ conversation: Object, userMessage: Object, agentResponses: Array }>}
   */
  async processMessageStreaming({ userId, message, conversationId, fileId }, callbacks = {}) {
    // Create or retrieve conversation
    let conversation;
    if (conversationId) {
      conversation = conversationModel.findById(conversationId);
    }
    if (!conversation) {
      conversationId = uuidv4();
      const title = message.slice(0, 60) + (message.length > 60 ? '...' : '');
      conversation = conversationModel.create({ id: conversationId, userId, title });
    }

    // Load file contents if fileId provided
    let fileContents = null;
    if (fileId) {
      fileContents = this._loadFileContents(fileId);
    }

    // Save user message
    const userMessage = messageModel.create({
      conversationId: conversation.id,
      role: 'user',
      content: message,
      metadata: fileId ? { fileId } : undefined,
    });

    // Dispatch with streaming callbacks
    const { orchestrateStreaming } = await import('@aios/agents');
    const agentResponses = [];

    const streamCallbacks = {
      onPipelineStart: (data) => {
        // Save system message
        messageModel.create({
          conversationId: conversation.id,
          role: 'system',
          content: data.plan,
        });
        callbacks.onPipelineStart?.({ ...data, conversation, userMessage });
      },
      onAgentStart: (data) => {
        callbacks.onAgentStart?.(data);
      },
      onAgentComplete: (agentResult) => {
        // Save to DB as it arrives
        const saved = messageModel.create({
          conversationId: conversation.id,
          role: 'agent',
          agentType: agentResult.agentType,
          content: agentResult.content,
          metadata: agentResult.metadata,
        });
        agentResponses.push(saved);

        auditLogModel.create({
          eventType: AUDIT_EVENTS.AGENT_COMPLETED,
          agentType: agentResult.agentType,
          userId,
          action: `Processed task: ${message.slice(0, 80)}`,
          details: { messageId: saved.id, provider: agentResult.metadata?.provider, pipeline: true },
          result: agentResult.metadata?.error ? 'error' : 'success',
        });

        callbacks.onAgentComplete?.({ ...agentResult, messageId: saved.id });
      },
      onPipelineDone: (data) => {
        conversationModel.updateTitle(conversation.id, conversation.title);
        callbacks.onPipelineDone?.(data);
      },
    };

    await orchestrateStreaming({ input: message, userId, conversationId: conversation.id, fileContents }, streamCallbacks);

    return { conversation, userMessage, agentResponses };
  },
};
