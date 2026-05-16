/**
 * @fileoverview Agent Chat page — multi-agent conversation with pipeline visualization.
 * Features: markdown rendering, file upload, provider badges, suggestion prompts.
 */

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore.js';
import { api } from '../services/api.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Upload, Paperclip, X, Bot, User, Cpu, Zap } from 'lucide-react';

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
  const { messages, conversationId, isLoading, sendMessage } = useChatStore();
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

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

        {isLoading && (
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
                Agents analyzing in sequence...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
 * Individual chat message component with markdown rendering.
 */
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAgent = message.role === 'agent';

  const agentColor = isAgent ? AGENT_COLORS[message.agent_type] || '#888' : undefined;
  const provider = message.metadata?.provider;

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
              {provider === 'gemini' ? <><Zap size={10} /> Gemini</> : provider === 'demo' ? '🎭 Demo' : provider}
            </span>
          )}
        </div>
        <div className="chat-message__content">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
