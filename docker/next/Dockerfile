FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

ARG NEXT_PUBLIC_API_URL="/api"
ARG NEXT_PUBLIC_DOMAIN="mmc.ilinqsoft.com"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DOMAIN=$NEXT_PUBLIC_DOMAIN
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Production runner ---
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
