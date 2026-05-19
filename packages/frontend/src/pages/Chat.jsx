/**
 * @fileoverview Agent Chat page — multi-agent conversation with LIVE pipeline visualization.
 * Features: SSE streaming, pipeline tracker, markdown rendering, file upload,
 *           provider badges, copy-to-clipboard, export report, suggestion prompts,
 *           pipeline metrics display, tool invocation badges.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../store/chatStore.js';
import { api } from '../services/api.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Upload, Paperclip, X, Bot, User, Cpu, Zap, Wrench,
  Copy, Check, Download, ChevronDown, ChevronUp, Clock, BarChart3,
} from 'lucide-react';

const AGENT_COLORS = {
  security: '#ef4444',
  governance: '#3b82f6',
  intelligence: '#a855f7',
  workflow: '#22c55e',
  code: '#f59e0b',
};

const SUGGESTIONS = [
  'Analyze this access log for security anomalies',
  'Run a compliance audit on our data pipeline',
  'Generate a rate limiter implementation',
  'What can you do?',
];

export function Chat() {
  const {
    messages, conversationId, isLoading, sendMessage,
    pipelineState, activeAgent, completedAgents, pipelineMetrics,
  } = useChatStore();
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [messages, activeAgent]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() && !uploadedFile) return;

    const messageText = uploadedFile
      ? `${input.trim() || 'Analyze this file'}\n\n📎 File attached: ${uploadedFile.fileName}`
      : input.trim();

    await sendMessage(messageText, uploadedFile?.fileId);
    setInput('');
    setUploadedFile(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const content = await file.text();
      const result = await api.uploadFile(file.name, content);
      setUploadedFile({ fileId: result.fileId, fileName: file.name, size: result.size });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
  };

  return (
    <div className="app-content chat-page">
      <div className="chat-messages" id="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty animate-fade-in">
            <div className="chat-empty__icon">
              <Bot size={48} strokeWidth={1.5} />
            </div>
            <p className="chat-empty__text">
              Ask anything — your query will be analyzed by multiple
              <br />specialized agents working together. Try:
            </p>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chat-suggestion" onClick={() => handleSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatMessage key={msg.id || i} message={msg} />
          ))
        )}

        {/* ═══ LIVE PIPELINE TRACKER ═══ */}
        {pipelineState && pipelineState.status === 'running' && (
          <PipelineTracker
            agents={pipelineState.agents}
            activeAgent={activeAgent}
            completedAgents={completedAgents}
          />
        )}

        {/* ═══ PIPELINE METRICS (post-completion) ═══ */}
        {pipelineMetrics && !isLoading && (
          <PipelineMetrics metrics={pipelineMetrics} />
        )}

        {isLoading && !pipelineState && (
          <div className="chat-message chat-message--system animate-fade-in">
            <div className="chat-message__avatar chat-message__avatar--system">
              <Cpu size={18} className="animate-pulse" />
            </div>
            <div className="chat-message__body">
              <div className="chat-message__sender">Pipeline Processing</div>
              <div className="chat-message__content">
                <span className="typing-indicator">
                  <span /><span /><span />
                </span>
                Connecting to agents...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ═══ EXPORT BAR ═══ */}
      {messages.filter((m) => m.role === 'agent').length > 0 && !isLoading && (
        <ExportBar messages={messages} />
      )}

      {/* Input Bar */}
      <form className="chat-input-bar" onSubmit={handleSubmit}>
        {uploadedFile && (
          <div className="chat-file-chip">
            <Paperclip size={14} />
            <span>{uploadedFile.fileName}</span>
            <button type="button" onClick={() => setUploadedFile(null)} className="chat-file-chip__remove">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="chat-input-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".log,.csv,.txt,.json,.xml,.yaml,.yml"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="chat-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload file for agent analysis"
          >
            <Upload size={20} />
          </button>
          <input
            className="chat-input"
            type="text"
            placeholder="Ask the AIOS agents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            id="chat-input-field"
          />
          <button
            className="chat-send-btn"
            type="submit"
            disabled={isLoading || (!input.trim() && !uploadedFile)}
            id="chat-send-button"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * ═══ PIPELINE TRACKER — The WOW Factor ═══
 * Shows a visual pipeline: 🛡️ ✅ → 📋 🔄 → 🔍 ⏳ → ⚙️ ⏳
 */
function PipelineTracker({ agents, activeAgent, completedAgents }) {
  return (
    <div className="pipeline-tracker animate-slide-up">
      <div className="pipeline-tracker__header">
        <Cpu size={14} className="animate-pulse" />
        <span>Sequential Pipeline Active</span>
      </div>
      <div className="pipeline-tracker__steps">
        {agents.map((agent, i) => {
          const isCompleted = completedAgents.includes(agent.type);
          const isActive = activeAgent === agent.type;

          return (
            <div key={agent.type} className="pipeline-tracker__step-wrapper">
              <div
                className={`pipeline-tracker__step ${
                  isCompleted ? 'pipeline-tracker__step--completed' :
                  isActive ? 'pipeline-tracker__step--active' :
                  'pipeline-tracker__step--pending'
                }`}
                style={{ '--agent-color': AGENT_COLORS[agent.type] }}
              >
                <span className="pipeline-tracker__emoji">{agent.emoji}</span>
                <span className="pipeline-tracker__name">{agent.name}</span>
                <span className="pipeline-tracker__status-icon">
                  {isCompleted ? '✅' : isActive ? (
                    <span className="pipeline-tracker__spinner" />
                  ) : '⏳'}
                </span>
              </div>
              {i < agents.length - 1 && (
                <div className={`pipeline-tracker__connector ${isCompleted ? 'pipeline-tracker__connector--active' : ''}`}>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="pipeline-tracker__progress">
        <div
          className="pipeline-tracker__progress-bar"
          style={{ width: `${((completedAgents.length) / agents.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * ═══ PIPELINE METRICS — Post-completion stats ═══
 * Shows total agents, latency, and routing method after pipeline finishes.
 */
function PipelineMetrics({ metrics }) {
  return (
    <div className="pipeline-metrics animate-fade-in">
      <div className="pipeline-metrics__item">
        <BarChart3 size={13} />
        <span>{metrics.totalAgents} agents</span>
      </div>
      <div className="pipeline-metrics__item">
        <Clock size={13} />
        <span>{metrics.latencyFormatted}</span>
      </div>
      <div className="pipeline-metrics__item">
        <Zap size={13} />
        <span>Pipeline Complete</span>
      </div>
    </div>
  );
}

/**
 * Export bar — Copy all findings or export as formatted report.
 */
function ExportBar({ messages }) {
  const [copied, setCopied] = useState(false);

  const agentMessages = messages.filter((m) => m.role === 'agent');

  const handleCopyAll = async () => {
    const report = agentMessages
      .map((m) => `## ${m.metadata?.emoji || '🤖'} ${m.metadata?.agentName || m.agent_type}\n\n${m.content}`)
      .join('\n\n---\n\n');

    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const report = [
      `# AIOS Agent Analysis Report`,
      `Generated: ${new Date().toLocaleString()}`,
      `Agents: ${agentMessages.length}`,
      `Provider: ${agentMessages[0]?.metadata?.provider || 'unknown'}`,
      '',
      '---',
      '',
      ...agentMessages.map((m) =>
        `## ${m.metadata?.emoji || '🤖'} ${m.metadata?.agentName || m.agent_type}\n\n${m.content}`
      ),
    ].join('\n');

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aios-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-bar animate-fade-in">
      <span className="export-bar__label">
        {agentMessages.length} agent{agentMessages.length !== 1 ? 's' : ''} responded
      </span>
      <div className="export-bar__actions">
        <button className="export-bar__btn" onClick={handleCopyAll} title="Copy all findings">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy All'}
        </button>
        <button className="export-bar__btn" onClick={handleExport} title="Download as markdown report">
          <Download size={14} />
          Export Report
        </button>
      </div>
    </div>
  );
}

/**
 * Individual chat message component with markdown rendering, copy button, and tool badges.
 */
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAgent = message.role === 'agent';
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const agentColor = isAgent ? AGENT_COLORS[message.agent_type] || '#888' : undefined;
  const provider = message.metadata?.provider;
  const toolsUsed = message.metadata?.toolsUsed || [];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`chat-message chat-message--${message.role} animate-fade-in`}>
      <div
        className={`chat-message__avatar chat-message__avatar--${message.role}`}
        style={agentColor ? { borderColor: agentColor } : undefined}
      >
        {isUser ? (
          <User size={18} />
        ) : isSystem ? (
          <Cpu size={18} />
        ) : (
          <span className="chat-message__emoji">{message.metadata?.emoji || '🤖'}</span>
        )}
      </div>
      <div className="chat-message__body">
        <div className="chat-message__header">
          <span
            className="chat-message__sender"
            style={agentColor ? { color: agentColor } : undefined}
          >
            {isUser ? 'You' : isSystem ? 'Orchestrator' : message.metadata?.agentName || message.agent_type}
          </span>
          {provider && provider !== 'error' && (
            <span className={`provider-badge provider-badge--${provider}`}>
              {provider === 'gemini' ? <><Zap size={10} /> Gemini Live</> : provider === 'demo' ? '🎭 Demo' : provider}
            </span>
          )}
          {/* ═══ TOOL INVOCATION BADGES ═══ */}
          {toolsUsed.length > 0 && (
            <div className="tool-badges">
              {toolsUsed.map((tool) => (
                <span key={tool} className="tool-badge">
                  <Wrench size={10} />
                  {tool}
                </span>
              ))}
            </div>
          )}
          {isAgent && (
            <div className="chat-message__actions">
              <button className="chat-action-btn" onClick={handleCopy} title="Copy">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
              <button className="chat-action-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
                {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="chat-message__content">
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {collapsed && (
          <div className="chat-message__collapsed" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Response collapsed — click ↓ to expand
          </div>
        )}
      </div>
    </div>
  );
}
