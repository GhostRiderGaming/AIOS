/**
 * @fileoverview Login page with sleek dark design.
 */

import { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@aios.local');
  const [password, setPassword] = useState('demo1234');
  const [name, setName] = useState('');
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch {
      // Error is set in store
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
          }}>
            AIOS
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
            Privacy-first AI Operating System
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '16px',
            color: 'var(--severity-critical)',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError(); }}
                required={isRegister}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
              style={{
                width: '100%',
                padding: '12px 12px 12px 42px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
              style={{
                width: '100%',
                padding: '12px 12px 12px 42px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem', fontWeight: 600 }}
          >
            {isLoading ? 'Signing in...' : (
              <>
                {isRegister ? 'Create Account' : 'Sign In'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => { setIsRegister(!isRegister); clearError(); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
            }}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
        }}>
          Demo credentials: demo@aios.local / demo1234
        </div>
      </div>
    </div>
  );
}
