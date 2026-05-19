# AIOS — AI Operating System

> 🏆 Multi-agent enterprise governance platform with live Gemini AI inference.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/GhostRiderGaming/AIOS)

## 🎯 What is AIOS?

AIOS is a **web-based AI agent platform** that orchestrates multiple specialized AI agents in a **sequential pipeline** to analyze security threats, enforce compliance, and automate enterprise workflows — powered by **Google Gemini 2.5 Flash**.

**Key Innovation:** Unlike simple chatbots, AIOS runs a **sequential inter-agent pipeline** where each agent builds upon the findings of its predecessors — creating a genuine chain of reasoning:

```
🛡️ Security Sentinel → 📋 Governance Auditor → 🔍 Intelligence Analyst → ⚙️ Workflow Coordinator → 💻 Code Architect
        ↓                        ↓                       ↓                        ↓                       ↓
   Detect threats      →  Check compliance     →  Correlate patterns   →  Create action plan   →  Generate code
   (MITRE ATT&CK)        (SOC 2, GDPR)           (Risk Score 9.0/10)     (4-step remediation)    (Security-aware)
```

Each agent receives the **full context of all prior agents**, enabling genuine collaborative intelligence.

## ✨ Features

### 🧠 Multi-Agent Sequential Pipeline
- **🛡️ Security Sentinel** — Threat detection, MITRE ATT&CK mapping, anomaly flagging
- **📋 Governance Auditor** — SOC 2, GDPR, HIPAA compliance checking with regulation citations
- **🔍 Intelligence Analyst** — Pattern analysis, risk scoring (0-10), confidence percentages
- **⚙️ Workflow Coordinator** — Remediation planning, task sequencing, timeline estimation
- **💻 Code Architect** — Security-aware code generation, vulnerability review

### 🏢 Enterprise Capabilities
- **File Upload & Scanning** — Upload `.log`, `.csv`, `.json` files for automated security analysis
- **Real Log Scanner** — Regex-based detection of 10+ threat patterns (SQLi, XSS, brute force, etc.)
- **Audit Trail** — Every agent action logged with timestamps, actor, provider, and metadata
- **Role-Based Access** — Admin, Analyst, Viewer roles with JWT authentication
- **Interactive Dashboard** — Real-time metrics, severity charts, agent status grid

### ⚡ AI Infrastructure
- **Gemini 2.5 Flash** — Primary inference engine with rich system prompts per agent
- **Auto-Fallback** — Gemini → Ollama (local) → Demo mode (deterministic)
- **Provider Badges** — UI shows which AI provider generated each response
- **Pipeline Context** — Each agent receives findings from all prior agents in the pipeline

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  Dashboard │ Agent Chat │ Agent Hub │ Security Panel        │
├────────────────────────────────────────────────────────────┤
│                    Backend (Express.js)                     │
│  Auth │ Chat │ Upload │ System │ Security  ← REST API       │
├────────────────────────────────────────────────────────────┤
│              Agent Orchestrator (Sequential Pipeline)       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Security │ Govern.  │ Intel.   │ Workflow │  Code    │  │
│  │    ↓     │    ↓     │    ↓     │    ↓     │          │  │
│  │ context  → context  → context  → context  → context  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
├────────────────────────────────────────────────────────────┤
│                    AI Engine (Model Router)                 │
│  Gemini 2.5 Flash │ Ollama Provider │ Demo Provider        │
├────────────────────────────────────────────────────────────┤
│  SQLite (sql.js)  │  File System  │  Audit Logs            │
└────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Free [Gemini API Key](https://aistudio.google.com/apikey)

### Setup
```bash
# Clone
git clone https://github.com/GhostRiderGaming/AIOS.git
cd AIOS

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start development
npm run dev
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api/v1

### Default Login
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@aios.dev` | `admin123` |
| Analyst | `analyst@aios.dev` | `analyst123` |
| Viewer | `viewer@aios.dev` | `viewer123` |

## 📦 Project Structure

```
AIOS/
├── packages/
│   ├── frontend/          # React + Vite SPA
│   │   └── src/
│   │       ├── pages/     # Dashboard, Chat, AgentHub, SecurityPanel, Settings
│   │       ├── components/# Layout (Header, Sidebar, AppShell)
│   │       ├── store/     # Zustand (auth, chat)
│   │       └── services/  # API client
│   ├── backend/           # Express.js API server
│   │   ├── routes/        # REST endpoints
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic (auth, chat)
│   │   ├── models/        # Database models (sql.js)
│   │   └── middleware/    # Auth, validation, error handling
│   ├── agents/            # Multi-agent framework
│   │   ├── agents/        # BaseAgent + 5 specialized agents
│   │   ├── core/          # Orchestrator (sequential pipeline) + Registry
│   │   └── tools/         # Log scanner, file analysis
│   └── ai-engine/         # AI provider abstraction
│       ├── providers/     # Gemini, Ollama, Demo
│       └── router.js      # Provider selection + auto-fallback
└── shared/                # Constants, validators, errors
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Zustand, Recharts, ReactMarkdown |
| Backend | Express.js, sql.js (SQLite), JWT, dotenv |
| AI | Gemini 2.5 Flash, Ollama (local), Demo fallback |
| Deployment | Render.com / Docker |

## 🔐 Security

- JWT-based authentication with Bearer token
- Role-based access control (Admin, Analyst, Viewer)
- Input validation with Zod schemas
- File upload type whitelist + size limits (2MB)
- All agent actions audited with full metadata
- Auto-fallback prevents exposure of API errors to users

## 🌐 Deployment

### Render.com (Recommended — Free Tier)
1. Fork this repository
2. Connect to [Render.com](https://render.com)
3. Use the `render.yaml` blueprint
4. Set `GEMINI_API_KEY` in environment variables
5. Deploy!

### Docker
```bash
docker build -t aios .
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your-key \
  -e NODE_ENV=production \
  aios
```

## 📊 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account |
| POST | `/api/v1/auth/login` | No | Login → JWT |
| GET | `/api/v1/auth/me` | Yes | User profile |
| POST | `/api/v1/chat/message` | Yes | Send → pipeline response |
| GET | `/api/v1/chat/conversations` | Yes | List conversations |
| POST | `/api/v1/upload` | Yes | Upload file for analysis |
| GET | `/api/v1/system/health` | No | Health check |
| GET | `/api/v1/system/metrics` | Yes | Dashboard metrics |
| GET | `/api/v1/security/audit-log` | Yes | Audit trail |
| GET | `/api/v1/security/alerts` | Yes | Security alerts |
| GET | `/api/v1/security/permissions` | Yes | Agent permissions |

## 📄 License

MIT — Built for the Enterprise AI Hackathon 2026
