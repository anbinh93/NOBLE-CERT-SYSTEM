# ============================================
# NOBLE-CERT ADMIN FRONTEND — Multi-stage Dockerfile
# ============================================

# ---------- Stage 1: Install dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Stage 2: Build Next.js ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3001
ARG NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Stage 3: Production image ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
