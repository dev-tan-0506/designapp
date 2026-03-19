# Story 1.1: Monorepo Foundation & Development Environment `[INFRA]`

Status: in-progress

> **Note:** This is a prerequisite infrastructure story — no user-visible feature is delivered. It MUST be completed before any other stories can begin. All subsequent dev agents will assume this structure exists exactly as specified.

## Story

As a developer,
I want the Turborepo monorepo scaffolded with all apps and shared packages configured,
so that the entire team can run the full stack locally with a single command and CI/CD is operational from day one.

## Acceptance Criteria

1. Running `pnpm dev` at monorepo root starts `apps/web` (Next.js 15), `apps/api` (NestJS 11), and `apps/worker` (BullMQ) in parallel via Turborepo without errors.
2. Running `docker-compose up` brings up PostgreSQL 16, Redis 7, and LocalStack S3 — all accessible to all apps.
3. A GitHub Actions CI pipeline executes in order: `lint` → `test` → `build` → `docker-build` with Turborepo remote cache enabled.
4. `packages/common-types/env.ts` Zod schema validates all required env vars at startup — apps fail fast if any are missing.
5. `packages/canvas-engine` is a pure TypeScript package with zero React/Zustand/Next.js dependencies — independently runnable with `vitest`.
6. All workspace packages are consumable via `"@design-editor/{package}": "workspace:*"` protocol.
7. ESLint + Prettier + TypeScript strict mode are enforced across all apps and packages.

## Tasks / Subtasks

- [ ] **Task 1: Initialize Turborepo monorepo** (AC: #1, #6)
  - [ ] Run: `pnpm dlx create-turbo@latest` in the project directory, select `pnpm` as package manager (Turborepo v2.8.18 — latest stable)
  - [ ] **DO NOT** use the default app names from create-turbo — clear the `apps/` directory after scaffold and create the correct apps below
  - [ ] Create `pnpm-workspace.yaml` with workspaces: `["apps/*", "packages/*"]`
  - [ ] Configure `turbo.json` with tasks: `build`, `dev`, `lint`, `test` with correct dependency ordering (`"dependsOn": ["^build"]` for build)

- [ ] **Task 2: Create `apps/web` — Next.js 15** (AC: #1)
  - [ ] `pnpm create next-app@latest apps/web --typescript --app --eslint --tailwind --no-src-dir --import-alias "@/*"`
  - [ ] Enable Turbopack in `next.config.ts`: `experimental: { turbopack: true }` (Next.js 15 default dev bundler)
  - [ ] Set `output: 'standalone'` in `next.config.ts` for Docker compatibility
  - [ ] Create route group structure:
    ```
    apps/web/app/
    ├── (marketing)/      ← SSG: landing, /templates/*, /explore
    ├── editor/[id]/      ← CSR only ('use client'), Canvas 2D
    ├── (auth)/           ← login, register
    └── (dashboard)/      ← protected user dashboard
    ```
  - [ ] Add `apps/web/.env.local.example` with all required env vars

- [ ] **Task 3: Create `apps/api` — NestJS 11** (AC: #1)
  - [ ] `pnpm dlx @nestjs/cli@latest new apps/api --package-manager pnpm --skip-install`
  - [ ] Remove default `apps/api/package.json` devDependencies already provided by root — use root workspace hoisting
  - [ ] Create NestJS feature module skeleton directories (no implementation — just module files):
    ```
    apps/api/src/
    ├── auth/
    ├── designs/
    ├── import/
    ├── export/
    └── admin/
    ```
  - [ ] Each feature directory needs: `{feature}.module.ts`, `{feature}.controller.ts`, `{feature}.service.ts`
  - [ ] Configure `apps/api/src/main.ts`: global prefix `/api/v1`, Helmet, CORS whitelist, ValidationPipe (whitelist: true, forbidNonWhitelisted: true)
  - [ ] Add `apps/api/.env.example` with all required env vars

- [ ] **Task 4: Create `apps/worker` — BullMQ consumer** (AC: #1)
  - [ ] Create bare Node.js TypeScript app (no NestJS — just `worker.ts` consumer entry point)
  - [ ] Install: `bullmq`, `ioredis`, `@design-editor/common-types` (workspace), `@design-editor/design-schema` (workspace)
  - [ ] Worker consumes queues: `import-jobs`, `export-jobs`
  - [ ] `apps/worker/tsconfig.json` extends root tsconfig

- [ ] **Task 5: Create shared packages** (AC: #5, #6)

  - [ ] **`packages/canvas-engine`**
    - Init as bare TypeScript package with `vitest` as test runner
    - `package.json` name: `"@design-editor/canvas-engine"`
    - Exports (stub / empty implementations only at this stage):
      - `CanvasRenderer` class
      - `ElementFactory` class
      - `HitTester` class
      - `HistoryManager` class (with 100-step LRU cap already wired — see Story 1.2)
    - **CRITICAL:** Zero dependencies on React, Zustand, Next.js, or any browser framework — `peerDependencies` must be empty
    - `tsconfig.json`: `"lib": ["ES2022", "DOM"]` — DOM needed for Canvas 2D types only
    - Add stub Vitest test to confirm test runner works

  - [ ] **`packages/design-schema`**
    - Init Prisma 6: `pnpm dlx prisma@6 init --datasource-provider postgresql`
    - Schema at: `packages/design-schema/prisma/schema.prisma`
    - Prisma client generated into `packages/design-schema/generated/`
    - `package.json` exports: `{ ".": "./generated/index.js" }`
    - **DO NOT create any models yet** — models are added per-story as needed
    - Add `postinstall` script: `"prisma generate"` so it auto-generates on `pnpm install`

  - [ ] **`packages/common-types`**
    - Create `packages/common-types/src/env.ts` — Zod schema for ALL environment variables:
      ```typescript
      // Required in ALL apps:
      DATABASE_URL, REDIS_URL, S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY,
      JWT_SECRET, JWT_REFRESH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
      NEXTAUTH_URL (web only), API_URL (web only), SENDGRID_API_KEY (api + worker only)
      ```
    - Each app calls `validateEnv()` at startup — throws with description of missing vars
    - Export shared TypeScript interfaces: `AsyncStatus` enum (`queued | processing | completed | failed`)
    - Export response wrapper types: `ApiResponse<T>`, `ApiError`

  - [ ] **`packages/ui`**
    - Tailwind CSS 4 shared component package
    - Stub only — `Button`, `Input` components as no-ops for now
    - `package.json` name: `"@design-editor/ui"`

- [ ] **Task 6: Configure root-level tooling** (AC: #7)
  - [ ] Root `package.json` with `"private": true` and workspace-level `devDependencies`:
    - TypeScript 5.x (`strict: true` in `tsconfig.base.json`)
    - ESLint 9 with `@typescript-eslint/eslint-plugin`
    - Prettier with single config at root
    - Vitest (for packages), Jest (for NestJS api)
  - [ ] `tsconfig.base.json` at root — all `tsconfig.json` files `"extends": "../../tsconfig.base.json"`
  - [ ] Root `.eslintrc.js` — extends `@typescript-eslint/recommended`, no-unused-vars as error
  - [ ] Root `.prettierrc` with: `{ "singleQuote": true, "trailingComma": "all", "tabWidth": 2, "semi": true }`

- [ ] **Task 7: Docker Compose for local dev** (AC: #2)
  - [ ] `docker-compose.yml` at monorepo root with services:
    ```yaml
    postgres:
      image: postgres:16-alpine
      environment: { POSTGRES_DB: design_editor, POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres }
      ports: ["5432:5432"]
    redis:
      image: redis:7-alpine
      ports: ["6379:6379"]
    localstack:
      image: localstack/localstack:latest
      environment: { SERVICES: s3, DEFAULT_REGION: us-east-1 }
      ports: ["4566:4566"]
    ```
  - [ ] Add `scripts/init-localstack.sh` to create the S3 bucket on localstack startup

- [ ] **Task 8: GitHub Actions CI pipeline** (AC: #3)
  - [ ] `.github/workflows/ci.yml` with jobs in sequence: `lint` → `test` → `build` → `docker-build`
  - [ ] Enable Turborepo remote cache via `TURBO_TOKEN` and `TURBO_TEAM` secrets
  - [ ] `docker-build` job only runs on `main` branch merge (trigger: `push: branches: [main]`)
  - [ ] Each app has Dockerfile stub (multi-stage, Node.js 22 Alpine base)

- [ ] **Task 9: Verify complete setup** (AC: #1–7)
  - [ ] `pnpm install` completes without errors
  - [ ] `docker-compose up -d` → all 3 services healthy
  - [ ] `pnpm dev` → all 3 apps start in watch mode
  - [ ] `pnpm lint` → passes with no warnings in any package
  - [ ] `pnpm test` → all stub tests pass (canvas-engine Vitest, api Jest health check)
  - [ ] `pnpm build` → all apps build successfully

## Dev Notes

### Critical Architecture Constraints

1. **Turborepo task ordering matters** — `turbo.json` must declare `"build"` depends on `"^build"` so packages build before apps. Wrong ordering causes import resolution failures.

2. **`packages/design-schema` is the ONLY source of Prisma client** — `apps/api` and `apps/worker` MUST import from `@design-editor/design-schema`, never install `prisma` or `@prisma/client` directly in those apps. Breaking this causes type drift between services.

3. **`packages/canvas-engine` must have zero framework deps** — At any point, run `pnpm ls --filter @design-editor/canvas-engine` and verify React/Zustand/Next.js do NOT appear in the dependency tree. If they do, this is a critical architecture violation.

4. **pnpm workspace hoisting** — Add to root `.npmrc`:
   ```
   shamefully-hoist=false
   strict-peer-dependencies=false
   ```
   Do NOT use `shamefully-hoist=true` — it defeats the purpose of workspace isolation.

5. **Next.js 15 + Turbopack** — Use `"next": "15.x"` with `experimental.turbopack: true`. Do NOT use webpack config — Turbopack config goes under `experimental.turbo` in `next.config.ts`.

6. **NestJS version pinning** — Use `@nestjs/core@^11.0.0`, `@nestjs/common@^11.0.0`. NestJS 11 requires Node.js 22 — confirm Node version matches `"engines": { "node": ">=22" }` in root `package.json`.

### File & Naming Conventions (ALL subsequent stories must follow these)

| Pattern | Convention | Example |
|---|---|---|
| TypeScript files | kebab-case | `design.service.ts`, `canvas-renderer.ts` |
| Classes/Types | PascalCase | `DesignService`, `CanvasElement` |
| Interfaces | PascalCase, NO `I` prefix | `DesignElement` not `IDesignElement` |
| Functions/vars | camelCase | `getUserDesigns`, `elementBounds` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE_MB` |
| Zustand stores | `use{Name}Store` | `useDocumentStore` |
| NestJS DTOs | `{Action}{Resource}Dto` | `CreateDesignDto` |
| DB Models (Prisma) | PascalCase singular | `Design`, `ImportJob` |
| API endpoints | plural noun, kebab-case | `/api/v1/import-jobs` |

### Environment Variables (full list)

Create `.env.example` (committed) and `.env.local` (gitignored) at root AND in each app:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/design_editor"

# Redis
REDIS_URL="redis://localhost:6379"

# S3 / LocalStack
S3_ENDPOINT="http://localhost:4566"
S3_BUCKET="design-editor-dev"
S3_REGION="us-east-1"
S3_ACCESS_KEY="test"
S3_SECRET_KEY="test"

# JWT (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET="<64-char-hex>"
JWT_REFRESH_SECRET="<64-char-hex>"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="30d"

# Google OAuth
GOOGLE_CLIENT_ID="<from console.cloud.google.com>"
GOOGLE_CLIENT_SECRET="<from console.cloud.google.com>"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/v1/auth/google/callback"

# Email (SendGrid)
SENDGRID_API_KEY="<placeholder for dev — use MailHog or similar>"

# App URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
API_URL="http://localhost:3001"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<random string>"
```

### Testing Standards

- **packages/canvas-engine**: Vitest with mock canvas via `vitest-canvas-mock` or custom `OffscreenCanvas` mock
- **apps/api**: Jest with `@nestjs/testing` `Test.createTestingModule()` — unit tests per service
- **apps/web**: Vitest for utilities; Playwright for E2E (stored in `apps/web/e2e/`)
- **Test co-location**: `*.spec.ts` files sit next to their source file
- **CI coverage gate**: No enforced threshold yet — added in Story 1.2

### Project Structure Notes

Complete monorepo directory tree after this story:

```
design-editor/                   ← monorepo root
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   ├── web/                     ← Next.js 15
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   ├── editor/[id]/
│   │   │   ├── (auth)/
│   │   │   └── (dashboard)/
│   │   ├── next.config.ts
│   │   ├── tsconfig.json        ← extends ../../tsconfig.base.json
│   │   └── package.json
│   ├── api/                     ← NestJS 11
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── designs/
│   │   │   ├── import/
│   │   │   ├── export/
│   │   │   ├── admin/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── nest-cli.json
│   │   └── package.json
│   └── worker/                  ← BullMQ consumer
│       ├── src/
│       │   └── worker.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── canvas-engine/           ← Pure TS, zero framework deps
│   │   ├── src/
│   │   │   ├── canvas-renderer.ts
│   │   │   ├── element-factory.ts
│   │   │   ├── hit-tester.ts
│   │   │   ├── history-manager.ts
│   │   │   └── events.ts        ← Typed CustomEvent helpers (T4-typed-event-bus)
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts       ← Vitest config
│   │   └── package.json
│   ├── design-schema/           ← Prisma 6 schema + generated client
│   │   ├── prisma/
│   │   │   └── schema.prisma    ← Empty models — added per story
│   │   ├── generated/           ← gitignored, generated by prisma generate
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── common-types/            ← Shared TS types + Zod env schema
│   │   ├── src/
│   │   │   ├── env.ts           ← Zod schema, validateEnv()
│   │   │   ├── api-types.ts     ← ApiResponse<T>, ApiError, AsyncStatus enum
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── ui/                      ← Shared Tailwind UI components (stubs)
│       ├── src/
│       ├── tsconfig.json
│       └── package.json
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── .npmrc
├── tsconfig.base.json
├── .eslintrc.js
├── .prettierrc
├── .env.example
└── package.json                 ← private: true, workspace devDependencies
```

### `turbo.json` Configuration

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["^build"],
      "cache": false
    }
  }
}
```

### Key Technical Versions (locked — do NOT upgrade without explicit approval)

| Package | Version | Notes |
|---|---|---|
| Turborepo | 2.8.18 | Latest stable as of 2026-03 |
| Next.js | 15.x | App Router + Turbopack |
| NestJS | 11.x | Requires Node 22 |
| Node.js | 22 LTS | Runtime for all apps |
| pnpm | 9.x | Package manager |
| TypeScript | 5.x | strict mode |
| Prisma | 6.x | Schema-first ORM |
| Tailwind CSS | 4.x | UI package |
| Vitest | 2.x | Unit tests for packages |
| Jest | 29.x | Unit tests for NestJS |
| Playwright | 1.x | E2E tests |
| PostgreSQL | 16 | Primary DB |
| Redis | 7 | BullMQ + future cache |

### References

- Architecture: Monorepo structure [Source: architecture.md#Selected-Starter-Turborepo-Monorepo-Manual-Setup]
- Architecture: Tech stack versions [Source: architecture.md#Architectural-Decisions-Provided-by-Starter]
- Architecture: CI/CD pipeline [Source: architecture.md#CICD-GitHub-Actions]
- Architecture: Naming conventions [Source: architecture.md#Naming-Patterns]
- Architecture: Canvas engine isolation [Source: architecture.md#Canvas-Engine-Package]
- Epics: Story 1.1 ACs [Source: epics.md#Story-1.1]
- Web: Turborepo docs [https://turborepo.com/docs]
- Web: Turborepo v2.8.18 [https://www.npmjs.com/package/turbo]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-03-19 17:24 ICT: `node --version` failed because `node` is not installed or not available on `PATH`.
- 2026-03-19 17:24 ICT: `pnpm --version` failed because `pnpm` is not installed or not available on `PATH`.
- 2026-03-19 17:33 ICT: `docker run --rm node:22-alpine node --version` failed because the Docker daemon is not running (`//./pipe/docker_engine` unavailable).
- 2026-03-19 17:34 ICT: Static validation succeeded for all JSON manifests via `ConvertFrom-Json`.
- 2026-03-19 17:34 ICT: `docker compose config` succeeded, confirming `docker-compose.yml` parses correctly.

### Completion Notes List

- Scaffolded a Turborepo-style monorepo root with `pnpm-workspace.yaml`, `turbo.json`, shared TypeScript config, ESLint, Prettier, `.npmrc`, `.gitignore`, root environment example, Docker Compose, and GitHub Actions CI sequencing.
- Added `apps/web` as a Next.js 15 skeleton with route groups, standalone output, Turbopack configuration, startup environment validation, and a multi-stage Dockerfile stub.
- Added `apps/api` as a NestJS 11 skeleton with feature module placeholders, `/api/v1` global prefix, Helmet, CORS, `ValidationPipe`, startup environment validation, and a Jest health-check spec.
- Added `apps/worker` as a BullMQ consumer skeleton for `import-jobs` and `export-jobs`, wired to shared environment validation and Redis connection setup.
- Added shared workspace packages: `@design-editor/common-types`, `@design-editor/canvas-engine`, `@design-editor/design-schema`, and `@design-editor/ui`.
- Implemented `packages/common-types/src/env.ts` with fail-fast Zod validation, shared API types, and the required `AsyncStatus` enum.
- Implemented `packages/canvas-engine` stub exports and a `HistoryManager` with the required 100-entry cap plus a Vitest smoke test.
- Added Prisma schema scaffolding and generated-client placeholders in `packages/design-schema` so downstream workspace imports have a stable package target before actual `prisma generate`.
- Full runtime validation is currently blocked by missing host Node/pnpm tooling and a stopped Docker daemon, so tasks remain unchecked and the story remains `in-progress`.

### File List

- .env.example
- .eslintrc.js
- .github/workflows/ci.yml
- .gitignore
- .npmrc
- .prettierrc
- _bmad-output/implementation-artifacts/1-1-monorepo-foundation-and-development-environment.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/api/.env.example
- apps/api/Dockerfile
- apps/api/jest.config.ts
- apps/api/nest-cli.json
- apps/api/package.json
- apps/api/src/admin/admin.controller.ts
- apps/api/src/admin/admin.module.ts
- apps/api/src/admin/admin.service.ts
- apps/api/src/app.controller.spec.ts
- apps/api/src/app.controller.ts
- apps/api/src/app.module.ts
- apps/api/src/app.service.ts
- apps/api/src/auth/auth.controller.ts
- apps/api/src/auth/auth.module.ts
- apps/api/src/auth/auth.service.ts
- apps/api/src/designs/designs.controller.ts
- apps/api/src/designs/designs.module.ts
- apps/api/src/designs/designs.service.ts
- apps/api/src/export/export.controller.ts
- apps/api/src/export/export.module.ts
- apps/api/src/export/export.service.ts
- apps/api/src/import/import.controller.ts
- apps/api/src/import/import.module.ts
- apps/api/src/import/import.service.ts
- apps/api/src/main.ts
- apps/api/tsconfig.build.json
- apps/api/tsconfig.json
- apps/web/.env.local.example
- apps/web/Dockerfile
- apps/web/app/(auth)/login/page.tsx
- apps/web/app/(auth)/register/page.tsx
- apps/web/app/(dashboard)/dashboard/page.tsx
- apps/web/app/(marketing)/explore/page.tsx
- apps/web/app/(marketing)/page.tsx
- apps/web/app/(marketing)/templates/page.tsx
- apps/web/app/editor/[id]/page.tsx
- apps/web/app/globals.css
- apps/web/app/layout.tsx
- apps/web/instrumentation.ts
- apps/web/next-env.d.ts
- apps/web/next.config.ts
- apps/web/package.json
- apps/web/public/.gitkeep
- apps/web/tsconfig.json
- apps/worker/.env.example
- apps/worker/Dockerfile
- apps/worker/package.json
- apps/worker/src/worker.ts
- apps/worker/tsconfig.json
- docker-compose.yml
- package.json
- packages/canvas-engine/package.json
- packages/canvas-engine/src/canvas-renderer.ts
- packages/canvas-engine/src/element-factory.ts
- packages/canvas-engine/src/events.ts
- packages/canvas-engine/src/history-manager.spec.ts
- packages/canvas-engine/src/history-manager.ts
- packages/canvas-engine/src/hit-tester.ts
- packages/canvas-engine/src/index.ts
- packages/canvas-engine/tsconfig.json
- packages/canvas-engine/vite.config.ts
- packages/common-types/package.json
- packages/common-types/src/api-types.ts
- packages/common-types/src/env.ts
- packages/common-types/src/index.ts
- packages/common-types/tsconfig.json
- packages/design-schema/generated/index.d.ts
- packages/design-schema/generated/index.js
- packages/design-schema/generated/index.ts
- packages/design-schema/package.json
- packages/design-schema/prisma/schema.prisma
- packages/design-schema/tsconfig.json
- packages/ui/package.json
- packages/ui/src/button.tsx
- packages/ui/src/index.ts
- packages/ui/src/input.tsx
- packages/ui/tsconfig.json
- pnpm-workspace.yaml
- scripts/init-localstack.sh
- tsconfig.base.json

### Change Log

- 2026-03-19: Scaffolded the Story 1.1 monorepo foundation across root tooling, apps, packages, Docker, and CI; runtime validation remains blocked pending Node/pnpm availability and a running Docker daemon.
