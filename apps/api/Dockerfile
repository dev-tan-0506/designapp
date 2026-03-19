FROM node:22-alpine AS base
WORKDIR /app

FROM base AS builder
COPY . .
RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @design-editor/api build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
CMD ["node", "dist/main.js"]
