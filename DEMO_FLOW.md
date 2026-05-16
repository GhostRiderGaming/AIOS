# DEMO_FLOW.md — AIOS Presentation Orchestration

> **Last Updated:** 2026-05-16  
> **Purpose:** Exact demo storyline, click-by-click flow, expected responses, fail-safes.  
> **Duration:** 5 minutes (hackathon demo slot)

---

## 1. Demo Narrative (The Story)

> *"Every enterprise runs on trust — trust in their data, their systems, their decisions. But as AI agents multiply across the organization, who watches the watchers? AIOS does. It's a privacy-first, local-only AI operating system where multiple specialized agents collaborate, govern each other, and leave an auditable trail of every decision. No cloud. No data leaks. Full explainability."*

---

## 2. Pre-Demo Checklist

| Item                        | Status | Action if Missing                    |
|-----------------------------|--------|--------------------------------------|
| Backend server running      | 🔲     | `npm run dev` from root              |
| Frontend loaded in browser  | 🔲     | http://localhost:5173                 |
| Demo mode enabled           | 🔲     | Toggle in Settings or `?demo=true`   |
| Demo user pre-seeded        | 🔲     | Auto-created: `demo@aios.local`      |
| Sample data loaded          | 🔲     | Seeds run automatically in demo mode |
| Browser zoomed to 110%      | 🔲     | Better visibility for projector      |
| Dark theme active           | 🔲     | Default in demo mode                 |
| Second tab: Security Panel  | 🔲     | Pre-opened for quick switch          |

---

## 3. Click-by-Click Demo Flow

### ACT 1: The Stage (30 seconds)
**Goal:** Establish what AIOS is.

| Step | Action | Screen | Narration |
|------|--------|--------|-----------|
| 1.1 | App loads | Dashboard | *"This is AIOS — an AI Operating System that runs entirely on your machine."* |
| 1.2 | Point to agent status grid | Dashboard | *"These are our specialized AI agents. Each has a distinct role, personality, and set of permissions."* |
| 1.3 | Hover over Security Sentinel card | Dashboard | Agent card glows red, shows status pulse | *"Security Sentinel — it monitors every action in the system."* |
| 1.4 | Point to local inference indicator | Dashboard header | *"See this indicator? All AI runs locally. Zero cloud dependency. Your data never leaves this machine."* |

---

### ACT 2: The Threat (90 seconds)
**Goal:** Show multi-agent collaboration on a real enterprise scenario.

| Step | Action | Screen | Narration |
|------|--------|--------|-----------|
| 2.1 | Click "Agent Hub" in sidebar | Agent Hub | *"Let's simulate a real enterprise scenario."* |
| 2.2 | Click "New Task" button | Task Modal | *"An employee has uploaded a suspicious server access log."* |
| 2.3 | Paste pre-loaded prompt: `"Analyze this enterprise access log for security anomalies: [log data]"` | Chat | *"Watch what happens."* |
| 2.4 | **WAIT** — Orchestrator activates | Chat + Agent Activity Panel | *"The Orchestrator just decomposed this into subtasks and dispatched them to specialized agents."* |
| 2.5 | Security Sentinel activates (red pulse) | Agent Activity | *"Security Sentinel is scanning for threat patterns."* |
| 2.6 | Governance Auditor activates (blue pulse) | Agent Activity | *"Governance Auditor is checking compliance requirements."* |
| 2.7 | Intelligence Analyst activates (purple pulse) | Agent Activity | *"Intelligence Analyst is correlating with known attack vectors."* |
| 2.8 | Results stream in from each agent | Chat | Show each agent's response with its avatar and personality |
| 2.9 | Workflow Coordinator synthesizes | Chat | *"And Workflow Coordinator synthesizes everything into an actionable remediation plan."* |

**Expected Agent Responses (Demo Mode — deterministic):**

**Security Sentinel** 🛡️ (strict tone):
> ⚠️ ALERT: 3 anomalies detected in access log.
> - Unusual login from IP 203.0.113.42 at 03:14 UTC (outside business hours)
> - Privilege escalation attempt on /admin/config endpoint
> - 47 failed authentication attempts from single source in 12 minutes
> Threat Level: HIGH. Recommend immediate session termination and IP block.

**Governance Auditor** 📋 (compliance tone):
> Compliance Check Complete:
> - SOC 2 Section CC6.1: Access control violation detected
> - GDPR Article 32: Security of processing may be compromised
> - Remediation required within 24 hours per incident response SLA
> Audit Reference: AUD-2026-05-16-0042

**Intelligence Analyst** 🔍 (analytical tone):
> Pattern Analysis:
> - IP 203.0.113.42 maps to a known proxy network (confidence: 87%)
> - Attack signature matches credential stuffing pattern MITRE ATT&CK T1110.004
> - Similar pattern observed in 3 other enterprise incidents this quarter
> Risk Score: 8.4/10

**Workflow Coordinator** ⚙️ (operational tone):
> Remediation Plan Generated:
> 1. ✅ Immediate: Block IP 203.0.113.42 at firewall level
> 2. ✅ Short-term: Force password reset for affected accounts
> 3. ✅ Medium-term: Implement adaptive MFA for admin endpoints
> 4. 📋 Documentation: Incident report auto-generated (IR-2026-0042)
> Estimated resolution time: 2 hours

---

### ACT 3: The Governance (60 seconds)
**Goal:** Show audit trail and explainability — the enterprise differentiator.

| Step | Action | Screen | Narration |
|------|--------|--------|-----------|
| 3.1 | Click "Security Panel" in sidebar | Security Panel | *"Every agent action is fully auditable."* |
| 3.2 | Point to audit trail table | Audit Log | *"Here's every decision, every tool call, every permission check — timestamped and traceable."* |
| 3.3 | Click on an audit entry | Audit Detail Modal | *"Full explainability. You can see exactly WHY each agent made each decision."* |
| 3.4 | Point to permission denial entry | Audit Log | *"See this? The Code Agent tried to access the file system, but Security Sentinel blocked it. Governance in action."* |
| 3.5 | Click "Agent Permissions" tab | Permissions Matrix | *"Every agent has fine-grained permissions. You control exactly what each agent can and cannot do."* |

---

### ACT 4: The Close (60 seconds)
**Goal:** Reinforce the value proposition and differentiation.

| Step | Action | Screen | Narration |
|------|--------|--------|-----------|
| 4.1 | Return to Dashboard | Dashboard | *"Let's recap what just happened."* |
| 4.2 | Point to metrics | Dashboard | *"Four specialized agents collaborated on a complex security incident."* |
| 4.3 | Point to local indicator | Header | *"Everything ran locally. No data left this machine. No API keys needed. No cloud costs."* |
| 4.4 | Point to audit count | Dashboard | *"Every decision is auditable and explainable — essential for regulated industries."* |
| 4.5 | Final statement | — | *"AIOS: Enterprise AI you can actually trust. Because trust requires transparency, and transparency requires local control."* |

---

## 4. Fail-Safe Backup Plans

| Failure                        | Backup                                          |
|--------------------------------|--------------------------------------------------|
| Backend won't start            | Pre-recorded video of full demo flow             |
| Agent response too slow        | Demo mode guarantees <500ms deterministic reply  |
| LLM produces bad output        | Demo mode uses pre-written, vetted responses     |
| Database corrupted             | `npm run seed:demo` regenerates all demo data    |
| Frontend crashes               | Reload + demo mode auto-restores state           |
| Browser zoom wrong             | CSS is responsive, works at any zoom level       |
| Projector low contrast         | Dark theme with high-contrast accent colors      |
| Internet goes down             | **Everything is local** — this IS the selling point |
| Question about scale           | *"The architecture is modular — add agents like plugins"* |
| Question about real LLMs       | *"Swap demo mode off, point to Ollama or any API"* |

---

## 5. Demo Mode Architecture

### How It Works
```
User Input → Demo Interceptor
              ├─ Is demo mode ON?
              │   ├─ YES → Match input against demo scenarios
              │   │         → Return pre-scripted agent responses
              │   │         → Simulate realistic typing delays (200-800ms)
              │   │         → Trigger visual agent activations
              │   │         → Generate audit trail entries
              │   └─ NO  → Route to real AI engine (Ollama/Gemini)
              └─ Unknown input in demo mode
                  → Generic intelligent fallback response
```

### Demo Scenarios (Pre-Scripted)

| Scenario ID | Trigger Phrase (fuzzy match)       | Agents Activated                              |
|-------------|-------------------------------------|-----------------------------------------------|
| `SEC-001`   | "security", "access log", "threat"  | Security, Governance, Intelligence, Workflow  |
| `DATA-001`  | "analyze data", "report", "metrics" | Data, Intelligence, Workflow                  |
| `CODE-001`  | "generate code", "build", "script"  | Code, Security, Reasoning                     |
| `GOV-001`   | "compliance", "audit", "regulation" | Governance, Security, Intelligence            |
| `MULTI-001` | "coordinate", "plan", "workflow"    | All agents                                    |

### Demo Data Seeds

| Entity          | Count | Purpose                           |
|-----------------|-------|-----------------------------------|
| Users           | 3     | admin, analyst, viewer roles      |
| Conversations   | 5     | Pre-existing chat history         |
| Audit Logs      | 50    | Rich audit trail for panel demo   |
| Agent Configs   | 5     | All agents pre-configured         |
| Security Alerts | 8     | Active alerts for dashboard       |
| Permissions     | 20    | Agent permission matrix populated |

---

## 6. Narration Cheat Sheet

### If Asked About...

| Topic                  | Key Talking Point                                              |
|------------------------|----------------------------------------------------------------|
| Why local?             | *"Enterprise data is too sensitive for cloud AI. Period."*     |
| Why multi-agent?       | *"No single AI can be expert at everything. Specialization + collaboration = better outcomes."* |
| How is this different? | *"Other tools give you AI. We give you governed, explainable, local AI with accountability."* |
| Scalability?           | *"Add agents like plugins. The orchestrator handles coordination automatically."* |
| Production-ready?      | *"The audit trail and permission framework are enterprise-grade. The rest is modular and extensible."* |
| Cost?                  | *"Zero cloud costs. Your hardware, your models, your data."*  |
| What models?           | *"Any Ollama-compatible model. Llama, Mistral, Gemma — your choice."* |

---

## 7. Timing Guide

| Segment     | Duration | Cumulative |
|-------------|----------|------------|
| ACT 1: Stage    | 0:30 | 0:30       |
| ACT 2: Threat   | 1:30 | 2:00       |
| ACT 3: Governance| 1:00 | 3:00       |
| ACT 4: Close    | 1:00 | 4:00       |
| Buffer / Q&A    | 1:00 | 5:00       |

---

## 8. Visual Cues During Demo

| Visual                         | When                                  |
|--------------------------------|---------------------------------------|
| Agent card pulse animation     | Agent activates on task               |
| Typing indicator in chat       | Agent "thinking" (simulated delay)    |
| 🛡️🔴 Red glow                 | Security Sentinel alert               |
| 📋🔵 Blue glow                 | Governance Auditor active             |
| 🔍🟣 Purple glow               | Intelligence Analyst processing       |
| ⚙️🟢 Green glow                | Workflow Coordinator synthesizing     |
| ✅ Checkmark cascade           | Remediation steps completing          |
| 🔒 Local inference badge       | Persistent header indicator           |
| Audit trail counter incrementing | Real-time during agent actions      |
