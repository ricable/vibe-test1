// Type definitions for Ericsson RAN Autonomous Swarm

export interface OrchestrationConfig {
  engine: string;
  version: string;
  agents: {
    totalCount: number;
    autoScaling: boolean;
  };
  memory: {
    backend: string;
    vectorDb: string;
  };
}

export interface E2BConfig {
  enabled: boolean;
  sandboxCount: number;
  platform: string;
  resources: {
    cpu: number;
    memory: string;
    disk: string;
  };
}

export interface RANConfig {
  enabled: boolean;
  optimizationInterval: number;
  metricsCollectionInterval: number;
  kpiThresholds: {
    throughput: number;
    latency: number;
  };
}

export interface LLMConfig {
  enabled: boolean;
  primaryProvider: string;
  fallbackProvider: string;
  adaptiveRouting: boolean;
}

export interface AgentStatus {
  id: string;
  type: string;
  status: "running" | "idle" | "error" | "stopping";
  cpuUsage: number;
  memoryUsage: number;
  taskCount: number;
  successRate: number;
  lastUpdate: Date;
}

export interface OptimizationResult {
  timestamp: Date;
  cellId: string;
  kpiImprovements: {
    throughput: number;
    latency: number;
    load: number;
    energy: number;
  };
  changesApplied: string[];
  learningScore: number;
}

export interface MemoryEntry {
  id: string;
  type: "episodic" | "semantic" | "procedural" | "skill";
  content: unknown;
  embedding: number[];
  metadata: Record<string, unknown>;
  timestamp: Date;
  ttl?: number;
}

export interface SwarmMetrics {
  totalAgents: number;
  activeAgents: number;
  consensus: number;
  diversity: number;
  throughput: number;
  latency: number;
}

export interface E2BSandboxInstance {
  id: string;
  status: "running" | "pending" | "stopped" | "error";
  agents: AgentStatus[];
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
  };
  createdAt: Date;
  lastHealthCheck: Date;
}
