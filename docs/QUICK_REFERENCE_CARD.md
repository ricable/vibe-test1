# Quick Reference Card - NPM Packages

## 🎯 At a Glance

| Aspect | Summary |
|--------|---------|
| **Total Packages** | 157 analyzed → 33 recommended |
| **Tier 1 (Essential)** | 7 packages |
| **Tier 2 (Production)** | 13 additional |
| **Tier 3 (Advanced)** | 6+ optional |
| **Install Time** | 5 min (Tier 1) → 1 hour (Complete) |
| **Memory Required** | 1-2GB (minimal) → 4-8GB (full) |

---

## 📦 Tier 1: The 7 Essentials

```bash
npm install \
  agentic-flow@1.10.2 \
  dspy.ts@2.1.1 \
  agentdb@1.6.1 \
  @ruvector/node@0.1.18 \
  claude-flow@2.7.41 \
  ruv-swarm@1.0.20 \
  agentic-robotics@0.2.4
```

| Package | Why | Key Metric |
|---------|-----|-----------|
| agentic-flow | 66 agents + 213 MCP tools | Orchestration |
| dspy.ts | Self-learning DSPy | Learning |
| agentdb | Memory with vector search | 150x faster |
| @ruvector/node | High-perf vector DB | 50K+ inserts/sec |
| claude-flow | Enterprise orchestration | ReasoningBank |
| ruv-swarm | Swarm intelligence | 500K+ ops/sec |
| agentic-robotics | RAN automation | Ericsson-specific |

---

## 🌐 Platform Bundles

### Web (Linux/Claude Code) - 10 packages
```bash
npm install \
  agentic-flow@latest dspy.ts@latest agentdb@latest \
  @ruvector/node@latest @foxruv/iris@latest \
  @ruvector/ruvllm@latest goalie@latest \
  agent-booster@latest ruvi@latest claude-flow@latest
```

### E2B Sandboxes (Linux) - 16 packages
```bash
npm install \
  @foxruv/e2b-runner@latest @neural-trader/e2b-strategies@latest \
  agentic-flow@latest dspy.ts@latest \
  agentic-robotics@latest @agentic-robotics/core@latest \
  @agentic-robotics/mcp@latest @agentic-robotics/self-learning@latest \
  agentdb@latest ruvector-core-linux-x64-gnu@latest \
  @ruvector/node-linux-x64-gnu@latest @ruvector/sona@latest \
  @ruvector/ruvllm@latest research-swarm@latest \
  strange-loops@latest @ruvector/tiny-dancer@latest
```

### Mac ARM64 (Apple Silicon) - 9 packages
```bash
npm install \
  @ruvector/node-darwin-arm64@latest \
  @ruvector/attention-darwin-arm64@latest \
  @ruvector/sona-darwin-arm64@latest \
  @ruvector/ruvllm-darwin-arm64@latest \
  agentic-flow@latest dspy.ts@latest \
  @foxruv/iris@latest @foxruv/iris-core@latest \
  cuda-wasm@latest
```

---

## ⚡ Performance Metrics

```
Vector Search:     baseline → 150x faster (agentdb)
Nano-Agents:       N/A → 500K+ ops/sec (strange-loops)
Inference:         100µs → <1µs (temporal-neural-solver)
Learning:          standard → <1ms (sona)
Agent Scaling:     N/A → 66+ simultaneous (agentic-flow)
```

---

## 🔧 Installation One-Liners

### Development (Local Mac)
```bash
npm install agentic-flow dspy.ts agentdb @ruvector/node-darwin-arm64 claude-flow
```

### Web Testing (Linux)
```bash
npm install agentic-flow dspy.ts agentdb @ruvector/node claude-flow @foxruv/iris
```

### Production E2B (Full)
```bash
# See Bundle B above
```

---

## 📊 Package Selection Matrix

| Feature | Tier 1 | Tier 2 | Tier 3 |
|---------|--------|--------|--------|
| Agent orchestration | ✅ | ✅ | ✅ |
| Self-learning | ✅ | ✅ | ✅ |
| Vector search | ✅ | ✅ | ✅ |
| E2B execution | - | ✅ | ✅ |
| Multi-model LLM | - | ✅ | ✅ |
| Nano-agent swarms | - | - | ✅ |
| Quantum security | - | - | ✅ |

---

## 🎯 Quick Decision Tree

```
Do you need E2B execution?
├─ NO → Web Bundle (10 packages)
└─ YES → E2B Bundle (16 packages)

Developing on Mac?
├─ YES → Use darwin-arm64 bindings
└─ NO → Use linux-x64-gnu bindings

Need multi-model LLM?
├─ YES → Add @ruvector/ruvllm + iris
└─ NO → Skip Tier 2 LLM packages

Need advanced features?
├─ YES → Add Tier 3 packages
└─ NO → Stop at Tier 2
```

---

## 🚀 5-Minute Setup

```bash
# 1. Install essentials
npm install agentic-flow dspy.ts agentdb @ruvector/node claude-flow

# 2. Verify
npm list --depth=0 | grep -E "agentic-flow|dspy|agentdb|@ruvector"

# 3. Initialize
npx claude-flow sparc tdd "Test swarm"

# Done! ✅
```

---

## 📍 Platform-Specific Bindings

### For Linux (E2B, Claude Code)
- `ruvector-core-linux-x64-gnu`
- `@ruvector/node-linux-x64-gnu`
- `@ruvector/sona-darwin-arm64` (if ARM)

### For Mac Intel
- `@ruvector/node-darwin-x64`
- `@ruvector/sona-darwin-x64`

### For Mac Apple Silicon
- `@ruvector/node-darwin-arm64` ✅
- `@ruvector/sona-darwin-arm64` ✅

---

## 🔐 Security Packages

```bash
# Add if needed:
npm install aidefence@2.1.1      # Adversarial defense
npm install qudag@1.2.1          # Quantum-resistant crypto
npm install agentic-jujutsu@2.3.6 # VCS security
```

---

## 🎯 What Each Tier Does

### Tier 1: Basic Swarm
- 66 agents coordinate
- Self-learning enabled
- Vector search available
- RAN automation ready

### Tier 2: Production Ready
- E2B sandboxes (isolated execution)
- Multi-model LLM routing
- Advanced optimization
- Performance tuning

### Tier 3: Advanced Features
- Nano-agent nano-swarms (500K+ ops/sec)
- Temporal consciousness
- Quantum security
- Adversarial defense

---

## 📝 Common Commands

### Verify Installation
```bash
npm list --depth=0 | head -20
```

### Check Specific Packages
```bash
npm list agentic-flow dspy.ts agentdb
```

### Update All
```bash
npm update
```

### Check for Vulnerabilities
```bash
npm audit
```

---

## ⏱️ Timeline

| Phase | Time | Packages | Status |
|-------|------|----------|--------|
| Phase 1 | 5 min | 7 (Tier 1) | MVP |
| Phase 2 | 30 min | +9 (Tier 2) | Production |
| Phase 3 | 30 min | +6 (Tier 3) | Advanced |
| **Total** | **65 min** | **22** | **Complete** |

---

## 🔗 Full Documentation

| Topic | File | Time |
|-------|------|------|
| Overview | PACKAGE_SELECTION_SUMMARY.md | 5 min |
| Details | NPM_PACKAGES_STRATEGY.md | 15 min |
| Install | PACKAGE_INSTALL_REFERENCE.md | 10 min |
| Architecture | ERICSSON_RAN_ARCHITECTURE.md | 20 min |

---

## ✅ Success Criteria

After installation, you should have:

- [ ] agentic-flow (66 agents)
- [ ] dspy.ts (self-learning)
- [ ] agentdb (150x faster search)
- [ ] @ruvector/node (vector DB)
- [ ] agentic-robotics (RAN ready)
- [ ] E2B sandboxes (if using)
- [ ] Multi-model LLM (if advanced)

**Result**: Autonomous RAN optimization swarm ready to deploy 🚀

---

## 💡 Pro Tips

1. **Start with Tier 1** - Get basics working first
2. **Test in E2B** - Use sandboxes for isolation
3. **Enable learning** - Let agents improve over time
4. **Monitor performance** - Track KPI improvements
5. **Scale gradually** - Add agents as needed

---

## 🎯 Next Steps

1. Choose your bundle (Web/E2B/Mac)
2. Copy the installation command
3. Run: `npm install <packages>`
4. Verify: `npm list --depth=0`
5. Initialize: `npx claude-flow sparc tdd "test"`

---

**Status**: Production Ready
**Last Updated**: 2025-12-05
**Confidence**: High ✅
