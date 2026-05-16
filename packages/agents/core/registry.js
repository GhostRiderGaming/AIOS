/**
 * @fileoverview Agent registry — registration and discovery of all agents.
 */

import {
  SecurityAgent,
  GovernanceAgent,
  IntelligenceAgent,
  WorkflowAgent,
  CodeAgent,
} from '../agents/specialized.js';

class AgentRegistry {
  constructor() {
    /** @type {Map<string, import('../agents/base.agent.js').BaseAgent>} */
    this._agents = new Map();
  }

  /**
   * Register an agent instance.
   * @param {import('../agents/base.agent.js').BaseAgent} agent
   */
  register(agent) {
    this._agents.set(agent.type, agent);
  }

  /**
   * Get an agent by type.
   * @param {string} type
   * @returns {import('../agents/base.agent.js').BaseAgent|undefined}
   */
  get(type) {
    return this._agents.get(type);
  }

  /**
   * Get all registered agents.
   * @returns {import('../agents/base.agent.js').BaseAgent[]}
   */
  getAll() {
    return Array.from(this._agents.values());
  }

  /**
   * Get status of all agents.
   * @returns {Object[]}
   */
  getAllStatus() {
    return this.getAll().map((agent) => agent.getStatus());
  }

  /**
   * Get agents by type list.
   * @param {string[]} types
   * @returns {import('../agents/base.agent.js').BaseAgent[]}
   */
  getByTypes(types) {
    return types.map((t) => this._agents.get(t)).filter(Boolean);
  }
}

// Singleton with all agents pre-registered
const registry = new AgentRegistry();
registry.register(new SecurityAgent());
registry.register(new GovernanceAgent());
registry.register(new IntelligenceAgent());
registry.register(new WorkflowAgent());
registry.register(new CodeAgent());

export { registry };
