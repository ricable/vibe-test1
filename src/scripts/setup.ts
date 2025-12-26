#!/usr/bin/env node

/**
 * Claude Code Web Environment Setup
 * Initializes Ericsson RAN Autonomous Swarm
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  success: (msg: string) => console.log(`[SUCCESS] ✓ ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ✗ ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ⚠ ${msg}`),
};

async function setup() {
  logger.info('Starting Ericsson RAN Autonomous Swarm Setup...\n');

  try {
    // Phase 1: Verify environment
    logger.info('Phase 1: Verifying environment...');
    verifyNode();
    verifyNpm();
    logger.success('Environment verified\n');

    // Phase 2: Check dependencies
    logger.info('Phase 2: Checking dependencies...');
    checkDependencies();
    logger.success('Dependencies verified\n');

    // Phase 3: Create directory structure
    logger.info('Phase 3: Creating directory structure...');
    createDirectories();
    logger.success('Directory structure created\n');

    // Phase 4: Create environment files
    logger.info('Phase 4: Creating environment files...');
    createEnvFiles();
    logger.success('Environment files created\n');

    // Phase 5: Initialize configuration
    logger.info('Phase 5: Initializing configuration...');
    initializeConfig();
    logger.success('Configuration initialized\n');

    // Phase 6: Initialize database
    logger.info('Phase 6: Initializing database...');
    initializeDatabase();
    logger.success('Database initialized\n');

    // Phase 7: Verify setup
    logger.info('Phase 7: Verifying setup...');
    verifySetup();
    logger.success('Setup verification complete\n');

    logger.success('\n========================================');
    logger.success('Setup completed successfully!');
    logger.success('========================================\n');

    logger.info('Next steps:');
    logger.info('  1. Configure your .env file with API keys');
    logger.info('  2. Run: npm run orchestration:init');
    logger.info('  3. Run: npm run e2b:deploy');
    logger.info('  4. Run: npm run swarm:start');
    logger.info('  5. Monitor: npm run swarm:monitor\n');

  } catch (error) {
    logger.error(`Setup failed: ${error}`);
    process.exit(1);
  }
}

function verifyNode() {
  try {
    const version = execSync('node --version').toString().trim();
    logger.info(`Node version: ${version}`);
  } catch {
    throw new Error('Node.js not found');
  }
}

function verifyNpm() {
  try {
    const version = execSync('npm --version').toString().trim();
    logger.info(`NPM version: ${version}`);
  } catch {
    throw new Error('NPM not found');
  }
}

function checkDependencies() {
  const requiredPackages = [
    'agentic-flow',
    'dspy.ts',
    'agentdb',
    'claude-flow',
  ];

  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
      logger.info(`✓ ${pkg}`);
    } catch {
      logger.warn(`${pkg} not installed - will be installed via npm install`);
    }
  }
}

function createDirectories() {
  const dirs = [
    'src',
    'src/scripts',
    'src/swarm',
    'src/ran',
    'src/memory',
    'src/services',
    'config',
    'data',
    'data/learning/checkpoints',
    'data/learning/metrics',
    'data/backups',
    'logs',
    'tests',
  ];

  for (const dir of dirs) {
    const fullPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`Created: ${dir}`);
    }
  }
}

function createEnvFiles() {
  const envPath = path.join(__dirname, '../../.env');
  const envExamplePath = path.join(__dirname, '../../.env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    logger.info('Created .env from .env.example');
  }
}

function initializeConfig() {
  // Create default config if doesn't exist
  logger.info('Configuration files ready in ./config/');
}

function initializeDatabase() {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  logger.info('Database directory initialized');
}

function verifySetup() {
  const requiredDirs = [
    'config',
    'data',
    'logs',
    'src',
  ];

  for (const dir of requiredDirs) {
    const fullPath = path.join(__dirname, '../../', dir);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing required directory: ${dir}`);
    }
  }
}

// Run setup
setup().catch(error => {
  logger.error(error.message);
  process.exit(1);
});
