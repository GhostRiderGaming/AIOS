# PROJECT_CONTEXT.md — AIOS Project Memory

> **Last Updated:** 2026-05-19
> **Owner:** GhostRiderGaming
> **License:** MIT
> **Status:** ✅ Production-Ready

---

## 1. Vision

**AIOS** (Artificial Intelligence Operating System) — a privacy-first, multi-agent enterprise governance platform with live AI inference and sequential pipeline orchestration.

### Short-Term (Hackathon MVP — May 2026)
Built and delivered:
- ✅ Live multi-agent orchestration with Gemini 2.5 Flash
- ✅ Enterprise-grade agent security & governance (Track 1 alignment)
- ✅ Agentic workflows with tool-calling capabilities (Agent Olympics alignment)
- ✅ Sequential agent collaboration with shared pipeline context
- ✅ Full audit trail and explainability
- ✅ SSE streaming pipeline with live visualization (WOW factor)
- ✅ Copy/export agent findings as Markdown reports
- ✅ Mobile-responsive layout with comprehensive breakpoints

### Long-Term
A complete operating system with:
- Inbuilt local AI inference engine
- Full privacy and security guarantees
- Multi-agent principle at every layer
- Zero cloud dependency for core operations

---

## 2. Hackathon Targets

### Hackathon A: Transforming Enterprise Through AI
- **Dates:** May 11–19, 2026
- **Prize Pool:** $10,000
- **Primary Track:** 🔐 Track 1 — Agent Security & AI Governance
- **Secondary Track:** 🤖 Track 2 — AI Agents (Gemini integration live)
- **Key Deliverables:**
  - ✅ Guardrails and safety layers for agentic workflows
  - ✅ Monitoring/observability for AI agents
  - ✅ Access control & permission framework for multi-agent systems
  - ✅ Audit trails and explainability tooling

### Hackathon B: AI Agent Olympics
- **Dates:** May 13–20, 2026
- **Prize Pool:** $32,000+
- **Primary Track:** 🧠 Intelligent Reasoning + 🤝 Collaborative Systems
- **Key Deliverables:**
  - ✅ Autonomous agents with independent decision-making
  - ✅ Multi-agent coordination and information sharing
  - ✅ Tool-calling: 6 real tools (LogScanner, IPEnrichment, CodeValidator, ComplianceChecker, CorrelationEngine, ActionPlanner)
  - ✅ Multi-step task management via sequential pipeline
  - ✅ 178 test assertions, 12 test groups, zero failures

---

## 3. Technology Stack

### Frontend
| Layer         | Technology                | Purpose                          |
|---------------|---------------------------|----------------------------------|
| Framework     | Vite + React 18           | Fast SPA with HMR               |
| Language      | JavaScript (ES2022+)      | Browser & Node compatibility     |
| Styling       | Vanilla CSS               | Scoped, no-framework styling     |
| State         | Zustand                   | Lightweight global state + pipeline tracking |
| Routing       | React Router v7           | Client-side navigation           |
| Icons         | Lucide React              | Consistent icon system           |
| Charts        | Recharts                  | Dashboard analytics              |
| Markdown      | ReactMarkdown             | AI response formatting           |
| Fonts         | Inter (Google Fonts)      | Modern typography                |
| Streaming     | SSE (ReadableStream)      | Real-time pipeline visualization |

### Backend
| Layer         | Technology                | Purpose                          |
|---------------|---------------------------|----------------------------------|
| Runtime       | Node.js 20 LTS            | Server runtime                   |
| Framework     | Express.js                | REST API + SSE streaming server  |
| Language      | JavaScript (ES2022+)      | Shared language with frontend    |
| Database      | SQLite (sql.js)            | Pure-JS, zero-config DB          |
| Auth          | JWT + bcrypt               | Stateless authentication         |
| Validation    | Zod                        | Schema validation                |
| Env Loading   | dotenv                     | .env file reading                |
| Streaming     | text/event-stream (SSE)    | Real-time agent result delivery  |

### AI / Agent Layer
| Layer           | Technology                | Purpose                          |
|-----------------|---------------------------|----------------------------------|
| Primary LLM     | Gemini 2.5 Flash (API)    | Live cloud inference             |
| Local LLM       | Ollama (llama3, mistral)  | Privacy-first local inference    |
| Demo Fallback   | DemoProvider              | Deterministic scripted responses |
| Agent Framework | Custom multi-agent system | Sequential pipeline orchestration|
| Tools (6)       | LogScanner, IPEnrichment, CodeValidator, ComplianceChecker, CorrelationEngine, ActionPlanner | Deterministic analysis engines |

### DevOps
| Layer         | Technology                | Purpose                          |
|---------------|---------------------------|----------------------------------|
| Package Mgr   | npm                       | Dependency management            |
| Monorepo      | npm workspaces            | Shared deps across packages      |
| Version Ctrl  | Git + GitHub              | Source control                   |
| Deployment    | Render.com / Docker       | Free-tier cloud hosting          |
| CI            | render.yaml blueprint     | One-click deploy                 |

---

## 4. Key Flows

### Agent Orchestration Flow (Sequential Pipeline)
```
User Input → Orchestrator → AI Engine (getRespondingAgents)
  → Security Sentinel   [LogScanner + IPEnrichment]    → scanReport + ipReport
  → Governance Auditor  [ComplianceChecker]             → complianceReport (score, grade)
  → Intelligence Analyst [CorrelationEngine]            → correlationReport (risk, correlations)
  → Workflow Coordinator [ActionPlanner]                → actionPlan (prioritized steps)
  → Code Architect      [CodeValidator]                 → securityReview (score, CWE findings)
  → Response with all agent results + structured metadata
```

### Authentication Flow
```
Register/Login → bcrypt hash → JWT issued → Token in localStorage
→ Protected routes validate JWT → Role-based access control
```

### AI Inference Flow (Auto-Fallback)
```
User Query → ModelRouter
               ├─ Gemini 2.5 Flash (cloud, primary) ← ACTIVE
               ├─ Ollama (local, if running)
               └─ Demo Provider (deterministic fallback)
            → Agent System Prompt → Safety Settings → Response
```

### File Analysis Flow
```
File Upload → Save to disk → Attach to chat message
→ LogScanner regex analysis (10 threat patterns)
→ IPEnrichment (extract & classify IPs)
→ Inject file contents + tool results into agent pipeline context
→ Each subsequent agent receives prior tool outputs as structured metadata
```

---

## 5. Dependencies Map

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│  React, Zustand, React Router, Recharts     │
│  ReactMarkdown, Lucide, Inter Font          │
├─────────────────────────────────────────────┤
│                API Gateway                   │
│  Express.js REST endpoints + CORS           │
├──────────┬──────────┬───────────────────────┤
│ Auth     │ Agents   │ Services              │
│ JWT      │ Router   │ AI Inference          │
│ bcrypt   │ Pipeline │ Log Scanner           │
│ RBAC     │ Registry │ Audit Logger          │
├──────────┴──────────┴───────────────────────┤
│              Data Layer                      │
│  SQLite (sql.js) — pure JavaScript          │
├─────────────────────────────────────────────┤
│           AI Inference Engine               │
│  Gemini 2.5 Flash │ Ollama │ Demo Provider  │
└─────────────────────────────────────────────┘
```

---

## 6. Environment Variables

| Variable              | Required | Default                  | Description                     |
|-----------------------|----------|--------------------------|---------------------------------|
| `PORT`                | No       | `3001`                   | Backend server port             |
| `JWT_SECRET`          | Yes      | `dev-secret-*`           | JWT signing secret              |
| `DB_PATH`             | No       | `./data/aios.db`         | SQLite database path            |
| `OLLAMA_BASE_URL`     | No       | `http://localhost:11434` | Ollama API endpoint             |
| `OLLAMA_MODEL`        | No       | `llama3`                 | Default Ollama model            |
| `GEMINI_API_KEY`      | Yes      | —                        | Google Gemini API key           |
| `GEMINI_MODEL`        | No       | `gemini-2.5-flash`       | Gemini model to use             |
| `NODE_ENV`            | No       | `development`            | Runtime environment             |
| `VITE_API_URL`        | No       | `http://localhost:3001`  | Frontend API target             |
| `DEMO_MODE`           | No       | `false`                  | Force demo mode (true/false)    |
| `UPLOAD_DIR`          | No       | `./data/uploads`         | File upload directory           |

---

## 7. Current Status

| Milestone                 | Status      |
|---------------------------|-------------|
| Repository initialized    | ✅ Complete |
| Project documentation     | ✅ Complete |
| Folder structure          | ✅ Complete |
| Backend scaffold          | ✅ Complete |
| Frontend scaffold         | ✅ Complete |
| AI service integration    | ✅ Complete |
| Agent framework           | ✅ Complete |
| Security & governance     | ✅ Complete |
| Multi-agent orchestration | ✅ Complete |
| Gemini Live inference     | ✅ Complete |
| File upload & scanning    | ✅ Complete |
| Sequential pipeline       | ✅ Complete |
| Dashboard & analytics     | ✅ Complete |
| Agent Hub visualization   | ✅ Complete |
| Render deployment config  | ✅ Complete |
| Demo-ready MVP            | ✅ Complete |
| Real tools (all 5 agents) | ✅ Complete |
| Infrastructure hardening  | ✅ Complete |
| Comprehensive test suite  | ✅ Complete |

---

## 8. Decision Log

| Date       | Decision                                      | Rationale                                    |
|------------|-----------------------------------------------|----------------------------------------------|
| 2026-05-16 | JavaScript over TypeScript                    | Speed of development for hackathon timeline  |
| 2026-05-16 | SQLite over PostgreSQL                        | Zero-config, local-first, privacy aligned    |
| 2026-05-16 | sql.js over better-sqlite3                    | Pure JS, no native build issues on Node 26   |
| 2026-05-16 | Ollama as local AI engine                     | Local inference, no cloud dependency         |
| 2026-05-16 | Gemini as cloud primary                       | Hackathon Track 2 alignment, free tier       |
| 2026-05-16 | Monorepo with npm workspaces                  | Shared utilities, single repo management     |
| 2026-05-16 | Custom agent framework over LangChain/CrewAI  | Full control, lightweight, hackathon scope   |
| 2026-05-16 | Dual-hackathon targeting                      | Maximize exposure and prize potential         |
| 2026-05-18 | Sequential pipeline over parallel execution   | True inter-agent reasoning chain required    |
| 2026-05-18 | dotenv for env loading                        | ES module hoisting prevents inline config    |
| 2026-05-19 | Gemini 2.5 Flash over 2.0 Flash               | Free-tier quota exhausted on 2.0 Flash       |
| 2026-05-19 | Render.com over Vultr                         | Free tier, no credit card, instant deploy    |
| 2026-05-19 | Deterministic tools over LLM parsing          | Pattern-matching engines > regex-on-LLM-output |
| 2026-05-19 | Rate limiter in standalone middleware         | Circular import prevention (server↔routes)   |
| 2026-05-19 | Per-user rate limiting (after auth)           | IP-based is useless behind proxies/NAT       |
| 2026-05-19 | Regex route `/.*/` for SPA fallback           | Fixes Express 5 / path-to-regexp 8 `*` crash |
