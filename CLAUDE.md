# Claude Code Configuration - SPARC Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. **USE CLAUDE CODE'S TASK TOOL** for spawning agents concurrently, not just MCP

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool (Claude Code)**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 🎯 CRITICAL: Claude Code Task Tool for Agent Execution

**Claude Code's Task tool is the PRIMARY way to spawn agents:**
```javascript
// ✅ CORRECT: Use Claude Code's Task tool for parallel agent execution
[Single Message]:
  Task("Research agent", "Analyze requirements and patterns...", "researcher")
  Task("Coder agent", "Implement core features...", "coder")
  Task("Tester agent", "Create comprehensive tests...", "tester")
  Task("Reviewer agent", "Review code quality...", "reviewer")
  Task("Architect agent", "Design system architecture...", "system-architect")
```

**MCP tools are ONLY for coordination setup:**
- `mcp__claude-flow__swarm_init` - Initialize coordination topology
- `mcp__claude-flow__agent_spawn` - Define agent types for coordination
- `mcp__claude-flow__task_orchestrate` - Orchestrate high-level workflows

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Project Overview

This project uses SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology with Claude-Flow orchestration for systematic Test-Driven Development.

## SPARC Commands

### Core Commands
- `npx claude-flow sparc modes` - List available modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc info <mode>` - Get mode details

### Batchtools Commands
- `npx claude-flow sparc batch <modes> "<task>"` - Parallel execution
- `npx claude-flow sparc pipeline "<task>"` - Full pipeline processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - Multi-task processing

### Build Commands
- `npm run build` - Build project
- `npm run test` - Run tests
- `npm run lint` - Linting
- `npm run typecheck` - Type checking

### RAN Optimization Commands (Bun/TypeScript)
- `npm run observability` - Start RAN observability server (Bun)
- `npm run observability:send` - Send event to observability server
- `npm run agent:list` - List Claude Code agent sessions
- `npm run agent:run` - Run Claude Code agent with prompt
- `npm run ran:optimize` - Execute RAN optimization workflow
- `npm run ran:graph` - Work with RAN Knowledge Graph

### Slash Commands (Claude Code)
- `/project:ran-optimize <cluster_id> <mode>` - Closed-loop RAN optimization
- `/project:ran-infinite <spec> <dir> <count>` - Infinite agentic optimization loop
- `/project:ran-status <cluster_id>` - Check cluster KPI status
- `/project:ran-graph <cluster_id>` - Visualize interference graph

## SPARC Workflow Phases

1. **Specification** - Requirements analysis (`sparc run spec-pseudocode`)
2. **Pseudocode** - Algorithm design (`sparc run spec-pseudocode`)
3. **Architecture** - System design (`sparc run architect`)
4. **Refinement** - TDD implementation (`sparc tdd`)
5. **Completion** - Integration (`sparc run integration`)

## Code Style & Best Practices

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **Documentation**: Keep updated

## 🚀 Available Agents (54 Total)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation
`tdd-london-swarm`, `production-validator`

### Migration & Planning
`migration-planner`, `swarm-init`

## 🎯 Claude Code vs MCP Tools

### Claude Code Handles ALL EXECUTION:
- **Task tool**: Spawn and run agents concurrently for actual work
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- Implementation work
- Project navigation and analysis
- TodoWrite and task management
- Git operations
- Package management
- Testing and debugging

### MCP Tools ONLY COORDINATE:
- Swarm initialization (topology setup)
- Agent type definitions (coordination patterns)
- Task orchestration (high-level planning)
- Memory management
- Neural features
- Performance tracking
- GitHub integration

**KEY**: MCP coordinates the strategy, Claude Code's Task tool executes with real agents.

## 🚀 Quick Setup

```bash
# Add MCP servers (Claude Flow required, others optional)
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add ruv-swarm npx ruv-swarm mcp start  # Optional: Enhanced coordination
claude mcp add flow-nexus npx flow-nexus@latest mcp start  # Optional: Cloud features
```

## MCP Tool Categories

### Coordination
`swarm_init`, `agent_spawn`, `task_orchestrate`

### Monitoring
`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

### Memory & Neural
`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

### GitHub Integration
`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

### System
`benchmark_run`, `features_detect`, `swarm_monitor`

### Flow-Nexus MCP Tools (Optional Advanced Features)
Flow-Nexus extends MCP capabilities with 70+ cloud-based orchestration tools:

**Key MCP Tool Categories:**
- **Swarm & Agents**: `swarm_init`, `swarm_scale`, `agent_spawn`, `task_orchestrate`
- **Sandboxes**: `sandbox_create`, `sandbox_execute`, `sandbox_upload` (cloud execution)
- **Templates**: `template_list`, `template_deploy` (pre-built project templates)
- **Neural AI**: `neural_train`, `neural_patterns`, `seraphina_chat` (AI assistant)
- **GitHub**: `github_repo_analyze`, `github_pr_manage` (repository management)
- **Real-time**: `execution_stream_subscribe`, `realtime_subscribe` (live monitoring)
- **Storage**: `storage_upload`, `storage_list` (cloud file management)

**Authentication Required:**
- Register: `mcp__flow-nexus__user_register` or `npx flow-nexus@latest register`
- Login: `mcp__flow-nexus__user_login` or `npx flow-nexus@latest login`
- Access 70+ specialized MCP tools for advanced orchestration

## 🚀 Agent Execution Flow with Claude Code

### The Correct Pattern:

1. **Optional**: Use MCP tools to set up coordination topology
2. **REQUIRED**: Use Claude Code's Task tool to spawn agents that do actual work
3. **REQUIRED**: Each agent runs hooks for coordination
4. **REQUIRED**: Batch all operations in single messages

### Example Full-Stack Development:

```javascript
// Single message with all agent spawning via Claude Code's Task tool
[Parallel Agent Execution]:
  Task("Backend Developer", "Build REST API with Express. Use hooks for coordination.", "backend-dev")
  Task("Frontend Developer", "Create React UI. Coordinate with backend via memory.", "coder")
  Task("Database Architect", "Design PostgreSQL schema. Store schema in memory.", "code-analyzer")
  Task("Test Engineer", "Write Jest tests. Check memory for API contracts.", "tester")
  Task("DevOps Engineer", "Setup Docker and CI/CD. Document in memory.", "cicd-engineer")
  Task("Security Auditor", "Review authentication. Report findings via hooks.", "reviewer")
  
  // All todos batched together
  TodoWrite { todos: [...8-10 todos...] }
  
  // All file operations together
  Write "backend/server.js"
  Write "frontend/App.jsx"
  Write "database/schema.sql"
```

## 📋 Agent Coordination Protocol

### Every Agent Spawned via Task Tool MUST:

**1️⃣ BEFORE Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work:**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ AFTER Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎯 Concurrent Execution Examples

### ✅ CORRECT WORKFLOW: MCP Coordinates, Claude Code Executes

```javascript
// Step 1: MCP tools set up coordination (optional, for complex tasks)
[Single Message - Coordination Setup]:
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }

// Step 2: Claude Code Task tool spawns ACTUAL agents that do the work
[Single Message - Parallel Agent Execution]:
  // Claude Code's Task tool spawns real agents concurrently
  Task("Research agent", "Analyze API requirements and best practices. Check memory for prior decisions.", "researcher")
  Task("Coder agent", "Implement REST endpoints with authentication. Coordinate via hooks.", "coder")
  Task("Database agent", "Design and implement database schema. Store decisions in memory.", "code-analyzer")
  Task("Tester agent", "Create comprehensive test suite with 90% coverage.", "tester")
  Task("Reviewer agent", "Review code quality and security. Document findings.", "reviewer")
  
  // Batch ALL todos in ONE call
  TodoWrite { todos: [
    {id: "1", content: "Research API patterns", status: "in_progress", priority: "high"},
    {id: "2", content: "Design database schema", status: "in_progress", priority: "high"},
    {id: "3", content: "Implement authentication", status: "pending", priority: "high"},
    {id: "4", content: "Build REST endpoints", status: "pending", priority: "high"},
    {id: "5", content: "Write unit tests", status: "pending", priority: "medium"},
    {id: "6", content: "Integration tests", status: "pending", priority: "medium"},
    {id: "7", content: "API documentation", status: "pending", priority: "low"},
    {id: "8", content: "Performance optimization", status: "pending", priority: "low"}
  ]}
  
  // Parallel file operations
  Bash "mkdir -p app/{src,tests,docs,config}"
  Write "app/package.json"
  Write "app/src/server.js"
  Write "app/tests/server.test.js"
  Write "app/docs/API.md"
```

### ❌ WRONG (Multiple Messages):
```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

## Performance Benefits

- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
- **27+ neural models**

## Hooks Integration

### Pre-Operation
- Auto-assign agents by file type
- Validate commands for safety
- Prepare resources automatically
- Optimize topology by complexity
- Cache searches

### Post-Operation
- Auto-format code
- Train neural patterns
- Update memory
- Analyze performance
- Track token usage

### Session Management
- Generate summaries
- Persist state
- Track metrics
- Restore context
- Export workflows

## Advanced Features (v2.0.0)

- 🚀 Automatic Topology Selection
- ⚡ Parallel Execution (2.8-4.4x speed)
- 🧠 Neural Training
- 📊 Bottleneck Analysis
- 🤖 Smart Auto-Spawning
- 🛡️ Self-Healing Workflows
- 💾 Cross-Session Memory
- 🔗 GitHub Integration

## Integration Tips

1. Start with basic swarm init
2. Scale agents gradually
3. Use memory for context
4. Monitor progress regularly
5. Train patterns from success
6. Enable hooks automation
7. Use GitHub tools first

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Flow-Nexus Platform: https://flow-nexus.ruv.io (registration required for cloud features)

---

Remember: **Claude Flow coordinates, Claude Code creates!**

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Never save working files, text/mds and tests to the root folder.

## Build & Development Commands

```bash
npm run build          # TypeScript compile + WASM build (wasm-pack)
npm run dev            # Watch mode with tsx
npm run test           # Run tests with vitest
npm run test:coverage  # Tests with coverage report
npm run lint           # ESLint on src/
npm run simulate       # Run the swarm simulation demo
npm run train:rl       # Train the Decision Transformer RL agent
npm run dashboard      # Start backend + frontend dashboard (concurrent)
npm run swarm:deploy   # Deploy swarm to production
```
# Ericsson RAN Project AI automation optimization for Configuration, performance and system fault management
## Architecture Overview

This is an **Ericsson RAN Autonomous Optimization Platform** - a federated swarm of self-learning agents (NanoAgents) that optimize cellular network parameters at the edge.

### Core Engine Stack (Ruvnet Ecosystem)

```
┌─────────────────────────────────────────────────────────────────┐
│                        NanoAgent                                 │
│  (One per cell - autonomous optimization unit)                   │
├─────────────────────────────────────────────────────────────────┤
│  AgentDB v1.6.1    │ Ruvector v0.1.26  │ Midstreamer v0.2.3    │
│  - ReasoningBank   │ - ST-GNN          │ - DTW alignment       │
│  - Causal Graphs   │ - Flash Attention │ - Chaos analysis      │
│  - HNSW vectors    │ - Hypergraph      │ - N-BEATS forecast    │
│  - Decision Trans. │ - Message Passing │ - Attractor detect    │
├─────────────────────────────────────────────────────────────────┤
│                    RuvSwarm v1.0.20                              │
│  - Federated Learning (FedAvg/FedProx/FedNova)                  │
│  - Leader election, pattern propagation                          │
│  - Differential privacy (ε-δ), Byzantine tolerance              │
├─────────────────────────────────────────────────────────────────┤
│                    AIDefence v0.1.6                              │
│  - Adversarial input detection                                   │
│  - Safety guardrails (parameter clamping)                        │
│  - Rate limiting, model provenance                               │
└─────────────────────────────────────────────────────────────────┘
```

### RAN Optimization Domains

- **CM (Configuration Management)**: `src/ran/cm/` - Uplink power control (P0, Alpha, PUSCH/PUCCH) using Decision Transformer RL
- **PM (Performance Management)**: `src/ran/pm/` - Multi-granularity KPI analysis (15min/hourly/daily/weekly)
- **FM (Fault Management)**: `src/ran/fm/` - 9 problem categories with causal RCA and self-healing

### Key Data Flow

1. KPIs ingested via `NanoAgent.processKPI()` → AIDefence validation
2. PerformanceManager detects anomalies → emits `anomaly-detected`
3. FaultManager classifies problem → builds causal chain → emits `problem-detected`
4. UplinkOptimizer proposes action → AIDefence guardrails → execute or block
5. SwarmOrchestrator aggregates learnings via federated rounds

### Type System

All domain types are in `src/types/index.ts`:
- `CellGlobalIdentity`, `CellKPIs`, `SliceKPIs` - Cell identification and metrics
- `RANGraph`, `RANGraphNode`, `RANGraphEdge` - Spatial topology for GNN
- `ThoughtTrajectory`, `CausalEdge` - Reasoning and causality
- `Action`, `ActionRecord`, `OptimizationState` - Optimization actions
- `Anomaly`, `Problem`, `ProblemCategory` - Fault detection types
- `SwarmMessage`, `FederatedModelUpdate` - Swarm coordination

### Path Aliases

Configured in tsconfig.json:
- `@core/*` → `src/core/*`
- `@ran/*` → `src/ran/*`
- `@security/*` → `src/security/*`
- `@utils/*` → `src/utils/*`

## Important Constants

From `config/swarm-config.json`:
- **Safety guardrails**: P0 range [-126, -60] dBm, Alpha [0.4, 1.0], Max TX power 46 dBm
- **Federation**: FedAvg with differential privacy (ε=1.0), min 3 clients/round
- **GNN**: 4-layer ST-GNN, 256 hidden dim, 8 attention heads, Flash Attention
- **RL**: Decision Transformer with context length 20, 3 layers

## Secondary Codebase (src1/)

Contains alternative GNN implementations and analysis scripts:
- `src1/gnn/` - FPPC optimizer, cluster optimizer, parallel processing
- `src1/analysis/` - Anomaly detection, root cause analysis, time series
- `src1/data/` - CSV KPI loaders and sample generators

## WASM Components

WASM modules built from `rust-core/` via wasm-pack:
- Attention mechanisms (`@ruvector/attention-wasm`)
- GNN operations (`@ruvector/gnn-wasm`)
- Graph algorithms (`@ruvector/graph-wasm`)

## 📊 Graph Knowledge Integration (ruvnet/graph-data-structure)

### RANKnowledgeGraph Class

Located in `src/core/RANKnowledgeGraph.ts`, provides:
- **Topological Sort**: Optimization order for cell dependencies
- **Dijkstra's Shortest Path**: Interference propagation analysis
- **K-Hop Neighborhood**: GNN message passing context
- **PyTorch Geometric Export**: Convert to torch_geometric format

```typescript
import { RANKnowledgeGraph } from '@/core/RANKnowledgeGraph';

const graph = new RANKnowledgeGraph();
graph.addCell(cgi, { staticFeatures, dynamicFeatures });
graph.addInterference(sourceCgi, targetCgi, interferenceLevel);

// Get optimization order (dominant interferors first)
const order = graph.getOptimizationOrder();

// Find interference path
const path = graph.getInterferencePath(sourceCell, targetCell);

// Export for GNN
const pygData = graph.toTorchGeometricFormat();
```

## 📡 Observability System (Bun/TypeScript)

Based on disler/claude-code-hooks-multi-agent-observability pattern.

### Server (`src/observability/ran-observability-server.ts`)
- Bun HTTP + WebSocket server
- SQLite persistence with WAL mode
- Real-time event streaming
- REST API endpoints: `/events`, `/events/recent`, `/events/stats`

### Event Sender (`src/observability/send-event.ts`)
- CLI tool for hooks: `bun run observability:send --event-type RANOptimization`
- Pre-tool validation with RAN safety guardrails
- Integration with claude-flow hooks

### Event Types
| Type | Emoji | Usage |
|------|-------|-------|
| PreToolUse | 🔧 | Tool validation |
| PostToolUse | ✅ | Execution result |
| RANOptimization | 📡 | Parameter changes |
| KPIAnomaly | ⚠️ | Anomaly detection |
| FaultDetected | 🔴 | Problem classification |
| GuardrailBlocked | 🛡️ | Safety violation |

## 🤖 Claude Code Agent (Bun/TypeScript)

Based on disler/big-3-super-agent pattern.

### RANOptimizerAgent (`src/agents/ClaudeCodeAgent.ts`)
- Session persistence with registry
- Operator file logging
- Streaming output support
- RAN-specific methods: `analyzeKPIs()`, `proposeOptimization()`, `validateActions()`

```typescript
import { RANOptimizerAgent } from '@/agents/ClaudeCodeAgent';

const agent = new RANOptimizerAgent('cluster-optimizer');
const result = await agent.analyzeKPIs('cluster_001');
const actions = await agent.proposeOptimization('cluster_001', 'power');
```

## 🔄 uv → bunx Command Mapping

| Python (uv) | Bun/TypeScript |
|-------------|----------------|
| `uv run send_event.py` | `bun run observability:send` |
| `uv run big_three_agents.py` | `bun run src/agents/ClaudeCodeAgent.ts` |
| `uvx claude-flow hooks` | `bunx claude-flow@alpha hooks` |
| `uv pip install` | `bun install` |

## 🎯 RAN-Specific Skills

Located in `.claude/skills/ran-graph-optimization.md`:
- Graph-based reasoning for cell optimization
- Integration with AgentDB ReasoningBank
- GNN message passing patterns
- Causal root cause analysis
