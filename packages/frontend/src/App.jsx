/**
 * @fileoverview AIOS root application component.
 * Handles routing, authentication, and layout.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore.js';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Header } from './components/layout/Header.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Chat } from './pages/Chat.jsx';
import { AgentHub } from './pages/AgentHub.jsx';
import { SecurityPanel } from './pages/SecurityPanel.jsx';
import { Login } from './pages/Login.jsx';

function ProtectedLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/agents" element={<AgentHub />} />
          <Route path="/security" element={<SecurityPanel />} />
          <Route path="/settings" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {isAuthenticated ? (
          <Route path="/*" element={<ProtectedLayout />} />
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
