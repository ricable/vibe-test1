# RAN Infinite Optimization Loop

## Command: `/project:ran-infinite`

Based on disler/infinite-agentic-loop pattern. Continuously optimizes RAN parameters
in waves until context limits or stopping criteria are reached.

## Usage

```
/project:ran-infinite <cluster_spec_file> <output_dir> <count>
```

### Parameters

- `cluster_spec_file`: Path to cluster specification (e.g., `specs/cluster_urban_001.json`)
- `output_dir`: Directory for optimization logs
- `count`: Number of iterations or `infinite`

### Count Modes

| Mode | Count | Behavior |
|------|-------|----------|
| Single | `1` | One optimization cycle |
| Batch | `5` | 5 parallel NanoAgents |
| Large | `20` | Coordinated waves of 5 agents |
| Infinite | `infinite` | Continuous until stopped |

## Two-Prompt System Architecture

### Primary Prompt (Orchestrator)

The `/project:ran-infinite` command orchestrates the overall loop:

```
1. Parse cluster specification from $CLUSTER_SPEC_FILE
2. Examine existing optimization history in $OUTPUT_DIR
3. Determine current iteration number
4. Deploy NanoAgent wave with unique optimization vectors
5. Collect results and validate improvements
6. If count == infinite AND improvement > threshold:
     Continue to next wave
   Else:
     Terminate loop
```

### Sub-Agent Prompts (NanoAgents)

Each wave deploys specialized agents with creative directions:

```
Task("ran-nano-agent-$N", `
  ## IDENTITY
  You are NanoAgent #$N in wave #$WAVE of the infinite RAN optimization loop.

  ## CREATIVE DIRECTION
  Explore optimization vector: $OPTIMIZATION_VECTOR
  (e.g., "aggressive power reduction", "conservative alpha tuning", "hybrid mobility")

  ## CONSTRAINTS
  - P0: [-126, -60] dBm (HARD LIMIT)
  - Alpha: [0.4, 1.0] (HARD LIMIT)
  - Max ΔP0 per iteration: ±2 dB
  - Max Δα per iteration: ±0.1

  ## TASK
  1. Retrieve cluster state
  2. Apply creative optimization vector
  3. Validate against guardrails
  4. Store proposed actions

  ## UNIQUENESS
  Your optimization MUST differ from previous iterations:
  ${PREVIOUS_OPTIMIZATIONS}

  ## OUTPUT
  Return optimized parameters with confidence score and expected improvement.
`)
```

## Stopping Criteria

The infinite loop terminates when:

1. **Context Limit**: Token budget exhausted
2. **Convergence**: Improvement < 0.1% for 3 consecutive waves
3. **Saturation**: All cells at optimal parameters
4. **Error Rate**: > 20% actions blocked by guardrails
5. **Manual Stop**: User interruption

## Example Cluster Specification

```json
{
  "cluster_id": "urban_dense_001",
  "cells": [
    {"cgi": "310-260-12345-1", "technology": "NR", "frequency": 3500},
    {"cgi": "310-260-12345-2", "technology": "NR", "frequency": 3500},
    {"cgi": "310-260-12345-3", "technology": "NR", "frequency": 3500}
  ],
  "optimization_targets": {
    "ul_throughput": {"target": 50, "weight": 0.4},
    "rach_success": {"target": 99, "weight": 0.3},
    "interference": {"target": -110, "weight": 0.3}
  },
  "creative_vectors": [
    "aggressive_power",
    "conservative_power",
    "balanced_alpha",
    "edge_focused",
    "capacity_maximizing"
  ]
}
```

## Observability Integration

Each wave emits events to the observability server:

```python
# Wave start
send_event("ran-infinite", "SessionStart", {"wave": wave_num, "agents": agent_count})

# Per-agent optimization
send_event("ran-infinite", "RANOptimization", {"agent": agent_id, "vector": optimization_vector})

# Wave completion
send_event("ran-infinite", "Stop", {"wave": wave_num, "improvement": delta_kpi})
```

## Memory Coordination

```bash
# Store wave state
npx claude-flow memory store \
  --namespace "ran/infinite/$CLUSTER_ID" \
  --key "wave_$WAVE_NUM" \
  --value '{"agents": [...], "results": [...], "next_vectors": [...]}'

# Retrieve for next wave
npx claude-flow memory retrieve --key "ran/infinite/$CLUSTER_ID/wave_$PREV"
```

## Example Execution

```bash
# Single optimization
/project:ran-infinite specs/cluster_urban_001.json output/urban_001 1

# 5 parallel agents
/project:ran-infinite specs/cluster_urban_001.json output/urban_001 5

# Infinite loop until convergence
/project:ran-infinite specs/cluster_urban_001.json output/urban_001 infinite
```
