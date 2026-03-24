# ============================================
# NOBLE-CERT FRONTEND — Multi-stage Dockerfile
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

# Build-time env vars (override at build or in .env)
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_BANK_ID=MB
ARG NEXT_PUBLIC_ACCOUNT_NO=0000000000000
ARG NEXT_PUBLIC_ACCOUNT_NAME=TEN_CHU_TAI_KHOAN

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_BANK_ID=$NEXT_PUBLIC_BANK_ID
ENV NEXT_PUBLIC_ACCOUNT_NO=$NEXT_PUBLIC_ACCOUNT_NO
ENV NEXT_PUBLIC_ACCOUNT_NAME=$NEXT_PUBLIC_ACCOUNT_NAME

# Enable Next.js standalone output for Docker
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Stage 3: Production image ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
