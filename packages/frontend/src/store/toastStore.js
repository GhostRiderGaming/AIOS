/**
 * @fileoverview Global toast notification store.
 * Used to surface errors, successes, and info messages from any component.
 */

import { create } from 'zustand';

let _toastId = 0;

export const useToastStore = create((set) => ({
  toasts: [],

  /**
   * Add a toast notification.
   * @param {{ message: string, type?: 'success'|'error'|'info'|'warning', duration?: number }} toast
   */
  addToast: ({ message, type = 'info', duration = 4000 }) => {
    const id = ++_toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, timestamp: Date.now() }],
    }));

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
