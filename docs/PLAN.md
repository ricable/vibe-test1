# Ericsson RAN Autonomous Optimization Platform
## Strategic Development Plan v2.0

**Last Updated**: December 2024
**Status**: Phase 1 Complete, Phase 2 In Progress
**Branch**: `claude/integrate-ruvnet-graph-01KfuHCde1ZbBDyR68AFEeMy`

---

## Executive Summary

This document outlines the comprehensive development plan for the **Ericsson RAN Autonomous Optimization Platform** - a federated swarm of self-learning NanoAgents that optimize cellular network parameters at the edge using AI-driven closed-loop automation.

---

## 🎯 Achieved State (Phase 1 Complete)

### 1. Core Infrastructure

| Component | Status | Description |
|-----------|--------|-------------|
| **RANKnowledgeGraph** | ✅ Complete | Graph-data-structure integration with topological sort, Dijkstra |
| **Observability Server** | ✅ Complete | Bun/TypeScript WebSocket server with SQLite persistence |
| **Event Sender CLI** | ✅ Complete | Hook integration with RAN safety guardrails |
| **ClaudeCodeAgent** | ✅ Complete | Agent wrapper with session management |
| **RANOptimizerAgent** | ✅ Complete | RAN-specific methods for KPI analysis |

### 2. Claude Code Integration

| Feature | Status | Location |
|---------|--------|----------|
| **Slash Commands** | ✅ Complete | `.claude/commands/ran-optimize.md`, `ran-infinite.md` |
| **Skills** | ✅ Complete | `.claude/skills/ran-graph-optimization.md` |
| **Hooks** | ✅ Complete | `.claude/hooks/ran_observability.py` |
| **Settings** | ✅ Complete | `.claude/settings.json` with Pre/PostToolUse hooks |

### 3. Package Dependencies

```json
{
  "graph-data-structure": "^4.5.0",  // ✅ Installed
  "nanoid": "^5.0.4",                 // ✅ For session IDs
  "better-sqlite3": "^9.2.2"          // ✅ For observability DB
}
```

### 4. Documentation

| Document | Status |
|----------|--------|
| `CLAUDE.md` | ✅ Updated with graph integration, observability, uv→bunx mapping |
| `docs/integration-plans/ruvnet-graph-ran-integration.md` | ✅ Complete |
| `docs/PLAN.md` | ✅ This document |

---

## 📊 Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE SWARM ORCHESTRATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ /ran-optimize│  │ /ran-infinite│  │ /ran-status  │  │ /ran-graph   │    │
│  │ Slash Cmd    │  │ Slash Cmd    │  │ Slash Cmd    │  │ Slash Cmd    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │             │
│         ▼                 ▼                 ▼                 ▼             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CLAUDE-AGENT-SDK SWARM                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ KPI Analyzer│  │Graph Optim. │  │ Validator   │  │ Executor    │ │   │
│  │  │ NanoAgent   │  │ NanoAgent   │  │ NanoAgent   │  │ NanoAgent   │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │   │
│  └─────────┼────────────────┼────────────────┼────────────────┼────────┘   │
│            │                │                │                │             │
│            ▼                ▼                ▼                ▼             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       OBSERVABILITY LAYER                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ Bun Server   │  │ SQLite DB    │  │ WebSocket    │               │   │
│  │  │ :4000        │  │ WAL Mode     │  │ /stream      │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RAN OPTIMIZATION ENGINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ RANKnowledge    │  │ Decision        │  │ AIDefence       │             │
│  │ Graph           │  │ Transformer RL  │  │ Guardrails      │             │
│  │ - Topo Sort     │  │ - P0/Alpha      │  │ - Parameter     │             │
│  │ - Dijkstra      │  │ - Context=20    │  │   Clamping      │             │
│  │ - K-Hop         │  │ - 3 Layers      │  │ - Rate Limit    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FEDERATED LEARNING (RuvSwarm)                     │   │
│  │  FedAvg | FedProx | FedNova | ε-δ Differential Privacy | Byzantine │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Multi-Phase Development Roadmap

### Phase 2: RAN Parameter Automation (Current)

**Timeline**: Weeks 1-4
**Objective**: Implement closed-loop automation with 4-ROP validation

#### 2.1 KPI Ingestion Pipeline

```typescript
// Target: Real-time KPI ingestion with 15-min ROP granularity
interface ROPData {
  rop_id: string;           // ROP identifier (timestamp-based)
  timestamp: Date;
  duration_min: 15;
  cells: Map<string, CellKPIs>;
  aggregation_level: '15min' | '1hour' | '1day';
}

// Tasks:
// □ Implement KPI collector service
// □ Add ROP buffer (circular buffer for last 4 ROPs)
// □ Create KPI normalization pipeline
// □ Integrate with existing PerformanceManager
```

**Files to Create**:
- `src/ran/pm/KPIIngestionService.ts`
- `src/ran/pm/ROPBuffer.ts`
- `src/ran/pm/KPINormalizer.ts`

#### 2.2 4-ROP Validation Framework

```typescript
// Validation window: 4 consecutive ROPs (1 hour total)
interface ValidationWindow {
  baseline_rops: ROPData[];      // Pre-change ROPs (4)
  post_change_rops: ROPData[];   // Post-change ROPs (4)
  change_timestamp: Date;
  validation_status: 'pending' | 'validating' | 'approved' | 'rollback';
}

// Decision Logic:
// IF post_change KPI >= baseline KPI (within tolerance):
//    APPROVE change, store in ReasoningBank as positive trajectory
// ELSE:
//    ROLLBACK, store as negative trajectory, adjust RL reward
```

**Validation Metrics**:
| Metric | Threshold | Weight |
|--------|-----------|--------|
| UL Throughput | ≥ -2% | 0.35 |
| RACH Success | ≥ -0.5% | 0.25 |
| Call Drop Rate | ≤ +0.5% | 0.20 |
| Interference (IoT) | ≤ +2 dB | 0.20 |

**Files to Create**:
- `src/ran/validation/ValidationWindow.ts`
- `src/ran/validation/RollbackManager.ts`
- `src/ran/validation/MetricComparator.ts`

#### 2.3 Rollback Mechanism

```typescript
// Automatic rollback on degradation
interface RollbackAction {
  original_action: Action;
  rollback_action: Action;
  trigger: 'auto' | 'manual';
  reason: string;
  executed_at: Date;
}

// Rollback Flow:
// 1. Detect degradation in 4-ROP window
// 2. Generate inverse action
// 3. Validate inverse is within guardrails
// 4. Execute rollback
// 5. Store trajectory with negative reward
// 6. Emit 'rollback-executed' event
```

**Files to Create**:
- `src/ran/rollback/RollbackService.ts`
- `src/ran/rollback/ActionInverter.ts`

#### 2.4 Claude-Agent-SDK Swarm Integration

```typescript
// Swarm topology for RAN optimization
const ranSwarmConfig = {
  topology: 'hierarchical',
  agents: [
    { type: 'kpi-analyzer', count: 1, role: 'leader' },
    { type: 'graph-optimizer', count: 3, role: 'worker' },
    { type: 'validator', count: 1, role: 'specialist' },
    { type: 'executor', count: 1, role: 'specialist' },
  ],
  coordination: {
    memory_namespace: 'ran/swarm',
    consensus: 'leader-election',
    timeout_ms: 30000,
  },
};
```

**Slash Command Integration**:
```markdown
/project:ran-validate <cluster_id>
- Trigger 4-ROP validation for recent changes
- Display validation status dashboard
- Option to force rollback

/project:ran-rollback <action_id>
- Execute immediate rollback
- Bypass 4-ROP window if emergency
```

---

### Phase 3: Advanced AI Agent Features

**Timeline**: Weeks 5-8
**Objective**: Enhance agent intelligence with learning and adaptation

#### 3.1 ReasoningBank Trajectory Learning

```typescript
// Store optimization trajectories for pattern learning
interface OptimizationTrajectory {
  id: string;
  cluster_id: string;
  initial_state: OptimizationState;
  actions: Action[];
  final_state: OptimizationState;
  reward: number;
  validation_result: 'approved' | 'rollback';
  created_at: Date;
}

// Learning Pipeline:
// 1. Store trajectory in AgentDB
// 2. Extract features for HNSW indexing
// 3. Train Decision Transformer on successful trajectories
// 4. Update GNN embeddings
```

#### 3.2 Causal Root Cause Analysis

```typescript
// Enhanced fault detection with causal graphs
interface CausalRCAResult {
  symptom: Anomaly;
  root_cause: ProblemCategory;
  causal_chain: CausalEdge[];
  confidence: number;
  recommended_actions: Action[];
}

// Integration with RANKnowledgeGraph:
// 1. Build causal graph from historical problems
// 2. Use Dijkstra to find shortest causal path
// 3. Rank root causes by probability
```

#### 3.3 Federated Learning Enhancement

```typescript
// Cross-cluster learning with privacy
interface FederatedRound {
  round_id: number;
  participating_clusters: string[];
  aggregated_gradients: number[];
  privacy_budget_used: number;  // ε from DP
  validation_accuracy: number;
}

// FedProx for heterogeneous data:
// - Local training with proximal term
// - Byzantine-tolerant aggregation
// - Differential privacy (ε=1.0, δ=1e-5)
```

---

### Phase 4: Production Hardening

**Timeline**: Weeks 9-12
**Objective**: Enterprise-ready deployment

#### 4.1 OSS Integration

```typescript
// Ericsson OSS-RC/ENM Integration
interface OSSConnector {
  type: 'oss-rc' | 'enm' | 'eo';
  endpoint: string;
  auth: { type: 'oauth2' | 'certificate' };
  operations: ['read_cm', 'write_cm', 'read_pm', 'read_fm'];
}

// CM Operations:
// - Read MO parameters
// - Write MO parameters (with audit trail)
// - Transaction support
```

#### 4.2 Multi-Vendor Support

```typescript
// Vendor abstraction layer
interface VendorAdapter {
  vendor: 'ericsson' | 'nokia' | 'huawei' | 'samsung';
  mapToGenericKPIs(vendorKPIs: any): CellKPIs;
  mapToVendorAction(action: Action): any;
}
```

#### 4.3 Scalability & Performance

| Target | Metric |
|--------|--------|
| Cells per NanoAgent | 1 |
| Agents per Cluster | 50-100 |
| KPI Ingestion Latency | < 5s |
| Optimization Cycle | < 60s |
| Federated Round | < 5 min |

---

## 📋 Detailed Task Breakdown

### Phase 2 Tasks (Current Sprint)

#### Week 1: KPI Pipeline

- [ ] **T2.1.1**: Create `KPIIngestionService.ts` with REST endpoint
- [ ] **T2.1.2**: Implement `ROPBuffer.ts` circular buffer (4 ROPs)
- [ ] **T2.1.3**: Add KPI normalization with Z-score
- [ ] **T2.1.4**: Create unit tests for ingestion pipeline
- [ ] **T2.1.5**: Add slash command `/project:ran-ingest`

#### Week 2: Validation Framework

- [ ] **T2.2.1**: Create `ValidationWindow.ts` state machine
- [ ] **T2.2.2**: Implement `MetricComparator.ts` with weighted scoring
- [ ] **T2.2.3**: Add validation event emissions
- [ ] **T2.2.4**: Create validation dashboard component
- [ ] **T2.2.5**: Add slash command `/project:ran-validate`

#### Week 3: Rollback Mechanism

- [ ] **T2.3.1**: Create `RollbackService.ts` orchestrator
- [ ] **T2.3.2**: Implement `ActionInverter.ts` for reverse actions
- [ ] **T2.3.3**: Add rollback guardrails validation
- [ ] **T2.3.4**: Create rollback observability events
- [ ] **T2.3.5**: Add slash command `/project:ran-rollback`

#### Week 4: Integration & Testing

- [ ] **T2.4.1**: Integrate with claude-agent-sdk swarm
- [ ] **T2.4.2**: End-to-end test: optimize → validate → rollback
- [ ] **T2.4.3**: Performance benchmarking
- [ ] **T2.4.4**: Update CLAUDE.md and skills
- [ ] **T2.4.5**: Create demo scenario

---

## 🔧 Script & Command Reference

### NPM Scripts (package.json)

```bash
# Observability
npm run observability           # Start Bun server on :4000
npm run observability:send      # Send event via CLI

# Agents
npm run agent:list              # List Claude Code agent sessions
npm run agent:run -- "<prompt>" # Run agent with prompt

# RAN Operations
npm run ran:optimize            # Execute /project:ran-optimize
npm run ran:status              # Check cluster status
npm run ran:graph               # Work with knowledge graph

# Phase 2 (To Add)
npm run ran:ingest              # Start KPI ingestion service
npm run ran:validate            # Trigger validation window
npm run ran:rollback            # Execute rollback
```

### Bunx/NPX Commands

```bash
# Claude Flow Operations
bunx claude-flow@alpha hooks pre-task --description "task"
bunx claude-flow@alpha memory store --namespace "ran/clusters" --key "kpis"
bunx claude-flow@alpha memory retrieve --key "ran/optimization/actions"

# Claude Code Invocation
bunx claude -p "/project:ran-optimize cluster_001 power"
bunx claude -p "/project:ran-infinite specs/urban.json output/ 5"

# AgentDB Operations
bunx agentdb@alpha query --collection trajectories --filter "success=true"
bunx agentdb@alpha train --model decision-transformer --data trajectories
```

### MCP Server Configuration

```json
{
  "mcpServers": {
    "claude-flow": {
      "command": "npx",
      "args": ["claude-flow@alpha", "mcp", "start"]
    },
    "agentdb": {
      "command": "npx",
      "args": ["agentdb@alpha", "mcp", "start"]
    },
    "ran-optimizer": {
      "command": "bun",
      "args": ["run", "src/mcp/ran-optimizer-server.ts"]
    }
  }
}
```

### Hook Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "bun run observability:send --event-type PreToolUse --source-app ran-optimizer"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "bun run observability:send --event-type PostToolUse --success --summarize"
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "bunx claude-flow@alpha hooks session-end --export-metrics true"
        }]
      }
    ]
  }
}
```

---

## 📈 Success Metrics

### Phase 2 Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Validation Accuracy | > 95% | Correct approve/rollback decisions |
| Rollback Latency | < 30s | Time from detection to execution |
| False Positive Rate | < 5% | Unnecessary rollbacks |
| KPI Improvement | > 5% | Average UL throughput gain |

### Overall Platform Targets

| Metric | Target | Current |
|--------|--------|---------|
| Automation Rate | > 80% | TBD |
| MTTR (Mean Time to Repair) | < 15 min | TBD |
| Optimization Coverage | > 90% cells | TBD |
| Agent Reliability | > 99.9% | TBD |

---

## 🔗 Related Documents

- [Integration Plan](./integration-plans/ruvnet-graph-ran-integration.md)
- [CLAUDE.md](../CLAUDE.md)
- [Type Definitions](../src/types/index.ts)
- [Swarm Config](../config/swarm-config.json)

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2024-12-06 | 2.0 | Phase 1 complete, added 4-ROP validation plan |
| 2024-12-06 | 1.5 | Added disler patterns, Bun/TypeScript ports |
| 2024-12-06 | 1.0 | Initial ruvnet graph integration |
