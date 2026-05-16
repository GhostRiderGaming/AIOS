/**
 * @fileoverview Specialized agent implementations.
 * Each agent extends BaseAgent with role-specific behavior.
 */

import { BaseAgent } from './base.agent.js';
import { AGENT_TYPES } from '@aios/shared/constants';

export class SecurityAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.SECURITY);
  }
}

export class GovernanceAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.GOVERNANCE);
  }
}

export class IntelligenceAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.INTELLIGENCE);
  }
}

export class WorkflowAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.WORKFLOW);
  }
}

export class CodeAgent extends BaseAgent {
  constructor() {
    super(AGENT_TYPES.CODE);
  }
}
