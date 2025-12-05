// Configuration loader for YAML files

import * as fs from 'fs';
import * as path from 'path';

export class ConfigLoader {
  private static instance: ConfigLoader;
  private configs: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  loadConfig(configName: string): any {
    if (this.configs.has(configName)) {
      return this.configs.get(configName);
    }

    const configPath = path.join(__dirname, `../../config/${configName}.yaml`);
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    // TODO: Parse YAML (use yaml parser)
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Store parsed config
    this.configs.set(configName, configContent);
    return configContent;
  }

  getOrchestrationConfig() {
    return this.loadConfig('orchestration');
  }

  getE2BConfig() {
    return this.loadConfig('e2b-sandboxes');
  }

  getRANConfig() {
    return this.loadConfig('ran-optimization');
  }

  getMemoryConfig() {
    return this.loadConfig('memory-system');
  }

  getLLMConfig() {
    return this.loadConfig('llm-router');
  }

  getMonitoringConfig() {
    return this.loadConfig('monitoring');
  }

  getSwarmConfig() {
    return this.loadConfig('swarm-intelligence');
  }
}
