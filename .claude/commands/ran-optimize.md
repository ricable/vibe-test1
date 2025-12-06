# RAN Closed-Loop Optimization Command

## Command: `/project:ran-optimize`

Orchestrates autonomous RAN parameter optimization using the NanoAgent swarm.

## Usage

```
/project:ran-optimize <cluster_id> <optimization_mode> [--dry-run]
```

### Parameters

- `cluster_id`: Cell cluster identifier (e.g., "cluster_001")
- `optimization_mode`: One of `power`, `mobility`, `capacity`, `full`
- `--dry-run`: Simulate without executing changes

## Execution Flow

### Phase 1: Context Retrieval

```bash
# Retrieve cluster state from memory
npx claude-flow@alpha memory retrieve --key "ran/clusters/$CLUSTER_ID/state"
npx claude-flow@alpha memory retrieve --key "ran/clusters/$CLUSTER_ID/kpis"
npx claude-flow@alpha memory retrieve --key "ran/interference/graph"
```

**Expected Context**:
- Current cell parameters (P0, Alpha, Tilt)
- Recent KPI history (15-min granularity, last 4 samples)
- Interference graph for the cluster

### Phase 2: Agent Deployment

Deploy NanoAgents in parallel with unique optimization focus:

```
Task("ran-kpi-analyzer", `
  ## TASK: Analyze KPI trends for cluster $CLUSTER_ID
  ## CONTEXT: Agent #1/4 | Next: Optimizer, Validator, Executor

  ## MEMORY RETRIEVAL
  npx claude-flow memory retrieve --key "ran/clusters/$CLUSTER_ID/kpis"

  ## ANALYSIS
  1. Identify anomalies using Z-score threshold > 2.5
  2. Calculate KPI correlations
  3. Detect performance degradation patterns

  ## MEMORY STORAGE
  Store: "ran/optimization/$CLUSTER_ID/analysis" - anomaly_list, correlation_matrix, trends

  ## OUTPUT
  Return: { anomalies: [], trends: [], recommendations: [] }
`)

Task("ran-graph-optimizer", `
  ## TASK: Calculate optimal parameter adjustments using GNN
  ## CONTEXT: Agent #2/4 | Previous: Analyzer | Next: Validator, Executor

  ## MEMORY RETRIEVAL
  npx claude-flow memory retrieve --key "ran/optimization/$CLUSTER_ID/analysis"
  npx claude-flow memory retrieve --key "ran/interference/graph"

  ## GRAPH OPERATIONS
  1. Build interference graph from neighbor relations
  2. Calculate topological optimization order
  3. Run GNN inference for parameter prediction
  4. Generate coordinated parameter changes

  ## CONSTRAINTS
  - P0: [-126, -60] dBm
  - Alpha: [0.4, 1.0]
  - Max change per iteration: P0 ±2dB, Alpha ±0.1

  ## MEMORY STORAGE
  Store: "ran/optimization/$CLUSTER_ID/proposed_actions" - action_list with confidence scores

  ## OUTPUT
  Return: { actions: [], optimization_order: [], expected_improvement: number }
`)

Task("ran-safety-validator", `
  ## TASK: Validate proposed actions against safety guardrails
  ## CONTEXT: Agent #3/4 | Previous: Optimizer | Next: Executor

  ## MEMORY RETRIEVAL
  npx claude-flow memory retrieve --key "ran/optimization/$CLUSTER_ID/proposed_actions"

  ## VALIDATION RULES
  1. All parameters within allowed ranges
  2. No conflicting actions on same cell
  3. Neighbor coordination verified
  4. No known problem patterns triggered

  ## TRUTH PROTOCOL
  - ONLY approve actions with clear justification
  - REJECT if insufficient data for decision
  - NEVER simulate validation without actual checks

  ## MEMORY STORAGE
  Store: "ran/optimization/$CLUSTER_ID/validated_actions" - approved_list, rejected_list, reasons

  ## OUTPUT
  Return: { approved: [], rejected: [], warnings: [] }
`)

Task("ran-action-executor", `
  ## TASK: Execute validated optimization actions
  ## CONTEXT: Agent #4/4 (FINAL) | Previous: Validator

  ## MEMORY RETRIEVAL
  npx claude-flow memory retrieve --key "ran/optimization/$CLUSTER_ID/validated_actions"

  ## PRE-EXECUTION
  1. Verify dry-run flag: $DRY_RUN
  2. Log pre-execution state
  3. Enable rollback capability

  ## EXECUTION (if not dry-run)
  For each approved action:
    1. Apply parameter change via OSS API
    2. Wait for configuration sync (30s)
    3. Log action execution

  ## POST-EXECUTION
  1. Collect immediate KPI feedback (15-min ROP)
  2. Compare with expected improvement
  3. Store execution record

  ## MEMORY STORAGE
  Store: "ran/optimization/$CLUSTER_ID/execution_log" - executed_actions, results

  ## OUTPUT
  Return: { executed: number, skipped: number, results: [] }
`)
```

### Phase 3: Observability

All actions are tracked via hooks:

```bash
# Pre-tool validation
python .claude/hooks/ran_observability.py --event-type PreToolUse --tool-name "ran-optimize" --summarize

# Post-execution logging
python .claude/hooks/ran_observability.py --event-type RANOptimization --payload '{"cluster": "$CLUSTER_ID", "mode": "$MODE"}' --summarize
```

## XP Rewards (Gamification)

| Achievement | XP | Trigger |
|-------------|-----|---------|
| KPI Improvement | +100 | UL throughput +5% |
| Safety Compliance | +50 | All guardrails passed |
| Cluster Coordination | +75 | All cells optimized together |
| Zero Rollback | +150 | No action reversions |
| Oracle Insight | +200 | Novel optimization pattern discovered |

## Example

```bash
# Optimize power control for cluster 001
/project:ran-optimize cluster_001 power

# Full optimization with dry-run
/project:ran-optimize cluster_002 full --dry-run
```

## Related Commands

- `/project:ran-status <cluster_id>` - Check cluster KPI status
- `/project:ran-rollback <execution_id>` - Rollback previous optimization
- `/project:ran-graph <cluster_id>` - Visualize interference graph
