#!/usr/bin/env tsx
/**
 * Real Network SINR Optimization Analysis
 *
 * Loads actual network data from filtered_flows.csv and runs
 * parallel optimization on real Ericsson RAN cells.
 *
 * Data source: docs/filtered_flows.csv
 * - 112,178 neighbor flow records
 * - Real SINR, PathLoss, P0, Alpha values
 * - Cell names like TONNERRE_CENTRE_F1, PFASTATT_NORD_F2, etc.
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadRealNetworkData, type LoaderStats } from '../data/csv-kpi-loader.js';
import {
  ParallelNetworkOptimizer,
  BatchCellData,
  NeighborIndex,
} from './parallel-optimizer.js';
import type { CellOptimizationResult } from './network-surrogate-model.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  CSV_PATH: path.join(__dirname, '../../docs/filtered_flows.csv'),
  OUTPUT_CSV_PATH: path.join(__dirname, '../../docs/optimization_results.csv'),
  NUM_WORKERS: Math.max(1, os.cpus().length - 1),
  ENABLE_PROFILING: true,

  // Optimization parameters
  P0_MIN: -104,
  P0_MAX: -76,
  P0_STEP: 2,
  ALPHA_VALUES: [0.6, 0.7, 0.8, 0.9, 1.0],
  MIN_IMPROVEMENT: 0.6,

  // Detection thresholds (per README.md)
  // Critical: SINR < 1 dB, Issue: 1-3 dB, Healthy: >= 3 dB
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
// CSV EXPORT FUNCTION
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
  // CSV Header: ECI;Cell_Name;Parameter;Value_before;Value;SINR_Improvement
  const header = 'ECI;Cell_Name;Parameter;Value_before;Value;SINR_Improvement';

  const changeRows: ParameterChangeRow[] = [];

  for (const r of results) {
    const cellName = cellNameMap.get(r.cellId) || r.cellId;
    const p0Change = r.optimizedParams.p0 - r.originalParams.p0;
    const alphaChange = r.optimizedParams.alpha - r.originalParams.alpha;

    // Only include cells with actual parameter changes
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

  // Sort by SINR improvement (descending), then by cell name
  changeRows.sort((a, b) => {
    if (b.sinrImprovement !== a.sinrImprovement) {
      return b.sinrImprovement - a.sinrImprovement;
    }
    return a.cellName.localeCompare(b.cellName);
  });

  // Convert to CSV rows
  const rows = changeRows.map(row =>
    [
      row.eci,
      row.cellName,
      row.parameter,
      row.valueBefore,
      row.value,
      row.sinrImprovement.toFixed(2),
    ].join(';')
  );

  // Write to file
  const csvContent = [header, ...rows].join('\n');
  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  return changeRows.length;
}

// ============================================================================
// HISTOGRAM HELPER
// ============================================================================

function printHistogram(title: string, values: Float64Array | number[], bucketSize: number, unit = '') {
  const distribution = new Map<number, number>();

  for (let i = 0; i < values.length; i++) {
    const bucket = Math.floor(values[i] / bucketSize) * bucketSize;
    distribution.set(bucket, (distribution.get(bucket) || 0) + 1);
  }

  console.log(`\n  ${title}:`);
  const sorted = [...distribution.entries()].sort((a, b) => a[0] - b[0]);
  const maxCount = Math.max(...sorted.map(([, c]) => c));
  const barScale = 40 / maxCount;

  for (const [value, count] of sorted) {
    const bar = '#'.repeat(Math.max(1, Math.ceil(count * barScale)));
    const pct = ((count / values.length) * 100).toFixed(1);
    console.log(`    ${value.toString().padStart(4)}${unit}: ${count.toString().padStart(5)} (${pct.padStart(5)}%) ${bar}`);
  }
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

async function runRealDataAnalysis() {
  const profiler = new Profiler(CONFIG.ENABLE_PROFILING);
  profiler.start('Total');

  console.log('\n' + '='.repeat(80));
  console.log('   REAL NETWORK SINR OPTIMIZATION ANALYSIS');
  console.log('   Using filtered_flows.csv - Ericsson LTE800 Network');
  console.log('='.repeat(80));

  // ============================================================================
  // LOAD DATA
  // ============================================================================

  console.log('\n' + '-'.repeat(80));
  console.log('  LOADING REAL NETWORK DATA');
  console.log('-'.repeat(80));

  profiler.start('Data Loading');

  console.log(`  CSV Path: ${CONFIG.CSV_PATH}`);
  console.log('  Parsing CSV file...');

  const { cellSnapshots, neighborRelations, cellNameMap, stats } = await loadRealNetworkData(CONFIG.CSV_PATH);

  const loadTime = profiler.end('Data Loading');

  console.log(`\n  Data Loaded Successfully:`);
  console.log(`    CSV rows parsed:      ${stats.totalRows.toLocaleString()}`);
  console.log(`    Unique cells:         ${stats.uniqueCells.toLocaleString()}`);
  console.log(`    Neighbor relations:   ${stats.neighborRelations.toLocaleString()}`);
  console.log(`    Parse time:           ${(loadTime / 1000).toFixed(2)}s`);
  console.log(`    Parse rate:           ${stats.rowsPerSecond.toLocaleString()} rows/s`);

  // ============================================================================
  // BUILD DATA STRUCTURES
  // ============================================================================

  console.log('\n' + '-'.repeat(80));
  console.log('  BUILDING OPTIMIZED DATA STRUCTURES');
  console.log('-'.repeat(80));

  profiler.start('Data Structure Build');

  console.log('  Creating TypedArray batch data...');
  profiler.start('BatchCellData');
  const batchData = new BatchCellData(cellSnapshots);
  const batchDataTime = profiler.end('BatchCellData');
  console.log(`    BatchCellData created in ${batchDataTime}ms`);

  console.log('  Building neighbor index...');
  profiler.start('NeighborIndex');
  const neighborIdx = new NeighborIndex(neighborRelations);
  const neighborIndexTime = profiler.end('NeighborIndex');
  console.log(`    NeighborIndex built in ${neighborIndexTime}ms`);

  profiler.end('Data Structure Build');

  // ============================================================================
  // BASELINE ANALYSIS
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('  BASELINE NETWORK ANALYSIS');
  console.log('='.repeat(80));

  profiler.start('Baseline Analysis');

  const baselineStats = batchData.calculateStats();
  const issueIndices = batchData.getIssueCellIndices(CONFIG.SINR_ISSUE_THRESHOLD);
  const criticalIndices = batchData.getIssueCellIndices(CONFIG.SINR_CRITICAL_THRESHOLD);

  console.log('\n  Cell Health Distribution:');
  console.log(`    Critical (SINR < ${CONFIG.SINR_CRITICAL_THRESHOLD} dB):     ${criticalIndices.length.toLocaleString().padStart(6)} cells (${(criticalIndices.length / stats.uniqueCells * 100).toFixed(1)}%)`);
  console.log(`    Issue (${CONFIG.SINR_CRITICAL_THRESHOLD} <= SINR < ${CONFIG.SINR_ISSUE_THRESHOLD} dB):   ${(issueIndices.length - criticalIndices.length).toLocaleString().padStart(6)} cells (${((issueIndices.length - criticalIndices.length) / stats.uniqueCells * 100).toFixed(1)}%)`);
  console.log(`    Healthy (SINR >= ${CONFIG.SINR_ISSUE_THRESHOLD} dB):     ${(stats.uniqueCells - issueIndices.length).toLocaleString().padStart(6)} cells (${((stats.uniqueCells - issueIndices.length) / stats.uniqueCells * 100).toFixed(1)}%)`);
  console.log(`    Total Problematic:          ${issueIndices.length.toLocaleString().padStart(6)} cells (${(issueIndices.length / stats.uniqueCells * 100).toFixed(1)}%)`);

  console.log('\n  SINR Statistics (Baseline):');
  console.log(`    Average:    ${baselineStats.sinr.avg.toFixed(2)} dB`);
  console.log(`    Std Dev:    ${baselineStats.sinr.stdDev.toFixed(2)} dB`);
  console.log(`    Min/Max:    ${baselineStats.sinr.min.toFixed(1)} / ${baselineStats.sinr.max.toFixed(1)} dB`);

  // P0 Distribution
  const p0Distribution = new Map<number, number>();
  for (let i = 0; i < batchData.count; i++) {
    const p0 = batchData.p0[i];
    p0Distribution.set(p0, (p0Distribution.get(p0) || 0) + 1);
  }

  console.log('\n  P0 Configuration Distribution:');
  const sortedP0 = [...p0Distribution.entries()].sort((a, b) => a[0] - b[0]);
  for (const [p0, count] of sortedP0) {
    console.log(`    ${p0} dBm: ${count.toLocaleString().padStart(6)} cells (${(count / stats.uniqueCells * 100).toFixed(1)}%)`);
  }

  // Alpha Distribution
  const alphaDistribution = new Map<number, number>();
  for (let i = 0; i < batchData.count; i++) {
    const alpha = batchData.alpha[i];
    alphaDistribution.set(alpha, (alphaDistribution.get(alpha) || 0) + 1);
  }

  console.log('\n  Alpha Configuration Distribution:');
  const sortedAlpha = [...alphaDistribution.entries()].sort((a, b) => a[0] - b[0]);
  for (const [alpha, count] of sortedAlpha) {
    console.log(`    ${alpha.toFixed(1)}: ${count.toLocaleString().padStart(6)} cells (${(count / stats.uniqueCells * 100).toFixed(1)}%)`);
  }

  printHistogram('SINR Distribution (2 dB buckets)', batchData.sinr, 2, ' dB');

  profiler.end('Baseline Analysis');

  // ============================================================================
  // PARALLEL OPTIMIZATION
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('  RUNNING PARALLEL OPTIMIZATION');
  console.log('='.repeat(80));

  console.log(`\n  Target cells: ${issueIndices.length.toLocaleString()} problematic cells`);
  console.log(`  Workers: ${CONFIG.NUM_WORKERS}`);

  profiler.start('Optimization');

  const optimizer = new ParallelNetworkOptimizer(
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

  const optTime = profiler.end('Optimization');

  console.log(`\n  Optimization completed in ${(optTime / 1000).toFixed(2)}s`);
  console.log(`  Cells optimized: ${result.optimizedCells.toLocaleString()}`);
  console.log(`  Processing rate: ${result.cellsPerSecond.toLocaleString()} cells/second`);

  // ============================================================================
  // OPTIMIZATION RESULTS
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('  OPTIMIZATION RESULTS');
  console.log('='.repeat(80));

  console.log('\n  SINR Improvement Statistics:');
  console.log(`    Total cells optimized:   ${result.optimizedCells.toLocaleString()}`);
  console.log(`    Total SINR gain:         +${result.stats.sinr.improvement.toFixed(1)} dB (avg per optimized cell)`);

  console.log('\n  P0 Nominal PUSCH Changes:');
  console.log(`    Average change:          ${result.stats.p0.avgChange >= 0 ? '+' : ''}${result.stats.p0.avgChange.toFixed(1)} dBm`);
  console.log(`    Increased:               ${result.stats.p0.increased.toLocaleString()} cells`);
  console.log(`    Decreased:               ${result.stats.p0.decreased.toLocaleString()} cells`);

  console.log('\n  Alpha Parameter Changes:');
  console.log(`    Average change:          ${result.stats.alpha.avgChange >= 0 ? '+' : ''}${result.stats.alpha.avgChange.toFixed(3)}`);
  console.log(`    Increased:               ${result.stats.alpha.increased.toLocaleString()} cells`);
  console.log(`    Decreased:               ${result.stats.alpha.decreased.toLocaleString()} cells`);

  // ============================================================================
  // EXPORT CSV RESULTS
  // ============================================================================

  console.log('\n' + '-'.repeat(80));
  console.log('  EXPORTING PARAMETER CHANGES TO CSV');
  console.log('-'.repeat(80));

  const rowsWritten = exportOptimizationResults(result.results, cellNameMap, CONFIG.OUTPUT_CSV_PATH);
  console.log(`\n  CSV exported: ${CONFIG.OUTPUT_CSV_PATH}`);
  console.log(`  Format: ECI;Cell_Name;Parameter;Value_before;Value;SINR_Improvement`);
  console.log(`  Parameter changes written: ${rowsWritten.toLocaleString()}`);

  // ============================================================================
  // TOP IMPROVEMENTS (WITH REAL CELL NAMES)
  // ============================================================================

  console.log('\n' + '-'.repeat(80));
  console.log('  TOP 20 MOST IMPROVED CELLS');
  console.log('-'.repeat(80));

  const sorted = [...result.results].sort((a, b) => b.sinrImprovement - a.sinrImprovement);
  console.log('    ' + '-'.repeat(100));
  console.log('    Cell Name                          | Original SINR | P0 Change         | Alpha     | SINR Gain');
  console.log('    ' + '-'.repeat(100));

  for (const r of sorted.slice(0, 20)) {
    const cellName = cellNameMap.get(r.cellId) || r.cellId;
    const p0Change = r.optimizedParams.p0 - r.originalParams.p0;
    const alphaChange = r.optimizedParams.alpha - r.originalParams.alpha;
    const namePadded = cellName.substring(0, 35).padEnd(35);
    console.log(`    ${namePadded} | ${r.originalSINR.toFixed(1).padStart(10)} dB | ${r.originalParams.p0} -> ${r.optimizedParams.p0} (${(p0Change >= 0 ? '+' : '') + p0Change}) | ${r.originalParams.alpha.toFixed(1)} -> ${r.optimizedParams.alpha.toFixed(1)} | +${r.sinrImprovement.toFixed(2)} dB`);
  }
  console.log('    ' + '-'.repeat(100));

  // ============================================================================
  // PROBLEM RESOLUTION
  // ============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('  NETWORK IMPACT ASSESSMENT');
  console.log('='.repeat(80));

  let resolvedCritical = 0;
  let resolvedToHealthy = 0;

  for (const r of result.results) {
    if (r.originalSINR < CONFIG.SINR_CRITICAL_THRESHOLD && r.optimizedSINR >= CONFIG.SINR_CRITICAL_THRESHOLD) {
      resolvedCritical++;
    }
    if (r.originalSINR < CONFIG.SINR_ISSUE_THRESHOLD && r.optimizedSINR >= CONFIG.SINR_ISSUE_THRESHOLD) {
      resolvedToHealthy++;
    }
  }

  console.log('\n  Problem Resolution Summary:');
  console.log(`    Critical cells resolved:      ${resolvedCritical.toLocaleString()} of ${criticalIndices.length.toLocaleString()}`);
  console.log(`    Cells moved to healthy:       ${resolvedToHealthy.toLocaleString()} cells`);

  // ============================================================================
  // EXPORT RECOMMENDATIONS
  // ============================================================================

  console.log('\n' + '-'.repeat(80));
  console.log('  PARAMETER CHANGE RECOMMENDATIONS');
  console.log('-'.repeat(80));

  // Group by region
  const regionChanges = new Map<string, { count: number; avgImprovement: number; cells: string[] }>();

  for (const r of result.results) {
    const cellName = cellNameMap.get(r.cellId) || r.cellId;
    const region = cellName.split('_')[0];  // Extract region from cell name

    const existing = regionChanges.get(region) || { count: 0, avgImprovement: 0, cells: [] };
    existing.count++;
    existing.avgImprovement = ((existing.avgImprovement * (existing.count - 1)) + r.sinrImprovement) / existing.count;
    existing.cells.push(cellName);
    regionChanges.set(region, existing);
  }

  console.log('\n  Changes by Region:');
  const sortedRegions = [...regionChanges.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 15);
  for (const [region, data] of sortedRegions) {
    console.log(`    ${region.padEnd(25)}: ${data.count.toString().padStart(4)} cells, avg improvement: +${data.avgImprovement.toFixed(2)} dB`);
  }

  // ============================================================================
  // PERFORMANCE SUMMARY
  // ============================================================================

  const totalTime = profiler.end('Total');

  console.log('\n' + '='.repeat(80));
  console.log('  PERFORMANCE SUMMARY');
  console.log('='.repeat(80));

  console.log(`
  Real Network Scale:
    - Cells: ${stats.uniqueCells.toLocaleString()}
    - Neighbor relations: ${stats.neighborRelations.toLocaleString()}
    - Problematic cells: ${issueIndices.length.toLocaleString()}

  Processing Performance:
    - Total time: ${(totalTime / 1000).toFixed(2)}s
    - Data loading: ${(loadTime / 1000).toFixed(2)}s (${stats.rowsPerSecond.toLocaleString()} rows/s)
    - Optimization: ${(optTime / 1000).toFixed(2)}s (${result.cellsPerSecond.toLocaleString()} cells/s)
    - Workers used: ${CONFIG.NUM_WORKERS}

  Optimization Results:
    - Cells optimized: ${result.optimizedCells.toLocaleString()} (${(result.optimizedCells / issueIndices.length * 100).toFixed(1)}% of problematic)
    - Avg SINR improvement: +${result.stats.sinr.improvement.toFixed(2)} dB
    - Critical resolved: ${resolvedCritical.toLocaleString()}
    - Moved to healthy: ${resolvedToHealthy.toLocaleString()}
`);

  profiler.report();

  console.log('\n' + '='.repeat(80));
  console.log('  ANALYSIS COMPLETE');
  console.log('='.repeat(80) + '\n');
}

// Run the analysis
runRealDataAnalysis().catch(console.error);
