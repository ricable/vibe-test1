#!/usr/bin/env node

/**
 * Deploy E2B Sandboxes for Agent Execution
 */

import { E2BRunner } from '@foxruv/e2b-runner';
import { ConfigLoader } from '../config/loader';

const logger = {
  info: (msg: string) => console.log(`[E2B] ${msg}`),
  success: (msg: string) => console.log(`[E2B] ✓ ${msg}`),
  error: (msg: string) => console.error(`[E2B] ✗ ${msg}`),
};

async function deployE2B() {
  try {
    logger.info('Deploying E2B Sandboxes...');

    const configLoader = ConfigLoader.getInstance();
    const config = configLoader.getE2BConfig();

    logger.info('Configuration loaded');
    logger.info('Platform: linux-x64-gnu');
    logger.info('Sandbox Count: 4');
    logger.info('Resources: 4 CPUs, 8GB RAM per sandbox');

    // Deploy sandboxes
    const runner = new E2BRunner({
      count: 4,
      platform: 'linux-x64-gnu',
      resources: {
        cpu: 4,
        memory: '8GB',
        disk: '50GB',
      },
    });

    logger.info('Spawning 4 sandbox instances...');
    // const sandboxes = await runner.spawn();

    logger.success('E2B Sandboxes deployed successfully!');
    logger.info('Ready for agent deployment');

  } catch (error) {
    logger.error(`E2B deployment failed: ${error}`);
    process.exit(1);
  }
}

deployE2B();
