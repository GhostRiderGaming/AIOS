/**
 * @fileoverview Conversation and message data access model.
 */

import { queryAll, queryOne, execute } from '../config/database.js';

export const conversationModel = {
  findById(id) {
    return queryOne('SELECT * FROM conversations WHERE id = ?', id);
  },

  findByUserId(userId) {
    return queryAll(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
      userId,
    );
  },

  create({ id, userId, title }) {
    execute(
      'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)',
      id,
      userId,
      title,
    );
    return this.findById(id);
  },

  updateTitle(id, title) {
    execute(
      "UPDATE conversations SET title = ?, updated_at = datetime('now') WHERE id = ?",
      title,
      id,
    );
  },
};

export const messageModel = {
  findByConversation(conversationId) {
    return queryAll(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      conversationId,
    );
  },

  create({ conversationId, role, agentType, content, metadata }) {
    const { lastId } = execute(
      'INSERT INTO messages (conversation_id, role, agent_type, content, metadata) VALUES (?, ?, ?, ?, ?)',
      conversationId,
      role,
      agentType || null,
      content,
      JSON.stringify(metadata || {}),
    );
    return queryOne('SELECT * FROM messages WHERE id = ?', lastId);
  },
};
