#!/bin/bash
# Post-create script for DevPod - Ericsson RAN Swarm Optimizer
# Runs once when the container is created

set -e

echo "=========================================="
echo "DevPod Post-Create Setup"
echo "=========================================="

# Install dependencies
echo "[1/5] Installing npm dependencies..."
npm ci

# Setup environment file
echo "[2/5] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

# Initialize data directories
echo "[3/5] Initializing data directories..."
mkdir -p data/agentdb data/vectors data/models logs

# Install claude-flow globally
echo "[4/5] Setting up claude-flow..."
npm install -g claude-flow@alpha agentic-flow 2>/dev/null || true

# Setup MCP servers
echo "[5/5] Configuring MCP servers..."
if command -v claude &> /dev/null; then
    claude mcp add claude-flow npx claude-flow@alpha mcp start 2>/dev/null || true
fi

echo "=========================================="
echo "Post-create setup complete!"
echo "=========================================="
