/**
 * @fileoverview Auth store — manages authentication state.
 */

import { create } from 'zustand';
import { api } from '../services/api.js';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('aios_token'),
  isAuthenticated: !!localStorage.getItem('aios_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await api.login({ email, password });
      localStorage.setItem('aios_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await api.register({ email, password, name });
      localStorage.setItem('aios_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('aios_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const user = await api.getProfile();
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('aios_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
