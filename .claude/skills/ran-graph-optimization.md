---
name: ran-graph-optimization
description: "Graph-based RAN cell optimization using GNNs, knowledge graphs, and decision transformer RL. Use for cell interference analysis, power control coordination, closed-loop automation, and causal root cause analysis."
---

# RAN Graph Optimization Skill

## Overview

Optimizes Ericsson RAN parameters using graph neural networks, knowledge graph reasoning, and reinforcement learning. Integrates with:

- **graph-data-structure**: Topological sort, shortest path for cell dependencies
- **AgentDB**: ReasoningBank for trajectory storage and pattern learning
- **Ruvector**: GNN operations and spatial-temporal analysis
- **ruv-FANN**: Neural network training at edge

## When to Use This Skill

Invoke this skill when:

- **Cell Interference Analysis**: Mapping inter-cell interference relationships
- **Power Control Coordination**: Optimizing P0/Alpha across clusters
- **Handover Optimization**: Tuning mobility parameters based on handover patterns
- **Root Cause Analysis**: Tracing fault propagation through causal graphs
- **Closed-Loop Automation**: Autonomous parameter optimization with guardrails

## Core Capabilities

### 1. Build Cell Interference Graph

```typescript
import { RANKnowledgeGraph, createFromNeighborRelations } from '@/core/RANKnowledgeGraph';

// From neighbor relations (CM dump)
const graph = createFromNeighborRelations(neighborRelations);

// Or build incrementally
const graph = new RANKnowledgeGraph();
graph.addCell(cgi, { staticFeatures, dynamicFeatures });
graph.addInterference(sourceCgi, targetCgi, interferenceLevel);
```

### 2. Calculate Optimization Order

Topological sort ensures cells with most dependents are optimized first:

```typescript
const optimizationOrder = graph.getOptimizationOrder();
// Returns: ['cell_003', 'cell_001', 'cell_002'] (dominant first)

// For cyclic graphs, falls back to degree centrality
```

### 3. Find Interference Paths

Dijkstra's algorithm for root cause propagation:

```typescript
const path = graph.getInterferencePath(sourceCgi, targetCgi);
// Returns: { nodes: ['cell_001', 'cell_002', 'cell_003'], totalWeight: 1.45 }
```

### 4. K-Hop Neighborhood (GNN Message Passing)

```typescript
const neighbors = graph.getKHopNeighborhood(cgi, k=2);
// Returns Set of cells within 2 hops
```

### 5. Convert to PyTorch Geometric Format

```typescript
const pygData = graph.toTorchGeometricFormat();
// Returns: { x, edge_index, edge_attr, node_ids }
```

## Integration with Decision Transformer

```typescript
// src/ran/cm/UplinkOptimizer.ts
import { RANKnowledgeGraph } from '@/core/RANKnowledgeGraph';

class UplinkOptimizer {
  private graph: RANKnowledgeGraph;

  async optimize(cluster: CellGlobalIdentity[]): Promise<Action[]> {
    // 1. Get optimization order from graph
    const order = this.graph.getOptimizationOrder();

    // 2. For each cell in order, run Decision Transformer
    const actions: Action[] = [];
    for (const cellId of order) {
      const state = this.buildStateVector(cellId);
      const graphEmbedding = await this.getGNNEmbedding(cellId);
      const action = await this.decisionTransformer.predict(state, graphEmbedding);
      actions.push(action);
    }

    return actions;
  }
}
```

## Integration with AgentDB ReasoningBank

```typescript
import { AgentDB } from 'agentdb';

// Store optimization trajectory
await agentdb.reasoningBank.storeTrajectory({
  symptom: 'High UL interference in cluster_001',
  context: graph.serialize(),
  actionSequence: actions,
  outcome: { success: true, deltaKPIs: { ulThroughput: +5.2 } },
});

// Query similar past experiences
const similar = await agentdb.reasoningBank.query({
  symptom: 'High UL interference',
  maxResults: 5,
  minSimilarity: 0.7,
});
```

## Integration with Ruvector GNN

```python
# Python GNN inference via Ruvector
from ruvector import STGNN

# Load graph data
pygData = graph.toTorchGeometricFormat()

# Initialize ST-GNN (Spatial-Temporal)
model = STGNN(
    in_channels=8,      # Node features
    hidden_channels=64,
    out_channels=32,    # Embedding dimension
    num_layers=4,
    heads=8,
)

# Get embeddings for optimization
embeddings = model(pygData.x, pygData.edge_index)
```

## Integration with ruv-FANN

```rust
// Edge deployment with ruv-FANN
use ruv_fann::{Network, Topology};

let network = Network::new(Topology::MLP {
    inputs: 8,      // Cell features
    hidden: [64, 32],
    outputs: 2,     // P0, Alpha predictions
});

// Train on local data (federated learning ready)
network.train(local_samples, TrainingConfig::default());
```

## Guardrails & Safety

```typescript
// Safety limits from config/swarm-config.json
const GUARDRAILS = {
  p0: { min: -126, max: -60 },      // dBm
  alpha: { min: 0.4, max: 1.0 },
  maxPower: { max: 46 },            // dBm
  maxDeltaPerIteration: {
    p0: 2,                          // dB
    alpha: 0.1,
  },
};

// Validate before execution
function validateAction(action: Action): boolean {
  const p0 = action.parameters.p0NominalPusch;
  return p0 >= GUARDRAILS.p0.min && p0 <= GUARDRAILS.p0.max;
}
```

## Causal Root Cause Analysis

```typescript
// Build causal graph from historical problems
const causalEdges = graph.buildCausalGraph(historicalProblems);

// Find root cause chain
const rootCausePath = graph.getInterferencePath(symptomCell, suspectedRootCause);

// Probability of causal relationship
const causalProbability = causalEdges.find(
  e => e.cause === symptomCell && e.effect === rootCause
)?.probability;
```

## Prompt Template for Agents

```
## IDENTITY
You are a RAN Graph Optimizer NanoAgent operating at the cell edge.

## MISSION
Optimize uplink power control using graph-based reasoning:
1. Build interference graph from neighbor relations
2. Calculate topological optimization order
3. Propose coordinated P0/Alpha adjustments
4. Validate against guardrails

## GRAPH OPERATIONS
- getOptimizationOrder() → Process dominant interferors first
- getInterferencePath(A, B) → Trace interference propagation
- getKHopNeighborhood(cell, k) → Aggregate neighbor context

## CONSTRAINTS
- P0: [-126, -60] dBm
- Alpha: [0.4, 1.0]
- Coordinate with neighbors before applying changes

## SUCCESS CRITERIA
- UL throughput improvement > 5%
- No guardrail violations
- Neighbor coordination confirmed
```

## Memory Namespaces

```bash
ran/graphs/[cluster_id]          # Serialized graph state
ran/optimization/[cluster_id]    # Proposed/validated actions
ran/trajectories/[cell_id]       # ReasoningBank trajectories
ran/patterns/[problem_type]      # Learned optimization patterns
```

## Related Skills

- `torch_geometric` - PyTorch Geometric for GNN training
- `networkx` - Graph analysis and visualization
- `pytorch-lightning` - Distributed GNN training

## Resources

- [graph-data-structure](https://github.com/datavis-tech/graph-data-structure)
- [ruv-FANN](https://github.com/ruvnet/ruv-FANN)
- [Claude Flow](https://github.com/ruvnet/claude-flow)
