/**
 * @fileoverview Header component with AI provider indicator.
 */

import { useEffect, useState } from 'react';
import { Zap, Radio, Brain } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { api } from '../../services/api.js';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const [provider, setProvider] = useState('loading');

  useEffect(() => {
    api.getMetrics()
      .then((metrics) => {
        setProvider(metrics.providerStatus?.activeProvider || 'demo');
      })
      .catch(() => setProvider('demo'));
  }, []);

  const providerConfig = {
    gemini: { label: 'Gemini Live', icon: Zap, className: '' },
    ollama: { label: 'Local Inference', icon: Brain, className: '' },
    demo: { label: 'Demo Mode', icon: Radio, className: 'local-indicator--demo' },
    loading: { label: 'Connecting...', icon: Radio, className: 'local-indicator--demo' },
  };

  const config = providerConfig[provider] || providerConfig.demo;
  const ProviderIcon = config.icon;

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>
          AI Operating System
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className={`local-indicator ${config.className}`}>
          <span className="local-indicator__dot" />
          <ProviderIcon size={14} />
          {config.label}
        </div>

        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {user.name}
          </div>
        )}
      </div>
    </header>
  );
}
