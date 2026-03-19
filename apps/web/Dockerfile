FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json .npmrc tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/common-types/package.json packages/common-types/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN corepack enable

FROM base AS builder
COPY . .
RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @design-editor/web build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
CMD ["node", "apps/web/server.js"]
