# AIOS — AI Operating System

> Privacy-first multi-agent governance platform for enterprise security operations.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/GhostRiderGaming/AIOS)

![Dashboard](docs/screenshots/dashboard.png)

## 🎯 What is AIOS?

AIOS is a **web-based AI agent platform** that orchestrates multiple specialized AI agents in a sequential pipeline to analyze security threats, enforce compliance, and automate enterprise workflows.

**Key Innovation:** Unlike simple chatbots, AIOS runs a **sequential inter-agent pipeline** where each agent builds upon the findings of its predecessors — creating a genuine chain of reasoning:

```
Security Sentinel → Governance Auditor → Intelligence Analyst → Workflow Coordinator → Code Architect
         ↓                    ↓                     ↓                      ↓                    ↓
    Detect threats    →  Check compliance   →  Correlate patterns  →  Create action plan  →  Generate code
```

## ✨ Features

### Multi-Agent Pipeline
- **🛡️ Security Sentinel** — Threat detection, MITRE ATT&CK mapping, anomaly flagging
- **📋 Governance Auditor** — SOC 2, GDPR, HIPAA compliance checking with regulation citations
- **🔍 Intelligence Analyst** — Pattern analysis, risk scoring (0-10), predictive forecasting
- **⚙️ Workflow Coordinator** — Remediation planning, task sequencing, timeline estimation
- **💻 Code Architect** — Security-aware code generation, vulnerability review

### Enterprise Capabilities
- **File Upload & Scanning** — Upload `.log`, `.csv`, `.json` files for automated security analysis
- **Real Log Scanner** — Regex-based detection of SQLi, XSS, brute force, privilege escalation
- **Audit Trail** — Every agent action is logged with timestamps and metadata
- **Role-Based Access** — Admin, Analyst, Viewer roles with JWT authentication
- **Interactive Dashboard** — Real-time metrics, severity charts, agent status monitoring

### AI Infrastructure
- **Gemini 2.0 Flash** — Primary inference engine with rich system prompts per agent
- **Automatic Fallback** — Gemini → Ollama (local) → Demo mode
- **Deep Prompt Inspection** — Lobster Trap DPI governance layer (architecture ready)
- **Provider Badges** — UI shows which AI provider generated each response

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  Dashboard │ Agent Chat │ Agent Hub │ Security Panel        │
├────────────────────────────────────────────────────────────┤
│                    Backend (Express.js)                     │
│  Auth │ Chat │ Upload │ System │ Security  ← REST API       │
├────────────────────────────────────────────────────────────┤
│                   Agent Framework                          │
│  Orchestrator (Sequential Pipeline)                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Security │ Govern.  │ Intel.   │ Workflow │  Code    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
├────────────────────────────────────────────────────────────┤
│                    AI Engine (Model Router)                 │
│  Gemini Provider │ Ollama Provider │ Demo Provider          │
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
- Email: `admin@aios.dev`
- Password: `admin123`

## 📦 Project Structure

```
AIOS/
├── packages/
│   ├── frontend/          # React + Vite SPA
│   │   └── src/
│   │       ├── pages/     # Dashboard, Chat, AgentHub, SecurityPanel
│   │       ├── components/# Layout, shared UI
│   │       ├── store/     # Zustand state management
│   │       └── services/  # API client
│   ├── backend/           # Express.js API server
│   │   ├── routes/        # REST endpoints
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models (sql.js)
│   │   └── middleware/    # Auth, validation, error handling
│   ├── agents/            # Multi-agent framework
│   │   ├── agents/        # BaseAgent, specialized agents
│   │   ├── core/          # Orchestrator, Registry
│   │   └── tools/         # Log scanner, file analysis
│   └── ai-engine/         # AI provider abstraction
│       ├── providers/     # Gemini, Ollama, Demo
│       └── router.js      # Provider selection + fallback
└── shared/                # Constants, validators, errors
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Zustand, Recharts, ReactMarkdown |
| Backend | Express.js, sql.js (SQLite), JWT |
| AI | Gemini 2.0 Flash, Ollama (local), Demo fallback |
| Deployment | Render.com / Docker |

## 🔐 Security

- JWT-based authentication with httpOnly cookie support
- Role-based access control (RBAC)
- Input validation with Zod schemas
- Content Security Policy headers
- File upload type/size validation
- All agent actions audited

## 📄 License

MIT — Built for the Enterprise AI Hackathon 2026
