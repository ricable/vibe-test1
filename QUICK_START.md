# Quick Start - 15 Minutes to Full System

## 🚀 5-Minute Core Setup

```bash
# 1. Install (3 min)
npm install

# 2. Setup (1 min)
npm run setup

# 3. Configure (1 min)
cp .env.example .env
# Edit .env with your API keys
```

## ⚙️ 10-Minute Full Deployment

```bash
# Terminal 1: Initialize & Monitor
npm run orchestration:init
npm run e2b:deploy
npm run memory:init
npm run swarm:start

# Terminal 2: Start RAN Optimization
npm run ran:optimize

# Terminal 3: Monitor
npm run swarm:monitor

# Terminal 4: Docker stack
docker-compose up -d
```

## 🎯 Commands Reference

### Startup
```bash
npm run setup              # Initial setup
npm run orchestration:init # Initialize orchestration
npm run e2b:deploy        # Deploy sandboxes
npm run memory:init       # Initialize memory
npm run swarm:start       # Start swarm
npm run ran:optimize      # Start RAN optimization
```

### Monitoring
```bash
npm run orchestration:status  # Orchestration status
npm run e2b:monitor          # E2B sandbox monitor
npm run swarm:monitor        # Swarm real-time monitor
npm run ran:monitor          # RAN optimization monitor
npm run swarm:status         # Agent status
```

### Development
```bash
npm run dev      # Watch mode
npm test         # Run tests
npm run build    # Build
npm run lint     # Linting
```

### Management
```bash
npm run memory:backup        # Backup memory
npm run memory:restore       # Restore from backup
npm run memory:export        # Export patterns
npm run swarm:stop           # Stop swarm
npm run reset               # Reset everything
```

## 📊 Expected Metrics

After 15 minutes:
- ✓ 66 agents running
- ✓ 4 E2B sandboxes active
- ✓ 150x vector search
- ✓ 500K+ ops/sec throughput
- ✓ <100ms agent latency

## 🔗 Access Points

- API: http://localhost:3000
- Grafana: http://localhost:3003
- Prometheus: http://localhost:9090
- Logs: `./logs/*.log`

## ✅ Verification

```bash
# Check status
npm run setup:verify
npm run swarm:status
npm run orchestration:status

# View logs
tail -f logs/swarm.log
```

## 🆘 Common Issues

**Port in use?**
```bash
lsof -i :3000
kill -9 <PID>
```

**Installation issues?**
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

**Low memory?**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run swarm:start
```

---

**Time to Production**: 15 minutes ✨
**Setup Status**: Ready to deploy 🚀
