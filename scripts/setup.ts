#!/usr/bin/env npx tsx
/**
 * Universal Setup Script for Ericsson RAN Swarm Optimizer
 * Supports: Claude Code Web, E2B Sandboxes, Mac Silicon DevPod
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface PlatformConfig {
  name: string;
  arch: string;
  nativePackages: string[];
  setupCommands: string[];
}

const CORE_PACKAGES = [
  'claude-flow@alpha',
  'agentic-flow',
  'ruvector',
];

const ERICSSON_RAN_PACKAGES = [
  // AI Providers
  '@anthropic-ai/sdk',
  '@google/generative-ai',
  'openai',

  // Swarm Intelligence
  'ruv-swarm',
  'agentdb',
  'dspy.ts',
  'research-swarm',
  'strange-loops',

  // Neural Networks & GNN
  '@ruvector/gnn',
  '@ruvector/attention',
  '@ruvector/ruvllm',
  '@ruvector/sona',
  '@ruvector/graph-node',
  '@ruvector/router',
  '@ruvector/tiny-dancer',
  'spiking-neural',
  'temporal-neural-solver',

  // Robotics & Automation
  'agentic-robotics',
  '@agentic-robotics/core',
  '@agentic-robotics/mcp',
  '@agentic-robotics/self-learning',

  // Optimization
  '@neural-trader/example-quantum-optimization',
  '@neural-trader/example-neuromorphic-computing',
  '@neural-trader/example-evolutionary-game-theory',
  '@neural-trader/example-energy-grid-optimization',

  // AI Learning
  '@foxruv/iris',
  '@foxruv/iris-core',
  '@foxruv/iris-agentic-synth',
  '@foxruv/agent-learning-core',

  // Security & Utilities
  'aidefence',
  'psycho-symbolic-integration',
  'goalie',
  'qudag',
  'agentic-jujutsu',
  'agent-booster',
];

function detectPlatform(): PlatformConfig {
  const arch = os.arch();
  const platform = os.platform();
  const env = process.env.PLATFORM || 'auto';

  // E2B Sandbox
  if (env === 'e2b' || process.env.E2B_SANDBOX) {
    return {
      name: 'e2b',
      arch: 'x64',
      nativePackages: [
        '@ruvector/node-linux-x64-gnu',
        '@ruvector/gnn-linux-x64-gnu',
        '@ruvector/attention-linux-x64-gnu',
        '@ruvector/sona-linux-x64-gnu',
        '@ruvector/ruvllm-linux-x64-gnu',
        '@agentic-robotics/linux-x64-gnu',
      ],
      setupCommands: [
        'mkdir -p /data/agentdb /data/vectors /logs',
      ],
    };
  }

  // Mac Silicon DevPod
  if (env === 'devpod-silicon' || (platform === 'darwin' && arch === 'arm64')) {
    return {
      name: 'devpod-silicon',
      arch: 'arm64',
      nativePackages: [
        '@ruvector/node-darwin-arm64',
        '@ruvector/gnn-darwin-arm64',
        '@ruvector/attention-darwin-arm64',
        '@ruvector/sona-darwin-arm64',
        '@ruvector/ruvllm-darwin-arm64',
      ],
      setupCommands: [
        'mkdir -p data/agentdb data/vectors logs',
      ],
    };
  }

  // Mac Intel
  if (platform === 'darwin' && arch === 'x64') {
    return {
      name: 'darwin-x64',
      arch: 'x64',
      nativePackages: [
        '@ruvector/node-darwin-x64',
        '@ruvector/gnn-darwin-x64',
        '@ruvector/attention-darwin-x64',
        '@ruvector/sona-darwin-x64',
        '@ruvector/ruvllm-darwin-x64',
      ],
      setupCommands: [
        'mkdir -p data/agentdb data/vectors logs',
      ],
    };
  }

  // Linux x64 (Claude Code Web default)
  return {
    name: 'claude-web',
    arch: 'x64',
    nativePackages: [
      '@ruvector/node-linux-x64-gnu',
      '@ruvector/gnn-linux-x64-gnu',
      '@ruvector/attention-linux-x64-gnu',
      '@ruvector/sona-linux-x64-gnu',
      '@ruvector/ruvllm-linux-x64-gnu',
      '@agentic-robotics/linux-x64-gnu',
    ],
    setupCommands: [
      'mkdir -p data/agentdb data/vectors logs',
    ],
  };
}

function exec(command: string, silent = false): string {
  try {
    if (!silent) console.log(`  $ ${command}`);
    return execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
  } catch (error) {
    if (!silent) console.error(`  Failed: ${command}`);
    return '';
  }
}

function setupEnvironment(): void {
  console.log('========================================');
  console.log('Ericsson RAN Swarm Optimizer Setup');
  console.log('========================================\n');

  const platform = detectPlatform();
  console.log(`Platform detected: ${platform.name} (${platform.arch})\n`);

  // Step 1: Create directories
  console.log('[1/6] Creating directories...');
  platform.setupCommands.forEach(cmd => exec(cmd, true));

  // Step 2: Setup environment file
  console.log('[2/6] Setting up environment...');
  if (!fs.existsSync('.env')) {
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      console.log('  Created .env from .env.example');
    }
  }

  // Step 3: Install core packages globally
  console.log('[3/6] Installing core packages...');
  exec(`npm install -g ${CORE_PACKAGES.join(' ')}`, true);

  // Step 4: Install npm dependencies
  console.log('[4/6] Installing npm dependencies...');
  exec('npm install');

  // Step 5: Install platform-specific native bindings
  console.log('[5/6] Installing native bindings...');
  if (platform.nativePackages.length > 0) {
    exec(`npm install ${platform.nativePackages.join(' ')}`, true);
  }

  // Step 6: Setup MCP servers
  console.log('[6/6] Setting up MCP servers...');
  exec('npx claude-flow@alpha mcp start', true);

  console.log('\n========================================');
  console.log('Setup complete!');
  console.log('========================================\n');

  console.log('Environment variables to set:');
  console.log('  ANTHROPIC_API_KEY     - Claude API key');
  console.log('  OPENROUTER_API_KEY    - OpenRouter API key');
  console.log('  GEMINI_API_KEY        - Google Gemini API key');
  console.log('  E2B_API_KEY           - E2B sandbox API key\n');

  console.log('Available commands:');
  console.log('  npm run dev           - Start development server');
  console.log('  npm run swarm:start   - Start the swarm');
  console.log('  npm run ran:optimize  - Run RAN optimization');
  console.log('  npm run ran:cm        - Configuration Management');
  console.log('  npm run ran:pm        - Performance Management');
  console.log('  npm run ran:fm        - Fault Management');
  console.log('  npx claude-flow sparc - Run SPARC workflow\n');
}

// Run setup
setupEnvironment();
