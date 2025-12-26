# Production Dockerfile for Ericsson RAN Swarm Optimizer
# Multi-architecture support (linux/amd64, linux/arm64)

FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY src ./src
COPY config ./config
COPY scripts ./scripts

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PLATFORM=docker
ENV LOG_LEVEL=info

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config

# Copy environment example
COPY .env.example ./.env.example

# Create data directories
RUN mkdir -p /app/data/agentdb /app/data/vectors /app/logs

# Create non-root user
RUN useradd -m -s /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expose ports
EXPOSE 3000 3001 3002 9090 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Default command
CMD ["node", "dist/index.js"]
