# DEMO_FLOW.md — AIOS Presentation Orchestration

> **Last Updated:** 2026-05-19  
> **Purpose:** Exact demo storyline, click-by-click flow, expected responses, fail-safes.  
> **Duration:** 5 minutes (hackathon demo slot)  
> **AI Provider:** Gemini 2.5 Flash (Live) with Demo Mode fallback

---

## 1. Demo Narrative (The Story)

> *"Every enterprise runs on trust — trust in their data, their systems, their decisions. But as AI agents multiply across the organization, who watches the watchers? AIOS does. It's a multi-agent AI governance platform where specialized agents collaborate in sequence, each building on the findings of its predecessors, with a complete auditable trail of every decision."*

---

## 2. Pre-Demo Checklist

| Item                        | Status | Action if Missing                           |
|-----------------------------|--------|---------------------------------------------|
| Backend server running      | 🔲     | `npm run dev` from root                     |
| Frontend loaded in browser  | 🔲     | http://localhost:5173                        |
| Gemini Live indicator green | 🔲     | Check header badge shows "⚡ Gemini Live"    |
| Demo user pre-seeded        | 🔲     | Login: `admin@aios.dev` / `admin123`        |
| Sample data loaded          | 🔲     | Seeds run automatically on startup          |
| Browser zoomed to 110%      | 🔲     | Better visibility for projector             |
| Dark theme active           | 🔲     | Default theme                               |
| Backup: DEMO_MODE=true      | 🔲     | Set in .env if Gemini quota exhausted       |

---

## 3. Click-by-Click Demo Flow

### ACT 1: The Stage (30 seconds)
**Goal:** Establish what AIOS is.

| Step | Action | Screen | Narration |
|------|--------|--------|-----------|
| 1.1 | App loads | Dashboard | *"This is AIOS — an AI Operating System for enterprise governance."* |
| 1.2 | Point to metrics cards | Dashboard | *"5 active agents, real-time alert monitoring, full audit trail."* |
| 1.3 | Point to AI Provider card | Dashboard | *"See this? **Gemini Live** — our AI is powered by Google's Gemini 2.5 Flash, running in real-time."* |
| 1.4 | Point to Agent Roster | Dashboard | *"Each agent has a specialized role, distinct personality, and defined permissions."* |

---

### ACT 2: The Threat & WOW Factor (90 seconds)
**Goal:** Show multi-agent collaboration with **live pipeline visualization** — the WOW moment.

| Step | Action | Screen | Narration |
|------|--------|--------|-----------|
| 2.1 | Click "Agent Chat" in sidebar | Chat | *"Let's simulate a real enterprise security incident."* |
| 2.2 | Type prompt (see below) | Chat Input | *"An employee reports suspicious access patterns in the server logs."* |
| 2.3 | Press Enter / Send | Chat | *"Watch the **pipeline tracker** — you can see agents activating in sequence."* |
| 2.4 | 🔥 Pipeline Tracker appears | Chat | *"The glowing agent is currently analyzing. Watch it cascade — each agent builds on the prior agent's findings."* |
| 2.5 | Security Sentinel responds (red) | Chat | *"Security Sentinel detects the threat, maps it to **MITRE ATT&CK** frameworks. Watch the pipeline step turn green ✅"* |
| 2.6 | Intelligence Analyst responds (purple) | Chat | *"Intelligence Analyst correlates patterns, assigns a **risk score of 9.0/10**."* |
| 2.7 | Workflow Coordinator responds (green) | Chat | *"Workflow Coordinator synthesizes everything into an actionable remediation plan."* |
| 2.8 | Point to provider badges | Chat | *"Notice the **⚡ Gemini Live** badge on each response — this is real-time AI, not scripted."* |
| 2.9 | Click "Copy All" in export bar | Export Bar | *"One click to copy all agent findings. Or download a full **Markdown report**."* |

**Recommended Prompt:**
```
Analyze this security scenario: Multiple failed login attempts detected from IP 
203.0.113.42 targeting admin endpoints. The IP has been flagged in 3 prior 
incidents this quarter. What are the risks and recommended actions?
```

**Expected Live Gemini Response Themes:**
- Security Sentinel: MITRE ATT&CK mapping (T1110, T1078), threat level assessment
  - Tool: LogScanner → risk score, brute force pattern detection
  - Tool: IPEnrichment → IP reputation, threat classification
- Governance Auditor: SOC2/GDPR compliance assessment
  - Tool: ComplianceChecker → score (0-100), grade (A-F), per-framework breakdown
- Intelligence Analyst: Risk score (8-10/10), pattern correlation, confidence %
  - Tool: CorrelationEngine → weighted aggregate risk, cross-agent correlations
- Workflow Coordinator: Numbered remediation steps with timeline
  - Tool: ActionPlanner → prioritized actions, team assignments, effort estimates

---

### ACT 3: The Governance (60 seconds)
**Goal:** Show audit trail and explainability — the enterprise differentiator.

| Step | Action | Screen | Narration |
|------|--------|--------|-----------|
| 3.1 | Click "Security Panel" in sidebar | Security Panel | *"Every agent action is fully auditable."* |
| 3.2 | Point to audit trail table | Audit Log | *"Here's every decision, every agent activation — timestamped and traceable."* |
| 3.3 | Point to event types | Audit Log | *"Agent completions, file scans, user logins — all categorized."* |
| 3.4 | Click "Alerts" tab | Alerts | *"Real-time security alerts with severity levels."* |
| 3.5 | Click "Permissions" tab | Permissions | *"Fine-grained agent permissions. You control exactly what each agent can do."* |

---

### ACT 4: The Architecture (60 seconds)
**Goal:** Show Agent Hub and reinforce the sequential pipeline.

| Step | Action | Screen | Narration |
|------|--------|--------|-----------|
| 4.1 | Click "Agent Hub" in sidebar | Agent Hub | *"The Agent Hub visualizes our sequential pipeline."* |
| 4.2 | Point to pipeline diagram | Agent Hub | *"Security → Governance → Intelligence → Workflow → Code. Each agent receives the full context of what came before."* |
| 4.3 | Point to individual agent cards | Agent Hub | *"Each agent has defined capabilities, response patterns, and access permissions."* |
| 4.4 | Return to Dashboard | Dashboard | *"This is AIOS — multi-agent governance with live AI, full auditability, and enterprise-grade security."* |

---

## 4. Fail-Safe Backup Plans

| Failure                        | Backup                                          |
|--------------------------------|--------------------------------------------------|
| Gemini quota exceeded (429)    | Set `DEMO_MODE=true` in .env, restart server    |
| Backend won't start            | Pre-recorded video of full demo flow             |
| Agent response too slow        | Demo mode guarantees <500ms deterministic reply  |
| LLM produces bad output        | Demo mode uses pre-written, vetted responses     |
| Database corrupted             | Delete `data/aios.db`, restart (auto-reseeds)    |
| Frontend crashes               | Reload — state persists in localStorage          |
| Internet goes down             | Switch to Ollama local or Demo mode              |

---

## 5. Provider Modes

### Live Mode (Default)
```
DEMO_MODE=false + GEMINI_API_KEY set
→ Real Gemini 2.5 Flash inference
→ Dynamic, contextual responses
→ MITRE ATT&CK citations, risk scores
→ Provider badge: "⚡ Gemini Live"
```

### Demo Mode (Fallback)
```
DEMO_MODE=true (or Gemini quota exhausted)
→ Deterministic pre-scripted responses
→ Consistent, vetted output every time
→ <500ms response time guaranteed
→ Provider badge: "Demo Mode"
```

---

## 6. Narration Cheat Sheet

### If Asked About...

| Topic                  | Key Talking Point                                              |
|------------------------|----------------------------------------------------------------|
| Why multi-agent?       | *"No single AI can be expert at everything. Specialization + collaboration = better outcomes."* |
| Sequential pipeline?   | *"Each agent builds on prior findings. Security feeds into Governance, which feeds Intelligence."* |
| How is this different? | *"Other tools give you AI. We give you governed, explainable AI with accountability."* |
| Scalability?           | *"Add agents like plugins. The orchestrator handles coordination automatically."* |
| Live AI?               | *"Powered by Gemini 2.5 Flash. Every response is generated in real-time, not scripted."* |
| What if Gemini fails?  | *"Auto-fallback: Gemini → Ollama local → Demo mode. Zero downtime."* |
| Cost?                  | *"Free tier Gemini. Self-hostable. No vendor lock-in."* |
| Production-ready?      | *"178 test assertions, 6 real tools, rate limiting, RBAC, audit trail — battle-tested."* |
| Real tools?            | *"Every agent uses deterministic analysis engines. ComplianceChecker has 16 rules across 6 frameworks. CorrelationEngine uses weighted scoring. Not LLM regex parsing."* |
| Testing?               | *"178 assertions across 12 test groups including negative cases, edge cases, and rate limiter verification. Zero failures."* |

---

## 7. Timing Guide

| Segment            | Duration | Cumulative |
|--------------------|----------|------------|
| ACT 1: Stage       | 0:30     | 0:30       |
| ACT 2: Threat      | 1:30     | 2:00       |
| ACT 3: Governance  | 1:00     | 3:00       |
| ACT 4: Architecture| 1:00     | 4:00       |
| Buffer / Q&A       | 1:00     | 5:00       |

---

## 8. Visual Cues During Demo

| Visual                         | When                                  |
|--------------------------------|---------------------------------------|
| 🟢 ⚡ Gemini Live badge        | Always visible in header              |
| Pipeline processing indicator  | During agent sequential processing    |
| 🛡️ Red agent response card    | Security Sentinel threat assessment   |
| 🔍 Purple agent response card  | Intelligence Analyst risk scoring     |
| ⚙️ Green agent response card   | Workflow Coordinator action plan      |
| Provider badge (gemini/demo)   | On each individual agent response     |
| Audit trail counter            | Real-time during agent actions        |
| Severity chart (Recharts)      | Dashboard analytics visualization     |
