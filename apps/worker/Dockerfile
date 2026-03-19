FROM node:22-alpine AS base
WORKDIR /app

FROM base AS builder
COPY . .
RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @design-editor/worker build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/worker/dist ./dist
CMD ["node", "dist/worker.js"]
