# Stage 1: Builder - compile TypeScript and native modules
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache sqlite python3 make g++

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run HTTP server for deployment (not stdio MCP)
CMD ["node", "dist/http-server.js"]
