# Stage 1: Builder - compile TypeScript and native modules
FROM node:22-alpine AS builder

WORKDIR /app

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

# Copy compiled code AND public frontend
COPY --from=builder /app/dist ./dist
COPY public ./public

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/http-server.js"]
