/**
 * @fileoverview Agent orchestrator — sequential pipeline with context passing.
 * The brain of the multi-agent system.
 *
 * Pipeline Architecture:
 *   1. Security Sentinel → scans for threats
 *   2. Governance Auditor → checks compliance (references Security findings)
 *   3. Intelligence Analyst → correlates patterns (uses Security + Governance)
 *   4. Workflow Coordinator → synthesizes action plan (uses all prior findings)
 *   5. Code Architect → implements if needed (references Workflow plan)
 *
 * Each agent's output is injected into the next agent's context,
 * creating a genuine inter-agent reasoning chain.
 */

import { registry } from './registry.js';
import { getAIEngine } from '@aios/ai-engine';
import { AGENT_TYPES } from '@aios/shared/constants';

/**
 * Defines the execution order for the agent pipeline.
 * Agents are processed sequentially — each receives the prior agents' results.
 */
const PIPELINE_ORDER = [
  AGENT_TYPES.SECURITY,
  AGENT_TYPES.GOVERNANCE,
  AGENT_TYPES.INTELLIGENCE,
  AGENT_TYPES.WORKFLOW,
  AGENT_TYPES.CODE,
];

/**
 * Orchestrate a multi-agent response using a sequential pipeline.
 * @param {{ input: string, userId?: number, conversationId?: string, fileContents?: string }} params
 * @returns {Promise<{ plan: string, results: Array<{ agentType: string, content: string, metadata: object }>, pipeline: boolean }>}
 */
export async function orchestrate({ input, userId, conversationId, fileContents }) {
  const aiEngine = getAIEngine();

  // Determine which agents should respond
  const respondingTypes = await aiEngine.getRespondingAgents(input);
  const orderedTypes = PIPELINE_ORDER.filter((t) => respondingTypes.includes(t));

  // Get agent instances
  const agents = registry.getByTypes(orderedTypes);

  // Generate orchestration plan
  const agentNames = agents.map((a) => `${a.emoji} ${a.name}`).join(' → ');
  const plan = `🧠 Orchestrator: Task analyzed. Executing sequential pipeline: ${agentNames}. Each agent builds on prior findings.`;

  // Execute agents in pipeline order — each gets prior context
  const pipelineContext = [];
  const results = [];

  for (const agent of agents) {
    // Check if agent should activate given current context
    if (!agent.shouldActivate(input, pipelineContext)) {
      continue;
    }

    try {
      const result = await agent.process(input, {
        aiEngine,
        pipelineContext: [...pipelineContext],
        fileContents,
      });

      results.push(result);

      // Add this agent's result to pipeline context for next agents
      pipelineContext.push({
        agentType: result.agentType,
        agentName: result.agentName,
        content: result.content,
        metadata: result.metadata,
      });
    } catch (error) {
      // Don't let one agent's failure stop the pipeline
      const errorResult = {
        agentType: agent.type,
        agentName: agent.name,
        emoji: agent.emoji,
        content: `${agent.emoji} ${agent.name}: Error during analysis — ${error.message}. Pipeline continuing with remaining agents.`,
        metadata: { error: true, errorMessage: error.message, provider: 'error' },
      };
      results.push(errorResult);

      // Still add to context so later agents know about the failure
      pipelineContext.push({
        agentType: agent.type,
        agentName: agent.name,
        content: `[ERROR] ${error.message}`,
        metadata: { error: true },
      });
    }
  }

  return { plan, results, pipeline: true };
}

/**
 * Get status of all agents.
 * @returns {Object[]}
 */
export function getAgentStatus() {
  return registry.getAllStatus();
}

/**
 * Orchestrate with real-time callbacks for SSE streaming.
 * Each agent fires onAgentStart/onAgentComplete so the frontend can show progress.
 * @param {{ input: string, userId?: number, conversationId?: string, fileContents?: string }} params
 * @param {{ onPipelineStart: Function, onAgentStart: Function, onAgentComplete: Function, onPipelineDone: Function }} callbacks
 * @returns {Promise<{ plan: string, results: Array, pipeline: boolean }>}
 */
export async function orchestrateStreaming({ input, userId, conversationId, fileContents }, callbacks = {}) {
  const aiEngine = getAIEngine();

  const respondingTypes = await aiEngine.getRespondingAgents(input);
  const orderedTypes = PIPELINE_ORDER.filter((t) => respondingTypes.includes(t));
  const agents = registry.getByTypes(orderedTypes);

  const agentNames = agents.map((a) => `${a.emoji} ${a.name}`).join(' → ');
  const plan = `🧠 Orchestrator: Task analyzed. Executing sequential pipeline: ${agentNames}. Each agent builds on prior findings.`;

  // Notify pipeline start
  const pipelineAgents = agents.map((a) => ({
    type: a.type,
    name: a.name,
    emoji: a.emoji,
  }));
  callbacks.onPipelineStart?.({ plan, agents: pipelineAgents });

  const pipelineContext = [];
  const results = [];

  for (const agent of agents) {
    if (!agent.shouldActivate(input, pipelineContext)) continue;

    // Notify agent starting
    callbacks.onAgentStart?.({ agentType: agent.type, agentName: agent.name, emoji: agent.emoji });

    try {
      const result = await agent.process(input, {
        aiEngine,
        pipelineContext: [...pipelineContext],
        fileContents,
      });

      results.push(result);
      pipelineContext.push({
        agentType: result.agentType,
        agentName: result.agentName,
        content: result.content,
        metadata: result.metadata,
      });

      // Notify agent complete — stream the result immediately
      callbacks.onAgentComplete?.({ ...result, pipelineIndex: results.length - 1 });
    } catch (error) {
      const errorResult = {
        agentType: agent.type,
        agentName: agent.name,
        emoji: agent.emoji,
        content: `${agent.emoji} ${agent.name}: Error during analysis — ${error.message}. Pipeline continuing with remaining agents.`,
        metadata: { error: true, errorMessage: error.message, provider: 'error' },
      };
      results.push(errorResult);
      pipelineContext.push({
        agentType: agent.type,
        agentName: agent.name,
        content: `[ERROR] ${error.message}`,
        metadata: { error: true },
      });
      callbacks.onAgentComplete?.({ ...errorResult, pipelineIndex: results.length - 1 });
    }
  }

  callbacks.onPipelineDone?.({ totalAgents: results.length });
  return { plan, results, pipeline: true };
}

/**
 * Invoke a specific agent by type (direct, no pipeline).
 * @param {string} agentType
 * @param {string} input
 * @returns {Promise<Object>}
 */
export async function invokeAgent(agentType, input) {
  const agent = registry.get(agentType);
  if (!agent) {
    throw new Error(`Agent type "${agentType}" not found`);
  }

  const aiEngine = getAIEngine();
  return agent.process(input, { aiEngine });
}
