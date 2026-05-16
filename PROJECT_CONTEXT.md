# PROJECT_CONTEXT.md — AIOS Project Memory

> **Last Updated:** 2026-05-16
> **Owner:** GhostRiderGaming
> **License:** MIT

---

## 1. Vision

**AIOS** (Artificial Intelligence Operating System) — a privacy-first, cloud-independent operating system shell with an integrated local AI engine powered by multi-agent architecture.

### Short-Term (Hackathon MVP — May 2026)
Build a functional prototype demonstrating:
- Local multi-agent orchestration (no cloud dependency)
- Enterprise-grade agent security & governance (Track 1 alignment)
- Agentic workflows with tool-calling capabilities (Agent Olympics alignment)
- Real-time agent collaboration and task delegation

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
- **Secondary Track:** 🤖 Track 2 — AI Agents (Gemini integration as optional cloud fallback)
- **Venue:** San Jose McEnery Convention Center (hybrid)
- **Key Deliverables:**
  - Guardrails and safety layers for agentic workflows
  - Monitoring/observability for AI agents (hallucination detection, drift, misuse)
  - Access control & permission framework for multi-agent systems
  - Audit trails and explainability tooling
  - Red-teaming framework for agent robustness

### Hackathon B: AI Agent Olympics
- **Dates:** May 13–20, 2026
- **Prize Pool:** $32,000+
- **Primary Track:** 🧠 Intelligent Reasoning + 🤝 Collaborative Systems
- **Secondary Track:** 🔄 Agentic Workflows + 🌍 Enterprise Utility
- **Venue:** Fiera Milano, Italy (hybrid)
- **Key Deliverables:**
  - Autonomous agents with independent decision-making
  - Multi-agent coordination and information sharing
  - Tool-calling (APIs, databases, file system)
  - Multi-step task management without human intervention

---

## 3. Technology Stack

### Frontend
| Layer         | Technology                | Purpose                          |
|---------------|---------------------------|----------------------------------|
| Framework     | Vite + React 18           | Fast SPA with HMR               |
| Language      | JavaScript (ES2022+)      | Browser & Node compatibility     |
| Styling       | Vanilla CSS + CSS Modules | Scoped, no-framework styling     |
| State         | Zustand                   | Lightweight global state         |
| Routing       | React Router v6           | Client-side navigation           |
| Icons         | Lucide React              | Consistent icon system           |
| Fonts         | Inter (Google Fonts)      | Modern typography                |

### Backend
| Layer         | Technology                | Purpose                          |
|---------------|---------------------------|----------------------------------|
| Runtime       | Node.js 20 LTS           | Server runtime                   |
| Framework     | Express.js                | REST API server                  |
| Language      | JavaScript (ES2022+)      | Shared language with frontend    |
| Database      | SQLite (better-sqlite3)   | Local-first, zero-config DB      |
| Auth          | JWT + bcrypt              | Stateless authentication         |
| Validation    | Zod                       | Schema validation                |

### AI / Agent Layer
| Layer         | Technology                | Purpose                          |
|---------------|---------------------------|----------------------------------|
| Local LLM     | Ollama (llama3, mistral)  | Privacy-first local inference    |
| Fallback LLM  | Google Gemini API         | Cloud fallback (optional)        |
| Agent Framework | Custom multi-agent system | Orchestration, delegation        |
| Embeddings   | Ollama embeddings         | Local vector search              |
| Vector Store  | In-memory / SQLite FTS5   | Local knowledge retrieval        |

### DevOps
| Layer         | Technology                | Purpose                          |
|---------------|---------------------------|----------------------------------|
| Package Mgr   | npm                       | Dependency management            |
| Monorepo      | npm workspaces            | Shared deps across packages      |
| Linting       | ESLint + Prettier         | Code quality                     |
| Version Ctrl  | Git                       | Source control                   |
| Testing       | Vitest                    | Unit & integration testing       |

---

## 4. Key Flows

### Agent Orchestration Flow
```
User Input → AgentRouter → TaskPlanner → [Agent Pool]
                                            ├─ SecurityAgent
                                            ├─ ReasoningAgent
                                            ├─ DataAgent
                                            ├─ CodeAgent
                                            └─ MonitorAgent
                                         → ResultAggregator → Response
```

### Authentication Flow
```
Register/Login → bcrypt hash → JWT issued → Token stored (httpOnly cookie)
→ Protected routes validate JWT → Role-based access control
```

### AI Inference Flow
```
User Query → Preprocessor → ModelRouter
                              ├─ Ollama (local, preferred)
                              └─ Gemini API (fallback)
                           → PostProcessor → Safety Filter → Response
```

### Agent Security Flow
```
Agent Action → Permission Check → Guardrail Validation
→ Execution Sandbox → Audit Logger → Action Result
```

---

## 5. Dependencies Map

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│  React, Zustand, React Router, Lucide       │
├─────────────────────────────────────────────┤
│                API Gateway                   │
│  Express.js REST endpoints                  │
├──────────┬──────────┬───────────────────────┤
│ Auth     │ Agents   │ Services              │
│ JWT      │ Router   │ AI Inference          │
│ bcrypt   │ Planner  │ Security Monitor      │
│ RBAC     │ Pool     │ Audit Logger          │
├──────────┴──────────┴───────────────────────┤
│              Data Layer                      │
│  SQLite (better-sqlite3) + FTS5             │
├─────────────────────────────────────────────┤
│           AI Inference Engine               │
│  Ollama (local) / Gemini API (fallback)     │
└─────────────────────────────────────────────┘
```

---

## 6. Environment Variables

| Variable              | Required | Default          | Description                     |
|-----------------------|----------|------------------|---------------------------------|
| `PORT`                | No       | `3001`           | Backend server port             |
| `JWT_SECRET`          | Yes      | —                | JWT signing secret              |
| `DB_PATH`             | No       | `./data/aios.db` | SQLite database path            |
| `OLLAMA_BASE_URL`     | No       | `http://localhost:11434` | Ollama API endpoint      |
| `OLLAMA_MODEL`        | No       | `llama3`         | Default Ollama model            |
| `GEMINI_API_KEY`      | No       | —                | Google Gemini API key           |
| `NODE_ENV`            | No       | `development`    | Runtime environment             |
| `VITE_API_URL`        | No       | `http://localhost:3001` | Frontend API target      |

---

## 7. Current Status

| Milestone                 | Status      |
|---------------------------|-------------|
| Repository initialized    | ✅ Complete |
| Project documentation     | ✅ Complete |
| Folder structure          | 🔲 Pending  |
| Backend scaffold          | 🔲 Pending  |
| Frontend scaffold         | 🔲 Pending  |
| AI service integration    | 🔲 Pending  |
| Agent framework           | 🔲 Pending  |
| Security & governance     | 🔲 Pending  |
| Multi-agent orchestration | 🔲 Pending  |
| Demo-ready MVP            | 🔲 Pending  |

---

## 8. Decision Log

| Date       | Decision                                      | Rationale                                    |
|------------|-----------------------------------------------|----------------------------------------------|
| 2026-05-16 | JavaScript over TypeScript                    | Speed of development for hackathon timeline  |
| 2026-05-16 | SQLite over PostgreSQL                        | Zero-config, local-first, privacy aligned    |
| 2026-05-16 | Ollama as primary AI engine                   | Local inference, no cloud dependency         |
| 2026-05-16 | Gemini as optional fallback                   | Hackathon Track 2 alignment                  |
| 2026-05-16 | Monorepo with npm workspaces                  | Shared utilities, single repo management     |
| 2026-05-16 | Custom agent framework over LangChain/CrewAI  | Full control, lightweight, hackathon scope   |
| 2026-05-16 | Dual-hackathon targeting                      | Maximize exposure and prize potential         |
