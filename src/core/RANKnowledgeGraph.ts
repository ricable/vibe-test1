/**
 * RAN Knowledge Graph
 *
 * Integrates ruvnet graph-data-structure for cell interference modeling,
 * optimization sequencing, and causal root cause analysis.
 *
 * @see https://github.com/datavis-tech/graph-data-structure
 */

import {
  Graph,
  topologicalSort,
  shortestPath,
  serializeGraph,
  deserializeGraph,
} from 'graph-data-structure';

import type {
  CellGlobalIdentity,
  RANGraphNode,
  RANGraphEdge,
  RANHyperedge,
  CellKPIs,
  CausalEdge,
  ProblemCategory,
} from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface InterferenceEdge {
  source: string;
  target: string;
  interferenceLevel: number;  // 0-1 normalized
  frequencyBand: string;
  distance: number;           // meters
}

export interface OptimizationPath {
  nodes: string[];
  totalWeight: number;
}

export interface ClusterAnalysis {
  clusterId: string;
  members: string[];
  dominantInterferor: string;
  totalInterference: number;
}

// ============================================================================
// RAN KNOWLEDGE GRAPH CLASS
// ============================================================================

export class RANKnowledgeGraph {
  private graph: ReturnType<typeof Graph>;
  private nodeMetadata: Map<string, RANGraphNode>;
  private edgeMetadata: Map<string, RANGraphEdge>;
  private hyperedges: Map<string, RANHyperedge>;
  private lastUpdated: Date;

  constructor() {
    this.graph = new Graph();
    this.nodeMetadata = new Map();
    this.edgeMetadata = new Map();
    this.hyperedges = new Map();
    this.lastUpdated = new Date();
  }

  // --------------------------------------------------------------------------
  // CELL (NODE) OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Generate consistent node ID from CGI
   */
  private getCellId(cgi: CellGlobalIdentity): string {
    return `${cgi.mcc}-${cgi.mnc}-${cgi.gnbId}-${cgi.cellId}`;
  }

  /**
   * Add a cell to the graph
   */
  addCell(cgi: CellGlobalIdentity, metadata: Partial<RANGraphNode>): void {
    const nodeId = this.getCellId(cgi);
    this.graph.addNode(nodeId);

    const fullMetadata: RANGraphNode = {
      id: nodeId,
      cgi,
      staticFeatures: metadata.staticFeatures || {
        azimuth: 0,
        tilt: 0,
        height: 30,
        beamwidth: 65,
        frequency: 3500,
        bandwidth: 100,
        technology: 'NR',
        latitude: 0,
        longitude: 0,
      },
      dynamicFeatures: metadata.dynamicFeatures || {
        txPower: 43,
        load: 0,
        rtwp: -100,
        activeUsers: 0,
        throughput: 0,
      },
      embedding: metadata.embedding,
    };

    this.nodeMetadata.set(nodeId, fullMetadata);
    this.lastUpdated = new Date();
  }

  /**
   * Remove a cell from the graph
   */
  removeCell(cgi: CellGlobalIdentity): void {
    const nodeId = this.getCellId(cgi);
    this.graph.removeNode(nodeId);
    this.nodeMetadata.delete(nodeId);

    // Remove associated edges
    for (const [key, edge] of this.edgeMetadata) {
      if (edge.sourceId === nodeId || edge.targetId === nodeId) {
        this.edgeMetadata.delete(key);
      }
    }

    this.lastUpdated = new Date();
  }

  /**
   * Update cell dynamic features from KPIs
   */
  updateCellFromKPIs(kpis: CellKPIs): void {
    const nodeId = this.getCellId(kpis.cgi);
    const metadata = this.nodeMetadata.get(nodeId);

    if (metadata) {
      metadata.dynamicFeatures = {
        txPower: metadata.dynamicFeatures.txPower,
        load: kpis.prbUtilizationDl,
        rtwp: kpis.rtwp,
        activeUsers: kpis.activeUsers,
        throughput: kpis.dlThroughput + kpis.ulThroughput,
      };
      this.lastUpdated = new Date();
    }
  }

  /**
   * Get cell metadata
   */
  getCell(cgi: CellGlobalIdentity): RANGraphNode | undefined {
    return this.nodeMetadata.get(this.getCellId(cgi));
  }

  /**
   * Get all cell IDs
   */
  getAllCellIds(): string[] {
    return Array.from(this.nodeMetadata.keys());
  }

  // --------------------------------------------------------------------------
  // INTERFERENCE EDGE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Add interference relationship between cells
   */
  addInterference(
    source: CellGlobalIdentity,
    target: CellGlobalIdentity,
    interferenceLevel: number,
    metadata?: Partial<RANGraphEdge['features']>
  ): void {
    const sourceId = this.getCellId(source);
    const targetId = this.getCellId(target);

    // Ensure nodes exist
    if (!this.nodeMetadata.has(sourceId)) {
      this.addCell(source, {});
    }
    if (!this.nodeMetadata.has(targetId)) {
      this.addCell(target, {});
    }

    // Add weighted edge (higher interference = higher weight for Dijkstra)
    this.graph.addEdge(sourceId, targetId, interferenceLevel);

    const edgeKey = `${sourceId}|${targetId}`;
    const edgeData: RANGraphEdge = {
      sourceId,
      targetId,
      edgeType: 'interference',
      weight: interferenceLevel,
      features: {
        interferenceLevel,
        distance: metadata?.distance,
        rsrp: metadata?.rsrp,
        hoVolume: metadata?.hoVolume,
      },
    };

    this.edgeMetadata.set(edgeKey, edgeData);
    this.lastUpdated = new Date();
  }

  /**
   * Add mobility (handover) relationship
   */
  addMobilityRelation(
    source: CellGlobalIdentity,
    target: CellGlobalIdentity,
    handoverVolume: number
  ): void {
    const sourceId = this.getCellId(source);
    const targetId = this.getCellId(target);

    // Use inverse of handover volume as weight (more handovers = closer relationship)
    const weight = 1 / Math.max(handoverVolume, 1);
    this.graph.addEdge(sourceId, targetId, weight);

    const edgeKey = `${sourceId}|${targetId}|mobility`;
    const edgeData: RANGraphEdge = {
      sourceId,
      targetId,
      edgeType: 'mobility',
      weight,
      features: {
        hoVolume: handoverVolume,
      },
    };

    this.edgeMetadata.set(edgeKey, edgeData);
    this.lastUpdated = new Date();
  }

  /**
   * Get edge metadata
   */
  getEdge(sourceId: string, targetId: string): RANGraphEdge | undefined {
    return this.edgeMetadata.get(`${sourceId}|${targetId}`);
  }

  /**
   * Check if edge exists
   */
  hasEdge(source: CellGlobalIdentity, target: CellGlobalIdentity): boolean {
    const sourceId = this.getCellId(source);
    const targetId = this.getCellId(target);
    return this.graph.hasEdge(sourceId, targetId);
  }

  // --------------------------------------------------------------------------
  // GRAPH ALGORITHMS
  // --------------------------------------------------------------------------

  /**
   * Get topological optimization order
   *
   * Returns cells in order such that cells with most dependents are optimized first.
   * This ensures coordinated power control optimization.
   */
  getOptimizationOrder(): string[] {
    try {
      return topologicalSort(this.graph);
    } catch (error) {
      // Cycle detected - return by degree centrality instead
      return this.getByDegreeCentrality();
    }
  }

  /**
   * Get cells ordered by degree centrality (fallback for cyclic graphs)
   */
  private getByDegreeCentrality(): string[] {
    const degrees: Map<string, number> = new Map();

    for (const nodeId of this.getAllCellIds()) {
      const neighbors = this.graph.adjacent(nodeId);
      degrees.set(nodeId, neighbors ? neighbors.size : 0);
    }

    return Array.from(degrees.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([nodeId]) => nodeId);
  }

  /**
   * Find shortest interference path between cells
   *
   * Useful for root cause propagation analysis.
   */
  getInterferencePath(
    source: CellGlobalIdentity,
    target: CellGlobalIdentity
  ): OptimizationPath | null {
    const sourceId = this.getCellId(source);
    const targetId = this.getCellId(target);

    try {
      const result = shortestPath(this.graph, sourceId, targetId);
      return {
        nodes: result.nodes,
        totalWeight: result.weight,
      };
    } catch {
      return null; // No path exists
    }
  }

  /**
   * Get immediate neighbors of a cell
   */
  getNeighbors(cgi: CellGlobalIdentity): string[] {
    const nodeId = this.getCellId(cgi);
    const neighbors = this.graph.adjacent(nodeId);
    return neighbors ? Array.from(neighbors) : [];
  }

  /**
   * Get k-hop neighborhood (for GNN message passing)
   */
  getKHopNeighborhood(cgi: CellGlobalIdentity, k: number): Set<string> {
    const nodeId = this.getCellId(cgi);
    const visited = new Set<string>([nodeId]);
    let frontier = new Set<string>([nodeId]);

    for (let hop = 0; hop < k; hop++) {
      const nextFrontier = new Set<string>();
      for (const node of frontier) {
        const neighbors = this.graph.adjacent(node);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              nextFrontier.add(neighbor);
            }
          }
        }
      }
      frontier = nextFrontier;
    }

    visited.delete(nodeId); // Exclude the source node
    return visited;
  }

  // --------------------------------------------------------------------------
  // HYPEREDGE OPERATIONS (INTERFERENCE CLUSTERS)
  // --------------------------------------------------------------------------

  /**
   * Add an interference cluster hyperedge
   */
  addInterferenceCluster(
    clusterId: string,
    memberCgis: CellGlobalIdentity[],
    dominantInterferor: CellGlobalIdentity
  ): void {
    const nodeIds = memberCgis.map(cgi => this.getCellId(cgi));
    const dominantId = this.getCellId(dominantInterferor);

    // Calculate total interference
    let totalInterference = 0;
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const edge = this.edgeMetadata.get(`${nodeIds[i]}|${nodeIds[j]}`);
        if (edge) {
          totalInterference += edge.weight;
        }
      }
    }

    const hyperedge: RANHyperedge = {
      id: clusterId,
      nodeIds,
      clusterType: 'interference',
      weight: totalInterference,
      features: {
        totalInterference,
        dominantInterferor: dominantId,
      },
    };

    this.hyperedges.set(clusterId, hyperedge);
    this.lastUpdated = new Date();
  }

  /**
   * Get all interference clusters
   */
  getInterferenceClusters(): ClusterAnalysis[] {
    return Array.from(this.hyperedges.values())
      .filter(h => h.clusterType === 'interference')
      .map(h => ({
        clusterId: h.id,
        members: h.nodeIds,
        dominantInterferor: h.features.dominantInterferor || '',
        totalInterference: h.weight,
      }));
  }

  // --------------------------------------------------------------------------
  // CAUSAL GRAPH OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Build causal graph for root cause analysis
   */
  buildCausalGraph(problems: Array<{ category: ProblemCategory; affectedCells: string[] }>): CausalEdge[] {
    const causalEdges: CausalEdge[] = [];
    const pairCounts = new Map<string, { count: number; total: number }>();

    // Count co-occurrences
    for (const problem of problems) {
      for (let i = 0; i < problem.affectedCells.length; i++) {
        for (let j = i + 1; j < problem.affectedCells.length; j++) {
          const pair = [problem.affectedCells[i], problem.affectedCells[j]].sort().join('|');
          const existing = pairCounts.get(pair) || { count: 0, total: 0 };
          existing.count++;
          existing.total = problems.length;
          pairCounts.set(pair, existing);
        }
      }
    }

    // Convert to causal edges
    for (const [pair, counts] of pairCounts) {
      const [cause, effect] = pair.split('|');
      const probability = counts.count / counts.total;

      if (probability > 0.5) { // Only include strong causal links
        causalEdges.push({
          cause,
          effect,
          probability,
          confidence: Math.min(counts.count / 10, 1), // Confidence scales with sample count
          observationCount: counts.count,
        });
      }
    }

    return causalEdges;
  }

  // --------------------------------------------------------------------------
  // SERIALIZATION
  // --------------------------------------------------------------------------

  /**
   * Serialize graph for persistence
   */
  serialize(): string {
    return JSON.stringify({
      graph: serializeGraph(this.graph),
      nodeMetadata: Object.fromEntries(this.nodeMetadata),
      edgeMetadata: Object.fromEntries(this.edgeMetadata),
      hyperedges: Object.fromEntries(this.hyperedges),
      lastUpdated: this.lastUpdated.toISOString(),
    });
  }

  /**
   * Deserialize graph from storage
   */
  static deserialize(data: string): RANKnowledgeGraph {
    const parsed = JSON.parse(data);
    const instance = new RANKnowledgeGraph();

    instance.graph = deserializeGraph(parsed.graph);
    instance.nodeMetadata = new Map(Object.entries(parsed.nodeMetadata));
    instance.edgeMetadata = new Map(Object.entries(parsed.edgeMetadata));
    instance.hyperedges = new Map(Object.entries(parsed.hyperedges));
    instance.lastUpdated = new Date(parsed.lastUpdated);

    return instance;
  }

  // --------------------------------------------------------------------------
  // CONVERSION FOR GNN/ML
  // --------------------------------------------------------------------------

  /**
   * Convert to PyTorch Geometric compatible format
   *
   * Returns format suitable for torch_geometric.data.Data:
   * - x: Node features [num_nodes, num_features]
   * - edge_index: COO format [2, num_edges]
   * - edge_attr: Edge features [num_edges, num_edge_features]
   */
  toTorchGeometricFormat(): {
    x: number[][];
    edge_index: [number[], number[]];
    edge_attr: number[][];
    node_ids: string[];
  } {
    const nodeIds = this.getAllCellIds();
    const nodeIdToIdx = new Map(nodeIds.map((id, idx) => [id, idx]));

    // Node features
    const x = nodeIds.map(id => {
      const meta = this.nodeMetadata.get(id)!;
      return [
        meta.staticFeatures.azimuth / 360,
        meta.staticFeatures.tilt / 15,
        meta.staticFeatures.height / 100,
        meta.staticFeatures.frequency / 6000,
        meta.dynamicFeatures.txPower / 50,
        meta.dynamicFeatures.load / 100,
        meta.dynamicFeatures.activeUsers / 1000,
        meta.dynamicFeatures.throughput / 1000,
      ];
    });

    // Edge index and attributes
    const sourceNodes: number[] = [];
    const targetNodes: number[] = [];
    const edgeAttr: number[][] = [];

    for (const [, edge] of this.edgeMetadata) {
      const srcIdx = nodeIdToIdx.get(edge.sourceId);
      const tgtIdx = nodeIdToIdx.get(edge.targetId);

      if (srcIdx !== undefined && tgtIdx !== undefined) {
        sourceNodes.push(srcIdx);
        targetNodes.push(tgtIdx);
        edgeAttr.push([
          edge.weight,
          edge.features.interferenceLevel || 0,
          (edge.features.distance || 0) / 10000,
          (edge.features.hoVolume || 0) / 1000,
        ]);
      }
    }

    return {
      x,
      edge_index: [sourceNodes, targetNodes],
      edge_attr: edgeAttr,
      node_ids: nodeIds,
    };
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    numNodes: number;
    numEdges: number;
    numHyperedges: number;
    avgDegree: number;
    lastUpdated: Date;
  } {
    const numNodes = this.nodeMetadata.size;
    const numEdges = this.edgeMetadata.size;

    let totalDegree = 0;
    for (const nodeId of this.getAllCellIds()) {
      const neighbors = this.graph.adjacent(nodeId);
      totalDegree += neighbors ? neighbors.size : 0;
    }

    return {
      numNodes,
      numEdges,
      numHyperedges: this.hyperedges.size,
      avgDegree: numNodes > 0 ? totalDegree / numNodes : 0,
      lastUpdated: this.lastUpdated,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create RANKnowledgeGraph from raw edge list
 */
export function createFromEdgeList(
  edges: Array<{
    source: CellGlobalIdentity;
    target: CellGlobalIdentity;
    weight: number;
  }>
): RANKnowledgeGraph {
  const graph = new RANKnowledgeGraph();

  for (const edge of edges) {
    graph.addInterference(edge.source, edge.target, edge.weight);
  }

  return graph;
}

/**
 * Create RANKnowledgeGraph from neighbor relations (CM dump)
 */
export function createFromNeighborRelations(
  relations: Array<{
    servingCell: CellGlobalIdentity;
    neighborCell: CellGlobalIdentity;
    noRemove: boolean;
    noHandover: boolean;
  }>
): RANKnowledgeGraph {
  const graph = new RANKnowledgeGraph();

  for (const rel of relations) {
    // Weight based on relationship type
    const weight = rel.noRemove ? 0.9 : (rel.noHandover ? 0.3 : 0.5);
    graph.addInterference(rel.servingCell, rel.neighborCell, weight);
  }

  return graph;
}

export default RANKnowledgeGraph;
