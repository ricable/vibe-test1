# Quick Package Installation Reference

## 🎯 MINIMAL VIABLE SET (All Environments)
**Total: 7 packages**

```bash
npm install \
  agentic-flow@latest \
  dspy.ts@latest \
  agentdb@latest \
  @ruvector/node@latest \
  claude-flow@latest \
  ruv-swarm@latest \
  agentic-robotics@latest
```

**Why these 7?**
- `agentic-flow`: 66 agents + 213 MCP tools
- `dspy.ts`: Self-learning framework
- `agentdb`: Memory with 150x vector search
- `@ruvector/node`: High-performance vector DB
- `claude-flow`: Enterprise orchestration
- `ruv-swarm`: Swarm intelligence (500K+ ops/sec)
- `agentic-robotics`: Ericsson RAN optimization

---

## 🌐 PLATFORM-SPECIFIC COMMANDS

### Linux/Claude Code Web Environment
```bash
# Core (minimal viable)
npm install agentic-flow dspy.ts agentdb @ruvector/node

# Web-optimized additions
npm install \
  @foxruv/iris@latest \
  @ruvector/ruvllm@latest \
  @ruvector/attention@latest \
  goalie@latest \
  agent-booster@latest

# Total: 10 packages
```

### E2B Sandboxes (CRITICAL)
```bash
# E2B Orchestration (REQUIRED)
npm install @foxruv/e2b-runner@latest @neural-trader/e2b-strategies@latest

# RAN Automation
npm install \
  agentic-robotics@latest \
  @agentic-robotics/core@latest \
  @agentic-robotics/mcp@latest \
  @agentic-robotics/self-learning@latest

# Swarm Execution
npm install \
  agentic-flow@latest \
  dspy.ts@latest \
  research-swarm@latest \
  strange-loops@latest \
  strange-loops-mcp@latest

# Memory & Vector DB (Linux x64)
npm install \
  agentdb@latest \
  ruvector-core-linux-x64-gnu@latest \
  @ruvector/node-linux-x64-gnu@latest \
  @ruvector/sona@latest

# Inference & Optimization
npm install \
  @ruvector/ruvllm@latest \
  @ruvector/tiny-dancer@latest \
  @ruvector/router@latest

# Total: 16 packages (E2B-optimized)
```

### Apple Silicon Mac (DevPod/Docker)
```bash
# ARM64 Native Bindings (CRITICAL)
npm install \
  @ruvector/node-darwin-arm64@latest \
  @ruvector/attention-darwin-arm64@latest \
  @ruvector/sona-darwin-arm64@latest \
  @ruvector/ruvllm-darwin-arm64@latest

# Development & Optimization
npm install \
  agentic-flow@latest \
  dspy.ts@latest \
  @foxruv/iris@latest \
  @foxruv/iris-core@latest

# GPU Acceleration (via Docker)
npm install cuda-wasm@latest

# Total: 9 packages (Mac ARM64-optimized)
```

---

## 📦 COMPLETE INSTALLATION BUNDLE (All Features)

### One-Command Installation (All Platforms)
```bash
# Core Infrastructure
npm install agentic-flow@latest dspy.ts@latest agentdb@latest claude-flow@latest

# Vector Database
npm install @ruvector/node@latest ruvector@latest

# Ericsson RAN
npm install agentic-robotics@latest @agentic-robotics/core@latest @agentic-robotics/mcp@latest

# E2B Sandboxes
npm install @foxruv/e2b-runner@latest @neural-trader/e2b-strategies@latest

# Swarm Intelligence
npm install ruv-swarm@latest research-swarm@latest strange-loops@latest strange-loops-mcp@latest

# LLM Optimization
npm install @foxruv/iris@latest @ruvector/ruvllm@latest @ruvector/sona@latest

# Routing & Attention
npm install @ruvector/router@latest @ruvector/tiny-dancer@latest @ruvector/attention@latest

# Advanced Neural Networks
npm install @ruvector/gnn@latest @ruvector/graph-node@latest

# Tools & Utilities
npm install goalie@latest agent-booster@latest ruvi@latest @foxruv/iris-agentic-synth@latest

# GPU Acceleration
npm install cuda-wasm@latest

# Security & Quantum
npm install qudag@latest aidefence@latest

# Total: 33 packages (Production Bundle)
```

---

## 🔧 ENVIRONMENT-SPECIFIC BUNDLES

### Bundle A: Web Development (10 packages)
```bash
#!/bin/bash
# For: Claude Code Web Environment
npm install \
  agentic-flow@latest \
  dspy.ts@latest \
  agentdb@latest \
  @ruvector/node@latest \
  @foxruv/iris@latest \
  @ruvector/ruvllm@latest \
  goalie@latest \
  agent-booster@latest \
  ruvi@latest \
  claude-flow@latest
```

### Bundle B: E2B Execution (16 packages)
```bash
#!/bin/bash
# For: E2B Linux Sandboxes
npm install \
  @foxruv/e2b-runner@latest \
  @neural-trader/e2b-strategies@latest \
  agentic-flow@latest \
  dspy.ts@latest \
  agentic-robotics@latest \
  @agentic-robotics/core@latest \
  @agentic-robotics/mcp@latest \
  @agentic-robotics/self-learning@latest \
  agentdb@latest \
  ruvector-core-linux-x64-gnu@latest \
  @ruvector/node-linux-x64-gnu@latest \
  @ruvector/sona@latest \
  @ruvector/ruvllm@latest \
  research-swarm@latest \
  strange-loops@latest \
  @ruvector/tiny-dancer@latest
```

### Bundle C: Mac Development (9 packages)
```bash
#!/bin/bash
# For: Apple Silicon (ARM64) Mac
npm install \
  @ruvector/node-darwin-arm64@latest \
  @ruvector/attention-darwin-arm64@latest \
  @ruvector/sona-darwin-arm64@latest \
  @ruvector/ruvllm-darwin-arm64@latest \
  agentic-flow@latest \
  dspy.ts@latest \
  @foxruv/iris@latest \
  @foxruv/iris-core@latest \
  cuda-wasm@latest
```

---

## 📊 PACKAGE BREAKDOWN BY FUNCTION

### Agent Orchestration (5 packages)
```bash
npm install \
  agentic-flow@latest \
  dspy.ts@latest \
  claude-flow@latest \
  agentic-robotics@latest \
  agentic-jujutsu@latest
```

### Memory & Vector Database (6 packages)
```bash
npm install \
  agentdb@latest \
  @ruvector/node@latest \
  @ruvector/graph-node@latest \
  ruvector@latest \
  @ruvector/sona@latest \
  @ruvector/agentic-synth@latest
```

### Neural Networks & Inference (7 packages)
```bash
npm install \
  @ruvector/ruvllm@latest \
  @ruvector/attention@latest \
  @ruvector/gnn@latest \
  temporal-neural-solver@latest \
  spiking-neural@latest \
  psycho-symbolic-reasoner@latest \
  consciousness-explorer@latest
```

### Swarm Intelligence (4 packages)
```bash
npm install \
  ruv-swarm@latest \
  research-swarm@latest \
  strange-loops@latest \
  strange-loops-mcp@latest
```

### E2B Execution (3 packages)
```bash
npm install \
  @foxruv/e2b-runner@latest \
  @neural-trader/e2b-strategies@latest \
  @agentic-robotics/core@latest
```

### LLM Optimization (3 packages)
```bash
npm install \
  @foxruv/iris@latest \
  @foxruv/iris-core@latest \
  @foxruv/iris-agentic-synth@latest
```

### Routing & Discovery (3 packages)
```bash
npm install \
  @ruvector/router@latest \
  @ruvector/tiny-dancer@latest \
  goalie@latest
```

### Tools & Utilities (4 packages)
```bash
npm install \
  agent-booster@latest \
  ruvi@latest \
  @foxruv/agent-learning-core@latest \
  lean-agentic@latest
```

---

## 🚀 INSTALLATION VERIFICATION

```bash
#!/bin/bash
# Verify critical packages installed
npm list | grep -E "agentic-flow|dspy\.ts|agentdb|@ruvector/node|agentic-robotics"

# Check versions
npm ls --depth=0 | head -20
```

---

## 📋 PLATFORM COMPATIBILITY MATRIX

| Package | Linux | E2B | Mac ARM64 | Mac Intel |
|---------|-------|-----|-----------|-----------|
| agentic-flow | ✅ | ✅ | ✅ | ✅ |
| dspy.ts | ✅ | ✅ | ✅ | ✅ |
| @ruvector/node-linux-x64-gnu | ✅ | ✅ | ❌ | ❌ |
| @ruvector/node-darwin-arm64 | ❌ | ❌ | ✅ | ❌ |
| agentic-robotics | ✅ | ✅ | ✅ | ✅ |
| @foxruv/e2b-runner | ✅ | ✅ | ⚠️ | ⚠️ |
| cuda-wasm | ✅ | ✅ | ✅ | ✅ |

**Legend**: ✅ Full support | ⚠️ Requires Docker | ❌ Not supported

---

## 🎯 PACKAGE PRIORITY GRID

### Must-Have (Tier 1)
1. agentic-flow - Core orchestration
2. dspy.ts - Self-learning framework
3. @ruvector/node - Vector database
4. agentdb - Memory system
5. agentic-robotics - RAN optimization

### Recommended (Tier 2)
6. @foxruv/e2b-runner - Sandbox execution
7. @ruvector/ruvllm - Multi-model LLM
8. @ruvector/sona - Adaptive learning
9. ruv-swarm - Swarm intelligence
10. @foxruv/iris - LLM optimization

### Nice-to-Have (Tier 3)
11. strange-loops - Nano-agent coordination
12. @ruvector/attention - Attention mechanisms
13. @ruvector/graph-node - Knowledge graphs
14. goalie - GOAP planning
15. cuda-wasm - GPU acceleration

---

## 🔐 SECURITY PACKAGES

```bash
npm install \
  aidefence@latest \
  qudag@latest \
  psycho-symbolic-reasoner@latest \
  agentic-jujutsu@latest
```

---

## 📦 VERSION LOCK FILE (package.json)

```json
{
  "dependencies": {
    "agentic-flow": "^1.10.2",
    "dspy.ts": "^2.1.1",
    "agentdb": "^1.6.1",
    "@ruvector/node": "^0.1.18",
    "@ruvector/node-darwin-arm64": "^0.1.18",
    "@ruvector/node-linux-x64-gnu": "^0.1.18",
    "agentic-robotics": "^0.2.4",
    "@agentic-robotics/core": "^0.2.1",
    "@foxruv/e2b-runner": "^2.0.1",
    "@ruvector/ruvllm": "^0.2.2",
    "@ruvector/sona": "^0.1.4",
    "ruv-swarm": "^1.0.20",
    "@foxruv/iris": "^1.8.19",
    "strange-loops": "^1.0.3",
    "claude-flow": "^2.7.41",
    "@ruvector/router": "^0.1.15",
    "@ruvector/attention": "^0.1.3",
    "cuda-wasm": "^1.1.1"
  },
  "devDependencies": {
    "agent-booster": "^0.2.2",
    "ruvi": "^1.1.0",
    "goalie": "^1.3.1"
  }
}
```

---

## 💡 INSTALLATION TIPS

### For E2B Sandboxes (Dockerfile)
```dockerfile
FROM node:20-alpine

# Install native build tools
RUN apk add --no-cache python3 make g++ rust

# Copy package files
COPY package*.json ./

# Install all packages
RUN npm ci --production

# Platform-specific bindings
RUN npm install ruvector-core-linux-x64-gnu@latest

CMD ["node", "app.js"]
```

### For Mac DevPod
```bash
# Inside DevPod container
docker exec devpod npm install @ruvector/node-darwin-arm64@latest
```

### For CI/CD Pipeline
```yaml
# GitHub Actions example
- name: Install Platform-Specific Packages
  run: |
    if [[ "$RUNNER_OS" == "Linux" ]]; then
      npm install ruvector-core-linux-x64-gnu@latest
    elif [[ "$RUNNER_OS" == "macOS" ]]; then
      npm install @ruvector/node-darwin-arm64@latest
    fi
```

---

## 🎯 NEXT STEPS

1. **Choose your bundle** (Web, E2B, or Mac)
2. **Copy installation command**
3. **Run in your environment**
4. **Verify with** `npm list --depth=0`
5. **Check docs**: `/docs/NPM_PACKAGES_STRATEGY.md`
