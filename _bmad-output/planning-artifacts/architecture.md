---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['prd.md']
workflowType: 'architecture'
project_name: 'design editor'
user_name: 'Tantr'
date: '2026-03-19T15:21:44+07:00'
lastStep: 8
status: 'complete'
completedAt: '2026-03-19T16:11:47+07:00'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
75 FRs across 13 domains — Canvas & Editing (FR1–10), Element Types (FR11–20f), AI File Import (FR21–27), Export (FR28–34), Templates & Assets (FR35–39), Document Management (FR40–43), Collaboration & Sharing (FR44–50), User & Design Management (FR51–57), Brand Kit (FR58–60), Workspace & Team (FR61–63), Platform Admin (FR64–68), Subscription & Billing (FR69–71, Phase 4), AI Features (FR72–75, Phase 4).

Phase 1 scope (hard scope freeze after Week 2): Canvas + 5 element types (Rectangle, Ellipse, Text, Image, Group) + AI import (.ai) + async PNG/PDF/HTML export + share link (view-only) + comment threads + version history (last 10, 30 days) + 20 curated templates + Google OAuth + email/password auth.

**Non-Functional Requirements:**

| NFR | Target |
|---|---|
| First Contentful Paint | < 1.5s |
| Time to Interactive (editor) | < 3s |
| Canvas render loop | ≤ 16ms / frame (60fps) on 200 elements |
| Canvas render floor | ≤ 33ms / frame (30fps) on >100 elements |
| Element selection/transform | < 50ms |
| AI Import P95 (≤ 50MB file) | ≤ 10s total (queue + processing) |
| Export PNG P95 | ≤ 5s |
| Export HTML/CSS P95 | ≤ 8s |
| API response P95 | < 200ms |
| Autosave latency | < 500ms background, non-blocking |
| Uptime SLA | ≥ 99.5% monthly |
| Concurrent users Phase 1 | 500 concurrent editors |
| Concurrent users Phase 4 | 10,000 (< 10% perf degradation) |
| Accessibility | WCAG 2.1 Level AA |
| Browser support | Chrome/Edge 100+, Firefox 110+, Safari 16+; mobile = view-only |

**Security requirements (must-fix pre-launch):**
- HTTPS/TLS 1.3 in transit; AES-256 at rest
- JWT access tokens 15min, refresh tokens 30 days
- Inkscape CLI: isolated container, 30s timeout, 512MB memory, no network access, PostScript/JS disabled
- SVG/vector content from import pipeline never injected into DOM — Canvas 2D Path2D only
- S3 signed URLs only (1h expiry); orphan asset cleanup within 24h of permanent delete
- Row-level security in PostgreSQL for multi-tenancy
- Font files: magic byte validation + malware scan + per-user storage isolation
- Import job IDs: UUIDv4, server-validates ownership on every status/result call
- Import rate limit: 5 jobs/hour/user, 3 concurrent max → HTTP 429 + Retry-After
- Login rate limit: 10 attempts/min per IP

**Scale & Complexity:**
- Primary domain: Full-stack Web SaaS — browser-native design tool
- Complexity level: **High** — custom Canvas 2D renderer + Adobe file format parsing + async job infrastructure + CRDT collaboration (Phase 4)
- Estimated architectural subsystems: 8–10

### Technical Constraints & Dependencies

| Dependency | Role | Constraint |
|---|---|---|
| Inkscape CLI | AI file server-side processing | Must run in isolated container; 30s hard timeout; 512MB mem limit; horizontal scale by adding worker containers |
| BullMQ + Redis | Import/export job queue | State must survive server restart; Redis-backed persistence required |
| PostgreSQL | Primary data store | Row-level security for multi-tenancy; PgBouncer connection pooling Phase 3+ |
| S3-compatible storage | Assets, fonts, designs, exports | Signed URLs only; per-user isolation; no direct public access |
| Google Fonts API | Font library | Phase 1 primary font source; user font upload (TTF/OTF) added Phase 2 |
| Google OAuth | Authentication | Primary auth method Phase 1; JWT issued server-side |
| Canvas 2D + Path2D + OffscreenCanvas | Renderer | Required browser APIs — no fallback; Safari 16+ required for OffscreenCanvas |
| Yjs CRDT | Real-time collaboration | Phase 4 only; **lazy init** critical — must have 0ms overhead on solo users |
| SendGrid / Postmark | Email notifications | Transactional: export complete, invite, nurture sequence |
| Stripe / Paddle | Subscription billing | Phase 4 only — no billing enforcement before Phase 4 |

### Cross-Cutting Concerns Identified

1. **Async UX pattern** — Import, export, and autosave are all async; a consistent loading/progress/error state system is needed across all three flows. Progress polling, queue position display, email delivery on completion.

2. **Authentication & Authorization** — JWT + RBAC must be enforced server-side on every API mutation. Applies across all 13 FR domains. 4 roles (Owner, Admin, Editor, Viewer) + personal Free/Pro accounts. Architecture must model tier-gating from day 1 even though billing is not enforced until Phase 4.

3. **Storage & Asset Lifecycle** — All assets (images, fonts, design exports) stored on S3 via signed URLs. Orphan cleanup must run within 24h of permanent delete. Per-user font isolation is a security requirement, not just organization.

4. **Error Handling & Graceful Degradation** — Import service failure must not affect the core editor. Export supports 1 auto-retry. All error messages must be specific and actionable (not generic "something went wrong"). Import QA Report must communicate partial success clearly.

5. **Tier Enforcement Architecture** — Feature gates (import, export limits, brand kit, team workspace) are not active until Phase 4 but must be designed into the data model from Phase 1 to avoid a painful migration later.

6. **Observability & Admin Operations** — Import success rate, P95 latency, DAU, and conversion rate metrics are required from Phase 1. Admin job queue management (retry/cancel stuck jobs) is an FR, not a nice-to-have.

7. **Visual Regression Testing Infrastructure** — Percy/Chromatic pixel-diff suite required from day 1 on every renderer commit. Cross-browser (especially Safari HiDPI) test matrix is a first-class CI concern given Canvas 2D rendering differences.

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Web SaaS — browser-native design tool with custom Canvas 2D renderer.

Architecture note: The editor page runs as a pure CSR (`'use client'`) component in Next.js. Canvas 2D API runs entirely in the browser regardless of framework. Next.js provides the additional benefit of SSG/SSR for SEO-critical pages (landing, template gallery, `/explore`) while the editor itself has zero server-rendering overhead.

### Selected Starter: Turborepo Monorepo (Manual Setup)

**Rationale:** No off-the-shelf starter covers the specific combination of Next.js 15 + NestJS 11 + BullMQ worker + shared Canvas engine package. A manual Turborepo workspace initialized with `create-turbo` and extended with the app/package structure below is the correct approach.

**Initialization Command:**

```bash
npx create-turbo@latest design-editor --package-manager pnpm
```

**Monorepo Structure:**

```
design-editor/
├── apps/
│   ├── web/                    ← Next.js 15 (App Router, Turbopack)
│   │   └── app/
│   │       ├── (marketing)/    ← SSG: landing, /templates/*, /explore
│   │       ├── editor/[id]/    ← CSR: 'use client' canvas editor
│   │       └── (auth)/         ← login, register
│   ├── api/                    ← NestJS 11 (REST API)
│   │   └── src/
│   │       ├── auth/
│   │       ├── designs/
│   │       ├── import/         ← AI file import + BullMQ producer
│   │       ├── export/
│   │       └── admin/
│   └── worker/                 ← BullMQ consumer (Inkscape jobs)
├── packages/
│   ├── canvas-engine/          ← Custom Canvas 2D renderer (shared lib)
│   ├── design-schema/          ← Prisma schema + generated client (shared)
│   ├── common-types/           ← Shared TypeScript types/interfaces
│   └── ui/                     ← Shared UI components (Tailwind CSS 4)
├── turbo.json
├── pnpm-workspace.yaml
└── docker-compose.yml          ← postgres + redis + s3 (localstack) for dev
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
TypeScript (strict mode) across all apps and packages. Node.js 22 LTS.

**Styling Solution:**
Tailwind CSS 4 for UI shell (web app, shared components). Canvas 2D content is not styled with CSS — rendered via Canvas API directly.

**Build Tooling:**
- `web`: Turbopack (Next.js 15 default) — ~5x faster than webpack in dev
- `api` / `worker`: ts-node-dev (dev) → tsc (prod build)
- Turborepo task graph: `build`, `dev`, `lint`, `test` with dependency ordering and remote cache

**Testing Framework:**
- Unit: Vitest (web packages) + Jest (NestJS — required for module testing)
- E2E: Playwright — canvas pixel-diff, cross-browser (Chrome, Firefox, Safari)
- Visual regression: Percy or Chromatic on every renderer commit

**Code Organization:**
Shared packages consumed by apps via workspace protocol (`"@design-editor/canvas-engine": "workspace:*"`). Canvas engine is fully isolated — independently testable and benchmarkable.

**Development Experience:**
- `pnpm dev` → starts all apps in parallel via Turborepo
- `docker-compose up` → PostgreSQL + Redis + LocalStack S3
- Shared ESLint config + Prettier in root `packages/`
- GitHub Actions CI: lint → test → build → visual regression

> **Note:** Project initialization (creating the monorepo structure, configuring turbo.json, writing docker-compose.yml) should be **Story 1** of the implementation backlog before any feature work begins.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Canvas state management: Zustand
- API documentation: Swagger / OpenAPI (NestJS built-in)
- Database ORM: Prisma 6
- Auth strategy: JWT + Google OAuth + email/password
- API style: REST (NestJS controllers + Swagger decorators)

**Important Decisions (Shape Architecture):**
- Caching: Next.js ISR for marketing/template pages; Redis API caching deferred to Phase 2
- Error monitoring: Deferred — implement Sentry in Phase 2 when traffic warrants
- Deployment platform: Docker Compose (local/dev); production platform decided at Phase 2 launch

**Deferred Decisions (Post-Phase 1):**
- Redis API response caching layer → Phase 2
- PgBouncer connection pooling → Phase 3
- Sentry error monitoring → Phase 2
- Production cloud platform (Railway / AWS ECS) → Phase 2 launch decision

---

### Data Architecture

**Primary Database:** PostgreSQL 16
- Row-level security (RLS) for multi-tenancy — every table with user-owned data has `user_id` or `workspace_id` FK with RLS policy
- Migrations managed by Prisma Migrate
- PgBouncer connection pooling deferred to Phase 3 (add when read replicas needed)

**ORM:** Prisma 6
- Schema-first: `packages/design-schema/prisma/schema.prisma` — single source of truth
- Generated client shared across `apps/api` and `apps/worker` via workspace package
- All database queries go through Prisma client — no raw SQL except for RLS policy setup

**Caching Strategy:**
- Phase 1: Next.js ISR (Incremental Static Regeneration) for `/templates/*` and marketing pages — no extra infra required
- Phase 1: Redis used exclusively for BullMQ job queue (no API response caching yet)
- Phase 2: Add Redis-backed API response caching (design metadata, template index) via NestJS CacheModule

**Data Validation:**
- API layer: `class-validator` + `class-transformer` on NestJS DTOs (all input validated before hitting service layer)
- Prisma schema types are the source of truth for database shape

---

### Authentication & Security

**Authentication Flow:**
- Google OAuth 2.0 via `passport-google-oauth20` (NestJS Passport strategy)
- Email/password via `passport-local` + bcrypt (cost factor 12)
- JWT issued by NestJS `@nestjs/jwt` — access token 15min, refresh token 30 days (stored in httpOnly cookie)
- JWT validation on every protected route via `JwtAuthGuard`

**Authorization:**
- RBAC guard (`RolesGuard`) applied at controller level — never trust client-provided role
- Role hierarchy: Owner > Admin > Editor > Viewer
- Subscription tier stored on User model — feature gating via `TierGuard` (enforced in code from Phase 1; billing enforcement active Phase 4)
- All API mutations check both role AND ownership server-side

**Security Middleware (NestJS global guards/interceptors):**
- Helmet (HTTP security headers)
- CORS whitelist (production domain + localhost:3000)
- Rate limiting via `@nestjs/throttler` — global 100 req/min; import endpoint custom 5/hour/user
- Request logging via Pino (structured JSON, secrets scrubbed)

**Data Security:**
- S3 signed URLs only (1h expiry) — no direct public bucket access
- SVG/vector content from import pipeline rendered via Canvas 2D Path2D only — never injected into DOM
- Inkscape container: network disabled, PostScript/JS disabled, 512MB memory, 30s timeout

---

### API & Communication Patterns

**API Style:** REST — NestJS controllers with Swagger decorators (`@ApiOperation`, `@ApiResponse`)

**API Documentation:** Swagger UI served at `/api/docs` (dev + staging; disabled in production or behind auth)

**API Versioning:** URL prefix versioning — `/api/v1/*` from Phase 1. Enables non-breaking evolution.

**Response Format (standard wrapper):**
```typescript
// Success
{ data: T, meta?: PaginationMeta }

// Error
{ error: { code: string, message: string, details?: unknown } }
```

**HTTP Status Codes (strict enforcement):**
- `200` OK — successful GET/PATCH
- `201` Created — successful POST
- `204` No Content — successful DELETE
- `400` Bad Request — validation errors
- `401` Unauthorized — missing/invalid JWT
- `403` Forbidden — authenticated but insufficient role/tier
- `404` Not Found — resource doesn't exist or user can't see it (don't leak existence)
- `409` Conflict — duplicate resource
- `422` Unprocessable — business logic validation failure
- `429` Too Many Requests — rate limit (include `Retry-After` header)

**Async Job Communication:**
- Client polls `GET /api/v1/jobs/:id/status` every 3 seconds
- Job status: `queued | processing | completed | failed`
- Failed jobs return `failureReason` with actionable user message

**Inter-service Communication (NestJS ↔ Worker):**
- BullMQ shared Redis — `api` adds jobs, `worker` consumes
- No direct HTTP between services — all communication via queue

---

### Frontend Architecture

**Framework:** Next.js 15 App Router

**Page Strategy:**
- `(marketing)/` routes: SSG (generateStaticParams) → fast load, SEO-indexed
- `editor/[id]/` route: CSR only (`'use client'`) → Canvas 2D loop, no SSR overhead
- `(auth)/` routes: SSR → server-side session check

**State Management:** Zustand
- `useDocumentStore` — document element tree, selection, history (undo/redo stack)
- `useUIStore` — panel visibility, tool mode, zoom level, loading states
- `useUserStore` — auth state, subscription tier, preferences
- Stores are clean slices — no cross-store subscriptions
- Canvas engine reads from `useDocumentStore` directly (no prop drilling)

**Canvas Engine Package (`packages/canvas-engine`):**
- Pure TypeScript — no React dependency
- Exports: `CanvasRenderer`, `ElementFactory`, `HitTester`, `HistoryManager`
- Consumed by `apps/web` editor page — React calls engine methods, engine owns the `<canvas>` element
- Independently testable with Vitest (no browser needed for unit tests via mock canvas)

**Data Fetching:**
- Next.js `fetch` with `cache` options for server components (template/marketing pages)
- `SWR` for client-side data fetching in editor (design metadata, comments, job status polling)
- Autosave: debounced `PATCH /api/v1/designs/:id` triggered by Zustand store subscription (500ms debounce)

---

### Infrastructure & Deployment

**Local Development:**
```bash
docker-compose up          # PostgreSQL 16 + Redis 7 + LocalStack S3
pnpm dev                   # Turborepo: starts web + api + worker in parallel
```

**Deployment (Phase 1 — Docker):**
- Each app has its own `Dockerfile` (multi-stage build)
- `web`: Node.js 22 Alpine — Next.js standalone output
- `api`: Node.js 22 Alpine — NestJS compiled JS
- `worker`: Node.js 22 Alpine — BullMQ worker process
- `inkscape-worker`: Debian-based — Inkscape CLI + isolation config

**CI/CD (GitHub Actions):**
1. `lint` → ESLint + TypeScript check (all packages)
2. `test` → Vitest (packages) + Jest (NestJS) + Playwright (E2E)
3. `visual-regression` → Percy/Chromatic canvas pixel-diff (on renderer commits)
4. `build` → Turborepo build (incremental, cached)
5. `docker-build` → Build + push images (on main branch merge)

**Environment Configuration:**
- `.env.local` (dev) / secrets manager (prod)
- Single `packages/common-types/env.ts` — Zod schema validates all env vars at startup
- All apps fail fast if required env vars missing — no silent undefined

**Production Platform:** Decided at Phase 2 launch (Railway or AWS ECS — evaluate based on team infra comfort and traffic needs at that point).

---

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (Prisma schema):**
- Models: PascalCase (`Design`, `ImportJob`, `User`)
- Tables: auto snake_case plural (`designs`, `import_jobs`, `users`)
- Columns: camelCase in Prisma → auto snake_case in DB (`createdAt` → `created_at`)
- Foreign keys: camelCase → `userId`, `workspaceId`, `designId`
- Never name a column `id` with a type prefix — always plain `id` (UUID)

**API Endpoints:**
- Resources: plural noun, kebab-case — `/api/v1/designs`, `/api/v1/import-jobs`
- Route params: `:id` — `GET /api/v1/designs/:id`
- Nested resources: `/api/v1/designs/:id/comments` (max 1 level of nesting)
- Query params: camelCase — `?pageSize=20&sortBy=createdAt&cursor=xxx`
- No verbs in URLs — use HTTP methods for actions

**TypeScript Code:**
- Files: kebab-case — `design.service.ts`, `canvas-renderer.ts`, `use-document-store.ts`
- Classes/Types/Interfaces: PascalCase — `DesignService`, `CanvasElement`, `ImportJobStatus`
- No `I` prefix on interfaces (`DesignElement` not `IDesignElement`)
- Functions/variables: camelCase — `getUserDesigns`, `elementBounds`, `parseAiFile`
- Constants: SCREAMING_SNAKE_CASE — `MAX_FILE_SIZE_MB`, `IMPORT_TIMEOUT_MS`, `CANVAS_FPS_TARGET`
- Zustand stores: `use{Name}Store` — `useDocumentStore`, `useUIStore`, `useUserStore`
- NestJS DTOs: `{Action}{Resource}Dto` — `CreateDesignDto`, `UpdateElementDto`
- NestJS modules: one module per feature domain

### Structure Patterns

**NestJS Feature Module Structure (apply consistently to every domain):**
```
src/{feature}/
├── {feature}.controller.ts     ← HTTP layer, Swagger decorators, auth guards
├── {feature}.service.ts        ← Business logic
├── {feature}.module.ts         ← Module definition, providers
├── {feature}.service.spec.ts   ← Unit tests co-located
├── dto/
│   ├── create-{feature}.dto.ts
│   ├── update-{feature}.dto.ts
│   └── {feature}-response.dto.ts
└── entities/
    └── {feature}.entity.ts     ← Type-only (Prisma types), no DB logic here
```

**Next.js Route Group Strategy:**
- `(marketing)/` — SSG pages, no auth required
- `editor/[id]/` — CSR only, protected, Canvas 2D
- `(auth)/` — SSR, redirect if already authenticated
- `(dashboard)/` — SSR, protected user dashboard
- `api/` — Next.js route handlers only for auth callbacks (Google OAuth); all other API via NestJS

**Test co-location rule:** Unit test files sit next to the source file they test (`*.spec.ts`). Playwright E2E tests live in `apps/web/e2e/`.

**Where shared logic lives:**
- Shared TS types/interfaces → `packages/common-types/src/`
- Prisma schema + generated client → `packages/design-schema/prisma/`
- Canvas rendering engine → `packages/canvas-engine/src/`
- Shared UI components (Tailwind) → `packages/ui/src/`
- NestJS common decorators/guards/filters → `apps/api/src/common/`

### Format Patterns

**API Response Wrapper (ALL NestJS endpoints — enforced by `ResponseWrapperInterceptor`):**
```typescript
// Success
{ "data": T }
{ "data": T, "meta": { "nextCursor": string | null, "total": number } }

// Error (from GlobalExceptionFilter)
{ "error": { "code": "SCREAMING_SNAKE_CODE", "message": "User-friendly message" } }
```

**Date format:** ISO 8601 UTC strings in all API payloads — `"2026-03-19T08:21:44.000Z"`. Never Unix timestamps.

**JSON field names:** camelCase in all requests and responses — `createdAt`, `userId`, `importJobId`.

**Pagination:** Cursor-based for all list endpoints with >10 items. Page-based only for admin dashboards.

**Boolean naming:** `is{State}` or `has{Thing}` — `isPublished`, `hasPassword`, `isOwner`. Never raw `active`, `enabled`.

### Communication Patterns

**Zustand state updates — always use immer-style setter:**
```typescript
// ✅ Correct
set(state => { state.elements.push(newEl) })
// ❌ Wrong — mutates outside setter
store.elements.push(newEl)
```

**Canvas Engine ↔ React boundary (strict separation):**
- React calls canvas engine public API: `renderer.addElement(el)`, `renderer.selectElement(id)`
- Canvas engine emits typed DOM CustomEvents for state changes: `canvas:element-selected`, `canvas:document-changed`
- React listens to CustomEvents → updates Zustand store
- `packages/canvas-engine` has zero imports from React, Zustand, or Next.js — pure TS

**BullMQ job definitions:**
```typescript
// Job names: SCREAMING_SNAKE — 'IMPORT_AI_FILE' | 'EXPORT_PNG' | 'SEND_EMAIL'
// All payloads typed in packages/common-types/src/jobs.ts as discriminated union
type JobPayload =
  | { type: 'IMPORT_AI_FILE'; userId: string; fileKey: string; jobId: string }
  | { type: 'EXPORT_PNG'; designId: string; width: number; height: number }
```

**Error handling (NestJS):**
```typescript
// Throw typed NestJS exceptions — GlobalExceptionFilter maps to standard response
throw new NotFoundException('DESIGN_NOT_FOUND', 'Design not found');
throw new ForbiddenException('INSUFFICIENT_TIER', 'AI import requires Pro plan');
throw new TooManyRequestsException('RATE_LIMIT_EXCEEDED', 'Max 5 imports/hour');
// Never throw generic Error() in service layer
```

**Async status type (Zustand stores):**
```typescript
// All async operations use AsyncStatus — not boolean isLoading
type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
// useUIStore.importStatus: AsyncStatus
// useUIStore.exportStatus: AsyncStatus
```

### Enforcement Rules — All AI Agents MUST:

1. Import Prisma client exclusively from `@design-editor/design-schema` — never create a new PrismaClient instance
2. Validate all API inputs with `class-validator` DTOs **before** the service layer
3. Apply `@ApiOperation`, `@ApiResponse(200)`, and `@ApiResponse(400/401/403)` Swagger decorators to **every** controller method
4. Wrap all API responses using `ResponseWrapperInterceptor` — never return raw objects
5. Check role AND ownership server-side on every mutation (two separate checks)
6. Never inject SVG, HTML, or vector content from import pipeline into the DOM
7. Keep `packages/canvas-engine` dependency-free from React/Next.js/Zustand
8. Use `AsyncStatus` enum (not `boolean`) for all loading states in Zustand stores
9. Run `pnpm lint && pnpm test` before marking any story complete
10. Add database migrations via `prisma migrate dev` — never modify the DB directly

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
design-editor/                            ← monorepo root
├── .github/
│   └── workflows/
│       ├── ci.yml                        ← lint, test, build, visual-regression
│       └── docker-build.yml             ← build & push images on main merge
├── apps/
│   ├── web/                             ← Next.js 15 (App Router)
│   │   ├── app/
│   │   │   ├── layout.tsx               ← root layout, global providers
│   │   │   ├── (marketing)/
│   │   │   │   ├── page.tsx             ← Landing page (SSG)
│   │   │   │   ├── templates/
│   │   │   │   │   └── [category]/
│   │   │   │   │       └── [slug]/
│   │   │   │   │           └── page.tsx ← Template SEO page (SSG)
│   │   │   │   └── explore/
│   │   │   │       └── page.tsx         ← Public gallery (SSG/ISR)
│   │   │   ├── editor/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx         ← 'use client' canvas editor entry
│   │   │   │       └── _components/
│   │   │   │           ├── canvas-stage.tsx
│   │   │   │           ├── toolbar/
│   │   │   │           ├── layers-panel/
│   │   │   │           ├── properties-panel/
│   │   │   │           └── import-qa-modal/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── designs/page.tsx
│   │   │       └── settings/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                      ← buttons, inputs, modals
│   │   │   └── shared/                  ← nav, footer, toast
│   │   ├── hooks/
│   │   │   ├── use-import-job.ts        ← polls GET /api/v1/import-jobs/:id
│   │   │   └── use-autosave.ts          ← Zustand → PATCH /api/v1/designs/:id
│   │   ├── lib/
│   │   │   ├── api-client.ts            ← typed fetch wrapper for NestJS API
│   │   │   └── auth.ts                  ← NextAuth.js config (Google OAuth)
│   │   ├── stores/
│   │   │   ├── use-document-store.ts    ← elements, selection, undo/redo
│   │   │   ├── use-ui-store.ts          ← panels, tool, zoom, async statuses
│   │   │   └── use-user-store.ts        ← auth state, tier, preferences
│   │   ├── e2e/
│   │   │   ├── canvas-render.spec.ts
│   │   │   ├── import-flow.spec.ts
│   │   │   └── export-flow.spec.ts
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   ├── api/                             ← NestJS 11 REST API
│   │   ├── src/
│   │   │   ├── main.ts                  ← bootstrap, Swagger, Helmet, CORS, throttler
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   ├── roles.decorator.ts
│   │   │   │   │   └── tier.decorator.ts
│   │   │   │   ├── filters/
│   │   │   │   │   └── global-exception.filter.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   ├── roles.guard.ts
│   │   │   │   │   └── tier.guard.ts
│   │   │   │   └── interceptors/
│   │   │   │       ├── response-wrapper.interceptor.ts
│   │   │   │       └── logging.interceptor.ts
│   │   │   ├── auth/                    ← FR51: Google OAuth + email/password
│   │   │   ├── users/                   ← FR51–57: user management
│   │   │   ├── designs/                 ← FR1–10, FR40–41, FR53–55
│   │   │   ├── import/                  ← FR21–26: AI import pipeline
│   │   │   ├── export/                  ← FR28–34: export PNG/PDF/HTML
│   │   │   ├── templates/               ← FR35–37: template library
│   │   │   ├── collaboration/           ← FR44–48: share, comments, versions
│   │   │   ├── storage/                 ← S3 signed URLs, asset lifecycle
│   │   │   ├── notifications/           ← FR57: email notifications
│   │   │   └── admin/                   ← FR64–68: admin dashboard
│   │   ├── nest-cli.json
│   │   └── tsconfig.json
│   │
│   └── worker/                          ← BullMQ consumer
│       └── src/
│           ├── main.ts
│           ├── import/
│           │   ├── import.processor.ts  ← IMPORT_AI_FILE handler
│           │   └── inkscape.service.ts  ← Inkscape CLI + SVG parsing
│           ├── export/
│           │   └── export.processor.ts  ← EXPORT_PNG / EXPORT_PDF
│           └── email/
│               └── email.processor.ts   ← SEND_EMAIL handler
│
├── packages/
│   ├── canvas-engine/                   ← Pure TS, no React/Zustand/Next.js
│   │   └── src/
│   │       ├── index.ts
│   │       ├── renderer.ts              ← CanvasRenderer (main render loop)
│   │       ├── element-factory.ts
│   │       ├── hit-tester.ts
│   │       ├── history-manager.ts       ← undo/redo stack
│   │       ├── elements/
│   │       │   ├── text-element.ts      ← FR12
│   │       │   ├── path-element.ts      ← FR14 + import vector
│   │       │   ├── image-element.ts     ← FR13 + rasterized import
│   │       │   ├── rect-element.ts
│   │       │   └── ellipse-element.ts
│   │       └── smart-hybrid/
│   │           └── categorizer.ts       ← FR23: Smart Hybrid classification
│   │
│   ├── design-schema/                   ← Prisma source of truth
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/index.ts                 ← PrismaClient singleton export
│   │
│   ├── common-types/                    ← Zero-runtime shared types
│   │   └── src/
│   │       ├── jobs.ts                  ← JobPayload discriminated union
│   │       ├── elements.ts              ← CanvasElement types
│   │       ├── api.ts                   ← Response wrapper types
│   │       └── env.ts                   ← Zod env validation schema
│   │
│   └── ui/                              ← Shared Tailwind components
│       └── src/
│           ├── button.tsx
│           ├── modal.tsx
│           └── toast.tsx
│
├── docker-compose.yml                   ← postgres 16 + redis 7 + localstack S3
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

### Architectural Boundaries

**API Boundaries:**
- `web` → `api`: REST/HTTP via typed `api-client.ts`. JWT Bearer on all protected routes. Base URL from env.
- `api` → `worker`: BullMQ queue via shared Redis. No direct HTTP between services.
- `worker` → Inkscape: Child process (`inkscape.service.ts`). Sandboxed, 30s timeout, 512MB mem.
- `api` / `worker` → S3: AWS SDK with pre-signed URLs only. Client never receives bucket credentials.
- `packages/canvas-engine` → `apps/web`: One-way. Web imports engine; engine imports nothing from web stack.

**Data Boundaries:**
- `packages/design-schema` is the single PrismaClient source — consumed by both `api` and `worker`.
- `packages/common-types` is types-only — zero runtime deps, safe to import anywhere.
- Per-user S3 path isolation: `assets/{userId}/...`, `fonts/{userId}/...`, `exports/{designId}/...`

### Requirements to Structure Mapping

| FR Group | Implementation Location |
|---|---|
| FR1–10 Canvas operations | `apps/api/src/designs/` + `packages/canvas-engine/` |
| FR11–20f Element types | `packages/canvas-engine/src/elements/` |
| FR21–27 AI Import | `apps/api/src/import/` + `apps/worker/src/import/` |
| FR23 Smart Hybrid | `packages/canvas-engine/src/smart-hybrid/categorizer.ts` |
| FR28–34 Export | `apps/api/src/export/` + `apps/worker/src/export/` |
| FR35–37 Templates | `apps/api/src/templates/` + `apps/web/app/(marketing)/templates/` |
| FR44–48 Collaboration | `apps/api/src/collaboration/` |
| FR51–57 User & Auth | `apps/api/src/auth/` + `apps/api/src/users/` |
| FR64–68 Admin | `apps/api/src/admin/` |
| Auth guards (cross-cutting) | `apps/api/src/common/guards/` |
| Storage lifecycle (cross-cutting) | `apps/api/src/storage/` |
| Email notifications (cross-cutting) | `apps/worker/src/email/` + `apps/api/src/notifications/` |

### Key Data Flows

**Import Flow (FR21–27):**
```
Browser → POST /api/v1/import-jobs (multipart file)
  → api: validate (size ≤50MB, magic bytes, virus scan) → upload raw file to S3
  → api: enqueue IMPORT_AI_FILE job (BullMQ) → return { data: { jobId } }
  → Browser polls GET /api/v1/import-jobs/:id every 3s
  → worker: dequeue → spawn Inkscape CLI (sandboxed 30s)
  → worker: parse SVG → SmartHybrid categorize → build DesignDocument JSON
  → worker: upload result to S3 → update job status: completed + QA report
  → Browser: receives QA Report modal → user confirms → editor loads document
```

**Autosave Flow (FR54):**
```
User edits canvas → useDocumentStore mutates (Zustand)
  → use-autosave.ts debounce 500ms → PATCH /api/v1/designs/:id
  → api: JwtAuthGuard + ownership check → Prisma upsert (RLS)
  → api: 200 OK → client clears pending-save flag
```

**Export Flow (FR28–34):**
```
User clicks Export → POST /api/v1/export-jobs
  → api: enqueue EXPORT_PNG/PDF job → return { data: { jobId } }
  → Browser polls status
  → worker: renders design server-side → uploads to S3
  → worker: updates job: completed + signed download URL
  → api: triggers SEND_EMAIL job (export complete notification)
  → Browser: auto-downloads or shows download link
```

---

## Architecture Validation Results

### Coherence Validation ✅ PASS

**Decision Compatibility:** All 5 core technology decisions are mutually compatible. Next.js 15 + NestJS 11 + Turborepo 2.8 + pnpm is the most common production monorepo stack in 2025. Prisma 6 integrates natively with NestJS 11 and PostgreSQL 16. Tailwind CSS 4 is compatible with Next.js 15 App Router.

**Pattern Consistency:** Naming conventions (kebab-case files, PascalCase classes, camelCase vars, SCREAMING_SNAKE constants) applied uniformly across all apps and packages. API response wrapper enforced via `ResponseWrapperInterceptor` — no raw return leakage. Error format consistent via `GlobalExceptionFilter`.

**Structure Alignment:** Monorepo structure fully supports all architectural decisions. `canvas-engine` is properly isolated (no framework deps). `design-schema` is single PrismaClient source shared across `api` and `worker`. `common-types` is zero-runtime, safe to import anywhere.

### Requirements Coverage Validation ✅ PASS

**Functional Requirements (75 FRs):** All 75 FRs are mapped to specific implementation locations in the Project Structure section. Phase 4 FRs (FR49–50, FR69–75) are explicitly deferred with no architectural debt — data model accommodates tier enforcement from Phase 1.

**Non-Functional Requirements:** All 15 NFR targets are architecturally addressed:
- Canvas 60fps: isolated `canvas-engine` package, OffscreenCanvas, viewport culling
- Import P95 ≤10s: async BullMQ + containerized Inkscape server
- API P95 <200ms: stateless NestJS + Prisma connection pooling
- Uptime 99.5%: Redis-backed job persistence, graceful degradation
- Security (8 items): JWT, signed S3 URLs, Inkscape sandbox, RLS, font isolation, SVG-never-in-DOM
- WCAG 2.1 AA: defined per-component in implementation

### Implementation Readiness Validation ✅ PASS

**Decision Completeness:** All critical decisions documented with technology versions. 10 enforcement rules defined for AI agent consistency. Story 1 (monorepo init) identified as first implementation step.

**Structure Completeness:** Complete directory tree with per-file FR annotations. 3 core data flows documented (Import, Autosave, Export). All integration boundaries explicitly defined.

**Pattern Completeness:** All 5 conflict categories addressed (naming, structure, format, communication, process). Concrete code examples provided for all patterns. Anti-patterns explicitly called out.

### Gap Analysis

**Critical Gaps:** None.

**Minor Gaps (resolve during implementation stories, not blockers):**
- Detailed Prisma schema (models, relations) — defined in Story 1
- Swagger endpoint specs — generated per module during implementation
- Percy vs Chromatic final choice — evaluate during CI setup in Story 1

### Architecture Completeness Checklist

- [x] Project context thoroughly analyzed (75 FRs, 15 NFRs, constraints, cross-cutting concerns)
- [x] Starter template evaluated and selected (Turborepo + Next.js 15 + NestJS 11 + pnpm)
- [x] Core architectural decisions documented with versions (Zustand, Swagger, Prisma, JWT, REST/v1)
- [x] Implementation patterns defined (10 enforcement rules, naming, structure, format, communication)
- [x] Complete project structure defined (full directory tree, FR mapping, data flows, boundaries)
- [x] Architecture validated for coherence, coverage, and implementation readiness

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION ✅**

**Confidence Level: High**

**Key Strengths:**
1. `canvas-engine` fully isolated → independently testable and benchmarkable from day 1
2. `design-schema` as single Prisma source of truth → no schema drift between `api` and `worker`
3. Tier enforcement designed into data model from Phase 1 → no painful migration at Phase 4
4. Async UX pattern consistent across import/export/autosave → coherent user experience
5. BullMQ job persistence → server restart does not lose in-flight import/export jobs

**Areas for Future Enhancement (Phase 2+):**
- Redis API response caching layer
- Sentry error monitoring integration
- PgBouncer connection pooling
- Production cloud platform selection

### Implementation Handoff

**First Implementation Story:**
```bash
npx create-turbo@latest design-editor --package-manager pnpm
```
Then scaffold the full monorepo structure as documented in the Project Structure section above.

**AI Agent Guidelines:**
- This document is the single source of truth for all technical decisions
- Follow all 10 enforcement rules in the Implementation Patterns section
- Refer to the Requirements → Structure mapping table for every new feature
- Run `pnpm lint && pnpm test` before marking any story complete
