#!/bin/bash
# E2B Sandbox Setup Script for Ericsson RAN Swarm Optimizer
# This script initializes the E2B sandbox environment

set -e

echo "=========================================="
echo "E2B Sandbox Setup - Ericsson RAN Swarm"
echo "=========================================="

# Platform detection
export PLATFORM="e2b"
export ARCH="x64"
export NODE_ENV="production"

# Create required directories
echo "[1/6] Creating directories..."
mkdir -p /data/agentdb /data/vectors /data/models /logs

# Install core packages (always required)
echo "[2/6] Installing core packages..."
npm install -g claude-flow@alpha agentic-flow ruvector

# Verify installations
echo "[3/6] Verifying core packages..."
npx claude-flow --version || echo "claude-flow installation pending"

# Initialize AgentDB
echo "[4/6] Initializing AgentDB..."
if [ -f "./scripts/init-agentdb.ts" ]; then
    npx tsx ./scripts/init-agentdb.ts
fi

# Initialize vector store
echo "[5/6] Initializing RuVector store..."
if [ -f "./scripts/init-ruvector.ts" ]; then
    npx tsx ./scripts/init-ruvector.ts
fi

# Setup MCP servers
echo "[6/6] Setting up MCP servers..."
npx claude-flow mcp start 2>/dev/null || true

echo "=========================================="
echo "E2B Sandbox setup complete!"
echo "=========================================="
echo ""
echo "Available commands:"
echo "  npm run start           - Start the optimizer"
echo "  npm run swarm:start     - Start the swarm"
echo "  npm run ran:optimize    - Run RAN optimization"
echo "  npx claude-flow sparc   - Run SPARC workflow"
