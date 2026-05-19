# CODING_RULES.md — AIOS Coding Standards

> **Last Updated:** 2026-05-19  
> **Enforced across all packages.**

---

## 1. Language & Runtime

- **Language:** JavaScript (ES2022+)
- **Runtime:** Node.js 20+ LTS
- **Modules:** ESM (`import`/`export`) — no CommonJS `require()`
- **Database:** sql.js (pure JavaScript SQLite — no native bindings)
- **Env Loading:** dotenv with explicit path resolution from monorepo root
- **Frontend:** React 18 with JSX

---

## 2. Naming Conventions

### Files
| Type              | Convention          | Example                    |
|-------------------|---------------------|----------------------------|
| Components        | PascalCase          | `AgentCard.jsx`            |
| Pages             | PascalCase          | `Dashboard.jsx`            |
| Hooks             | camelCase, `use`    | `useAgentStatus.js`        |
| Stores            | camelCase, `Store`  | `agentStore.js`            |
| Services          | camelCase, `.service` | `agent.service.js`       |
| Controllers       | camelCase, `.controller` | `agent.controller.js` |
| Models            | camelCase, `.model` | `agent.model.js`           |
| Routes            | camelCase, `.routes`| `agent.routes.js`          |
| Utils             | camelCase           | `logger.js`                |
| CSS Modules       | PascalCase, `.module` | `AgentCard.module.css`   |
| Constants         | camelCase           | `constants.js`             |
| Tests             | matches source + `.test` | `agent.service.test.js`|

### Variables & Functions
| Type              | Convention          | Example                    |
|-------------------|---------------------|----------------------------|
| Variables         | camelCase           | `agentCount`               |
| Constants         | UPPER_SNAKE_CASE    | `MAX_RETRY_COUNT`          |
| Functions         | camelCase           | `getAgentById()`           |
| Classes           | PascalCase          | `SecurityAgent`            |
| React Components  | PascalCase          | `<AgentCard />`            |
| Event handlers    | camelCase, `handle` | `handleSubmit()`           |
| Booleans          | camelCase, `is/has` | `isLoading`, `hasError`    |
| Private methods   | `_` prefix          | `_validateInput()`         |

### Database
- Table names: `snake_case`, plural (`users`, `audit_logs`)
- Column names: `snake_case` (`created_at`, `agent_id`)
- Primary keys: `id` (integer, autoincrement)
- Foreign keys: `{table_singular}_id` (`user_id`, `agent_id`)

### API
- Endpoints: kebab-case (`/api/v1/audit-log`)
- Query params: camelCase (`?pageSize=10`)
- JSON keys: camelCase (`{ agentId, createdAt }`)

---

## 3. Code Patterns

### Controllers (THIN — no business logic)
```javascript
// ✅ Correct
export async function createAgent(req, res, next) {
  try {
    const agent = await agentService.create(req.body);
    res.status(201).json({ data: agent });
  } catch (error) {
    next(error);
  }
}

// ❌ Wrong — business logic in controller
export async function createAgent(req, res) {
  const existing = db.query('SELECT ...');  // NO
  if (existing) throw new Error('...');     // NO
}
```

### Services (business logic here)
```javascript
// ✅ Correct — framework-agnostic, testable
export function createAgent(data) {
  validateAgentData(data);
  const existing = agentModel.findByName(data.name);
  if (existing) throw new ConflictError('Agent exists');
  return agentModel.create(data);
}
```

### Models (data access only)
```javascript
// ✅ Correct
export function findByName(name) {
  return db.prepare('SELECT * FROM agents WHERE name = ?').get(name);
}
```

### React Components (no business logic)
```jsx
// ✅ Correct — presentational
export function AgentCard({ agent, onInvoke }) {
  return (
    <div className={styles.card}>
      <h3>{agent.name}</h3>
      <button onClick={() => onInvoke(agent.id)}>Invoke</button>
    </div>
  );
}
```

### Custom Hooks (state + side effects)
```javascript
// ✅ Correct
export function useAgents() {
  const agents = useAgentStore((s) => s.agents);
  const fetchAgents = useAgentStore((s) => s.fetchAgents);
  useEffect(() => { fetchAgents(); }, [fetchAgents]);
  return { agents };
}
```

---

## 4. Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent with id 42 not found",
    "status": 404
  }
}
```

### Custom Error Classes (in `shared/errors.js`)
```javascript
export class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export class NotFoundError extends AppError { ... }
export class ValidationError extends AppError { ... }
export class UnauthorizedError extends AppError { ... }
```

### Rules
- Always use custom error classes, never raw `throw new Error()`
- All async routes wrapped in try/catch → `next(error)`
- Global error handler returns standardized JSON
- Never expose stack traces in production

---

## 5. Formatting Rules

- **Indentation:** 2 spaces (no tabs)
- **Semicolons:** Always
- **Quotes:** Single quotes for JS, double for JSX attributes
- **Trailing commas:** Always (ES2017+)
- **Line length:** Max 100 characters
- **Blank lines:** One between logical blocks, two between top-level declarations
- **Imports order:**
  1. Node built-ins
  2. External packages
  3. Internal packages (`@aios/*`)
  4. Relative imports
  5. CSS imports (last)

---

## 6. Documentation

### JSDoc for all public functions
```javascript
/**
 * Create a new agent instance.
 * @param {Object} config - Agent configuration
 * @param {string} config.name - Agent name
 * @param {string} config.type - Agent type (security|reasoning|data|code)
 * @returns {Agent} Created agent instance
 * @throws {ValidationError} If config is invalid
 */
export function createAgent(config) { ... }
```

### Rules
- Every exported function has JSDoc
- Every module has a file-level comment
- Complex logic has inline comments explaining WHY, not WHAT
- README in each package directory

---

## 7. Git Conventions

### Commit Messages
```
<type>(<scope>): <description>

Types: feat, fix, refactor, docs, test, chore, style
Scope: frontend, backend, ai-engine, agents, shared
```

**Examples:**
```
feat(agents): add SecurityAgent with permission framework
fix(backend): resolve JWT expiry edge case
refactor(ai-engine): extract provider base class
docs: update ARCHITECTURE.md with new data flow
test(agents): add orchestrator unit tests
```

### Branch Naming
```
feat/agent-security-framework
fix/jwt-refresh-logic
refactor/ai-provider-pattern
```

### Rules
- Commit after every stable feature
- Never commit broken code to `main`
- Squash WIP commits before merge
- Tag releases with semver (`v0.1.0`)

---

## 8. Testing

- **Framework:** Vitest
- **Naming:** `*.test.js` colocated or in `tests/`
- **Coverage target:** 70% for services, 50% overall
- **Rules:**
  - Test services thoroughly (business logic)
  - Mock external deps (AI providers, DB)
  - Integration tests for API routes
  - E2E tests for critical flows

---

## 9. Absolute Prohibitions

| ❌ Never Do                              | ✅ Instead                              |
|------------------------------------------|-----------------------------------------|
| Business logic in controllers            | Put in services                         |
| Business logic in components             | Put in hooks/stores                     |
| Raw SQL in controllers                   | Use model functions                     |
| `console.log` in production              | Use `logger.js`                         |
| `var` declarations                       | Use `const`/`let`                       |
| CommonJS `require()`                     | Use ESM `import`                        |
| Inline styles in React                   | Use CSS Modules                         |
| Hard-coded config values                 | Use env variables via `config/`         |
| `any` equivalent loose patterns          | Use JSDoc types                         |
| Circular imports                         | Restructure dependency chain            |
| God files (>300 lines)                   | Split into focused modules              |
| Duplicated logic                         | Extract to `shared/` or utils           |
