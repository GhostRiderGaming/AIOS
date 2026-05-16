/**
 * @fileoverview API service — centralized fetch wrapper.
 * All backend API calls go through this module.
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

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  getProfile: () => request('/auth/me'),

  // Chat
  sendMessage: (body) => request('/chat/message', { method: 'POST', body }),
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
