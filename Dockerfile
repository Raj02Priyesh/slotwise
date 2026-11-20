# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Dependencies (postinstall generates the Prisma client)
FROM base AS deps
COPY package.json package-lock.json prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci

# 2. Production build (standalone output)
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Migration tooling only: the Prisma CLI in an isolated folder
FROM base AS migrate
WORKDIR /migrate
RUN npm init -y >/dev/null \
 && npm install --omit=dev --no-audit --no-fund prisma@7.10.1 dotenv@18 \
 && npm cache clean --force
COPY prisma ./prisma
COPY prisma7.config.ts ./

# 4. Runtime
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=migrate /migrate ./migrate
COPY --chmod=755 docker-entrypoint.sh ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
