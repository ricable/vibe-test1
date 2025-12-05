#!/bin/bash
# Post-start script for DevPod - Ericsson RAN Swarm Optimizer
# Runs each time the container starts

set -e

echo "=========================================="
echo "DevPod Post-Start"
echo "=========================================="

# Verify environment
echo "[1/3] Verifying environment..."
echo "  Platform: ${PLATFORM:-not set}"
echo "  Arch: ${ARCH:-not set}"
echo "  Node: $(node --version)"
echo "  NPM: $(npm --version)"

# Check services
echo "[2/3] Checking services..."
if [ -n "$REDIS_HOST" ]; then
    redis-cli -h $REDIS_HOST ping 2>/dev/null && echo "  Redis: OK" || echo "  Redis: Not available"
fi

# Start background services if needed
echo "[3/3] Environment ready!"

echo "=========================================="
echo "Available commands:"
echo "  npm run dev             - Start development server"
echo "  npm run swarm:start     - Start the swarm"
echo "  npm run ran:optimize    - Run RAN optimization"
echo "  npm run ran:cm          - Run CM management"
echo "  npm run ran:pm          - Run PM management"
echo "  npm run ran:fm          - Run FM management"
echo "  npx claude-flow sparc   - Run SPARC workflow"
echo "=========================================="
