/**
 * Claude Code Agent (Bun/TypeScript)
 *
 * Ported from disler/big-3-super-agent ClaudeCodeAgenticCoder
 * Provides programmatic access to Claude Code for multi-agent orchestration
 *
 * @see https://github.com/disler/big-3-super-agent
 */

import { spawn, spawnSync } from 'bun';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { nanoid } from 'nanoid';

// ============================================================================
// TYPES
// ============================================================================

interface AgentConfig {
  name: string;
  workingDirectory: string;
  allowedTools?: string[];
  sessionId?: string;
  operatorFile?: string;
}

interface AgentSession {
  id: string;
  name: string;
  workingDirectory: string;
  createdAt: string;
  operatorFiles: string[];
  status: 'active' | 'completed' | 'error';
}

interface AgentResult {
  success: boolean;
  output: string;
  operatorFile?: string;
  sessionId: string;
}

// ============================================================================
// REGISTRY
// ============================================================================

class AgentRegistry {
  private registryPath: string;
  private sessions: Map<string, AgentSession> = new Map();

  constructor(basePath: string = './data/agents/claude_code') {
    this.registryPath = resolve(basePath);
    if (!existsSync(this.registryPath)) {
      mkdirSync(this.registryPath, { recursive: true });
    }
    this.loadRegistry();
  }

  private loadRegistry(): void {
    const registryFile = join(this.registryPath, 'registry.json');
    if (existsSync(registryFile)) {
      const data = JSON.parse(readFileSync(registryFile, 'utf-8'));
      this.sessions = new Map(Object.entries(data));
    }
  }

  private saveRegistry(): void {
    const registryFile = join(this.registryPath, 'registry.json');
    writeFileSync(registryFile, JSON.stringify(Object.fromEntries(this.sessions), null, 2));
  }

  createSession(config: AgentConfig): AgentSession {
    const session: AgentSession = {
      id: config.sessionId || nanoid(),
      name: config.name,
      workingDirectory: config.workingDirectory,
      createdAt: new Date().toISOString(),
      operatorFiles: [],
      status: 'active',
    };

    this.sessions.set(session.id, session);
    this.saveRegistry();
    return session;
  }

  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId: string, updates: Partial<AgentSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      this.saveRegistry();
    }
  }

  listSessions(): AgentSession[] {
    return Array.from(this.sessions.values());
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.saveRegistry();
    }
    return deleted;
  }
}

// ============================================================================
// CLAUDE CODE AGENT
// ============================================================================

export class ClaudeCodeAgent {
  private registry: AgentRegistry;
  private config: AgentConfig;
  private session: AgentSession;

  constructor(config: AgentConfig) {
    this.config = config;
    this.registry = new AgentRegistry();

    // Create or resume session
    if (config.sessionId) {
      const existing = this.registry.getSession(config.sessionId);
      if (existing) {
        this.session = existing;
      } else {
        this.session = this.registry.createSession(config);
      }
    } else {
      this.session = this.registry.createSession(config);
    }

    console.log(`🤖 Claude Code Agent initialized: ${this.session.name} (${this.session.id})`);
  }

  /**
   * Execute a prompt via Claude Code CLI
   */
  async execute(prompt: string, options: { outputFormat?: 'text' | 'json' } = {}): Promise<AgentResult> {
    const args = ['claude', '-p', prompt];

    // Add allowed tools
    if (this.config.allowedTools?.length) {
      for (const tool of this.config.allowedTools) {
        args.push('--allowedTools', tool);
      }
    }

    // Add output format
    if (options.outputFormat === 'json') {
      args.push('--output-format', 'json');
    }

    // Create operator file for this task
    const operatorFile = join(
      this.config.workingDirectory,
      'operators',
      `${this.session.id}_${nanoid(6)}.md`
    );

    // Ensure operators directory exists
    const operatorsDir = join(this.config.workingDirectory, 'operators');
    if (!existsSync(operatorsDir)) {
      mkdirSync(operatorsDir, { recursive: true });
    }

    try {
      // Execute claude CLI
      const proc = spawnSync(args, {
        cwd: this.config.workingDirectory,
        env: { ...process.env },
      });

      const output = proc.stdout?.toString() || '';
      const error = proc.stderr?.toString() || '';

      if (proc.exitCode !== 0) {
        this.registry.updateSession(this.session.id, { status: 'error' });
        return {
          success: false,
          output: error || output,
          sessionId: this.session.id,
        };
      }

      // Save operator file
      writeFileSync(
        operatorFile,
        `# Operator Log: ${new Date().toISOString()}\n\n## Prompt\n${prompt}\n\n## Output\n${output}`
      );

      // Update session
      this.session.operatorFiles.push(operatorFile);
      this.registry.updateSession(this.session.id, {
        operatorFiles: this.session.operatorFiles,
      });

      return {
        success: true,
        output,
        operatorFile,
        sessionId: this.session.id,
      };
    } catch (error) {
      this.registry.updateSession(this.session.id, { status: 'error' });
      return {
        success: false,
        output: String(error),
        sessionId: this.session.id,
      };
    }
  }

  /**
   * Execute with streaming output
   */
  async executeStream(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<AgentResult> {
    const args = ['claude', '-p', prompt, '--output-format', 'stream-json'];

    if (this.config.allowedTools?.length) {
      for (const tool of this.config.allowedTools) {
        args.push('--allowedTools', tool);
      }
    }

    try {
      const proc = spawn(args, {
        cwd: this.config.workingDirectory,
        env: { ...process.env },
        stdout: 'pipe',
        stderr: 'pipe',
      });

      let output = '';

      // Read stdout stream
      const reader = proc.stdout.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        output += chunk;
        onChunk(chunk);
      }

      const exitCode = await proc.exited;

      return {
        success: exitCode === 0,
        output,
        sessionId: this.session.id,
      };
    } catch (error) {
      return {
        success: false,
        output: String(error),
        sessionId: this.session.id,
      };
    }
  }

  /**
   * Get session info
   */
  getSession(): AgentSession {
    return this.session;
  }

  /**
   * List all agent sessions
   */
  static listAgents(): AgentSession[] {
    const registry = new AgentRegistry();
    return registry.listSessions();
  }

  /**
   * Delete an agent session
   */
  static deleteAgent(sessionId: string): boolean {
    const registry = new AgentRegistry();
    return registry.deleteSession(sessionId);
  }
}

// ============================================================================
// RAN-SPECIFIC AGENT
// ============================================================================

export class RANOptimizerAgent extends ClaudeCodeAgent {
  constructor(name: string, sessionId?: string) {
    super({
      name,
      workingDirectory: process.cwd(),
      allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Task'],
      sessionId,
    });
  }

  /**
   * Run KPI analysis
   */
  async analyzeKPIs(clusterId: string): Promise<AgentResult> {
    const prompt = `
## TASK: Analyze KPI trends for cluster ${clusterId}

## MEMORY RETRIEVAL
npx claude-flow@alpha memory retrieve --key "ran/clusters/${clusterId}/kpis"

## ANALYSIS
1. Identify anomalies using Z-score threshold > 2.5
2. Calculate KPI correlations
3. Detect performance degradation patterns

## OUTPUT
Return JSON: { anomalies: [], trends: [], recommendations: [] }
    `;

    return this.execute(prompt, { outputFormat: 'json' });
  }

  /**
   * Propose optimization actions
   */
  async proposeOptimization(
    clusterId: string,
    mode: 'power' | 'mobility' | 'capacity' | 'full'
  ): Promise<AgentResult> {
    const prompt = `
## TASK: Propose ${mode} optimization for cluster ${clusterId}

## CONSTRAINTS
- P0: [-126, -60] dBm
- Alpha: [0.4, 1.0]
- Max change per iteration: P0 ±2dB, Alpha ±0.1

## GRAPH OPERATIONS
1. Build interference graph from neighbor relations
2. Calculate topological optimization order
3. Generate coordinated parameter changes

## OUTPUT
Return JSON: { actions: [], optimization_order: [], expected_improvement: number }
    `;

    return this.execute(prompt, { outputFormat: 'json' });
  }

  /**
   * Validate proposed actions
   */
  async validateActions(clusterId: string): Promise<AgentResult> {
    const prompt = `
## TASK: Validate proposed actions for cluster ${clusterId}

## MEMORY RETRIEVAL
npx claude-flow@alpha memory retrieve --key "ran/optimization/${clusterId}/proposed_actions"

## VALIDATION RULES
1. All parameters within allowed ranges
2. No conflicting actions on same cell
3. Neighbor coordination verified
4. No known problem patterns triggered

## TRUTH PROTOCOL
- ONLY approve actions with clear justification
- REJECT if insufficient data for decision

## OUTPUT
Return JSON: { approved: [], rejected: [], warnings: [] }
    `;

    return this.execute(prompt, { outputFormat: 'json' });
  }
}

// ============================================================================
// CLI
// ============================================================================

if (import.meta.main) {
  const args = Bun.argv.slice(2);

  if (args[0] === 'list') {
    const agents = ClaudeCodeAgent.listAgents();
    console.log('📋 Claude Code Agents:');
    for (const agent of agents) {
      console.log(`  ${agent.status === 'active' ? '🟢' : '🔴'} ${agent.name} (${agent.id})`);
    }
  } else if (args[0] === 'delete' && args[1]) {
    const deleted = ClaudeCodeAgent.deleteAgent(args[1]);
    console.log(deleted ? '✅ Agent deleted' : '❌ Agent not found');
  } else if (args[0] === 'run' && args[1]) {
    const agent = new RANOptimizerAgent('cli-agent');
    const result = await agent.execute(args.slice(1).join(' '));
    console.log(result.output);
  } else {
    console.log(`
Claude Code Agent CLI

Usage:
  bun run ClaudeCodeAgent.ts list                    List all agents
  bun run ClaudeCodeAgent.ts delete <session-id>     Delete an agent
  bun run ClaudeCodeAgent.ts run <prompt>            Run a prompt
    `);
  }
}
