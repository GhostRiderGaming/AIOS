/**
 * @fileoverview Global toast notification component.
 * Renders stacked notifications with auto-dismiss and severity colors.
 */

import { useToastStore } from '../store/toastStore.js';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_COLORS = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '400px',
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => {
        const Icon = TOAST_ICONS[toast.type] || Info;
        const color = TOAST_COLORS[toast.type] || TOAST_COLORS.info;
        return (
          <div
            key={toast.id}
            className="animate-slide-up"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: `1px solid ${color}40`,
              borderLeft: `3px solid ${color}`,
              boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 12px ${color}20`,
              backdropFilter: 'blur(20px)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              pointerEvents: 'auto',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ flex: 1, lineHeight: 1.5 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
