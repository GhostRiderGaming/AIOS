/**
 * @fileoverview Chat store — manages conversations, messages, and pipeline state.
 * Supports both standard and SSE streaming message delivery.
 * Surfaces errors via toast notifications instead of silent console.error.
 */

import { create } from 'zustand';
import { api } from '../services/api.js';
import { useToastStore } from './toastStore.js';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  conversationId: null,
  messages: [],
  isLoading: false,
  isSending: false,

  // ─── Pipeline Streaming State ───────────────────────────────
  pipelineState: null, // null | { agents: [], status: 'running' | 'done' }
  activeAgent: null,   // Currently processing agent type
  completedAgents: [], // Array of completed agent types

  // ─── Pipeline Metrics (Token Tracking) ──────────────────────
  pipelineMetrics: null, // { totalAgents, latencyMs, routingMethod }

  fetchConversations: async () => {
    try {
      const conversations = await api.getConversations();
      set({ conversations });
    } catch (error) {
      useToastStore.getState().addToast({ message: `Failed to load conversations: ${error.message}`, type: 'error' });
    }
  },

  loadConversation: async (id) => {
    set({ isLoading: true });
    try {
      const messages = await api.getMessages(id);
      set({ currentConversation: id, conversationId: id, messages, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      useToastStore.getState().addToast({ message: `Failed to load conversation: ${error.message}`, type: 'error' });
    }
  },

  /**
   * Send a message using SSE streaming — agents appear one at a time.
   * Falls back to the standard endpoint if streaming fails.
   */
  sendMessage: async (message, fileId = null) => {
    const { conversationId } = get();

    // Optimistically add user message
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };
    const startTime = Date.now();
    set((state) => ({
      messages: [...state.messages, optimisticMsg],
      isLoading: true,
      isSending: true,
      pipelineState: null,
      activeAgent: null,
      completedAgents: [],
      pipelineMetrics: null,
    }));

    try {
      let agentCount = 0;

      await api.sendMessageStream(
        { message, conversationId, fileId },
        {
          onPipelineStart: (data) => {
            set((state) => ({
              conversationId: data.conversationId || state.conversationId,
              pipelineState: { agents: data.agents, status: 'running' },
              // Add the orchestrator plan as a system message
              messages: [
                ...state.messages.filter((m) => m.id !== optimisticMsg.id),
                { id: `user-${Date.now()}`, role: 'user', content: message, created_at: new Date().toISOString() },
                { id: `plan-${Date.now()}`, role: 'system', content: data.plan, created_at: new Date().toISOString() },
              ],
            }));
          },

          onAgentStart: (data) => {
            set({ activeAgent: data.agentType });
          },

          onAgentComplete: (data) => {
            agentCount++;
            set((state) => ({
              activeAgent: null,
              completedAgents: [...state.completedAgents, data.agentType],
              // Append agent response message
              messages: [
                ...state.messages,
                {
                  id: data.messageId || `agent-${Date.now()}-${data.agentType}`,
                  role: 'agent',
                  agent_type: data.agentType,
                  content: data.content,
                  metadata: {
                    ...data.metadata,
                    agentName: data.agentName,
                    emoji: data.emoji,
                  },
                  created_at: new Date().toISOString(),
                },
              ],
            }));
          },

          onPipelineDone: (data) => {
            const latencyMs = Date.now() - startTime;
            set((state) => ({
              isLoading: false,
              isSending: false,
              pipelineState: state.pipelineState
                ? { ...state.pipelineState, status: 'done' }
                : null,
              activeAgent: null,
              pipelineMetrics: {
                totalAgents: agentCount,
                latencyMs,
                latencyFormatted: latencyMs > 1000 ? `${(latencyMs / 1000).toFixed(1)}s` : `${latencyMs}ms`,
                ...data,
              },
            }));
            useToastStore.getState().addToast({
              message: `Pipeline complete — ${agentCount} agents in ${latencyMs > 1000 ? (latencyMs / 1000).toFixed(1) + 's' : latencyMs + 'ms'}`,
              type: 'success',
              duration: 3000,
            });
          },

          onError: (data) => {
            useToastStore.getState().addToast({ message: `Pipeline error: ${data.message}`, type: 'error' });
            set({ isLoading: false, isSending: false, pipelineState: null });
          },
        },
      );
    } catch (error) {
      // Fallback to non-streaming if SSE fails
      console.warn('SSE streaming failed, falling back to standard endpoint:', error.message);
      try {
        const result = await api.sendMessage({ message, conversationId, fileId });
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
          pipelineState: null,
        }));
      } catch (fallbackError) {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== optimisticMsg.id),
          isLoading: false,
          isSending: false,
          pipelineState: null,
        }));
        useToastStore.getState().addToast({
          message: `Failed to send message: ${fallbackError.message}`,
          type: 'error',
          duration: 6000,
        });
      }
    }
  },

  clearChat: () => set({
    messages: [],
    currentConversation: null,
    conversationId: null,
    pipelineState: null,
    activeAgent: null,
    completedAgents: [],
    pipelineMetrics: null,
  }),
}));
