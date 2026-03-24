# ============================================
# NOBLE-CERT BACKEND — Multi-stage Dockerfile
# ============================================

# ---------- Stage 1: Install dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev && npx prisma generate

# ---------- Stage 2: Build TypeScript ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.json ./
COPY prisma ./prisma/

# Install all deps (including devDependencies for tsc)
RUN npm install
RUN npx prisma generate

COPY src ./src
RUN npx tsc

# ---------- Stage 3: Production image ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 5000

CMD ["node", "dist/server.js"]
