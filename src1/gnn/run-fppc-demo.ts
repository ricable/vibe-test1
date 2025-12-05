#!/usr/bin/env tsx
/**
 * FPPC Optimizer Demo - Unified demonstration of all execution modes
 *
 * Demonstrates the Fractional Path-loss Power Control Optimizer with:
 * - Small network (12 cells) - Accurate mode with GNN detail
 * - Medium network (500 cells) - Hybrid mode showing auto-selection
 * - Large network (5000 cells) - Fast mode with 10-20x speedup
 *
 * Run: npx tsx src/gnn/run-fppc-demo.ts
 */

import * as os from 'os';
import { FPPCOptimizer, type FPPCOptimizationResult } from './fppc-optimizer.js';
import type {
  CellKPISnapshot,
  NeighborRelation,
} from '../models/ran-kpi.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface ScenarioConfig {
  name: string;
  cells: number;
  mode: 'fast' | 'accurate' | 'hybrid';
  criticalPercent: number;
  issuePercent: number;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    name: 'Small Network (Accurate Mode)',
    cells: 12,
    mode: 'accurate',
    criticalPercent: 15,
    issuePercent: 25,
  },
  {
    name: 'Medium Network (Hybrid Mode)',
    cells: 500,
    mode: 'hybrid',
    criticalPercent: 5,
    issuePercent: 22,
  },
  {
    name: 'Large Network (Fast Mode)',
    cells: 5000,
    mode: 'fast',
    criticalPercent: 5,
    issuePercent: 22,
  },
];

// ============================================================================
// SAMPLE DATA GENERATORS (copied from run-scaled-analysis-parallel.ts)
// ============================================================================

function generateSampleCellSnapshot(
  cellId: string,
  overrides: { sinr: number; iot: number; p0: number; alpha: number }
): CellKPISnapshot {
  const { sinr, iot, p0, alpha } = overrides;

  return {
    timestamp: new Date(),
    cell: {
      cellId,
      enodebId: `eNB_${cellId.split('_')[1] ?? '001'}`,
      sectorId: parseInt(cellId.split('_')[2] ?? '0', 10) % 3,
      frequency: 2600,
      band: 'B7',
      technology: 'LTE',
      pci: Math.floor(Math.random() * 504),
      tac: 12345,
    },
    accessibility: {
      rrcSetupAttempts: 1000 + Math.floor(Math.random() * 5000),
      rrcSetupSuccess: 950 + Math.floor(Math.random() * 50),
      rrcSetupFailure: Math.floor(Math.random() * 50),
      rrcSetupSuccessRate: 95 + Math.random() * 5,
      erabSetupAttempts: 800 + Math.floor(Math.random() * 4000),
      erabSetupSuccess: 780 + Math.floor(Math.random() * 200),
      erabSetupFailure: Math.floor(Math.random() * 20),
      erabSetupSuccessRate: 97 + Math.random() * 3,
      s1SigConnEstabAttempts: 1000,
      s1SigConnEstabSuccess: 990,
      s1SigConnEstabSuccessRate: 99,
      initialContextSetupAttempts: 900,
      initialContextSetupSuccess: 880,
      initialContextSetupSuccessRate: 97.8,
    },
    retainability: {
      erabNormalRelease: 5000,
      erabAbnormalRelease: 50,
      erabDropRate: 1,
      voiceCallAttempts: 1000,
      voiceCallDrops: 10,
      voiceCallDropRate: 1,
      dataSessionAttempts: 8000,
      dataSessionDrops: 80,
      dataSessionRetainability: 99,
    },
    radioQuality: {
      dlAvgCqi: 10 + Math.random() * 4,
      dlRi1Ratio: 40 + Math.random() * 20,
      dlRi2Ratio: 40 + Math.random() * 20,
      dlBlerPercent: 2 + Math.random() * 3,
      ulSinrAvg: sinr,
      ulSinrP10: sinr - 5,
      ulSinrP50: sinr,
      ulSinrP90: sinr + 5,
      ulBlerPercent: 3 + Math.random() * 4,
      rsrpAvg: -95 + Math.random() * 15,
      rsrpP10: -105,
      rsrpP50: -95,
      rsrpP90: -85,
      rsrqAvg: -10 + Math.random() * 5,
      rsrqP10: -15,
      rsrqP50: -10,
      rsrqP90: -5,
      dlSpectralEfficiency: 3 + Math.random() * 2,
      ulSpectralEfficiency: 1.5 + Math.random() * 1,
    },
    mobility: {
      intraFreqHoAttempts: 500 + Math.floor(Math.random() * 2000),
      intraFreqHoSuccess: 480 + Math.floor(Math.random() * 20),
      intraFreqHoFailure: Math.floor(Math.random() * 20),
      intraFreqHoSuccessRate: 96 + Math.random() * 4,
      interFreqHoAttempts: 100,
      interFreqHoSuccess: 95,
      interFreqHoFailure: 5,
      interFreqHoSuccessRate: 95,
      interRatHoAttempts: 50,
      interRatHoSuccess: 45,
      interRatHoFailure: 5,
      interRatHoSuccessRate: 90,
      x2HoAttempts: 400,
      x2HoSuccess: 390,
      x2HoSuccessRate: 97.5,
      s1HoAttempts: 100,
      s1HoSuccess: 95,
      s1HoSuccessRate: 95,
      tooEarlyHo: 5,
      tooLateHo: 3,
      wrongCellHo: 2,
      pingPongHo: 8,
      incomingHoTotal: 600,
      outgoingHoTotal: 580,
    },
    uplinkInterference: {
      prbUlInterferenceAvg: -105 + iot,
      prbUlInterferenceP10: -110 + iot,
      prbUlInterferenceP50: -105 + iot,
      prbUlInterferenceP90: -100 + iot,
      prbUlInterferenceP99: -95 + iot,
      iotAvg: iot,
      iotP95: iot + 2,
      rip: -100 + iot,
      externalInterferenceDetected: iot > 10,
      externalInterferenceLevel: iot > 15 ? 'high' : iot > 10 ? 'medium' : iot > 6 ? 'low' : 'none',
      puschSinrDegradation: Math.max(0, 8 - sinr),
      highInterferencePrbRatio: Math.min(100, iot * 5),
    },
    uplinkPowerControl: {
      p0NominalPusch: p0,
      p0NominalPucch: p0 - 5,
      alpha,
      ueTxPowerAvg: 10 + Math.random() * 10,
      ueTxPowerP10: 5,
      ueTxPowerP50: 15,
      ueTxPowerP90: 20,
      ueTxPowerMax: 23,
      powerHeadroomAvg: 10 + Math.random() * 10,
      powerHeadroomP10: 5,
      powerHeadroomP50: 12,
      powerHeadroomP90: 18,
      negativePowerHeadroomRatio: Math.max(0, 15 - sinr),
      pathLossAvg: 110 + Math.random() * 20,
      pathLossP10: 100,
      pathLossP50: 115,
      pathLossP90: 130,
      tpcUpCommands: 1000,
      tpcDownCommands: 800,
      tpcAccumulatedOffset: 2,
      powerLimitedUeRatio: Math.max(0, 25 - sinr),
    },
  };
}

function generateSampleNeighborRelation(
  sourceCellId: string,
  targetCellId: string
): NeighborRelation {
  return {
    sourceCellId,
    targetCellId,
    relationshipType: 'intra-freq',
    sourcePci: Math.floor(Math.random() * 504),
    sourceFrequency: 2600,
    sourceRsrp: -90 + Math.random() * 10,
    sourceSinr: 8 + Math.random() * 10,
    targetPci: Math.floor(Math.random() * 504),
    targetFrequency: 2600,
    targetRsrp: -95 + Math.random() * 15,
    targetSinr: 5 + Math.random() * 12,
    hoAttempts: 100 + Math.floor(Math.random() * 400),
    hoSuccess: 95 + Math.floor(Math.random() * 5),
    hoFailure: Math.floor(Math.random() * 5),
    hoSuccessRate: 95 + Math.random() * 5,
    a3Offset: 3,
    hysteresis: 2,
    timeToTrigger: 480,
    neighborQuality: 'good',
    distance: 500 + Math.random() * 2000,
  };
}

function generateNetwork(config: ScenarioConfig): {
  cellSnapshots: Map<string, CellKPISnapshot>;
  neighborRelations: NeighborRelation[];
} {
  const cellSnapshots = new Map<string, CellKPISnapshot>();
  const cellIds: string[] = [];

  const defaultP0 = -100;
  const defaultAlpha = 0.8;

  for (let i = 1; i <= config.cells; i++) {
    const cellId = `CELL_${String(i).padStart(4, '0')}`;
    cellIds.push(cellId);

    const rand = Math.random() * 100;
    const p0Variation = Math.floor(Math.random() * 11) - 5;
    const alphaVariation = (Math.random() * 0.4) - 0.2;
    const baseP0 = defaultP0 + p0Variation;
    const baseAlpha = Math.max(0.4, Math.min(1.0, defaultAlpha + alphaVariation));

    let cellConfig: { sinr: number; iot: number; p0: number; alpha: number };

    if (rand < config.criticalPercent) {
      // Critical cell
      const sinr = -3 + Math.random() * 3;
      const iot = 14 + Math.random() * 6;
      cellConfig = { sinr, iot, p0: baseP0, alpha: baseAlpha };
    } else if (rand < config.criticalPercent + config.issuePercent) {
      // Issue cell
      const sinr = Math.random() * 5;
      const iot = 10 + Math.random() * 5;
      cellConfig = { sinr, iot, p0: baseP0, alpha: baseAlpha };
    } else {
      // Healthy cell
      const sinr = 5 + Math.random() * 18;
      const iot = 2 + Math.random() * 6;
      cellConfig = { sinr, iot, p0: baseP0, alpha: baseAlpha };
    }

    cellSnapshots.set(cellId, generateSampleCellSnapshot(cellId, cellConfig));
  }

  // Generate neighbor relations (~5 neighbors per cell)
  const neighborRelations: NeighborRelation[] = [];
  const targetRelations = config.cells * 5;
  const numCells = cellIds.length;

  for (let i = 0; i < numCells && neighborRelations.length < targetRelations; i++) {
    const numNeighbors = 3 + Math.floor(Math.random() * 4);
    for (let n = 0; n < numNeighbors && neighborRelations.length < targetRelations; n++) {
      const offset = 1 + Math.floor(Math.random() * 10);
      const j = (i + offset) % numCells;
      if (i !== j) {
        neighborRelations.push(generateSampleNeighborRelation(cellIds[i], cellIds[j]));
      }
    }
  }

  return { cellSnapshots, neighborRelations };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

function printHeader(text: string, char: string = '='): void {
  console.log('\n' + char.repeat(80));
  console.log('  ' + text);
  console.log(char.repeat(80));
}

function printSubHeader(text: string): void {
  console.log('\n  ' + '-'.repeat(76));
  console.log('  ' + text);
  console.log('  ' + '-'.repeat(76));
}

function printScenarioResults(
  scenario: ScenarioConfig,
  result: FPPCOptimizationResult,
  genTimeMs: number
): void {
  printSubHeader(`Results: ${scenario.name}`);

  console.log(`
  Mode:                ${result.mode}
  Total cells:         ${result.metrics.totalCells.toLocaleString()}
  Issue cells:         ${result.metrics.issueCellsDetected.toLocaleString()}
  Cells optimized:     ${result.metrics.cellsOptimized.toLocaleString()}
  Success rate:        ${(result.metrics.successRate * 100).toFixed(1)}%

  Performance:
    Generation time:   ${(genTimeMs / 1000).toFixed(2)}s
    Optimization time: ${(result.processingTimeMs / 1000).toFixed(2)}s
    Cells/second:      ${result.cellsPerSecond.toLocaleString()}

  SINR Improvement:
    Average:           +${result.metrics.avgSINRImprovement.toFixed(2)} dB
    Neighbor impact:   ${result.metrics.avgNeighborImpact.toFixed(2)} dB`);

  if (result.mode === 'hybrid') {
    console.log(`
  Hybrid Breakdown:
    GNN (critical):    ${result.metrics.gnnCells ?? 0} cells
    Physics (issue):   ${result.metrics.physicsCells ?? 0} cells`);
  }

  // Show top 5 improvements
  if (result.results.length > 0) {
    const sorted = [...result.results].sort((a, b) => b.sinrImprovement - a.sinrImprovement);
    const topN = Math.min(5, sorted.length);

    console.log(`\n  Top ${topN} Improvements:`);
    console.log('  ' + '-'.repeat(72));

    for (let i = 0; i < topN; i++) {
      const r = sorted[i];
      const p0Change = r.optimizedParams.p0 - r.originalParams.p0;
      console.log(`    ${r.cellId}: P0 ${r.originalParams.p0}→${r.optimizedParams.p0} (${p0Change >= 0 ? '+' : ''}${p0Change}), ` +
                  `Alpha ${r.originalParams.alpha.toFixed(1)}→${r.optimizedParams.alpha.toFixed(1)}, ` +
                  `SINR +${r.sinrImprovement.toFixed(1)} dB`);
    }
  }
}

function printHistogram(title: string, values: number[], bucketSize: number, unit: string = ''): void {
  const distribution = new Map<number, number>();

  for (const val of values) {
    const bucket = Math.floor(val / bucketSize) * bucketSize;
    distribution.set(bucket, (distribution.get(bucket) || 0) + 1);
  }

  console.log(`\n  ${title}:`);
  const sorted = Array.from(distribution.entries()).sort((a, b) => a[0] - b[0]);
  const maxCount = Math.max(...sorted.map(([, c]) => c));
  const barScale = 30 / maxCount;

  for (const [value, count] of sorted) {
    const bar = '#'.repeat(Math.max(1, Math.ceil(count * barScale)));
    const pct = ((count / values.length) * 100).toFixed(1);
    console.log(`    ${value.toString().padStart(4)}${unit}: ${count.toString().padStart(5)} (${pct.padStart(5)}%) ${bar}`);
  }
}

function printComparisonSummary(results: Array<{ scenario: ScenarioConfig; result: FPPCOptimizationResult; genTimeMs: number }>): void {
  printHeader('Performance Comparison Summary');

  console.log(`
  Scenario              | Cells   | Mode     | Time (s) | Cells/s  | Avg SINR+
  ----------------------|---------|----------|----------|----------|----------`);

  for (const { scenario, result } of results) {
    const cells = scenario.cells.toString().padEnd(7);
    const mode = result.mode.padEnd(8);
    const time = (result.processingTimeMs / 1000).toFixed(2).padStart(8);
    const rate = result.cellsPerSecond.toLocaleString().padStart(8);
    const sinr = `+${result.metrics.avgSINRImprovement.toFixed(1)} dB`.padStart(10);
    console.log(`  ${scenario.name.substring(0, 21).padEnd(21)} | ${cells} | ${mode} | ${time} | ${rate} | ${sinr}`);
  }

  // Calculate speedup
  if (results.length >= 2) {
    const fastResult = results.find(r => r.result.mode === 'fast');
    const accurateResult = results.find(r => r.result.mode === 'accurate');

    if (fastResult && accurateResult) {
      const scaleFactor = fastResult.scenario.cells / accurateResult.scenario.cells;
      const normalizedFastTime = fastResult.result.processingTimeMs / scaleFactor;
      const speedup = accurateResult.result.processingTimeMs / normalizedFastTime;

      console.log(`\n  Estimated Fast vs Accurate speedup: ${speedup.toFixed(1)}x (normalized to same cell count)`);
    }
  }
}

// ============================================================================
// MAIN DEMO
// ============================================================================

async function runDemo(): Promise<void> {
  printHeader('FPPC Optimizer Demo - Fractional Path-loss Power Control');
  console.log(`
  Unified optimizer combining:
  - GNN-based SINR prediction (accuracy)
  - TypedArray batch processing (speed)
  - O(1) neighbor lookup with pre-computed adjacency

  Based on: Ericsson PyTorch Conference 2023 - GNN for RAN Optimization

  System: ${os.cpus().length} CPUs, ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB RAM
`);

  const allResults: Array<{ scenario: ScenarioConfig; result: FPPCOptimizationResult; genTimeMs: number }> = [];

  for (const scenario of SCENARIOS) {
    printHeader(`Scenario: ${scenario.name}`, '-');

    console.log(`  Configuration:`);
    console.log(`    Cells: ${scenario.cells}`);
    console.log(`    Mode: ${scenario.mode}`);
    console.log(`    Critical cells: ${scenario.criticalPercent}%`);
    console.log(`    Issue cells: ${scenario.issuePercent}%`);

    // Generate network
    console.log(`\n  Generating network...`);
    const genStart = Date.now();
    const { cellSnapshots, neighborRelations } = generateNetwork(scenario);
    const genTimeMs = Date.now() - genStart;
    console.log(`    Generated ${cellSnapshots.size} cells, ${neighborRelations.length} neighbor relations in ${(genTimeMs / 1000).toFixed(2)}s`);

    // Create optimizer
    console.log(`\n  Creating FPPC optimizer...`);
    const optimizer = await FPPCOptimizer.create({ mode: scenario.mode });

    // Run optimization
    console.log(`  Running optimization (mode: ${scenario.mode})...`);
    const result = await optimizer.optimizeNetwork(cellSnapshots, neighborRelations, {
      forceMode: scenario.mode,
    });

    // Display results
    printScenarioResults(scenario, result, genTimeMs);

    // Show SINR distribution for accurate mode
    if (scenario.mode === 'accurate' && result.results.length > 0) {
      const improvements = result.results.map(r => r.sinrImprovement);
      printHistogram('SINR Improvement Distribution (1 dB buckets)', improvements, 1, ' dB');
    }

    allResults.push({ scenario, result, genTimeMs });

    console.log('');
  }

  // Final comparison
  printComparisonSummary(allResults);

  // Key insights
  printHeader('Key Insights: P0 and Alpha Trade-offs');
  console.log(`
  pZeroNominalPusch (P0):
  - Target uplink transmission power of UE
  - HIGH P0 = High UE throughput BUT higher interference on neighbors
  - LOW P0 = Less interference BUT may cause coverage issues
  - Optimal range: -102 to -95 dBm (Ericsson recommended)

  Alpha (Path Loss Compensation):
  - Pathloss compensation factor (0-1)
  - HIGH Alpha = Better cell-edge coverage BUT higher neighbor interference
  - LOW Alpha = Less interference BUT cell-edge users may suffer
  - Optimal range: 0.7 to 0.9 (Ericsson recommended)

  The FPPC optimizer learns to predict the OPTIMAL balance:
  - Maximize SINR for issue cells
  - WITHOUT degrading neighbor cell SINR > 1.5 dB
`);

  printHeader('Demo Complete');
  console.log(`\n  Run: npx tsx src/gnn/run-fppc-demo.ts\n`);
}

// Run demo
runDemo().catch(console.error);
