---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
---

# Design Editor - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Design Editor, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create a new design canvas with custom dimensions
FR2: Users can select, move, resize (proportional + free), and rotate elements on the canvas
FR3: Users can control element z-order (bring forward/back/to front/to back)
FR4: Users can copy, paste, duplicate, and delete design elements
FR5: Users can align and distribute multiple elements relative to each other or the canvas
FR6: Users can undo and redo any canvas action with history preserved
FR7: Users can pan and zoom the canvas view
FR8: Users can group and ungroup multiple elements into a single unit
FR9: Users can lock elements to prevent accidental editing
FR10: Users can toggle element visibility
FR11: Users can create and edit geometric shapes (Rectangle, Ellipse, Polygon, Star, Line, Arrow)
FR12: Users can create and edit text elements with font, size, style, and alignment controls
FR13: Users can upload and place image elements on the canvas
FR14: Users can draw vector path elements using a Bezier pen tool
FR15: Users can apply solid color fills and strokes to elements
FR16: Users can apply gradient fills (linear, radial) to elements
FR17: Users can control element opacity and blend modes
FR18: Users can apply visual effects (drop shadow, inner shadow, blur, glow) to elements
FR19: Users can apply non-destructive image adjustment filters (brightness, contrast, saturation, hue) to image elements — filters stored as metadata, original asset unmodified
FR20: Users can access and apply fonts from the Google Fonts library
FR20b: The system renders images on canvas at full source resolution without downsampling or quality loss
FR20c: Users can view designs at any zoom level (up to 800%) with crisp, non-pixelated vector and text elements
FR20d: The system preserves original image resolution when importing assets — no automatic compression or resizing without user confirmation
FR20e: Users can snap elements to the canvas grid, other elements' edges/centers, and canvas boundaries with smart distance guides visible during drag
FR20f: Users can switch between Simple mode (condensed toolbar for non-designers) and Pro mode (full toolbar with all controls)
FR21: Users can upload .ai (Adobe Illustrator) files for import into the editor
FR22: The system validates uploaded files before processing (size ≤ 50MB, format integrity, malware check)
FR23: The system converts .ai file content into editable design elements using Smart Hybrid conversion (text → TextElement, vector → PathElement, complex effects → rasterized ImageElement)
FR24: Users can view an Import QA Report with visual before/after preview before confirming import
FR25: Users can track import processing status in real-time (3-stage: Upload → Processing → QA Report)
FR26: The system provides specific, actionable error messages when import fails or partially succeeds
FR27: Users can import advanced .ai features (complex gradients, patterns, symbols, masks) as native editable elements *(Phase 3)*
FR28: Users can export designs as PNG with transparent background support
FR28b: PNG export renders at the exact pixel dimensions specified — no upscaling artifacts or quality degradation
FR29: Users can export designs as PDF (screen-optimized)
FR30: Users can export designs as a self-contained static HTML/CSS web page
FR30b: HTML/CSS export produces valid, self-contained HTML5 with inline CSS — no external dependencies
FR31: HTML/CSS export uses original asset files at full resolution — no recompression
FR32: Users can configure export dimensions for PNG output
FR33: The system provides export progress feedback for long-running exports
FR34: Users receive email notification when an async export job completes
FR35: Users can browse and search a curated template library by category and keyword
FR36: Users can preview a template before opening it as a new design
FR37: Users can open any template as an editable design
FR38: Users can submit templates to a community marketplace *(Phase 3)*
FR39: Users can browse and use stock assets from an integrated asset library *(Phase 3)*
FR40: Users can create and manage multi-page documents *(Phase 2)*
FR41: Users can reorder, duplicate, and delete pages within a document *(Phase 2)*
FR42: Users can add entrance/exit animations to individual elements *(Phase 2)*
FR43: Users can add transition animations between pages *(Phase 2)*
FR44: Users can share a design via a view-only link
FR45: Users can password-protect shared design links
FR46: Users can add comments anchored to specific layers or positions in a design
FR47: Users can reply to and resolve comment threads
FR48: Users can view version history and restore previous saved versions
FR49: Multiple users can edit the same design simultaneously in real-time *(Phase 4)*
FR50: Users can see collaborators' cursor positions and selections in real-time *(Phase 4)*
FR51: Users can register and authenticate via Google OAuth or email/password
FR52: Visitors can use the editor and preview a design without creating an account (try-without-signup mode)
FR53: Users can create, rename, organize, and delete their designs
FR54: The system autosaves designs automatically at regular intervals and on navigation
FR55: Users can recover deleted designs from a trash folder within their retention window
FR56: Users can upload custom fonts (TTF/OTF) for use in their designs *(Phase 2)*
FR57: The system sends automated email notifications for key events (export complete, invite received, email nurture sequence for new signups)
FR58: Users can create and manage a Brand Kit containing colors, logos, and fonts *(Phase 3)*
FR59: Workspace administrators can lock Brand Kit elements to enforce brand consistency *(Phase 3)*
FR60: Users can apply Brand Kit assets directly from within the editor *(Phase 3)*
FR61: Users can create team workspaces and invite members *(Phase 3)*
FR62: Workspace administrators can assign roles (Owner, Admin, Editor, Viewer) to members *(Phase 3)*
FR63: Team members can access and collaborate on shared designs within a workspace *(Phase 3)*
FR64: Platform admins can search, view, and manage all user accounts
FR65: Platform admins can unpublish or remove designs that violate content policy
FR66: Platform admins can monitor the import job queue and manually retry or cancel stuck jobs
FR67: Platform admins can view system health metrics (import success rate, P95 latency, DAU, conversion rate)
FR68: Platform admins can export analytics reports
FR69: Users can subscribe to paid plans and manage billing information *(Phase 4)*
FR70: The system enforces feature access and usage limits based on subscription tier *(Phase 4)*
FR71: Free-tier exports display an attribution badge (opt-out for paid tiers) *(Phase 4)*
FR72: Users can remove image backgrounds using AI *(Phase 4)*
FR73: Users can generate images from text prompts using AI *(Phase 4)*
FR74: Users can automatically resize and reformat designs for different platforms (Magic Resize) *(Phase 4)*
FR75: Users can receive AI-suggested templates based on a brief description *(Phase 4)*

### NonFunctional Requirements

NFR1: First Contentful Paint (FCP) < 1.5s — editor must load fast
NFR2: Time to Interactive (editor) < 3s — canvas ready within 3s
NFR3: Canvas render loop ≤ 16ms/frame (60fps) on 200-element document in solo mode
NFR4: Canvas render floor ≤ 33ms/frame (30fps minimum) with >100 elements
NFR5: Element selection/transform response < 50ms — must feel instant
NFR6: AI Import P95 ≤ 10s total (queue + processing) for files ≤ 50MB
NFR7: Export PNG P95 ≤ 5s (full canvas, any size)
NFR8: Export HTML/CSS P95 ≤ 8s
NFR9: API response P95 < 200ms (save, load, auth)
NFR10: Design autosave latency < 500ms background, non-blocking UI
NFR11: Uptime SLA ≥ 99.5% monthly (~3.6 hours downtime/month max)
NFR12: Concurrent users Phase 1: 500 concurrent editors without performance degradation
NFR13: Concurrent users Phase 4: 10,000 with <10% performance degradation vs Phase 1 baseline
NFR14: Accessibility WCAG 2.1 Level AA — full keyboard navigation, screen reader support, color contrast ≥ 4.5:1
NFR15: Browser support: Chrome/Edge 100+, Firefox 110+, Safari 16+; mobile = view-only mode

### Additional Requirements

- **Starter Template**: Architecture specifies Turborepo monorepo (Manual Setup) initialized with `npx create-turbo@latest design-editor --package-manager pnpm`. This is **Story 1** of the backlog.
- Monorepo structure: `apps/web` (Next.js 15), `apps/api` (NestJS 11), `apps/worker` (BullMQ consumer), `packages/canvas-engine`, `packages/design-schema`, `packages/common-types`, `packages/ui`
- Database: PostgreSQL 16 with Row-Level Security (RLS) for multi-tenancy; Prisma 6 as ORM; single PrismaClient source in `packages/design-schema`
- Job queue: BullMQ + Redis — must survive server restart; Redis-backed persistence
- Inkscape CLI: runs in isolated Docker container, 30s timeout, 512MB memory limit, no network access, PostScript/JS disabled
- Auth: JWT access tokens 15min, refresh tokens 30 days (httpOnly cookie); Google OAuth via passport-google-oauth20; email/password via passport-local + bcrypt (cost 12)
- Storage: S3-compatible; signed URLs only (1h expiry); per-user path isolation (`assets/{userId}/...`, `fonts/{userId}/...`, `exports/{designId}/...`); orphan asset cleanup within 24h of permanent delete
- Security: RBAC guard (RolesGuard) + TierGuard on all controller methods; Helmet, CORS whitelist, @nestjs/throttler (100 req/min global; 5 imports/hour/user)
- Canvas Engine: pure TypeScript package — zero deps on React, Zustand, or Next.js; exports `CanvasRenderer`, `ElementFactory`, `HitTester`, `HistoryManager`
- State management: Zustand stores (`useDocumentStore`, `useUIStore`, `useUserStore`); 3-store architecture; Canvas engine communicates via DOM CustomEvents
- Testing: Vitest (web packages) + Jest (NestJS); Playwright E2E; Percy/Chromatic visual regression on every renderer commit
- CI/CD: GitHub Actions — lint → test → visual-regression → build → docker-build; Turborepo remote cache
- API conventions: REST `/api/v1/*`; response wrapper via `ResponseWrapperInterceptor`; cursor-based pagination; camelCase JSON; ISO 8601 UTC dates; `AsyncStatus` enum (not boolean) for loading states
- Tier enforcement: designed into data model from Phase 1 (not enforced until Phase 4) — `TierGuard` in code from start
- Observability: import success rate, P95 latency, DAU, conversion rate metrics required from Phase 1 (admin dashboard FR64–68)
- Visual regression: Percy or Chromatic pixel-diff suite required from day 1 on every renderer commit; Safari HiDPI test matrix required

### UX Design Requirements

*No UX Design document found. UX requirements are embedded in the PRD.*

UX-DR1: Async 3-stage import UX — Upload → Processing (poll 3s with status messages) → QA Report modal with visual before/after preview per element
UX-DR2: Import QA Report modal — shows font substitutions, color accuracy (ΔE), effect approximations BEFORE opening document; user confirms or cancels; keyboard navigable, screen reader announces warnings
UX-DR3: Simple/Pro mode toggle — Simple mode: condensed toolbar (Text, Colors, Images only); Pro mode: full toolbar with all controls
UX-DR4: Export dialog with clear format labels: "PDF (Screen)" vs "PDF (Print/300dpi - Studio)"; warning when screen PDF chosen for large format
UX-DR5: Delete undo toast — immediate toast on delete: "Design deleted. [Undo] [View Trash]"; Trash folder (7 days Free / 30 days Pro / 90 days Studio)
UX-DR6: Async export queue UX — position indicator: "#12 in queue (~45s)"; email delivery on completion; 1 auto-retry on failure before error display
UX-DR7: Try-without-signup mode — editor opens without account, prompt to sign up only at export; Google OAuth 1-click after prompt
UX-DR8: "Made with DesignEditor" viral badge on Free tier exports; Pro/Studio can opt-out
UX-DR9: Invite management UX — pending invite list with delivery status (Sent/Accepted/Bounced); bounce notification + Resend button
UX-DR10: Tab/browser close during import — job persistence via BullMQ; notification (in-app + email) when import completes; result cached 24h
UX-DR11: Multi-tab conflict detection — banner warning + read-only mode option when same document opened in multiple tabs
UX-DR12: Smart element snap guides — visible distance guides during drag; snap to grid, edges, centers, canvas boundaries
UX-DR13: Layer panel — accessible layer list with text descriptions (screen reader supplement for Canvas 2D content)
UX-DR14: Pre-validation gate for import — specific error messages: e.g., "Re-save as AI CS6+ or SVG" for old format files; fallback rasterize option

### FR Coverage Map

FR1: Epic 1 - Create canvas with custom dimensions
FR2: Epic 1 - Select, move, resize, rotate elements
FR3: Epic 1 - Control element z-order
FR4: Epic 1 - Copy, paste, duplicate, delete elements
FR5: Epic 1 - Align and distribute elements
FR6: Epic 1 - Undo/redo canvas actions
FR7: Epic 1 - Pan and zoom canvas view
FR8: Epic 1 - Group/ungroup elements
FR9: Epic 1 - Lock elements
FR10: Epic 1 - Toggle element visibility
FR11: Epic 1 - Create geometric shapes (Phase 1: Rect, Ellipse; Phase 2: Polygon, Star, Line, Arrow)
FR12: Epic 1 - Create and edit text elements with Google Fonts
FR13: Epic 1 - Upload and place image elements
FR14: Epic 2 - Bezier pen tool for vector paths (Phase 2)
FR15: Epic 1 - Solid color fills and strokes
FR16: Epic 2 - Gradient fills (Phase 2)
FR17: Epic 2 - Opacity and blend modes (Phase 2)
FR18: Epic 2 - Visual effects (drop shadow, blur, glow) (Phase 2)
FR19: Epic 2 - Non-destructive image filter adjustments
FR20: Epic 1 - Google Fonts library access
FR20b: Epic 1 - Full source resolution image rendering
FR20c: Epic 1 - Crisp zoom up to 800%
FR20d: Epic 1 - Preserve original image resolution on import
FR20e: Epic 1 - Smart snap guides during drag
FR20f: Epic 1 - Simple/Pro mode toggle
FR21: Epic 3 - Upload .ai files for import
FR22: Epic 3 - Pre-upload validation (size, format, malware)
FR23: Epic 3 - Smart Hybrid conversion (text/vector/rasterize)
FR24: Epic 3 - Import QA Report with visual before/after preview
FR25: Epic 3 - Real-time 3-stage import status tracking
FR26: Epic 3 - Specific actionable error messages on import failure
FR27: Epic 3 - Advanced .ai import (Phase 3)
FR28: Epic 4 - PNG export with transparent background
FR28b: Epic 4 - Pixel-accurate PNG export dimensions
FR29: Epic 4 - PDF (screen-optimized) export
FR30: Epic 4 - Self-contained HTML/CSS static page export
FR30b: Epic 4 - Valid HTML5 with inline CSS, no external deps
FR31: Epic 4 - Original asset resolution in HTML/CSS export
FR32: Epic 4 - Configure PNG export dimensions
FR33: Epic 4 - Export progress feedback
FR34: Epic 4 - Email notification on async export completion
FR35: Epic 5 - Browse and search template library
FR36: Epic 5 - Preview template before opening
FR37: Epic 5 - Open template as editable design
FR38: Epic 5 - Submit to community marketplace (Phase 3)
FR39: Epic 5 - Browse stock assets (Phase 3)
FR40: Epic 2 - Multi-page document support (Phase 2)
FR41: Epic 2 - Reorder, duplicate, delete pages (Phase 2)
FR42: Epic 2 - Per-element entrance/exit animations (Phase 2)
FR43: Epic 2 - Page transition animations (Phase 2)
FR44: Epic 6 - Share design via view-only link
FR45: Epic 6 - Password-protect shared links
FR46: Epic 6 - Comments anchored to layers/positions
FR47: Epic 6 - Reply to and resolve comment threads
FR48: Epic 6 - Version history and restore
FR49: Epic 6 - Real-time simultaneous co-editing (Phase 4)
FR50: Epic 6 - Live collaborator cursor positions (Phase 4)
FR51: Epic 7 - Google OAuth + email/password authentication
FR52: Epic 7 - Try-without-signup mode
FR53: Epic 7 - Create, rename, organize, delete designs
FR54: Epic 7 - Autosave at regular intervals
FR55: Epic 7 - Trash folder with retention window
FR56: Epic 7 - Custom font upload TTF/OTF (Phase 2)
FR57: Epic 7 - Automated email notifications (export, invite, nurture)
FR58: Epic 8 - Create and manage Brand Kit (Phase 3)
FR59: Epic 8 - Lock Brand Kit for brand consistency (Phase 3)
FR60: Epic 8 - Apply Brand Kit assets in editor (Phase 3)
FR61: Epic 8 - Create team workspaces and invite members (Phase 3)
FR62: Epic 8 - RBAC role assignment (Phase 3)
FR63: Epic 8 - Shared designs in workspace (Phase 3)
FR64: Epic 9 - Admin: search and manage user accounts
FR65: Epic 9 - Admin: unpublish/remove policy-violating designs
FR66: Epic 9 - Admin: monitor import job queue, retry/cancel stuck jobs
FR67: Epic 9 - Admin: system health metrics dashboard
FR68: Epic 9 - Admin: export analytics reports
FR69: Epic 10 - Subscribe to paid plans, manage billing (Phase 4)
FR70: Epic 10 - Enforce feature access/usage limits by tier (Phase 4)
FR71: Epic 10 - Free-tier attribution badge, opt-out for paid (Phase 4)
FR72: Epic 10 - AI background removal (Phase 4)
FR73: Epic 10 - AI text-to-image generation (Phase 4)
FR74: Epic 10 - Magic Resize (Phase 4)
FR75: Epic 10 - AI template suggestions (Phase 4)

## Epic List

### Epic 1: Core Design Editor — Create & Edit Designs
Users can open the editor, create designs from scratch using shapes, text, and images, manipulate elements with professional controls (select, move, resize, rotate, z-order, align, group, lock), undo/redo all actions, and navigate the canvas fluently. Google Fonts integration and Simple/Pro mode toggle are included.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR15, FR20, FR20b, FR20c, FR20d, FR20e, FR20f

### Epic 2: Visual Depth — Enhanced Elements & Multi-Page
Users can apply gradient fills, blend modes, visual effects (shadow, blur, glow), non-destructive image filters, and draw vector paths with the Bezier pen tool. Multi-page document support with page management and animation export (MP4/GIF) enables richer design output.
**FRs covered:** FR14, FR16, FR17, FR18, FR19, FR40, FR41, FR42, FR43 *(Phase 2)*

### Epic 3: AI File Import — Import & Preserve Adobe Files
Users can upload .ai (Adobe Illustrator) files through a secure 3-stage async pipeline (validate → process → QA Report). The Smart Hybrid conversion engine preserves text as editable TextElements, vectors as editable PathElements, and rasterizes only complex effects. The Import QA Report with visual before/after preview gives users full transparency before committing to open the document.
**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27 *(FR27 Phase 3)*

### Epic 4: Export — Publish Designs in Any Format
Users can export designs as PNG (transparent background, configurable dimensions), PDF (screen-optimized), and self-contained HTML/CSS web pages. All exports are pixel-accurate at full source resolution. An async export queue with progress feedback and email notification handles long-running exports gracefully.
**FRs covered:** FR28, FR28b, FR29, FR30, FR30b, FR31, FR32, FR33, FR34

### Epic 5: Templates & Asset Library — Discover & Start Faster
Users can browse, search, preview, and open curated templates by category and keyword, making it easy to start a professional design in seconds. Phase 3 expands to a community marketplace and integrated stock asset library (Freepik API).
**FRs covered:** FR35, FR36, FR37, FR38, FR39 *(FR38, FR39 Phase 3)*

### Epic 6: Collaboration & Sharing — Share, Comment & Co-Create
Users can share designs via view-only links (with optional password protection), collaborate asynchronously through anchored comment threads with reply/resolve workflows, and access version history to restore previous saves. Phase 4 adds real-time Yjs CRDT simultaneous co-editing with live cursor presence.
**FRs covered:** FR44, FR45, FR46, FR47, FR48, FR49, FR50 *(FR49, FR50 Phase 4)*

### Epic 7: User & Design Management — Accounts, Autosave & Onboarding
Visitors can try the editor without signup and export after a frictionless Google OAuth 1-click. Registered users can manage all their designs, benefit from autosave (30s + navigate away), recover deleted designs from Trash, upload custom fonts (Phase 2), and receive automated email notifications for key events (export complete, invite, nurture sequence).
**FRs covered:** FR51, FR52, FR53, FR54, FR55, FR56, FR57 *(FR56 Phase 2)*

### Epic 8: Brand Kit & Team Workspace — Scale to Teams & Agencies
Studio users can create Brand Kits (colors, logos, fonts) with Owner-locked enforcement, create team workspaces, invite members with RBAC roles (Owner/Admin/Editor/Viewer), and collaborate on shared designs — enabling agency-scale workflows. Invite management includes delivery status and bounce notifications.
**FRs covered:** FR58, FR59, FR60, FR61, FR62, FR63 *(Phase 3)*

### Epic 9: Platform Administration — Monitor & Operate at Scale
Internal admins have a full operations dashboard: user account management, design content moderation (unpublish/remove), import job queue monitor (retry/cancel stuck jobs), system health metrics (import success rate, P95 latency, DAU, conversion rate), and analytics report export.
**FRs covered:** FR64, FR65, FR66, FR67, FR68

### Epic 10: Monetization, AI & Real-Time Collaboration
Subscription tiers (Free / Pro $15/mo / Studio $49/mo) are enforced with feature gates and usage limits. AI features (background removal, text-to-image, Magic Resize, template suggestions) are activated. Yjs CRDT real-time collaboration is fully enabled (lazy-init on solo users). PSD import and plugin marketplace complete the platform.
**FRs covered:** FR69, FR70, FR71, FR72, FR73, FR74, FR75 *(Phase 4)*

---

## Epic 1: Core Design Editor � Create & Edit Designs

Users can open the editor, create designs from scratch using shapes, text, and images, manipulate elements with professional controls (select, move, resize, rotate, z-order, align, group, lock), undo/redo all actions, and navigate the canvas fluently.

### Story 1.1: Monorepo Foundation & Development Environment `[INFRA]`

As a developer,
I want the Turborepo monorepo scaffolded with all apps and shared packages configured,
So that the entire team can run the full stack locally with a single command and CI/CD is operational from day one.

> **Note:** This is a prerequisite infrastructure story — no user-visible feature is delivered. It must be completed before any other stories can be implemented.

**Acceptance Criteria:**

**Given** the developer runs 
px create-turbo@latest design-editor --package-manager pnpm and scaffolds the full monorepo structure
**When** pnpm dev is executed at the monorepo root
**Then** apps/web (Next.js 15), apps/api (NestJS 11), and apps/worker (BullMQ) all start in parallel via Turborepo without errors

**Given** docker-compose up is run
**When** the compose file is applied
**Then** PostgreSQL 16, Redis 7, and LocalStack S3 are running and accessible to all apps

**Given** a commit is pushed to the repository
**When** GitHub Actions CI runs
**Then** the pipeline executes in order: lint, test, build, docker-build � with Turborepo remote cache enabled

**And** packages/common-types/env.ts Zod schema validates all required env vars at startup � apps fail fast if any are missing

### Story 1.2: Canvas Renderer & Element Foundation

As a designer,
I want a high-performance Canvas 2D rendering engine that draws elements at 60fps,
So that designing feels smooth and professional even with many elements on the canvas.

**Acceptance Criteria:**

**Given** packages/canvas-engine is initialized as a pure TypeScript package with zero React/Zustand/Next.js dependencies
**When** CanvasRenderer is initialized with a canvas element and a 200-element document
**Then** the render loop runs at <= 16ms per frame (60fps) on the benchmark document

**Given** the canvas renders on a HiDPI display with devicePixelRatio = 2
**When** elements are drawn
**Then** output is at 2x resolution � no blur or pixelation at any zoom level

**Given** useDocumentStore (Zustand) holds the element tree and is mutated
**When** an element is added, moved, or resized
**Then** the canvas engine re-renders via the DOM CustomEvent canvas:document-changed

**And** packages/canvas-engine is independently testable with Vitest using a mock canvas API

**And** HistoryManager enforces a maximum of 100 undo steps — older entries are evicted using LRU; memory usage stays bounded regardless of session length (P1b-history-memory-leak)

**And** when 50+ elements are drag-selected and moved simultaneously, the canvas issues a single batched dirty-flag re-render — not 50 individual re-renders; render time stays <= 16ms (P1a-bulk-transform-batching)

**And** all canvas CustomEvents are dispatched and received via strongly-typed helper functions in `packages/canvas-engine/events.ts` (e.g. `dispatchDocumentChanged(doc: DesignDocument)`, `onDocumentChanged(handler)`) — raw `new CustomEvent(...)` calls are never used directly in app code (T4-typed-event-bus)

### Story 1.3: Canvas Navigation � New Design & Zoom/Pan

As a designer,
I want to create a new design canvas with custom dimensions and navigate it freely,
So that I can set up my workspace before starting to design.

**Acceptance Criteria:**

**Given** the user is on the editor page and creates a new design
**When** the new design dialog appears
**Then** they can specify custom width and height in pixels for the canvas (FR1)

**Given** the canvas is open
**When** the user scrolls with the mouse wheel or pinches with a trackpad
**Then** the canvas zooms in and out smoothly without frame drops (FR7)

**Given** the user holds Space and drags
**When** the drag event fires
**Then** the canvas pans in the direction of drag with no lag (FR7)

**Given** the zoom level changes
**When** viewing text or vector elements at any level from 10% to 800%
**Then** all text and vector elements remain crisp and non-pixelated (FR20c)

**And** keyboard shortcuts Ctrl++, Ctrl+-, and Ctrl+0 (fit-to-screen) are functional

### Story 1.4: Basic Shape Tools � Rectangle & Ellipse

As a designer,
I want to draw Rectangle and Ellipse shapes on the canvas with solid fills and strokes,
So that I can build fundamental geometric elements in my designs.

**Acceptance Criteria:**

**Given** the Rectangle tool is selected
**When** the user clicks and drags on the canvas
**Then** a RectElement is created at the exact drag position and size (FR11)

**Given** the Ellipse tool is selected
**When** the user clicks and drags
**Then** an EllipseElement is created; holding Shift constrains to a perfect circle (FR11)

**Given** a shape is selected
**When** the user applies a solid fill color and stroke via the properties panel
**Then** the shape renders with the correct fill (hex/RGB color picker) and stroke width/color (FR15)

**And** pressing Escape after starting a drag cancels shape creation without adding an element

### Story 1.5: Text Element � Create & Edit with Google Fonts

As a designer,
I want to add and edit text elements with full Google Fonts support,
So that I can create professional typography in my designs.

**Acceptance Criteria:**

**Given** the Text tool is selected and the user clicks the canvas
**When** the click fires
**Then** a TextElement is created and enters edit mode immediately (FR12)

**Given** a text element is in edit mode
**When** the user types
**Then** text renders on canvas in real-time using the selected Google Font

**Given** the user opens the font picker and types a font name
**When** search fires
**Then** Google Fonts results appear within 500ms and the selected font is applied immediately (FR20)

**Given** a text element is selected
**When** the user changes font-size, bold, italic, underline, or text-alignment
**Then** the element re-renders with the new style without losing cursor position (FR12)

**And** Simple mode shows only font family, size, and color; Pro mode shows full typography controls (FR20f, UX-DR3)

### Story 1.6: Image Element � Upload & Place at Full Resolution

As a designer,
I want to upload images and place them on the canvas at full source resolution,
So that my designs use high-quality assets without quality degradation.

**Acceptance Criteria:**

**Given** the user clicks the Image tool or drags a file onto the canvas
**When** a JPG, PNG, or WebP file is selected
**Then** the image is uploaded to S3 at ssets/{userId}/ and placed on the canvas (FR13)

**Given** an image element renders on canvas
**When** drawn at any zoom level
**Then** it uses imageSmoothingQuality = high at full source resolution � no downsampling (FR20b, FR20d)

**Given** the user uploads an image
**When** the system stores it
**Then** the original file is stored unmodified � no automatic compression or resizing (FR20d)

**And** images are served via S3 signed URLs with 1-hour expiry � never direct bucket access

### Story 1.7: Element Selection, Transform & Z-Order

As a designer,
I want to select, move, resize, rotate, and reorder elements precisely,
So that I have full professional control over layout and composition.

**Acceptance Criteria:**

**Given** an element is on the canvas and the user clicks it
**When** the click registers
**Then** the element is selected with visible selection handles � corner and edge handles (FR2)

**Given** an element is selected and the user drags it
**When** the drag event fires
**Then** it moves and canvas re-renders at <= 16ms per frame; selection feels instant (FR2, NFR3, NFR5)

**Given** the user drags a corner handle of a selected element
**When** dragging
**Then** the element resizes proportionally; edge-handle drag resizes freely (FR2)

**Given** the user drags the rotation handle
**When** dragging
**Then** the element rotates about its center; Shift snaps to 15-degree increments (FR2)

**Given** multiple elements are layered
**When** the user right-clicks and selects Bring Forward, Send Backward, Bring to Front, or Send to Back
**Then** the z-order updates correctly and canvas re-renders (FR3)

### Story 1.8: Element Operations � Copy, Paste, Duplicate, Delete & Undo/Redo

As a designer,
I want standard clipboard and history operations on canvas elements,
So that I can work efficiently without fear of mistakes.

**Acceptance Criteria:**

**Given** an element is selected and the user presses Ctrl+C then Ctrl+V
**When** paste fires
**Then** an exact copy is pasted slightly offset from the original (FR4)

**Given** an element is selected and the user presses Ctrl+D
**When** duplicate fires
**Then** a duplicate is created, selected, and positioned offset (FR4)

**Given** an element is deleted via Delete key or right-click menu
**When** deletion fires
**Then** a toast appears: "Element deleted. [Undo]" (FR4)

**Given** any canvas action is performed (add, move, resize, delete, style change)
**When** Ctrl+Z is pressed
**Then** the action is undone and canvas returns to previous state (FR6)

**Given** an undo has been performed and Ctrl+Y is pressed
**When** redo fires
**Then** the action is redone correctly (FR6)

**And** undo/redo is managed by HistoryManager in packages/canvas-engine � not React state

### Story 1.9: Multi-Select, Align & Distribute

As a designer,
I want to select multiple elements and align or distribute them precisely,
So that I can create perfectly structured layouts efficiently.

**Acceptance Criteria:**

**Given** the user clicks and drags on empty canvas space
**When** the drag selection box intersects multiple elements
**Then** all intersected elements are selected (FR5)

**Given** multiple elements are selected and the user opens alignment controls
**When** an alignment action is chosen
**Then** elements align to: left edge, center horizontal, right edge, top edge, center vertical, or bottom edge (FR5)

**Given** multiple elements are selected
**When** the user clicks Distribute Horizontally or Vertically
**Then** elements are spaced with equal gaps between them (FR5)

**And** alignment reference toggles between "relative to selection" and "relative to canvas"

### Story 1.10: Group, Lock, Visibility & Smart Snap Guides

As a designer,
I want to group elements, lock them, toggle visibility, and benefit from smart snap guides,
So that I can organize complex designs with precise spatial control.

**Acceptance Criteria:**

**Given** multiple elements are selected and Ctrl+G is pressed
**When** grouping fires
**Then** they are grouped into a GroupElement movable and resizable as one unit (FR8)

**Given** a GroupElement is selected and Ctrl+Shift+G is pressed
**When** ungrouping fires
**Then** child elements are individually selectable (FR8)

**Given** an element is selected and the user clicks Lock in the layers panel
**When** locked
**Then** the element cannot be moved, resized, or deleted until unlocked; no transform handles appear (FR9)

**Given** the user drags an element near another element's edge, center, or canvas boundary
**When** within the snap threshold of 8px
**Then** snap guide lines appear and the element snaps precisely (FR20e, UX-DR12)

**Given** an element's visibility toggle is turned off in the layers panel
**When** toggled
**Then** the element disappears from canvas view but remains in the layer list (FR10)

### Story 1.11: Layers Panel & Simple/Pro Mode Toggle

As a designer or non-designer,
I want to switch between Simple and Pro toolbar modes and view an accessible layer list,
So that I use a UI complexity appropriate to my skill level.

**Acceptance Criteria:**

**Given** the editor is open and the user clicks the Simple/Pro mode toggle
**When** toggled
**Then** Simple mode shows only Text, Color picker, and Image upload; Pro mode shows all tools and controls (FR20f, UX-DR3)

**Given** the layers panel is open and the canvas contains elements
**When** viewing the layer list
**Then** each element is listed as a named row with drag-to-reorder for z-order changes (FR3)

**Given** a screen reader user navigates the layers panel
**When** each row is focused
**Then** the element type and name are announced as text descriptions of the canvas content (NFR14, UX-DR13)

**And** the layers panel toggle is keyboard accessible via Tab and Enter

---

## Epic 2: Visual Depth � Enhanced Elements & Multi-Page *(Phase 2)*

Users can apply gradient fills, blend modes, visual effects, non-destructive image filters, draw Bezier vector paths, and manage multi-page documents with animation export.

### Story 2.1: Gradient Fills (Linear & Radial)

As a designer,
I want to apply linear and radial gradient fills to shapes and text,
So that I can create visually rich designs with depth and dimension.

**Acceptance Criteria:**

**Given** an element is selected and the fill panel is open
**When** the user switches fill type from Solid to Linear Gradient or Radial Gradient
**Then** the gradient editor appears with at least 2 color stops (FR16)

**Given** the gradient editor is open
**When** the user adds, moves, or removes color stops and adjusts their colors or opacity
**Then** the canvas re-renders the gradient in real-time without frame drops (FR16)

**And** gradient data is stored as metadata in the design JSON � not rasterized

### Story 2.2: Blend Modes & Opacity

As a designer,
I want to control element opacity and apply blend modes,
So that I can create layered compositions with transparency effects.

**Acceptance Criteria:**

**Given** an element is selected
**When** the user adjusts the opacity slider (0-100%)
**Then** the element renders with correct transparency (FR17)

**Given** an element is selected and the blend mode dropdown is opened
**When** a mode is selected (Multiply, Screen, Overlay, Soft Light, etc.)
**Then** the canvas composites the element using Canvas 2D globalCompositeOperation (FR17)

**And** blend mode and opacity values survive save/reload of the design document

### Story 2.3: Visual Effects � Shadows, Blur & Glow

As a designer,
I want to apply drop shadow, inner shadow, blur, and glow effects to elements,
So that I can add depth and visual polish to my designs.

**Acceptance Criteria:**

**Given** an element is selected and the effects panel is open
**When** the user adds a Drop Shadow effect
**Then** they can configure color, X offset, Y offset, blur radius, and spread; canvas re-renders live (FR18)

**Given** a Blur effect is added with a radius value
**When** rendered
**Then** the element is blurred correctly using Canvas 2D filter API (FR18)

**And** multiple effects can be stacked on a single element; effects are stored as non-destructive metadata

### Story 2.4: Non-Destructive Image Filters

As a designer,
I want to apply brightness, contrast, saturation, and hue adjustments to image elements non-destructively,
So that I can fine-tune images without modifying the original asset.

**Acceptance Criteria:**

**Given** an image element is selected
**When** the user opens the Image Filters panel
**Then** sliders for Brightness, Contrast, Saturation, and Hue appear with their current values (FR19)

**Given** the user adjusts a filter slider
**When** the value changes
**Then** the canvas re-renders the filtered image in real-time; the original S3 asset remains unchanged (FR19)

**And** a Reset filters button restores all values to neutral defaults

### Story 2.5: Bezier Pen Tool � Vector Path Drawing

As a designer,
I want to draw custom vector paths using a Bezier pen tool,
So that I can create complex custom shapes beyond the preset shapes.

**Acceptance Criteria:**

**Given** the Pen tool is selected and the user clicks on the canvas
**When** clicking creates a straight segment and click-drag creates a curve
**Then** a PathElement is built incrementally (FR14)

**Given** the user clicks the first anchor point to close the path
**When** closed
**Then** a closed PathElement renders as a filled/stroked vector shape (FR14)

**Given** a PathElement is double-clicked
**When** edit mode activates
**Then** all anchor points and curve handles are visible and draggable (FR14)

**And** PathElement uses Canvas 2D Path2D API � SVG content is never injected into the DOM

### Story 2.6: Multi-Page Document Support

As a designer,
I want to create and manage multi-page documents,
So that I can design presentation decks and multi-format campaigns in a single project.

**Acceptance Criteria:**

**Given** a design document is open
**When** the user clicks Add Page
**Then** a new page is added with the same canvas dimensions; a thumbnail strip appears for navigation (FR40)

**Given** the page panel is visible
**When** the user drags a thumbnail to a new position
**Then** page order updates and the document reflects the new ordering (FR41)

**Given** a page is right-clicked with Duplicate or Delete selected
**When** the action fires
**Then** the page is duplicated with all elements, or deleted with an undo toast (FR41)

### Story 2.7a: Element & Page Animation Configuration `[Phase 2]`

As a designer,
I want to add entrance/exit animations to elements and configure page transition animations,
So that I can define rich animated content before exporting.

**Acceptance Criteria:**

**Given** an element is selected and the animation panel opens
**When** the user picks an entrance animation (Fade, Slide In, Scale Up)
**Then** the animation configuration is saved and previews in the editor timeline at the correct keyframe (FR42)

**Given** the user is viewing the page panel
**When** they configure a transition between two pages (Fade, Slide Left, etc.)
**Then** the transition previews correctly when the Play button is pressed in the editor (FR43)

**And** animation data is stored as metadata in the design document JSON — not baked into canvas elements

**And** animation config is fully verifiable in the editor preview without needing export — export verification is explicitly covered in Story 2.7b, not this story (M1-test-boundary)

### Story 2.7b: Animated Export — MP4 & GIF `[Phase 2]`

As a designer,
I want to export my animated design as an MP4 or GIF file,
So that I can share animated social content on any platform.

**Acceptance Criteria:**

**Given** a design with animations/transitions is open and the user clicks Export → MP4
**When** the async export job is submitted
**Then** the worker renders each frame and encodes an MP4 (max 30s duration, 1080p max resolution) using server-side headless rendering (FR42, FR43)

**Given** the user selects GIF as export format
**When** the export job processes
**Then** a GIF is produced with configurable frame rate (12/24fps) and loop settings — file size < 15MB for <= 10s at 12fps

**Given** the animated export completes
**When** the signed download URL is ready
**Then** an email notification is sent with the download link valid for 24h (FR34)

---

## Epic 3: AI File Import � Import & Preserve Adobe Files

Users can upload .ai files through a secure 3-stage async pipeline. Smart Hybrid conversion preserves text as editable TextElements and vectors as editable PathElements.

### Story 3.1: File Upload Endpoint & Pre-Validation Gate

As a designer,
I want to upload a file with immediate security validation,
So that malicious or incompatible files are rejected before any processing begins.

**Acceptance Criteria:**

**Given** the user selects a file via the file picker or drags an .ai file directly from the desktop onto the editor canvas
**When** POST /api/v1/import-jobs receives the multipart request
**Then** the API validates: file size <= 50MB (400 if exceeded), magic bytes confirm .ai format (422 if mismatch), ClamAV virus scan passes (422 if infected) (FR22, G1-drag-drop)

**Given** validation passes
**When** the file is stored
**Then** it is uploaded to S3 at imports/{userId}/{jobId}/original.ai via signed URL – not stored on server disk (FR22)

**Given** the file is from a pre-CS6 Illustrator version
**When** validation detects it
**Then** the API returns a specific error: "Re-save as AI CS6+ or SVG" with a fallback rasterize option (FR26, UX-DR14)

**And** rate limit is enforced: max 5 imports/hour/user, max 3 concurrent – HTTP 429 + Retry-After header
**And** drag-and-drop target is active on the editor page for .ai files – dropping a file triggers the import flow identical to click-to-upload

### Story 3.2: Async Import Job Queue & Status Polling

As a designer,
I want to track my import progress in real-time,
So that I know what is happening and can continue browsing without losing my import.

**Acceptance Criteria:**

**Given** the job is enqueued and the API returns HTTP 201 with a jobId
**When** the browser starts polling GET /api/v1/import-jobs/:id every 3 seconds
**Then** the UI shows 3-stage progress: "Uploading..." then "Analysing layers..." then "Converting elements..." (FR25, UX-DR1)

**Given** the user closes the browser tab during import
**When** they return later
**Then** an in-app notification and email notify them the import is complete; result is cached for 24h (FR25, UX-DR10)

**And** job IDs are UUIDv4; ownership is validated on every status/result API call

### Story 3.3: Smart Hybrid Conversion Engine (Inkscape Worker) `[COMPLEX]`

As a designer,
I want my .ai file converted to fully editable design elements,
So that text is editable text, vectors are editable paths, and only incompatible effects are rasterized.

**Acceptance Criteria:**

**Given** the BullMQ worker dequeues an IMPORT_AI_FILE job
**When** Inkscape CLI is spawned in an isolated container (PostScript/JS disabled, no network, 512MB RAM, 30s timeout)
**Then** Inkscape converts .ai to SVG without any SVG/vector content injected into the DOM (FR23)

**Given** the SVG is parsed by canvas-engine/smart-hybrid/categorizer.ts
**When** each element is categorized
**Then** text elements become TextElement, pure vector paths become PathElement, complex blend-mode elements become ImageElement (rasterized PNG at 2x DPI) (FR23)

**Given** the result DesignDocument JSON is built
**When** uploaded to S3
**Then** the job status is updated to completed with a signed URL for the result (FR23)

**Given** Inkscape times out at 30 seconds
**When** the timeout fires
**Then** the container is force-killed, resources cleaned up, and job status set to failed with error INKSCAPE_TIMEOUT (FR26)

**And** if the same Inkscape worker causes 3 consecutive failures within 1 hour, the worker automatically pauses that job type and emits a `WORKER_HEALTH_ALERT` event — admin is notified without requiring manual dashboard check (P2a-worker-auto-pause)

**And** the Inkscape container is spawned with `--network=none` Docker flag; a security smoke test confirms any outbound network call from within the container times out within 1s — verified on every CI/CD deployment (C3-network-isolation)

**And** the SVG categorizer uses a feature-presence decision tree (not a numeric complexity score): `hasClipMask || hasPattern || hasBlendMode` → `ImageElement`; `isTextNode` → `TextElement`; `isPurePath && nodeCount <= 500` → `PathElement`; `isPurePath && nodeCount > 500` → `ImageElement` with a QA Report warning "Path simplified due to complexity (N nodes)" (T4-categorization-decision-tree)

### Story 3.4: Import QA Report Modal

As a designer,
I want to see a clear visual before/after QA report before opening an imported file,
So that I know exactly how my file was interpreted before committing.

**Acceptance Criteria:**

**Given** the worker completes and the browser receives status: completed
**When** the QA Report data is available
**Then** the Import QA Report modal opens showing: Text preserved (N elements), Font substitutions (A to B with visual preview), Color accuracy (delta E), Effects rasterized (N elements with thumbnail) (FR24, UX-DR2)

**Given** a font substitution is listed in the QA Report (e.g. Helvetica Neue substituted with Arial)
**When** the user clicks the font warning row
**Then** a font upload inline action appears within the modal allowing the user to upload the correct TTF/OTF file — if uploaded successfully, the warning badge clears before opening the document (G2-font-upload-from-modal)

**Given** the QA Report modal is open
**When** navigated via keyboard
**Then** modal is fully keyboard-navigable and screen reader announces each warning (NFR14, UX-DR2)

**Given** the user clicks Open Anyway
**When** the document loads
**Then** the editor opens with all converted elements at correct positions (FR24)

**Given** the user clicks Cancel
**When** cancelled
**Then** the import job is discarded and the user returns to the dashboard (FR24)

### Story 3.5: Import Error Handling & Graceful Degradation

As a designer,
I want clear actionable error messages when my import fails,
So that I know exactly what went wrong and what to do next.

**Acceptance Criteria:**

**Given** an import job fails at any processing stage
**When** the browser polls and receives status: failed
**Then** a specific error message is shown – not a generic "Something went wrong" (FR26)

**Given** the import service (Inkscape worker) is entirely down
**When** a user attempts to import
**Then** the editor remains fully operational for create/edit/export; only the import button shows a temporary unavailability message

**And** failed import jobs are retried automatically once before being permanently marked as failed

---

## Epic 4: Export – Publish Designs in Any Format

Users can export designs as PNG, PDF, and self-contained HTML/CSS. All exports are pixel-accurate at full source resolution with async queue progress feedback and email notification.

### Story 4.1: PNG Export – Pixel-Accurate with Async Queue

As a designer,
I want to export my design as a transparent-background PNG at exact specified dimensions,
So that I have a high-quality image asset ready for immediate use.

**Acceptance Criteria:**

**Given** the user selects PNG in the Export dialog and clicks Export
**When** POST /api/v1/export-jobs is created
**Then** the browser shows a queue position indicator: "#N in queue (~Xs)" (FR28, FR32, UX-DR6)

**Given** the worker processes the export job
**When** server-side rendering completes
**Then** the PNG is at exactly the specified dimensions – no upscaling artifacts or quality degradation (FR28b)

**Given** the export completes
**When** the signed download URL is ready
**Then** the browser auto-downloads the file and an email notification is sent to the user (FR34, UX-DR6)

**And** if export fails, it is retried once automatically before the error is reported to the user

### Story 4.2: PDF Export (Screen-Optimized)

As a designer,
I want to export my design as a screen-optimized PDF,
So that I can share designs in a universally readable format.

**Acceptance Criteria:**

**Given** the user selects PDF in the Export dialog
**When** the dialog opens
**Then** the format is clearly labeled "PDF (Screen)" – not "PDF (Print)" (FR29, UX-DR4)

**Given** the user selects PDF for a large-format canvas
**When** the export dialog confirms
**Then** a warning appears: "Screen PDF may not be suitable for print. Use Print PDF (Studio) for press-ready output." (UX-DR4)

**Given** the PDF export worker processes the job
**When** the PDF is generated
**Then** fonts are embedded and images are included at appropriate screen resolution (FR29)

### Story 4.3: HTML/CSS Export – Self-Contained Static Page

As a designer,
I want to export my design as a self-contained HTML/CSS web page,
So that I can publish it on any website without external dependencies.

**Acceptance Criteria:**

**Given** the user selects HTML/CSS and clicks Export
**When** the worker generates the output
**Then** a single .html file is produced with all CSS inline and all images embedded – no external references (FR30, FR30b)

**Given** image elements exist in the design
**When** the HTML/CSS is exported
**Then** images are included at original source resolution – not recompressed (FR31)

**Given** the exported HTML is opened in any supported browser
**When** rendered
**Then** the visual output matches the canvas design at 1:1 pixel fidelity (FR30b)

**And** export P95 is <= 8 seconds; async queue and email notification apply identically to PNG/PDF (NFR8)

**And** all text content in the exported HTML is HTML-entity-escaped before insertion — no raw user input is ever emitted as executable HTML or JS in the export output (P5-xss-prevention)

---

## Epic 5: Templates & Asset Library – Discover & Start Faster

Users can browse, search, preview, and open curated templates to start designing immediately.

### Story 5.1: Template Library – Browse, Search & Preview

As a non-designer,
I want to browse and search a curated template library filtered by category,
So that I can find the right starting point in seconds.

**Acceptance Criteria:**

**Given** the user opens the template library
**When** the page loads
**Then** templates are organized by category (Social Media, Presentation, Print, Banner) and filterable (FR35)

**Given** the user types in the search box
**When** searching for "Instagram post"
**Then** results appear within 500ms filtered by keyword match in title and tags (FR35)

**Given** the user hovers over a template card
**When** the preview action triggers
**Then** a full-size preview modal opens showing the template at intended dimensions (FR36)

**And** template pages are SSG with SEO meta tags and OG images – crawlable by search engines

**Given** a search returns 0 results
**When** the empty state renders
**Then** a message appears: "No templates found for '[query]'. Try a different keyword." with a Clear search button (C4-empty-state)

**And** template grid uses cursor-based pagination loading 24 templates per page with infinite scroll triggered at 80% scroll depth — no loading spinner blocks the entire grid (C4-pagination)

### Story 5.2: Open Template as Editable Design

As a user,
I want to open any template as a fully editable design in one click,
So that I can start customizing immediately.

**Acceptance Criteria:**

**Given** the user clicks "Use this template"
**When** the action fires
**Then** a new design is created as a copy of the template (original unmodified) and the editor opens (FR37)

**Given** the template contains text, shapes, and images
**When** the design opens
**Then** all elements are fully editable with correct positions, fonts, colors, and sizes (FR37)

**And** opening a template works in try-without-signup mode – guests can use templates without an account (FR52, UX-DR7)

---

## Epic 6: Collaboration & Sharing – Share, Comment & Co-Create

Users can share designs via view-only links, leave anchored comments, view version history, and restore previous saves.

### Story 6.1: Share Design via View-Only Link

As a designer,
I want to generate a shareable view-only link for my design,
So that clients can view my work in a browser without needing an account.

**Acceptance Criteria:**

**Given** the user opens the Share dialog and clicks Create share link
**When** the link is generated
**Then** a unique view-only URL is created and copied to clipboard (FR44)

**Given** the share link is visited by anyone without an account
**When** the page loads
**Then** the design renders correctly in read-only view – no editing controls visible (FR44)

**Given** the user enables password protection before generating the link
**When** a visitor opens the link
**Then** they are prompted for the password before the design renders (FR45)

**And** share link pages include OG meta tags (design thumbnail, title) for social sharing

### Story 6.2: Anchored Comments & Thread Resolution

As a collaborator,
I want to leave comments anchored to specific elements or positions,
So that feedback is contextual and easy to locate.

**Acceptance Criteria:**

**Given** a user opens a shared design and selects the Comment tool
**When** they click on an element
**Then** a comment bubble appears anchored to that element's canvas position (FR46)

**Given** a comment thread exists and another user types a reply
**When** the reply is submitted
**Then** it is added to the thread with the author's name and timestamp (FR47)

**Given** a comment thread is resolved
**When** the user clicks Resolve
**Then** the thread is marked resolved and collapses; show/hide toggle available for resolved threads (FR47)

### Story 6.3: Version History & Restore

As a designer,
I want to view and restore previous saved versions of my design,
So that I can recover from mistakes or revert to an earlier direction.

**Acceptance Criteria:**

**Given** the user opens Version History
**When** the panel appears
**Then** the last 10 saves (up to 30 days) are listed with timestamps (FR48)

**Given** the user selects a historical version and clicks Preview
**When** the preview loads
**Then** the design renders in read-only view at that historical state (FR48)

**Given** the user clicks Restore this version
**When** confirmed
**Then** the current design is overwritten with the historical version and a new autosave is created (FR48)

**And** version history entries are created on MANUAL saves and every 10th autosave event — not on every autosave tick; this bounds storage to a predictable number of snapshots per session (C5-version-selection-logic)

---

## Epic 7: User & Design Management – Accounts, Autosave & Onboarding

Visitors can try the editor without signup; registered users manage designs, autosave, trash recovery, and automated email notifications.

### Story 7.1: Authentication – Google OAuth & Email/Password

As a visitor,
I want to sign up and log in via Google OAuth or email/password,
So that I can access my designs securely from any device.

**Acceptance Criteria:**

**Given** the user clicks Sign in with Google
**When** the Google OAuth flow completes
**Then** they are authenticated and redirected to the dashboard with a JWT access token (15min) and httpOnly refresh token (30 days) (FR51)

**Given** the user submits the email/password registration form
**When** the form is valid
**Then** the password is hashed with bcrypt cost-12 and a welcome email is sent (FR51)

**Given** 10 failed login attempts occur from the same IP within 1 minute
**When** the 11th attempt is made
**Then** the API returns HTTP 429 with a Retry-After header (Security NFR)

**And** all protected API routes validate JWT via JwtAuthGuard – no route is accessible without a valid token

**And** the refresh token cookie has `Domain=.{root-domain}.com` (not a subdomain) and `SameSite=Lax` — ensuring Safari ITP does not block it when the app and API share the same registrable domain (P4-safari-itp-cookie)

### Story 7.2: Try-Without-Signup Mode & Frictionless Onboarding

As a first-time visitor,
I want to try the editor immediately without creating an account,
So that I can evaluate the product before committing to signup.

**Acceptance Criteria:**

**Given** the user clicks "Try for free – no signup" on the landing page
**When** the editor opens
**Then** the editor is fully functional with a blank canvas or selected template – no authentication required (FR52, UX-DR7)

**Given** the guest user clicks Export
**When** the export action fires
**Then** a "Sign up free to export" prompt appears; Google OAuth 1-click signs them in and completes the export immediately (FR52, UX-DR7)

**Given** a new user completes signup and exports their first design from the Free tier
**When** the export file is generated
**Then** a "Made with DesignEditor" watermark badge is embedded in the exported image – this is visible Phase 1 behavior for the viral loop; Pro users can opt out (UX-DR8, G5-viral-badge-phase1)

**Given** a new user completes signup
**When** 10 minutes pass after their first design action
**Then** a welcome email is sent: "You just created your first design. Have an AI file? Import it with Pro." (FR57)

**And** the guest session design is preserved after signup – no work is lost

### Story 7.3: Design Dashboard – Create, Rename, Organize & Delete

As a registered user,
I want to manage all my designs from a central dashboard,
So that I can find, rename, organize, and delete my work easily.

**Acceptance Criteria:**

**Given** the user is on the designs dashboard and clicks New Design
**When** the dialog appears
**Then** they can specify canvas dimensions or select a template (FR53)

**Given** the user hovers over a design card and clicks Rename
**When** the inline text field appears
**Then** pressing Enter saves the new name (FR53)

**Given** the user right-clicks a design card and selects Duplicate
**When** duplicate fires
**Then** an exact copy of the design is created with the name "[Original Name] (copy)" and appears at the top of the design list — enabling creating multiple size variants for a campaign (G4-duplicate-design)

**Given** the user selects a design and clicks Delete
**When** deletion occurs
**Then** a toast appears: "Design deleted. [Undo] [View Trash]" and the design moves to Trash with 30-day retention (FR53, FR55, UX-DR5)

**Given** the user is on the Free tier and has used all 3 exports for the day
**When** they click Export on any design
**Then** an upgrade prompt appears: "You've used 3/3 free exports today. Upgrade to Pro for unlimited exports." — no silent failure (G6-export-limit-ux)

**And** designs are sorted by last modified date; search by design name is available

### Story 7.4: Design Autosave & Persistence

As a designer,
I want my design to autosave automatically every 30 seconds and on navigation,
So that I never lose work due to browser crash or accidental page close.

**Acceptance Criteria:**

**Given** the user is editing a design and 30 seconds have passed
**When** the debounced autosave triggers
**Then** use-autosave.ts sends PATCH /api/v1/designs/:id with the document JSON (FR54)

**Given** the server confirms the save with HTTP 200
**When** the response arrives
**Then** the client clears the pending-save flag – design is confirmed durable on the server (FR54)

**Given** the user navigates away from the editor
**When** the beforeunload event fires
**Then** a synchronous save is triggered before the page unloads (FR54)

**And** autosave debounce is 500ms after the last change – it does not block or flicker the editor UI (NFR10)

**And** autosave sends ONLY the design JSON document — image asset S3 keys are stored as references, not re-uploaded on each save; assets are uploaded once on first use and reused by key reference (P3a-no-asset-reupload)

### Story 7.5: Email Notifications System

As a user,
I want to receive email notifications for completed exports and key account events,
So that I stay informed without watching the app constantly.

**Acceptance Criteria:**

**Given** an export job completes in the worker
**When** the SEND_EMAIL BullMQ job is processed
**Then** an email is sent with the subject "Your export is ready" and a signed download link valid for 24h (FR57)

**Given** a new user signs up
**When** D0, D3, and D7 nurture triggers fire
**Then** emails are sent with appropriate content: D0 welcome, D3 use-case story, D7 re-engagement (FR57)

**And** all nurture emails include an unsubscribe link; transactional alerts (export complete) are exempt

**And** a nightly BullMQ job `CLEANUP_ORPHAN_ASSETS` runs at 03:00 UTC — deletes S3 objects where no active design document references the key within the last 24 hours; job result logged for admin audit (P3b-orphan-asset-cleanup)

### Story 7.6: Multi-Tab Conflict Resolution

As a designer,
I want to be warned and offered options if I open the same design in multiple browser tabs,
So that I don't accidentally overwrite my own work or lose changes.

**Acceptance Criteria:**

**Given** a user has a design open in Tab A and then opens the *same* design in Tab B
**When** Tab B loads the design
**Then** a modal appears in Tab B: "This design is already open in another tab. Open anyway (read-only) / Take over editing / Cancel" (G3-multi-tab-conflict)

**Given** the user selects "Take over editing" in Tab B
**When** the action fires
**Then** Tab B becomes editable, and Tab A receives a notification: "Editing session moved to another tab. This tab is now read-only." (G3-multi-tab-conflict)

**Given** the user selects "Open anyway (read-only)" in Tab B
**When** the action fires
**Then** Tab B opens the design in read-only mode, and Tab A remains editable without interruption (G3-multi-tab-conflict)

---

## Epic 8: Brand Kit & Team Workspace – Scale to Teams & Agencies *(Phase 3)*

Studio users create Brand Kits with Owner-locked enforcement, team workspaces, and RBAC-controlled collaboration.

### Story 8.1: Brand Kit – Create, Manage & Lock

As a Studio user,
I want to create a Brand Kit with my brand's colors, logos, and fonts,
So that my design team always uses consistent brand assets.

**Acceptance Criteria:**

**Given** a Studio user opens Brand Kit settings
**When** they create a new Brand Kit
**Then** they can add color swatches (hex), logo images (uploaded to S3), and font references (Google Fonts or uploaded fonts) (FR58)

**Given** the Brand Kit is populated and the user applies it in the editor
**When** the editor loads
**Then** Brand Kit colors and fonts appear as a shortcut palette and font list (FR60)

**Given** the Brand Kit owner clicks Lock
**When** the kit is locked
**Then** only Owner and Admin roles can edit it; Editors can only view and use the assets (FR59)

**And** Brand Kit functionality is available in Phase 1 for Pro users, but locking is a Phase 3 feature (G8-brand-kit-phase1)

### Story 8.2: Team Workspace – Create, Invite & Role Assignment

As a Studio workspace owner,
I want to create a workspace, invite members with specific roles, and manage invite delivery,
So that my team has appropriate access-controlled collaboration.

**Acceptance Criteria:**

**Given** a Studio user creates a workspace and invites a member by email
**When** the invite is sent
**Then** an invite email is sent with a UUID token (single-use, expires 48 hours) (FR61)

**Given** the invite is sent and the owner views the invite list
**When** the list loads
**Then** each invite shows status: Sent, Accepted, or Bounced – with a Resend button for bounced invites (FR61, UX-DR9)

**Given** a role is assigned to a workspace member
**When** the member accesses the workspace
**Then** RBAC is enforced server-side on every API call – role cannot be escalated from the client (FR62)

**Given** a Viewer-role member sends a PATCH /api/v1/designs/:id mutation request directly via API (attempting role escalation)
**When** the request hits the server
**Then** RolesGuard returns HTTP 403 FORBIDDEN with error code INSUFFICIENT_ROLE – no mutation is applied regardless of client-side role claim (G7-role-escalation-testable)

**And** workspace membership is capped at 10 members in Phase 3; attempting to add an 11th returns HTTP 422 WORKSPACE_MEMBER_LIMIT_EXCEEDED

### Story 8.3: Shared Designs in Workspace

As a team member,
I want to access and collaborate on shared designs in the workspace,
So that the whole team works from a single source of truth.

**Acceptance Criteria:**

**Given** an Editor opens the Shared Designs folder
**When** the list loads
**Then** all workspace-shared designs are listed with creator name and last modified date (FR63)

**Given** a Viewer opens a shared design
**When** the editor loads
**Then** they see the design in read-only mode with comments available � editing controls are disabled (FR63)

**Given** an Editor opens a shared design and saves changes
**When** autosave fires
**Then** changes are saved to the shared design and visible to all workspace members (FR63)

---

## Epic 9: Platform Administration � Monitor & Operate at Scale

Internal admins have user management, content moderation, import job queue monitoring, system health metrics, and analytics export.

### Story 9.1: Admin Dashboard � User Management & Content Moderation

As a platform admin,
I want to search, view, and manage all user accounts and moderate published designs,
So that I can maintain platform integrity and respond to policy violations quickly.

**Acceptance Criteria:**

**Given** an admin logs in to the admin dashboard at /admin
**When** they search for a user by email or name
**Then** the user's account details, design count, and import history are shown (FR64)

**Given** an admin views a user's published designs and identifies a policy-violating design
**When** they click Unpublish
**Then** the design immediately becomes private and an automated warning email is sent to the user (FR65)

**And** all admin actions are logged with admin ID, timestamp, and action type for auditability

**Given** a non-admin authenticated user directly navigates to `/admin` via URL
**When** the page or any `/admin/*` API endpoint is accessed
**Then** the server returns HTTP 403 FORBIDDEN and the admin dashboard HTML is never rendered — not a redirect to login (C6-admin-route-guard)

### Story 9.2: Import Job Queue Monitor

As a platform admin,
I want to monitor the import job queue and manually retry or cancel stuck jobs,
So that users do not wait indefinitely during processing backlogs.

**Acceptance Criteria:**

**Given** the admin opens the Import Queue monitor
**When** the page loads
**Then** all jobs are listed with: status, user email, file size, queue time, and processing duration (FR66)

**Given** a job is stuck in processing for more than 60 seconds
**When** the admin clicks Retry
**Then** the job is re-enqueued and a fresh Inkscape worker processes it (FR66)

**Given** the admin clicks Cancel on a queued or processing job
**When** confirmed
**Then** the job is removed, any active Inkscape container is stopped, and the user is notified (FR66)

**And** the queue monitor auto-refreshes every 10 seconds

**And** if queue depth exceeds 50 jobs OR any single job is stuck in `processing` for more than 5 minutes, a red alert badge automatically appears on the Admin dashboard header — no page refresh required (P2b-queue-depth-auto-alert)

### Story 9.3: System Health Dashboard & Analytics Export

As a platform admin,
I want to view real-time system health metrics and export analytics reports,
So that I can monitor platform performance and share business data with the founding team.

**Acceptance Criteria:**

**Given** the admin opens the System Health dashboard
**When** the page loads
**Then** the following metrics are shown: import success rate (%), P95 import latency (seconds), DAU, and free-to-Pro conversion rate (%) (FR67)

**Given** the admin sets a date range and clicks Export Report
**When** the export processes
**Then** a CSV file is downloaded containing all metrics for the selected period (FR68)

**And** metrics are computed from server-side event logs � not client-side analytics � ensuring accuracy

---

## Epic 10: Monetization, AI & Real-Time Collaboration *(Phase 4)*

Subscription tiers are enforced, AI features activated, Yjs CRDT real-time co-editing enabled, and PSD import added.

### Story 10.1: Subscription Tiers & Billing Enforcement

As a user,
I want to subscribe to Pro or Studio plans and have features unlocked accordingly,
So that I can access premium capabilities with clear understanding of what I am paying for.

**Acceptance Criteria:**

**Given** the user clicks Upgrade and completes the Stripe/Paddle checkout flow
**When** the subscription is confirmed
**Then** their subscription tier is updated in the database and feature gates activate immediately (FR69)

**Given** a Free-tier user attempts to import an .ai file
**When** the import endpoint is called
**Then** TierGuard returns HTTP 403 INSUFFICIENT_TIER with an upgrade prompt � no import is processed (FR70)

**Given** a Free-tier user exports a design
**When** the export is generated
**Then** an attribution badge "Made with DesignEditor" is embedded in the exported file (FR71)

**And** TierGuard is in code from Phase 1 but gated off � Phase 4 activates it

### Story 10.2: AI Features � Background Removal, Text-to-Image & Magic Resize

As a Pro/Studio user,
I want AI-powered design tools that automate tedious tasks,
So that I can produce better designs faster.

**Acceptance Criteria:**

**Given** an image element is selected and the user clicks Remove Background
**When** the remove.bg API processes the image
**Then** the background is removed and the element updates with a transparent PNG (FR72)

**Given** the user enters a text prompt in the Text-to-Image panel
**When** the OpenAI/Stability AI API responds
**Then** generated images appear in a selection grid; the chosen image is placed on the canvas (FR73)

**Given** the user clicks Magic Resize and selects a target platform
**When** the resize processes
**Then** the design is reformatted to the target dimensions with AI-adjusted layout (FR74)

### Story 10.3: Real-Time Collaboration (Yjs CRDT)

As a team member,
I want to co-edit a design simultaneously with teammates in real-time,
So that we can collaborate on complex designs without version conflicts.

**Acceptance Criteria:**

**Given** a user opens a design that another user also has open in a collab session
**When** both are connected
**Then** Yjs CRDT initializes with lazy-init (0ms overhead for solo users) and changes propagate in real-time (FR49)

**Given** two users make simultaneous edits to different elements
**When** the CRDT merges the changes
**Then** both users' changes are preserved without conflict (FR49)

**Given** a collaborator is editing
**When** the current user views the canvas
**Then** the collaborator's cursor position and selected element highlight are visible in real-time (FR50)

**And** Yjs CRDT activates ONLY when a collab session is opened — solo users have exactly 0ms overhead

**And** when two users simultaneously move *different* elements, both mutations propagate and are visible to the other user within 200ms — verified via Playwright E2E test with 2 independent browser contexts (M2-crdt-timing-ac)

**And** a solo user opening a design incurs 0ms Yjs initialization cost — `performance.mark('yjs-init')` fires only when a second user joins the document session, never on solo open (M3-solo-zero-overhead)
