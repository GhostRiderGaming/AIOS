# ARCHITECTURE.md — AIOS System Architecture

> **Last Updated:** 2026-05-16  
> **Architecture Style:** Modular Layered + Multi-Agent

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│                 AIOS — System Overview                │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │          PRESENTATION LAYER (Frontend)          │  │
│  │  React SPA · Zustand · CSS Modules · Vite      │  │
│  └─────────────────────┬──────────────────────────┘  │
│                        │ HTTP/REST                    │
│  ┌─────────────────────▼──────────────────────────┐  │
│  │           API GATEWAY (Backend)                 │  │
│  │  Express.js · JWT Auth · Validation             │  │
│  └──┬─────────┬─────────┬─────────┬───────────────┘  │
│  ┌──▼──┐  ┌───▼──┐  ┌──▼──┐  ┌───▼────────────┐    │
│  │Auth │  │Agent │  │Data │  │Services         │    │
│  │Svc  │  │Svc   │  │Svc  │  │(AI, Security)  │    │
│  └──┬──┘  └───┬──┘  └──┬──┘  └───┬────────────┘    │
│  ┌──▼─────────▼─────────▼─────────▼────────────┐    │
│  │           DATA ACCESS LAYER                  │    │
│  │  SQLite · better-sqlite3 · FTS5              │    │
│  └──────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────┐    │
│  │        AI INFERENCE ENGINE (Local)            │    │
│  │  Ollama · Gemini Fallback · Safety Filters   │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
AIOS/
├── PROJECT_CONTEXT.md
├── ARCHITECTURE.md
├── CODING_RULES.md
├── FEATURE_LOG.md
├── package.json              # Root workspace config
├── .env.example
├── .gitignore
├── packages/
│   ├── frontend/             # PRESENTATION LAYER
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx
│   │       ├── index.css     # Global styles + tokens
│   │       ├── components/
│   │       │   ├── common/   # Buttons, Cards, Modals
│   │       │   ├── layout/   # Header, Sidebar, Shell
│   │       │   └── agents/   # Agent-specific UI
│   │       ├── pages/
│   │       ├── hooks/
│   │       ├── store/        # Zustand stores
│   │       ├── services/     # API client (api.js)
│   │       └── utils/
│   ├── backend/              # API GATEWAY + SERVICES
│   │   ├── package.json
│   │   ├── server.js
│   │   ├── config/
│   │   ├── middleware/       # auth, validate, errors
│   │   ├── routes/
│   │   ├── controllers/      # Thin request handlers
│   │   ├── services/         # Business logic
│   │   ├── models/           # DB models / SQL
│   │   ├── database/         # migrations, seeds
│   │   └── utils/
│   ├── ai-engine/            # AI INFERENCE ENGINE
│   │   ├── package.json
│   │   ├── index.js
│   │   ├── providers/        # ollama, gemini
│   │   ├── router.js         # Model routing
│   │   ├── safety/           # guardrails, hallucination
│   │   └── utils/
│   └── agents/               # MULTI-AGENT FRAMEWORK
│       ├── package.json
│       ├── index.js
│       ├── core/             # orchestrator, planner, registry
│       ├── agents/           # security, reasoning, data, code
│       ├── tools/            # fileSystem, database, webSearch
│       ├── security/         # permissions, auditTrail, redTeam
│       └── utils/
├── shared/                   # Cross-package utilities
│   ├── constants.js
│   ├── errors.js
│   └── validators.js
├── data/                     # Local data (gitignored)
├── scripts/                  # setup, migrate, seed
└── tests/
```

---

## 3. Layer Responsibilities

### Presentation Layer (`packages/frontend/`)
- UI rendering, user interaction, client-side state
- NO business logic — components receive props, emit events
- All API calls through `services/api.js`
- State via Zustand stores only

### API Gateway (`packages/backend/routes/`, `controllers/`)
- HTTP routing, validation, response formatting
- Controllers are THIN: validate → call service → respond
- NO direct database access from controllers

### Business Logic (`packages/backend/services/`)
- ALL business rules live here
- Framework-agnostic (no Express req/res)
- Unit-testable in isolation

### Data Access (`packages/backend/models/`)
- Encapsulates ALL SQL queries
- No raw SQL outside models
- Sequential, reversible migrations

### AI Engine (`packages/ai-engine/`)
- Provider pattern for LLM backends
- Fallback chain: Ollama → Gemini → Error
- All outputs pass through safety guardrails

### Agent Framework (`packages/agents/`)
- All agents extend `BaseAgent`
- Orchestrator manages lifecycle and delegation
- Tools sandboxed with permission checks
- All actions audit-logged

---

## 4. Data Flow

### Chat → Multi-Agent Response
```
User → Frontend → POST /api/chat/message → Auth Middleware
→ ChatService → Orchestrator → [ReasoningAgent, DataAgent, ...]
→ AI Engine (Ollama/Gemini) → ResultAggregator
→ Save to DB → JSON Response → Frontend → User
```

### Agent Security Flow
```
Agent Action → Permission Check → Guardrail Validation
→ Execution Sandbox → Hallucination Check → Audit Log → Result
```

### Model Routing
```
Request → Is Ollama available? → Yes → Local inference
                                → No → Gemini key set? → Yes → Cloud
                                                        → No → Error
```

---

## 5. API Endpoints (`/api/v1`)

| Method | Endpoint                  | Auth | Description                |
|--------|---------------------------|------|----------------------------|
| POST   | `/auth/register`          | No   | Create account             |
| POST   | `/auth/login`             | No   | Authenticate → JWT         |
| GET    | `/auth/me`                | Yes  | Current user profile       |
| POST   | `/chat/message`           | Yes  | Send message → agent reply |
| GET    | `/chat/conversations`     | Yes  | List conversations         |
| GET    | `/agents`                 | Yes  | List agents                |
| POST   | `/agents/:id/invoke`      | Yes  | Invoke specific agent      |
| GET    | `/system/health`          | No   | Health check               |
| GET    | `/security/audit-log`     | Yes  | Audit trail                |
| POST   | `/security/red-team/run`  | Yes  | Red-team test suite        |

---

## 6. Security Architecture

- **Auth:** JWT (24h expiry), bcrypt (cost 12), httpOnly cookies
- **Agent Security:** Per-agent permissions, execution sandbox, guardrails
- **Audit:** Every action logged with timestamp, actor, result
- **Data:** Local-only storage, no telemetry, optional encryption

---

## 7. Agent Personalities

| Agent | ID | Role | Personality | Tone | Color |
|-------|-----|------|-------------|------|-------|
| 🛡️ Security Sentinel | `security` | Threat detection, access monitoring, anomaly flagging | Strict, defensive, zero-tolerance | *"⚠️ ALERT: Unauthorized access detected..."* | `#ef4444` Red |
| 📋 Governance Auditor | `governance` | Compliance checking, policy enforcement, regulation mapping | Methodical, regulation-focused, by-the-book | *"Compliance Check: SOC 2 Section CC6.1..."* | `#3b82f6` Blue |
| 🔍 Intelligence Analyst | `intelligence` | Pattern analysis, risk scoring, threat correlation | Analytical, evidence-driven, probabilistic | *"Pattern Analysis: Confidence 87%..."* | `#a855f7` Purple |
| ⚙️ Workflow Coordinator | `workflow` | Task synthesis, remediation planning, action sequencing | Operational, solution-oriented, pragmatic | *"Remediation Plan: Step 1..."* | `#22c55e` Green |
| 💻 Code Architect | `code` | Code generation, technical solutions, architecture review | Precise, modular, security-aware | *"Implementation: Using sandboxed execution..."* | `#f59e0b` Amber |

---

## 8. Demo Mode Architecture

Since the MVP runs without Ollama or Gemini API, **Demo Mode is the primary inference path**.

```
User Input → Demo Interceptor
  ├─ Fuzzy-match against known scenarios
  ├─ Select matching agent responses (pre-scripted)
  ├─ Simulate realistic delays (200-800ms per agent)
  ├─ Trigger agent activation animations
  ├─ Generate audit trail entries
  └─ Return deterministic, vetted responses
```

### Provider Priority
```
1. Demo Provider   ← CURRENT PRIMARY (always available)
2. Ollama Provider ← Future (when installed)
3. Gemini Provider ← Future (when API key added)
```

---

## 9. Module Dependencies

```
shared          → (none)
ai-engine       → shared
agents          → shared, ai-engine
backend         → shared, ai-engine, agents
frontend        → shared (constants, via build)
```

**Circular dependencies are FORBIDDEN.**
