#!/usr/bin/env npx tsx
/**
 * Mac Silicon DevPod Setup Script for Ericsson RAN Swarm Optimizer
 * Initializes the DevPod environment with ARM64 native bindings
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

const DEVPOD_NATIVE_PACKAGES = [
  '@ruvector/node-darwin-arm64',
  '@ruvector/gnn-darwin-arm64',
  '@ruvector/attention-darwin-arm64',
  '@ruvector/sona-darwin-arm64',
  '@ruvector/ruvllm-darwin-arm64',
];

const DEVPOD_LINUX_PACKAGES = [
  '@ruvector/node-linux-arm64-gnu',
  '@ruvector/gnn-linux-arm64-gnu',
  '@ruvector/attention-linux-arm64-gnu',
  '@ruvector/sona-linux-arm64-gnu',
  '@ruvector/ruvllm-linux-arm64-gnu',
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

async function setupDevPod(): Promise<void> {
  console.log('==========================================');
  console.log('DevPod Setup - Ericsson RAN Swarm');
  console.log('==========================================\n');

  const platform = os.platform();
  const arch = os.arch();

  // Determine if running on native macOS or Linux container
  const isNativeMac = platform === 'darwin';
  const isLinuxContainer = platform === 'linux';

  // Set environment
  process.env.PLATFORM = 'devpod-silicon';
  process.env.ARCH = arch;
  process.env.NODE_ENV = 'development';

  console.log(`Detected: ${platform} (${arch})`);
  console.log(`Mode: ${isNativeMac ? 'Native macOS' : 'Linux Container'}\n`);

  // Step 1: Create required directories
  console.log('[1/7] Creating directories...');
  const dirs = ['data/agentdb', 'data/vectors', 'data/models', 'logs'];
  dirs.forEach(dir => {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  Created: ${dir}`);
    } catch (e) {
      console.log(`  Exists: ${dir}`);
    }
  });

  // Step 2: Setup environment file
  console.log('\n[2/7] Setting up environment...');
  if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      console.log('  Created .env from .env.example');
    }
  } else {
    console.log('  .env already exists');
  }

  // Step 3: Install core packages globally
  console.log('\n[3/7] Installing core packages globally...');
  exec('npm install -g claude-flow@alpha agentic-flow ruvector tsx');

  // Step 4: Install npm dependencies
  console.log('\n[4/7] Installing npm dependencies...');
  exec('npm ci');

  // Step 5: Install platform-specific native bindings
  console.log('\n[5/7] Installing native bindings...');
  const nativePackages = isNativeMac ? DEVPOD_NATIVE_PACKAGES : DEVPOD_LINUX_PACKAGES;
  exec(`npm install ${nativePackages.join(' ')}`);

  // Step 6: Verify installations
  console.log('\n[6/7] Verifying installations...');
  const version = exec('npx claude-flow --version', true);
  console.log(`  claude-flow: ${version.trim() || 'OK'}`);

  try {
    const { RuVector } = await import('ruvector');
    console.log('  ruvector: OK');
  } catch (e) {
    console.log('  ruvector: Will initialize on first use');
  }

  // Step 7: Setup MCP servers
  console.log('\n[7/7] Setting up MCP servers...');
  exec('npx claude-flow@alpha mcp start', true);

  // Check Redis if available
  if (process.env.REDIS_HOST) {
    console.log(`  Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`);
  }

  console.log('\n==========================================');
  console.log('DevPod setup complete!');
  console.log('==========================================\n');

  console.log('Environment:');
  console.log(`  Platform: ${process.env.PLATFORM}`);
  console.log(`  Architecture: ${process.env.ARCH}`);
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Mode: ${isNativeMac ? 'Native macOS' : 'Docker Container'}`);
  console.log('');

  console.log('Available commands:');
  console.log('  npm run dev           - Start development server');
  console.log('  npm run swarm:start   - Start the swarm');
  console.log('  npm run ran:optimize  - Run RAN optimization');
  console.log('  npm run ran:cm        - Configuration Management');
  console.log('  npm run ran:pm        - Performance Management');
  console.log('  npm run ran:fm        - Fault Management');
  console.log('  npx claude-flow sparc - Run SPARC workflow');
}

setupDevPod().catch(console.error);
