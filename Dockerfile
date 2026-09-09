# Stage 1: Builder - compile TypeScript and native modules
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3 (native module)
RUN apk add --no-cache python3 make g++ 

# Copy package files first (for better layer caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev deps for building)
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Runtime - minimal production image
FROM node:22-alpine

WORKDIR /app

# Install runtime dependencies AND build tools for better-sqlite3
RUN apk add --no-cache sqlite python3 make g++

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment
ENV NODE_ENV=production

# Run the MCP server
CMD ["node", "dist/index.js"]
