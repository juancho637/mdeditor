# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/jest-config/package.json packages/jest-config/
COPY packages/api/package.json packages/api/
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN cd node_modules/.pnpm/bcrypt@*/node_modules/bcrypt && node-gyp rebuild 2>/dev/null || true

# ---- Development ----
# Only copy configs and packages — source files come from volume mounts
FROM deps AS dev
COPY packages ./packages
COPY turbo.json tsconfig.json ./
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["npx", "nest", "start", "--watch"]

# ---- Builder (production) ----
FROM deps AS builder
COPY apps/api ./apps/api
COPY packages ./packages
COPY turbo.json tsconfig.json ./
RUN cd apps/api && npx nest build

# ---- Runner (production) ----
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
