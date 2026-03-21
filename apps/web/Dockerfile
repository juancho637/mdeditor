# ---- Base ----
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/api/package.json packages/api/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- Development ----
# Only copy configs and packages — source files come from volume mounts
FROM deps AS dev
COPY packages ./packages
COPY turbo.json tsconfig.json ./
COPY apps/web/tsconfig.json apps/web/next.config.js apps/web/postcss.config.mjs apps/web/
WORKDIR /app/apps/web
EXPOSE 3001
CMD ["npx", "next", "dev", "--turbopack", "--port", "3001"]

# ---- Builder (production) ----
FROM deps AS builder
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
