/**
 * @fileoverview Chat store — manages conversations and messages.
 */

import { create } from 'zustand';
import { api } from '../services/api.js';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  conversationId: null,
  messages: [],
  isLoading: false,
  isSending: false,

  fetchConversations: async () => {
    try {
      const conversations = await api.getConversations();
      set({ conversations });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  },

  loadConversation: async (id) => {
    set({ isLoading: true });
    try {
      const messages = await api.getMessages(id);
      set({ currentConversation: id, conversationId: id, messages, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to load conversation:', error);
    }
  },

  sendMessage: async (message, fileId = null) => {
    const { conversationId } = get();

    // Optimistically add user message
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, optimisticMsg],
      isLoading: true,
      isSending: true,
    }));

    try {
      const result = await api.sendMessage({
        message,
        conversationId,
        fileId,
      });

      // Replace optimistic message and add agent responses
      set((state) => ({
        messages: [
          ...state.messages.filter((m) => m.id !== optimisticMsg.id),
          result.userMessage,
          ...(result.agentResponses || []),
        ],
        conversationId: result.conversation.id,
        currentConversation: result.conversation.id,
        isLoading: false,
        isSending: false,
      }));

      return result;
    } catch (error) {
      // Remove optimistic message on failure
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== optimisticMsg.id),
        isLoading: false,
        isSending: false,
      }));
      console.error('Send failed:', error);
      throw error;
    }
  },

  clearChat: () => set({ messages: [], currentConversation: null, conversationId: null }),
}));
