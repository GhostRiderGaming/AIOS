# ═══════════════════════════════════════════════════════════
#  AIOS — Production Dockerfile
#  Multi-stage build: Node.js backend + Vite frontend
# ═══════════════════════════════════════════════════════════

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY shared/ ./shared/
COPY packages/frontend/ ./packages/frontend/
RUN npm install -w packages/frontend --production=false
RUN npm run build -w packages/frontend

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/agents/package*.json ./packages/agents/
COPY packages/ai-engine/package*.json ./packages/ai-engine/
COPY shared/ ./shared/

# Install production dependencies
RUN npm install --production --ignore-scripts

# Copy backend source
COPY packages/backend/ ./packages/backend/
COPY packages/agents/ ./packages/agents/
COPY packages/ai-engine/ ./packages/ai-engine/

# Copy built frontend
COPY --from=frontend-build /app/packages/frontend/dist ./packages/frontend/dist

# Create data directory
RUN mkdir -p data/uploads

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV DEMO_MODE=false

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/system/health || exit 1

EXPOSE 3001

CMD ["node", "packages/backend/server.js"]
