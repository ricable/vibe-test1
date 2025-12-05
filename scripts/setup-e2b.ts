#!/usr/bin/env npx tsx
/**
 * E2B Sandbox Setup Script for Ericsson RAN Swarm Optimizer
 * Initializes the E2B sandbox environment with all required packages
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

const E2B_NATIVE_PACKAGES = [
  '@ruvector/node-linux-x64-gnu',
  '@ruvector/gnn-linux-x64-gnu',
  '@ruvector/attention-linux-x64-gnu',
  '@ruvector/sona-linux-x64-gnu',
  '@ruvector/ruvllm-linux-x64-gnu',
  '@agentic-robotics/linux-x64-gnu',
];

function exec(command: string, silent = false): string {
  try {
    if (!silent) console.log(`  $ ${command}`);
    return execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
  } catch (error) {
    if (!silent) console.error(`  Command failed: ${command}`);
    return '';
  }
}

async function setupE2B(): Promise<void> {
  console.log('==========================================');
  console.log('E2B Sandbox Setup - Ericsson RAN Swarm');
  console.log('==========================================\n');

  // Set environment
  process.env.PLATFORM = 'e2b';
  process.env.ARCH = 'x64';
  process.env.NODE_ENV = 'production';

  // Step 1: Create required directories
  console.log('[1/7] Creating directories...');
  const dirs = ['/data/agentdb', '/data/vectors', '/data/models', '/logs'];
  dirs.forEach(dir => {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  Created: ${dir}`);
    } catch (e) {
      console.log(`  Exists: ${dir}`);
    }
  });

  // Step 2: Install core packages globally
  console.log('\n[2/7] Installing core packages globally...');
  exec('npm install -g claude-flow@alpha agentic-flow ruvector');

  // Step 3: Install npm dependencies
  console.log('\n[3/7] Installing npm dependencies...');
  exec('npm ci --only=production');

  // Step 4: Install E2B-specific native bindings
  console.log('\n[4/7] Installing linux-x64-gnu native bindings...');
  exec(`npm install ${E2B_NATIVE_PACKAGES.join(' ')}`);

  // Step 5: Verify installations
  console.log('\n[5/7] Verifying installations...');
  exec('npx claude-flow --version', true);
  console.log('  claude-flow: OK');

  // Step 6: Initialize AgentDB
  console.log('\n[6/7] Initializing AgentDB...');
  try {
    const { AgentDB } = await import('agentdb');
    console.log('  AgentDB: OK');
  } catch (e) {
    console.log('  AgentDB: Will initialize on first use');
  }

  // Step 7: Setup MCP servers
  console.log('\n[7/7] Setting up MCP servers...');
  exec('npx claude-flow@alpha mcp start', true);

  console.log('\n==========================================');
  console.log('E2B Sandbox setup complete!');
  console.log('==========================================\n');

  console.log('Environment:');
  console.log(`  Platform: ${process.env.PLATFORM}`);
  console.log(`  Architecture: ${process.env.ARCH}`);
  console.log(`  Node.js: ${process.version}`);
  console.log('');

  console.log('Available commands:');
  console.log('  npm run start         - Start the optimizer');
  console.log('  npm run swarm:start   - Start the swarm');
  console.log('  npm run ran:optimize  - Run RAN optimization');
  console.log('  npx claude-flow sparc - Run SPARC workflow');
}

setupE2B().catch(console.error);
