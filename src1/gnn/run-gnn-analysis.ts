#!/usr/bin/env tsx
/**
 * GNN-Based Network SINR Optimization Analysis
 *
 * Uses actual Graph Neural Network predictions with:
 * - Multi-head attention message passing
 * - Interference-aware candidate generation (bi-directional P0 exploration)
 * - Cell profiling for smart optimization direction
 *
 * Run with: npx tsx src/gnn/run-gnn-analysis.ts
 *
 * Output: docs/gnn_optimization_results.csv
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadRealNetworkData, type LoaderStats } from '../data/csv-kpi-loader.js';
import { GNNParallelOptimizer, type GNNOptimizationResult } from './gnn-parallel-optimizer.js';
import type { CellOptimizationResult } from './network-surrogate-model.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  CSV_PATH: path.join(__dirname, '../../docs/filtered_flows.csv'),
  OUTPUT_CSV_PATH: path.join(__dirname, '../../docs/gnn_optimization_results.csv'),
  NUM_WORKERS: Math.max(1, os.cpus().length - 1),
  ENABLE_PROFILING: true,

  // Optimization parameters
  P0_MIN: -104,
  P0_MAX: -76,
  P0_STEP: 2,
  ALPHA_VALUES: [0.6, 0.7, 0.8, 0.9, 1.0],
  MIN_IMPROVEMENT: 0.6,

  // Detection thresholds
  SINR_CRITICAL_THRESHOLD: 1,
  SINR_ISSUE_THRESHOLD: 3,
};

// ============================================================================
// PROFILER
// ============================================================================

interface ProfileEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class Profiler {
  private entries: ProfileEntry[] = [];
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  start(name: string): void {
    if (!this.enabled) return;
    this.entries.push({ name, startTime: Date.now() });
  }

  end(name: string): number {
    if (!this.enabled) return 0;
    const entry = this.entries.find(e => e.name === name && !e.endTime);
    if (entry) {
      entry.endTime = Date.now();
      entry.duration = entry.endTime - entry.startTime;
      return entry.duration;
    }
    return 0;
  }

  report(): void {
    if (!this.enabled) return;
    console.log('\n  Performance Profile:');
    console.log('    ' + '-'.repeat(50));

    for (const entry of this.entries) {
      if (entry.duration) {
        const pct = this.entries[0].duration
          ? ((entry.duration / this.entries[0].duration) * 100).toFixed(1)
          : '100.0';
        console.log(`    ${entry.name.padEnd(30)} ${(entry.duration / 1000).toFixed(2)}s (${pct}%)`);
      }
    }
    console.log('    ' + '-'.repeat(50));
  }
}

// ============================================================================
// CSV EXPORT
// ============================================================================

interface ParameterChangeRow {
  eci: string;
  cellName: string;
  parameter: string;
  valueBefore: string;
  value: string;
  sinrImprovement: number;
}

function exportOptimizationResults(
  results: CellOptimizationResult[],
  cellNameMap: Map<string, string>,
  outputPath: string
): number {
  const header = 'ECI;Cell_Name;Parameter;Value_before;Value;SINR_Improvement';
  const changeRows: ParameterChangeRow[] = [];

  for (const r of results) {
    const cellName = cellNameMap.get(r.cellId) || r.cellId;
    const p0Change = r.optimizedParams.p0 - r.originalParams.p0;
    const alphaChange = r.optimizedParams.alpha - r.originalParams.alpha;

    if (p0Change !== 0) {
      changeRows.push({
        eci: r.cellId,
        cellName,
        parameter: 'pZeroNominalPusch',
        valueBefore: r.originalParams.p0.toFixed(0),
        value: r.optimizedParams.p0.toFixed(0),
        sinrImprovement: r.sinrImprovement,
      });
    }

    if (Math.abs(alphaChange) > 0.001) {
      changeRows.push({
        eci: r.cellId,
        cellName,
        parameter: 'alpha',
        valueBefore: r.originalParams.alpha.toFixed(1),
        value: r.optimizedParams.alpha.toFixed(1),
        sinrImprovement: r.sinrImprovement,
      });
    }
  }

  // Sort by SINR improvement (descending)
  changeRows.sort((a, b) => b.sinrImprovement - a.sinrImprovement);

  const rows = changeRows.map(row =>
    [row.eci, row.cellName, row.parameter, row.valueBefore, row.value, row.sinrImprovement.toFixed(2)].join(';')
  );

  fs.writeFileSync(outputPath, [header, ...rows].join('\n'), 'utf-8');
  return changeRows.length;
}

// ============================================================================
// RESULTS ANALYZER
// ============================================================================

function analyzeP0Distribution(results: CellOptimizationResult[]): void {
  console.log('\n  P0 Change Distribution (GNN vs Linear):');
  console.log('    ' + '-'.repeat(60));

  const deltaBins = new Map<string, number>();

  for (const r of results) {
    const delta = r.optimizedParams.p0 - r.originalParams.p0;
    let bin: string;
    if (delta < -6) bin = '< -6 dBm (strong decrease)';
    else if (delta < -2) bin = '-6 to -3 dBm (decrease)';
    else if (delta < 0) bin = '-2 to -1 dBm (slight decrease)';
    else if (delta === 0) bin = 'No change';
    else if (delta <= 2) bin = '+1 to +2 dBm (slight increase)';
    else if (delta <= 6) bin = '+3 to +6 dBm (increase)';
    else bin = '> +6 dBm (strong increase)';

    deltaBins.set(bin, (deltaBins.get(bin) || 0) + 1);
  }

  const total = results.length;
  const sortedBins = [
    '< -6 dBm (strong decrease)',
    '-6 to -3 dBm (decrease)',
    '-2 to -1 dBm (slight decrease)',
    'No change',
    '+1 to +2 dBm (slight increase)',
    '+3 to +6 dBm (increase)',
    '> +6 dBm (strong increase)',
  ];

  for (const bin of sortedBins) {
    const count = deltaBins.get(bin) || 0;
    const pct = (count / total * 100).toFixed(1);
    const bar = '#'.repeat(Math.ceil(count / total * 40));
    console.log(`    ${bin.padEnd(35)} ${count.toString().padStart(5)} (${pct.padStart(5)}%) ${bar}`);
  }
}

function analyzeAlphaDistribution(results: CellOptimizationResult[]): void {
  console.log('\n  Alpha Change Distribution:');
  console.log('    ' + '-'.repeat(60));

  const deltaBins = new Map<string, number>();

  for (const r of results) {
    const delta = r.optimizedParams.alpha - r.originalParams.alpha;
    let bin: string;
    if (delta < -0.15) bin = '< -0.2 (strong decrease)';
    else if (delta < -0.05) bin = '-0.1 (decrease)';
    else if (delta < 0.05) bin = 'No change';
    else if (delta < 0.15) bin = '+0.1 (increase)';
    else bin = '> +0.2 (strong increase)';

    deltaBins.set(bin, (deltaBins.get(bin) || 0) + 1);
  }

  const total = results.length;
  const sortedBins = [
    '< -0.2 (strong decrease)',
    '-0.1 (decrease)',
    'No change',
    '+0.1 (increase)',
    '> +0.2 (strong increase)',
  ];

  for (const bin of sortedBins) {
    const count = deltaBins.get(bin) || 0;
    const pct = (count / total * 100).toFixed(1);
    const bar = '#'.repeat(Math.ceil(count / total * 40));
    console.log(`    ${bin.padEnd(35)} ${count.toString().padStart(5)} (${pct.padStart(5)}%) ${bar}`);
  }
}

function analyzeOptimizationReasons(results: CellOptimizationResult[]): void {
  console.log('\n  Optimization Patterns (P0 × Alpha):');
  console.log('    ' + '-'.repeat(60));

  const patterns = new Map<string, { count: number; avgImprovement: number }>();

  for (const r of results) {
    const p0Delta = r.optimizedParams.p0 - r.originalParams.p0;
    const alphaDelta = r.optimizedParams.alpha - r.originalParams.alpha;

    let p0Dir = p0Delta > 0 ? 'P0↑' : p0Delta < 0 ? 'P0↓' : 'P0=';
    let alphaDir = alphaDelta > 0.05 ? 'α↑' : alphaDelta < -0.05 ? 'α↓' : 'α=';
    const pattern = `${p0Dir} ${alphaDir}`;

    const existing = patterns.get(pattern) || { count: 0, avgImprovement: 0 };
    existing.avgImprovement = (existing.avgImprovement * existing.count + r.sinrImprovement) / (existing.count + 1);
    existing.count++;
    patterns.set(pattern, existing);
  }

  const sorted = [...patterns.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [pattern, data] of sorted) {
    const pct = (data.count / results.length * 100).toFixed(1);
    console.log(`    ${pattern.padEnd(15)} ${data.count.toString().padStart(5)} cells (${pct.padStart(5)}%) | avg +${data.avgImprovement.toFixed(2)} dB`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function runGNNAnalysis() {
  const profiler = new Profiler(CONFIG.ENABLE_PROFILING);
  profiler.start('Total');

  console.log('\n' + '='.repeat(80));
  console.log('   GNN-BASED NETWORK SINR OPTIMIZATION');
  console.log('   Using Graph Neural Network with Attention');
  console.log('='.repeat(80));

  // ============================================================================
  // LOAD DATA
  // ============================================================================

  console.log('\n' + '-'.repeat(80));
  console.log('  LOADING NETWORK DATA');
  console.log('-'.repeat(80));

  profiler.start('Data Loading');

  console.log(`  CSV Path: ${CONFIG.CSV_PATH}`);
  const { cellSnapshots, neighborRelations, cellNameMap, stats } = await loadRealNetworkData(CONFIG.CSV_PATH);

  const loadTime = profiler.end('Data Loading');

  console.log(`\n  Data Loaded:`);
  console.log(`    CSV rows:             ${stats.totalRows.toLocaleString()}`);
  console.log(`    Unique cells:         ${stats.uniqueCells.toLocaleString()}`);
  console.log(`    Neighbor relations:   ${stats.neighborRelations.toLocaleString()}`);
  console.log(`    Parse time:           ${(loadTime / 1000).toFixed(2)}s`);

  // ============================================================================
  // RUN GNN OPTIMIZATION
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('  RUNNING GNN OPTIMIZATION');
  console.log('='.repeat(80));

  console.log(`\n  Configuration:`);
  console.log(`    Workers:              ${CONFIG.NUM_WORKERS}`);
  console.log(`    P0 range:             [${CONFIG.P0_MIN}, ${CONFIG.P0_MAX}] dBm`);
  console.log(`    Alpha values:         ${CONFIG.ALPHA_VALUES.join(', ')}`);
  console.log(`    Min improvement:      ${CONFIG.MIN_IMPROVEMENT} dB`);

  profiler.start('GNN Optimization');

  const optimizer = new GNNParallelOptimizer(
    { numWorkers: CONFIG.NUM_WORKERS, enableProfiling: true },
    {
      p0Min: CONFIG.P0_MIN,
      p0Max: CONFIG.P0_MAX,
      p0Step: CONFIG.P0_STEP,
      alphaValues: CONFIG.ALPHA_VALUES,
      minImprovement: CONFIG.MIN_IMPROVEMENT,
      sinrCriticalThreshold: CONFIG.SINR_CRITICAL_THRESHOLD,
      sinrIssueThreshold: CONFIG.SINR_ISSUE_THRESHOLD,
    }
  );

  const result = await optimizer.optimizeNetwork(cellSnapshots, neighborRelations);

  const optTime = profiler.end('GNN Optimization');

  console.log(`\n  Optimization completed in ${(optTime / 1000).toFixed(2)}s`);
  console.log(`  Processing rate: ${result.cellsPerSecond.toLocaleString()} cells/second`);

  // ============================================================================
  // RESULTS
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('  OPTIMIZATION RESULTS');
  console.log('='.repeat(80));

  console.log('\n  Summary:');
  console.log(`    Total cells:          ${result.totalCells.toLocaleString()}`);
  console.log(`    Issue cells:          ${result.issueCells.toLocaleString()} (${(result.issueCells / result.totalCells * 100).toFixed(1)}%)`);
  console.log(`    Optimized cells:      ${result.optimizedCells.toLocaleString()} (${(result.optimizedCells / result.issueCells * 100).toFixed(1)}% of issues)`);

  console.log('\n  SINR Improvement:');
  console.log(`    Average improvement:  +${result.stats.sinr.improvement.toFixed(2)} dB`);

  console.log('\n  P0 Changes (KEY METRIC - Should show bi-directional):');
  console.log(`    P0 increased:         ${result.stats.p0.increased.toLocaleString()} cells`);
  console.log(`    P0 decreased:         ${result.stats.p0.decreased.toLocaleString()} cells`);
  console.log(`    Average change:       ${result.stats.p0.avgChange >= 0 ? '+' : ''}${result.stats.p0.avgChange.toFixed(1)} dBm`);

  const p0DecreasePercent = (result.stats.p0.decreased / (result.stats.p0.increased + result.stats.p0.decreased) * 100).toFixed(1);
  console.log(`    P0 decrease ratio:    ${p0DecreasePercent}% (target: >20%)`);

  console.log('\n  Alpha Changes:');
  console.log(`    Alpha increased:      ${result.stats.alpha.increased.toLocaleString()} cells`);
  console.log(`    Alpha decreased:      ${result.stats.alpha.decreased.toLocaleString()} cells`);
  console.log(`    Average change:       ${result.stats.alpha.avgChange >= 0 ? '+' : ''}${result.stats.alpha.avgChange.toFixed(3)}`);

  // ============================================================================
  // DISTRIBUTION ANALYSIS
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('  DISTRIBUTION ANALYSIS');
  console.log('='.repeat(80));

  analyzeP0Distribution(result.results);
  analyzeAlphaDistribution(result.results);
  analyzeOptimizationReasons(result.results);

  // ============================================================================
  // TOP IMPROVEMENTS
  // ============================================================================

  console.log('\n' + '-'.repeat(80));
  console.log('  TOP 20 IMPROVEMENTS');
  console.log('-'.repeat(80));

  const sorted = [...result.results].sort((a, b) => b.sinrImprovement - a.sinrImprovement);
  console.log('    ' + '-'.repeat(110));
  console.log('    Cell Name                          | Original SINR | P0 Change         | Alpha     | SINR Gain');
  console.log('    ' + '-'.repeat(110));

  for (const r of sorted.slice(0, 20)) {
    const cellName = cellNameMap.get(r.cellId) || r.cellId;
    const p0Change = r.optimizedParams.p0 - r.originalParams.p0;
    const namePadded = cellName.substring(0, 35).padEnd(35);
    const p0Sign = p0Change >= 0 ? '+' : '';
    console.log(`    ${namePadded} | ${r.originalSINR.toFixed(1).padStart(10)} dB | ${r.originalParams.p0} -> ${r.optimizedParams.p0} (${p0Sign}${p0Change}) | ${r.originalParams.alpha.toFixed(1)} -> ${r.optimizedParams.alpha.toFixed(1)} | +${r.sinrImprovement.toFixed(2)} dB`);
  }

  // ============================================================================
  // CELLS WITH P0 DECREASE (key improvement)
  // ============================================================================

  const p0DecreaseCells = result.results.filter(r => r.optimizedParams.p0 < r.originalParams.p0);
  if (p0DecreaseCells.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('  CELLS WITH P0 DECREASE (Interference Reduction)');
    console.log('-'.repeat(80));

    const topDecreases = [...p0DecreaseCells].sort((a, b) =>
      (a.optimizedParams.p0 - a.originalParams.p0) - (b.optimizedParams.p0 - b.originalParams.p0)
    ).slice(0, 10);

    for (const r of topDecreases) {
      const cellName = cellNameMap.get(r.cellId) || r.cellId;
      const p0Change = r.optimizedParams.p0 - r.originalParams.p0;
      console.log(`    ${cellName.padEnd(35)} P0: ${r.originalParams.p0} -> ${r.optimizedParams.p0} (${p0Change}) | SINR: +${r.sinrImprovement.toFixed(2)} dB`);
    }
  }

  // ============================================================================
  // EXPORT CSV
  // ============================================================================

  console.log('\n' + '-'.repeat(80));
  console.log('  EXPORTING RESULTS');
  console.log('-'.repeat(80));

  const rowsWritten = exportOptimizationResults(result.results, cellNameMap, CONFIG.OUTPUT_CSV_PATH);
  console.log(`\n  CSV exported: ${CONFIG.OUTPUT_CSV_PATH}`);
  console.log(`  Parameter changes: ${rowsWritten.toLocaleString()}`);

  // ============================================================================
  // PERFORMANCE
  // ============================================================================

  const totalTime = profiler.end('Total');

  console.log('\n' + '='.repeat(80));
  console.log('  PERFORMANCE SUMMARY');
  console.log('='.repeat(80));

  console.log(`
  Network Scale:
    - Cells: ${stats.uniqueCells.toLocaleString()}
    - Neighbor relations: ${stats.neighborRelations.toLocaleString()}

  Performance:
    - Total time: ${(totalTime / 1000).toFixed(2)}s
    - Data loading: ${(loadTime / 1000).toFixed(2)}s
    - GNN optimization: ${(optTime / 1000).toFixed(2)}s
    - Workers: ${CONFIG.NUM_WORKERS}

  Key Metrics:
    - Cells optimized: ${result.optimizedCells.toLocaleString()}
    - Avg SINR gain: +${result.stats.sinr.improvement.toFixed(2)} dB
    - P0 decrease ratio: ${p0DecreasePercent}%
`);

  profiler.report();

  console.log('\n' + '='.repeat(80));
  console.log('  GNN ANALYSIS COMPLETE');
  console.log('='.repeat(80) + '\n');
}

// Run
runGNNAnalysis().catch(console.error);
