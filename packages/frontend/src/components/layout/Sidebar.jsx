/**
 * @fileoverview Sidebar navigation component.
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Shield,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <h1>AIOS</h1>
        <span className="logo-badge">MVP</span>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-title">Main</span>
        <NavLink to="/" end>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/chat">
          <MessageSquare size={18} />
          Agent Chat
        </NavLink>
        <NavLink to="/agents">
          <Bot size={18} />
          Agent Hub
        </NavLink>

        <span className="sidebar-section-title">Security</span>
        <NavLink to="/security">
          <Shield size={18} />
          Security Panel
        </NavLink>

        <span className="sidebar-section-title">System</span>
        <NavLink to="/settings">
          <Settings size={18} />
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-nav" onClick={logout} style={{ width: '100%' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <LogOut size={18} />
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
