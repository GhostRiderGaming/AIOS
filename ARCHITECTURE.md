# ARCHITECTURE.md — AIOS System Architecture

> **Last Updated:** 2026-05-19  
> **Architecture Style:** Modular Layered + Sequential Multi-Agent Pipeline

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│                 AIOS — System Overview                │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │          PRESENTATION LAYER (Frontend)          │  │
│  │  React SPA · Zustand · Recharts · Vite         │  │
│  │  Pages: Dashboard, Chat, AgentHub, Security    │  │
│  └─────────────────────┬──────────────────────────┘  │
│                        │ HTTP/REST                    │
│  ┌─────────────────────▼──────────────────────────┐  │
│  │           API GATEWAY (Backend)                 │  │
│  │  Express.js · JWT Auth · Zod Validation        │  │
│  │  dotenv · CORS · Cookie Parser                 │  │
│  └──┬─────────┬─────────┬─────────┬───────────────┘  │
│  ┌──▼──┐  ┌───▼──┐  ┌──▼──┐  ┌───▼────────────┐    │
│  │Auth │  │Chat  │  │Upload│  │System/Security │    │
│  │Svc  │  │Svc   │  │Svc   │  │(Health, Audit) │    │
│  └──┬──┘  └───┬──┘  └──┬──┘  └───┬────────────┘    │
│  ┌──▼─────────▼─────────▼─────────▼────────────┐    │
│  │        AGENT ORCHESTRATOR (Sequential)       │    │
│  │  Security → Governance → Intel → Workflow    │    │
│  │  Pipeline Context Sharing Between Agents     │    │
│  └──────────────────┬──────────────────────────┘    │
│  ┌──────────────────▼──────────────────────────┐    │
│  │           AI ENGINE (Model Router)           │    │
│  │  Gemini 2.5 Flash · Ollama · Demo Provider  │    │
│  │  Auto-Fallback: Gemini → Ollama → Demo      │    │
│  └──────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────┐    │
│  │           DATA ACCESS LAYER                  │    │
│  │  SQLite (sql.js) · File System · Audit Logs  │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
AIOS/
├── PROJECT_CONTEXT.md        # Project memory & status
├── ARCHITECTURE.md           # This file — system design
├── CODING_RULES.md           # Code standards & conventions
├── FEATURE_LOG.md            # Change tracking log
├── DEMO_FLOW.md              # Demo orchestration script
├── README.md                 # Public-facing documentation
├── package.json              # Root workspace config
├── render.yaml               # Render.com deployment blueprint
├── Dockerfile                # Multi-stage production build
├── .env.example              # Environment template
├── .gitignore
├── packages/
│   ├── frontend/             # PRESENTATION LAYER
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx
│   │       ├── index.css       # Global design system & tokens
│   │       ├── components/
│   │       │   └── layout/     # Header, Sidebar, AppShell
│   │       ├── pages/
│   │       │   ├── Login.jsx       # Auth + registration
│   │       │   ├── Dashboard.jsx   # Metrics, agent grid, charts
│   │       │   ├── Chat.jsx        # Multi-agent chat interface
│   │       │   ├── AgentHub.jsx    # Pipeline visualization
│   │       │   ├── SecurityPanel.jsx # Audit trail & alerts
│   │       │   └── Settings.jsx    # System configuration
│   │       ├── store/          # Zustand stores
│   │       │   ├── authStore.js    # Auth state + JWT
│   │       │   └── chatStore.js    # Messages + conversations
│   │       └── services/
│   │           └── api.js          # Centralized fetch wrapper
│   ├── backend/              # API GATEWAY + SERVICES
│   │   ├── package.json
│   │   ├── server.js             # Entry point + dotenv loading
│   │   ├── config/
│   │   │   ├── index.js          # Centralized config from env
│   │   │   └── database.js       # sql.js initialization
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT verification
│   │   │   ├── validate.js       # Zod schema validation
│   │   │   └── errorHandler.js   # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js    # /auth/*
│   │   │   ├── chat.routes.js    # /chat/*
│   │   │   ├── upload.routes.js  # /upload/*
│   │   │   └── system.routes.js  # /system/*, /security/*
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── chat.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   └── chat.service.js
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   ├── conversation.model.js
│   │   │   └── auditLog.model.js
│   │   └── database/
│   │       ├── migrations.js     # Schema creation
│   │       └── seeds.js          # Demo data seeding
│   ├── ai-engine/            # AI INFERENCE ENGINE
│   │   ├── package.json
│   │   ├── index.js              # Singleton factory
│   │   ├── router.js             # Model routing + fallback
│   │   └── providers/
│   │       ├── base.provider.js  # Abstract base class
│   │       ├── gemini.provider.js# Gemini API integration
│   │       ├── ollama.provider.js# Local Ollama integration
│   │       └── demo.provider.js  # Deterministic demo responses
│   └── agents/               # MULTI-AGENT FRAMEWORK
│       ├── package.json
│       ├── index.js              # Public API exports
│       ├── core/
│       │   ├── orchestrator.js   # Sequential pipeline execution
│       │   └── registry.js       # Agent singleton registry
│       ├── agents/
│       │   ├── base.agent.js     # Abstract base with process()
│       │   └── specialized.js    # 5 specialized agent classes
│       └── tools/
│           └── logScanner.js     # Regex-based threat detection
├── shared/                   # Cross-package utilities
│   ├── index.js
│   ├── constants.js              # Agent profiles, permissions, events
│   ├── errors.js                 # Custom error hierarchy
│   └── validators.js             # Zod schemas
└── data/                     # Local data (gitignored)
    ├── aios.db                   # SQLite database
    └── uploads/                  # Uploaded files
```

---

## 3. Layer Responsibilities

### Presentation Layer (`packages/frontend/`)
- UI rendering, user interaction, client-side state
- NO business logic — components receive props, emit events
- All API calls through `services/api.js`
- State via Zustand stores only
- Dark theme with glassmorphism, gradient accents, micro-animations

### API Gateway (`packages/backend/routes/`, `controllers/`)
- HTTP routing, validation, response formatting
- Controllers are THIN: validate → call service → respond
- NO direct database access from controllers
- `dotenv` loads `.env` from monorepo root at startup

### Business Logic (`packages/backend/services/`)
- ALL business rules live here
- Framework-agnostic (no Express req/res)
- Dynamic import of `@aios/agents` for chat orchestration

### Data Access (`packages/backend/models/`)
- Encapsulates ALL SQL queries
- sql.js (pure JavaScript SQLite — no native bindings)
- Sequential migrations with idempotent seeding

### AI Engine (`packages/ai-engine/`)
- Provider pattern for LLM backends
- **Auto-Fallback chain: Gemini → Ollama → Demo**
- Rich system prompts per agent type with personality injection
- Safety settings (HARM_BLOCK_ONLY_HIGH)
- 30s timeout with AbortSignal

### Agent Framework (`packages/agents/`)
- All agents extend `BaseAgent`
- **Sequential pipeline orchestration** (not parallel)
- Each agent receives `pipelineContext` from prior agents
- Tools: LogScanner with 10 regex threat patterns
- All actions audit-logged

---

## 4. Data Flow

### Chat → Multi-Agent Sequential Pipeline
```
User Message → Frontend (chatStore) → POST /api/v1/chat/message
  → Auth Middleware (JWT) → Zod Validation
  → ChatService.processMessage()
    → Create/retrieve conversation
    → Load file contents (if fileId attached)
    → Save user message to DB
    → Orchestrator.orchestrate()
      → AI Engine: getRespondingAgents(input)
      → For each agent (sequential):
          ├─ agent.shouldActivate(input, pipelineContext)
          ├─ agent.process(input, { aiEngine, pipelineContext, fileContents })
          ├─ aiEngine.agentResponse(type, input, options)
          │   ├─ Build system prompt with personality + pipeline context
          │   └─ Gemini API call (or fallback)
          └─ Append result to pipelineContext for next agent
    → Save all agent responses to DB
    → Create audit log entries
  → JSON Response → Frontend → Render messages
```

### Model Routing (Auto-Fallback)
```
Request → ModelRouter.getProvider()
  → Is DEMO_MODE forced? → Yes → DemoProvider
  → Is Gemini key set + valid? → Yes → GeminiProvider
  → Is Ollama running? → Yes → OllamaProvider
  → Fallback → DemoProvider

If GeminiProvider call fails (429, timeout, error):
  → console.warn → Fallback to DemoProvider
```

---

## 5. API Endpoints (`/api/v1`)

| Method | Endpoint                    | Auth | Description                     |
|--------|-----------------------------|------|---------------------------------|
| POST   | `/auth/register`            | No   | Create account                  |
| POST   | `/auth/login`               | No   | Authenticate → JWT              |
| GET    | `/auth/me`                  | Yes  | Current user profile            |
| POST   | `/chat/message`             | Yes  | Send message → pipeline reply   |
| GET    | `/chat/conversations`       | Yes  | List user conversations         |
| GET    | `/chat/conversations/:id`   | Yes  | Get messages for conversation   |
| POST   | `/upload`                   | Yes  | Upload file for analysis        |
| GET    | `/system/health`            | No   | Health check + provider status  |
| GET    | `/system/metrics`           | Yes  | Dashboard metrics               |
| GET    | `/security/audit-log`       | Yes  | Audit trail with pagination     |
| GET    | `/security/alerts`          | Yes  | Active security alerts          |
| GET    | `/security/permissions`     | Yes  | Agent permission matrix         |

---

## 6. Security Architecture

- **Auth:** JWT (24h expiry), bcrypt (cost 12), Bearer token
- **Agent Security:** Per-agent permissions, pipeline context isolation
- **Audit:** Every agent action logged with timestamp, actor, result, provider
- **Validation:** Zod schemas on all input endpoints
- **File Upload:** Type whitelist (.log, .csv, .txt, .json, .xml, .yaml), 2MB limit
- **Error Handling:** Structured JSON errors, no stack traces in production

---

## 7. Agent Personalities

| Agent | ID | Role | Personality | Tone | Color |
|-------|-----|------|-------------|------|-------|
| 🛡️ Security Sentinel | `security` | Threat detection, MITRE ATT&CK mapping | Strict, defensive, zero-tolerance | *"⚠️ ALERT: Unauthorized access detected..."* | `#ef4444` Red |
| 📋 Governance Auditor | `governance` | SOC 2, GDPR, HIPAA compliance | Methodical, regulation-focused | *"Compliance Check: SOC 2 Section CC6.1..."* | `#3b82f6` Blue |
| 🔍 Intelligence Analyst | `intelligence` | Pattern analysis, risk scoring | Analytical, evidence-driven | *"Risk Score: 9.0/10.0 (Confidence: 92%)..."* | `#a855f7` Purple |
| ⚙️ Workflow Coordinator | `workflow` | Remediation planning, task sequencing | Operational, solution-oriented | *"Remediation Plan: Step 1..."* | `#22c55e` Green |
| 💻 Code Architect | `code` | Code generation, architecture review | Precise, modular, security-aware | *"Implementation: Using sandboxed execution..."* | `#f59e0b` Amber |

---

## 8. Provider Priority (Auto-Fallback)

```
1. Gemini 2.5 Flash  ← CURRENT PRIMARY (live, verified working)
2. Ollama Provider   ← Available when Ollama is running locally
3. Demo Provider     ← Always available (deterministic, scripted)
```

### Provider Selection Logic
- If `DEMO_MODE=true` → always use Demo
- If `GEMINI_API_KEY` is set → try Gemini first
- If Gemini fails (429/timeout/error) → fallback to Demo
- UI badge shows active provider: "Gemini Live" / "Ollama Local" / "Demo Mode"

---

## 9. Module Dependencies

```
shared          → (none)
ai-engine       → shared
agents          → shared, ai-engine
backend         → shared, ai-engine, agents, dotenv
frontend        → shared (constants, via build)
```

**Circular dependencies are FORBIDDEN.**

---

## 10. Deployment Architecture

### Render.com (Primary — Free Tier)
```
GitHub Push → Render Auto-Deploy → Docker Build
  → Multi-stage: Node build frontend → Serve with Express
  → Environment variables set in Render dashboard
  → Public URL: https://aios-XXXX.onrender.com
```

### Docker (Self-Hosted)
```bash
docker build -t aios .
docker run -p 3001:3001 -e GEMINI_API_KEY=... aios
```

### Local Development
```bash
npm install
cp .env.example .env  # Add GEMINI_API_KEY
npm run dev           # Starts BE (3001) + FE (5173) concurrently
```
