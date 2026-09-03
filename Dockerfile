# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Dependencies ----
FROM base AS deps
# libc6-compat es requerido por Next.js en Alpine (https://github.com/nodejs/docker/issues/550)
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Builder ----
FROM base AS builder
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* se hornea en el JS del cliente en BUILD time, no se lee en
# runtime — sin pasar esto como --build-arg, la imagen queda con el
# NEXT_PUBLIC_API_URL de .env local (localhost:3001) horneado adentro, y el
# login falla con "Failed to fetch" (el navegador le pega a la URL
# equivocada, no hay error de red real). Ver docker-compose para los valores.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_VERSION
ARG NEXT_PUBLIC_OWN_URL
ARG NEXT_PUBLIC_EVIDENCIAS_DRIVE_FOLDER_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_VERSION=$NEXT_PUBLIC_API_VERSION
ENV NEXT_PUBLIC_OWN_URL=$NEXT_PUBLIC_OWN_URL
ENV NEXT_PUBLIC_EVIDENCIAS_DRIVE_FOLDER_ID=$NEXT_PUBLIC_EVIDENCIAS_DRIVE_FOLDER_ID
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runner (produccion) ----
FROM base AS runner
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone: solo lo necesario (no todo node_modules)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Standalone server.js respeta PORT y HOSTNAME
CMD ["node", "server.js"]
