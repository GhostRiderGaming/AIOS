/**
 * @fileoverview API service — centralized fetch wrapper.
 * All backend API calls go through this module.
 * Includes SSE streaming for real-time pipeline updates.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';

/**
 * Make an authenticated API request.
 * @param {string} endpoint - API endpoint path (e.g. '/auth/login')
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${API_PREFIX}${endpoint}`;
  const token = localStorage.getItem('aios_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error?.message || 'Request failed',
      data.error?.code || 'UNKNOWN',
      response.status,
    );
  }

  return data.data;
}

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Send a message via SSE streaming — receives agent responses one at a time.
 * @param {{ message: string, conversationId?: string, fileId?: string }} body
 * @param {{ onPipelineStart: Function, onAgentStart: Function, onAgentComplete: Function, onPipelineDone: Function, onError: Function }} callbacks
 * @returns {Promise<void>}
 */
async function sendMessageStream(body, callbacks = {}) {
  const url = `${API_BASE}${API_PREFIX}/chat/stream`;
  const token = localStorage.getItem('aios_token');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error?.message || 'Stream failed',
      errorData.error?.code || 'STREAM_ERROR',
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from the buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    let currentEvent = null;
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ') && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6));
          switch (currentEvent) {
            case 'pipeline:start':
              callbacks.onPipelineStart?.(data);
              break;
            case 'agent:start':
              callbacks.onAgentStart?.(data);
              break;
            case 'agent:complete':
              callbacks.onAgentComplete?.(data);
              break;
            case 'pipeline:done':
              callbacks.onPipelineDone?.(data);
              break;
            case 'error':
              callbacks.onError?.(data);
              break;
          }
        } catch {
          // Skip malformed JSON
        }
        currentEvent = null;
      }
    }
  }
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  getProfile: () => request('/auth/me'),

  // Chat
  sendMessage: (body) => request('/chat/message', { method: 'POST', body }),
  sendMessageStream,
  getConversations: () => request('/chat/conversations'),
  getMessages: (id) => request(`/chat/conversations/${id}`),

  // System
  getHealth: () => request('/system/health'),
  getMetrics: () => request('/system/metrics'),

  // Security
  getAuditLogs: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/security/audit-log${qs ? `?${qs}` : ''}`);
  },
  getAlerts: () => request('/security/alerts'),
  getPermissions: () => request('/security/permissions'),

  // File Upload
  uploadFile: (name, content) => request('/upload', {
    method: 'POST',
    body: { name, content },
  }),
};

export { ApiError };
