# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate
WORKDIR /app

# ---- Development ----
# Build tools needed for native modules (bcrypt) during pnpm install
# No COPY — everything comes from volume mounts
# ---- Development ----
# No COPY — everything comes from volume mounts
# Dependencies installed by docker-compose install service
FROM base AS dev
# Chromium + psql for running Playwright E2E tests inside the container
RUN apk add --no-cache chromium postgresql-client
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
EXPOSE 3001
CMD ["sh", "-c", "cd apps/web && npx next dev --turbopack --port 3001"]

# ---- Dependencies (production) ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/api/package.json packages/api/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- Builder (production) ----
FROM deps AS builder
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
COPY apps/web ./apps/web
COPY packages ./packages
COPY turbo.json tsconfig.json ./
RUN cd apps/web && npx next build

# ---- Runner (production) ----
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
