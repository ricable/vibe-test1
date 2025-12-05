#!/usr/bin/env npx tsx
/**
 * Verification Script for Ericsson RAN Swarm Optimizer
 * Validates that all required packages and configurations are properly set up
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, fn: () => { status: 'pass' | 'fail' | 'warn'; message: string }): void {
  try {
    const result = fn();
    results.push({ name, ...result });
  } catch (error) {
    results.push({
      name,
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function exec(command: string): string {
  return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
}

async function verify(): Promise<void> {
  console.log('==========================================');
  console.log('Environment Verification');
  console.log('==========================================\n');

  // Platform detection
  const platform = os.platform();
  const arch = os.arch();
  console.log(`Platform: ${platform} (${arch})`);
  console.log(`Node.js: ${process.version}\n`);

  // Check 1: Node.js version
  check('Node.js version', () => {
    const version = parseInt(process.version.slice(1));
    if (version >= 20) return { status: 'pass', message: `v${version} (recommended)` };
    if (version >= 18) return { status: 'warn', message: `v${version} (minimum supported)` };
    return { status: 'fail', message: `v${version} (requires >= 18)` };
  });

  // Check 2: package.json exists
  check('package.json', () => {
    if (fs.existsSync('package.json')) {
      return { status: 'pass', message: 'Found' };
    }
    return { status: 'fail', message: 'Not found' };
  });

  // Check 3: Environment file
  check('.env file', () => {
    if (fs.existsSync('.env')) {
      return { status: 'pass', message: 'Found' };
    }
    if (fs.existsSync('.env.example')) {
      return { status: 'warn', message: 'Missing (.env.example available)' };
    }
    return { status: 'fail', message: 'Not found' };
  });

  // Check 4: Core packages
  check('claude-flow', () => {
    try {
      exec('npx claude-flow --version');
      return { status: 'pass', message: 'Installed' };
    } catch {
      return { status: 'fail', message: 'Not installed' };
    }
  });

  // Check 5: Data directories
  check('Data directories', () => {
    const dirs = ['data/agentdb', 'data/vectors', 'logs'];
    const missing = dirs.filter(d => !fs.existsSync(d));
    if (missing.length === 0) {
      return { status: 'pass', message: 'All directories exist' };
    }
    return { status: 'warn', message: `Missing: ${missing.join(', ')}` };
  });

  // Check 6: API keys
  check('ANTHROPIC_API_KEY', () => {
    if (process.env.ANTHROPIC_API_KEY) {
      return { status: 'pass', message: 'Set' };
    }
    return { status: 'warn', message: 'Not set' };
  });

  check('E2B_API_KEY', () => {
    if (process.env.E2B_API_KEY) {
      return { status: 'pass', message: 'Set' };
    }
    return { status: 'warn', message: 'Not set (required for E2B sandboxes)' };
  });

  // Check 7: RuVector
  check('ruvector', () => {
    try {
      require.resolve('ruvector');
      return { status: 'pass', message: 'Installed' };
    } catch {
      return { status: 'fail', message: 'Not installed' };
    }
  });

  // Check 8: AgentDB
  check('agentdb', () => {
    try {
      require.resolve('agentdb');
      return { status: 'pass', message: 'Installed' };
    } catch {
      return { status: 'fail', message: 'Not installed' };
    }
  });

  // Check 9: Agentic Flow
  check('agentic-flow', () => {
    try {
      require.resolve('agentic-flow');
      return { status: 'pass', message: 'Installed' };
    } catch {
      return { status: 'fail', message: 'Not installed' };
    }
  });

  // Check 10: Native bindings
  check('Native bindings', () => {
    const platformBindings: Record<string, string> = {
      'darwin-arm64': '@ruvector/node-darwin-arm64',
      'darwin-x64': '@ruvector/node-darwin-x64',
      'linux-x64': '@ruvector/node-linux-x64-gnu',
      'linux-arm64': '@ruvector/node-linux-arm64-gnu',
    };

    const key = `${platform}-${arch}`;
    const binding = platformBindings[key];

    if (!binding) {
      return { status: 'warn', message: `No bindings for ${key}` };
    }

    try {
      require.resolve(binding);
      return { status: 'pass', message: `${binding} installed` };
    } catch {
      return { status: 'warn', message: `${binding} not installed (will use WASM)` };
    }
  });

  // Print results
  console.log('Results:');
  console.log('------------------------------------------');

  let passed = 0, warned = 0, failed = 0;

  results.forEach(r => {
    const icon = r.status === 'pass' ? '[OK]' : r.status === 'warn' ? '[!!]' : '[XX]';
    console.log(`${icon} ${r.name}: ${r.message}`);
    if (r.status === 'pass') passed++;
    else if (r.status === 'warn') warned++;
    else failed++;
  });

  console.log('------------------------------------------');
  console.log(`Total: ${passed} passed, ${warned} warnings, ${failed} failed\n`);

  if (failed > 0) {
    console.log('Run "npm run setup" to fix issues.');
    process.exit(1);
  } else if (warned > 0) {
    console.log('Environment ready with some warnings.');
  } else {
    console.log('Environment fully configured!');
  }
}

verify().catch(console.error);
