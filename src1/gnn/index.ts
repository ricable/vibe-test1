/**
 * GNN Module - FPPC Optimizer Architecture
 *
 * Unified exports for the Graph Neural Network module.
 * Primary API: FPPCOptimizer (Fractional Path-loss Power Control Optimizer)
 *
 * The FPPCOptimizer combines:
 * - GNN-based SINR prediction (accuracy)
 * - TypedArray batch processing (speed)
 * - O(1) neighbor lookup with pre-computed adjacency
 */

// ============================================================================
// FPPC OPTIMIZER (Primary API - Recommended)
// ============================================================================

export {
  // Main Unified Optimizer
  FPPCOptimizer,

  // GNN Layer
  FPPCGNNLayer,

  // Data Structures
  BatchCellData as FPPCBatchCellData,
  NeighborIndex as FPPCNeighborIndex,
  DifferentiableParameterSearch as FPPCParameterSearch,

  // Physics Constants
  FPPC_PHYSICS,

  // Configuration
  DEFAULT_FPPC_CONFIG,

  // Types
  type FPPCConfig,
  type FPPCOptimizationResult,
  type OptimizeOptions,
} from './fppc-optimizer.js';

// ============================================================================
// CORE GNN (RuVector Implementation)
// ============================================================================

export {
  // Main GNN Classes
  SelfLearningUplinkGNN,
  RuVectorGNNLayer,
  EricssonUplinkOptimizer,

  // Learning Components
  ExperienceReplayBuffer,
  DifferentiableParameterSearch,
  InterferenceAwareCandidateGenerator,

  // RuVector Functions
  runRuVectorGNNLayer,
  compressEmbeddings,
  differentiableSearch,

  // Types
  type RuVectorLayerConfig,
  type LearningMetrics,
  type SelfLearningState,
  type CompressionLevel,
  type CompressedTensor,
  type ExperienceSample,
} from './self-learning-uplink-gnn.js';

// ============================================================================
// GRAPH BUILDING & UTILITIES
// ============================================================================

export {
  // Graph Construction
  SurrogateGraphBuilder,
  IssueCellDetector,
  SurrogateVisualizer,

  // Optimizer (uses SelfLearningUplinkGNN internally)
  SurrogateOptimizer,

  // Configuration
  DEFAULT_SURROGATE_CONFIG,

  // Types
  type SurrogateGraph,
  type SurrogateModelConfig,
  type PowerControlParams,
  type CellStatus,
  type CellOptimizationResult,
  type NetworkOptimizationResult,
  type TrainingSample,
} from './network-surrogate-model.js';

// ============================================================================
// UTILITY CLASSES
// ============================================================================

export {
  // Path Loss Analysis
  PathLossAnalyzer,

  // Validation
  PowerControlValidator,

  // SINR Analysis
  SINRNeighborAnalyzer,

  // Types
  type PathLossDistribution,
} from './gnn-utils.js';

// ============================================================================
// CLUSTER OPTIMIZATION
// ============================================================================

export {
  NetworkClusterOptimizer,
  ClusterIdentifier,
  ClusterOptimizer,
} from './cluster-optimizer.js';

// ============================================================================
// GNN PARALLEL OPTIMIZER (New - Uses actual GNN predictions)
// ============================================================================

/**
 * GNN-Based Parallel Optimizer with:
 * - Multi-head attention message passing (not linear approximation)
 * - Interference-aware candidate generation (bi-directional P0 exploration)
 * - Cell profiling for smart optimization direction
 *
 * Run with: npx tsx src/gnn/run-gnn-analysis.ts
 */
export {
  // Main GNN optimizer
  GNNParallelOptimizer,

  // Candidate generator (key for bi-directional P0 exploration)
  InterferenceAwareCandidateGenerator,

  // Configuration
  DEFAULT_GNN_OPTIMIZER_CONFIG,
  DEFAULT_GNN_OPTIMIZATION_CONFIG,

  // Types
  type GNNOptimizerConfig,
  type GNNOptimizationConfig,
  type GNNOptimizationResult,
  type CellProfile,
} from './gnn-parallel-optimizer.js';

// ============================================================================
// PARALLEL OPTIMIZATION (Deprecated - Use GNNParallelOptimizer or FPPCOptimizer)
// ============================================================================

/**
 * @deprecated Use GNNParallelOptimizer for actual GNN predictions,
 * or FPPCOptimizer for the unified API.
 * ParallelNetworkOptimizer uses linear approximation (biased toward P0 increases).
 */
export {
  // Main parallel optimizer
  ParallelNetworkOptimizer,

  // Data structures
  BatchCellData,
  NeighborIndex,
  WorkerPool,

  // Parallel generators
  generateCellsParallel,
  generateNeighborsParallel,

  // Batch optimization function
  optimizeCellBatch,

  // Configuration
  DEFAULT_PARALLEL_CONFIG,

  // Types
  type ParallelConfig,
  type ParallelOptimizationResult,
} from './parallel-optimizer.js';

// ============================================================================
// RUVECTOR UPLINK OPTIMIZER (Deprecated - Use FPPCOptimizer instead)
// ============================================================================

/**
 * @deprecated Use FPPCOptimizer from './fppc-optimizer.js' instead.
 * RuVectorUplinkOptimizer is kept for backward compatibility.
 */
export {
  RuVectorUplinkOptimizer,
  RuVectorGNNLayer as RuVectorGNNLayerLegacy,
  RuVectorParameterSearch,
  runRuVectorCommand,
} from './ruvector-uplink-optimizer.js';
