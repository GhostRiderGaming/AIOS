# FEATURE_LOG.md — AIOS Change Tracker

> **Every feature, change, fix, and decision is tracked here.**  
> **Update this file after every commit.**

---

## Format

```
### [DATE] — [TYPE]: [Title]
- **Scope:** [package(s) affected]
- **Files:** [key files created/modified]
- **Description:** [what changed and why]
- **Decision:** [any architectural decisions made]
- **Status:** ✅ Complete | 🔄 In Progress | 🔲 Planned
```

**Types:** `FEAT` | `FIX` | `REFACTOR` | `DOCS` | `CHORE` | `TEST` | `BREAKING`

---

## Log

---

### 2026-05-16 — DOCS: Project Foundation Documents

- **Scope:** root
- **Files:**
  - `PROJECT_CONTEXT.md` — project memory, stack, flows, dependencies
  - `ARCHITECTURE.md` — layers, services, data flow, module structure
  - `CODING_RULES.md` — naming conventions, patterns, formatting rules
  - `FEATURE_LOG.md` — change tracking (this file)
- **Description:** Created all four foundational documents before any code generation. Established technology stack (React + Vite, Express, SQLite, Ollama, custom multi-agent framework), defined modular layered architecture with strict separation of concerns, set coding standards, and created change tracking system.
- **Decision:** 
  - JavaScript over TypeScript for hackathon speed
  - SQLite over PostgreSQL for local-first privacy
  - Custom agent framework over LangChain for full control
  - Monorepo with npm workspaces
  - Dual-hackathon targeting (Enterprise AI + Agent Olympics)
- **Status:** ✅ Complete

---

### 2026-05-16 — FEAT: Project Scaffold (Phase 1)

- **Scope:** root, shared
- **Files:** `package.json`, `.gitignore`, `.env.example`, `shared/*`
- **Description:** Created monorepo with npm workspaces, shared constants (agent profiles, permissions, audit events), custom error hierarchy, and Zod validation schemas.
- **Decision:** Used ESM throughout, custom error classes over generic throws.
- **Status:** ✅ Complete

---

### 2026-05-16 — FEAT: Backend Core (Phase 2)

- **Scope:** backend
- **Files:** `server.js`, `config/*`, `middleware/*`, `models/*`, `routes/*`, `controllers/*`, `services/*`, `database/*`
- **Description:** Full Express.js backend with JWT auth, sql.js database (switched from better-sqlite3 due to Node 26 native build issues), Zod validation middleware, audit logging, and demo data seeding.
- **Decision:** Switched to sql.js (pure JS SQLite) for zero-compilation dependency. Thin controllers → fat services → model pattern enforced.
- **Status:** ✅ Complete

---

### 2026-05-16 — FEAT: AI Engine with Demo Provider (Phase 3)

- **Scope:** ai-engine
- **Files:** `providers/base.provider.js`, `providers/demo.provider.js`, `providers/ollama.provider.js`, `providers/gemini.provider.js`, `router.js`, `index.js`
- **Description:** Provider-pattern AI engine with Demo Provider as fallback. 5 demo scenarios with pre-scripted agent responses, fuzzy keyword matching, simulated delays. Ollama and Gemini providers fully implemented.
- **Decision:** Auto-fallback chain: Gemini → Ollama → Demo.
- **Status:** ✅ Complete

---

### 2026-05-16 — FEAT: Multi-Agent Framework (Phase 4)

- **Scope:** agents
- **Files:** `agents/base.agent.js`, `agents/specialized.js`, `core/orchestrator.js`, `core/registry.js`, `index.js`
- **Description:** 5 specialized agents extending BaseAgent, central orchestrator with sequential pipeline execution, agent registry singleton, pipeline context sharing between agents.
- **Decision:** Sequential pipeline (not parallel) — each agent builds on prior findings, creating a genuine inter-agent reasoning chain.
- **Status:** ✅ Complete

---

### 2026-05-16 — FEAT: Frontend Dashboard (Phase 5)

- **Scope:** frontend
- **Files:** `index.css`, `App.jsx`, `pages/*`, `components/layout/*`, `store/*`, `services/api.js`
- **Description:** React SPA with Vite, dark theme with glassmorphism, gradient accents, and micro-animations. Login, Dashboard (metrics + agent grid + severity chart), Agent Chat (multi-agent responses with provider badges), Agent Hub (pipeline visualization), Security Panel (audit trail + alerts + permissions matrix), Settings.
- **Decision:** Vanilla CSS design system over Tailwind for full control. Zustand over Redux for simplicity.
- **Status:** ✅ Complete

---

### 2026-05-16 — FIX: Chat Validation Schema

- **Scope:** shared
- **Files:** `shared/validators.js`
- **Description:** Fixed `chatMessageSchema` to accept `null` for `conversationId` and `agentTarget` fields. Frontend sends null when no conversation exists, but Zod `.optional()` alone rejects null.
- **Status:** ✅ Complete

---

### 2026-05-16 — DOCS: Demo Flow & Agent Personalities

- **Scope:** root
- **Files:** `DEMO_FLOW.md`, `README.md`, `ARCHITECTURE.md`
- **Description:** Created comprehensive demo orchestration document with 4-act click-by-click flow, pre-scripted agent responses, fail-safe backups, narration cheat sheet. Updated README with architecture diagrams and agent roster.
- **Status:** ✅ Complete

---

### 2026-05-18 — FEAT: Gemini Live Integration (Phase 6)

- **Scope:** ai-engine, backend
- **Files:** `providers/gemini.provider.js`, `router.js`, `index.js`
- **Description:** Fully implemented Gemini provider with rich system prompts per agent type, personality injection, conversation history, safety settings, and 30s timeout with AbortSignal. Model router with auto-fallback logic.
- **Decision:** Each agent gets a unique system prompt reflecting its personality and role. Pipeline context from prior agents is injected into subsequent prompts.
- **Status:** ✅ Complete

---

### 2026-05-18 — FEAT: File Upload & Log Scanner

- **Scope:** backend, agents
- **Files:** `routes/upload.routes.js`, `tools/logScanner.js`, `services/chat.service.js`
- **Description:** File upload endpoint accepting .log, .csv, .txt, .json, .xml, .yaml files (2MB max). LogScanner tool with 10 regex patterns detecting SQLi, XSS, brute force, privilege escalation, path traversal, command injection, and more. File contents injected into agent pipeline context.
- **Status:** ✅ Complete

---

### 2026-05-18 — CHORE: Deployment Configuration

- **Scope:** root
- **Files:** `Dockerfile`, `render.yaml`, `.env.example`
- **Description:** Multi-stage Dockerfile (build frontend → serve with Express in production). Render.com blueprint with render.yaml for one-click deployment. Updated .env.example with all current variables.
- **Status:** ✅ Complete

---

### 2026-05-19 — FIX: dotenv Loading (Critical)

- **Scope:** backend
- **Files:** `packages/backend/server.js`, `packages/backend/package.json`
- **Description:** **Root cause found:** `.env` file was never being loaded — `process.env.GEMINI_API_KEY` was always empty at runtime, causing silent fallback to Demo mode. Installed `dotenv` package and added path-resolved loading at the top of `server.js` pointing to monorepo root `.env`.
- **Decision:** Must use explicit path resolution (`resolve(__dirname, '../../.env')`) because ES module import hoisting executes all imports before any inline code runs.
- **Status:** ✅ Complete

---

### 2026-05-19 — FIX: Switch to Gemini 2.5 Flash

- **Scope:** root
- **Files:** `.env`, `.env.example`
- **Description:** `gemini-2.0-flash` API returned HTTP 429 (quota exceeded). Tested all available models — `gemini-2.5-flash` returned 200 OK. Switched primary model in `.env`.
- **Decision:** `gemini-2.5-flash` as primary model. Provides newer capabilities with available free-tier quota.
- **Status:** ✅ Complete

---

### 2026-05-19 — DOCS: Full Documentation Update

- **Scope:** root
- **Files:** `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `FEATURE_LOG.md`, `DEMO_FLOW.md`, `README.md`, `.env.example`
- **Description:** Complete rewrite of all documentation to reflect production-ready state. Updated technology stack (Gemini 2.5 Flash, sql.js, dotenv), accurate folder structure, current API endpoints, sequential pipeline architecture, decision log, and deployment instructions.
- **Status:** ✅ Complete

---

<!-- NEXT ENTRY GOES HERE -->
