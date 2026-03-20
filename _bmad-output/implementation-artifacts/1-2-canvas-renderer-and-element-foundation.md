# Story 1.2: Canvas Renderer & Element Foundation

Status: done

## Story

As a designer,
I want a high-performance Canvas 2D rendering engine that draws elements at 60fps,
so that designing feels smooth and professional even with many elements on the canvas.

## Acceptance Criteria

1. `packages/canvas-engine` remains a pure TypeScript package with zero React, Zustand, or Next.js dependencies after implementation.
2. `CanvasRenderer` can initialize against a real canvas element and render a synthetic 200-element document within the story's benchmark harness at an average of `<= 16ms` per frame.
3. HiDPI rendering is handled correctly: when `devicePixelRatio = 2`, the canvas backing store scales to 2x while the CSS size remains logical, producing crisp output without blur.
4. `apps/web` introduces a `useDocumentStore` Zustand store for the design document, and document mutations trigger canvas updates through typed `canvas:document-changed` event helpers rather than raw `new CustomEvent(...)` calls.
5. `packages/canvas-engine` remains independently testable with Vitest using the existing mock canvas setup.
6. `HistoryManager` preserves a bounded 100-entry undo history, clears redo history on new pushes, and evicts oldest snapshots to keep memory bounded.
7. Batched document mutations covering 50+ moved elements schedule a single dirty-frame render, not one synchronous render per element mutation.
8. `packages/canvas-engine/events.ts` exposes strongly typed dispatch/listener helpers for canvas events used by this story, and app code only consumes those helpers.

## Tasks / Subtasks

- [x] Task 1: Define shared document and element foundation types in `@design-editor/common-types` (AC: 3, 4)
  - [x] Create `packages/common-types/src/elements.ts` with the minimum type system needed for renderer work: `DesignDocument`, `CanvasElement`, base element fields, and concrete element variants for `rect`, `ellipse`, `text`, `image`, and `group`
  - [x] Include canvas sizing and geometry primitives the renderer and hit tester need now, but keep them zero-runtime types only
  - [x] Export the new element types from `packages/common-types/src/index.ts`

- [x] Task 2: Replace `canvas-engine` stubs with renderer foundation code (AC: 1, 2, 3, 7)
  - [x] Upgrade `packages/canvas-engine/src/canvas-renderer.ts` to own canvas initialization, resize handling, dirty-flag invalidation, requestAnimationFrame scheduling, document assignment, and teardown
  - [x] Implement HiDPI backing-store scaling using `devicePixelRatio` and preserve logical canvas sizing
  - [x] Set image smoothing quality for raster drawing and structure the renderer so future zoom/pan work in Story 1.3 can extend it without rewrites
  - [x] Ensure multiple document mutations before the next animation frame coalesce into one render pass

- [x] Task 3: Build element rendering and hit-test foundations without pulling future story scope forward (AC: 2, 3)
  - [x] Upgrade `packages/canvas-engine/src/element-factory.ts` to resolve draw strategies by element type instead of returning `null`
  - [x] Add `packages/canvas-engine/src/elements/` modules if needed for element-specific draw logic, keeping files in kebab-case
  - [x] Implement `packages/canvas-engine/src/hit-tester.ts` with minimal bounds-based hit testing only; transform handles, rotate handles, snapping, and selection chrome stay in later stories

- [x] Task 4: Standardize typed canvas event helpers (AC: 4, 8)
  - [x] Replace the generic `CanvasEventMap` placeholder in `packages/canvas-engine/src/events.ts` with concrete typed helper APIs
  - [x] Add helpers for at least `canvas:document-changed` and any additional event introduced by this story
  - [x] Ensure app and renderer integration use the helper functions exclusively instead of constructing raw `CustomEvent` objects inline

- [x] Task 5: Wire the web editor shell to a real document store and canvas stage (AC: 4)
  - [x] Add `zustand` to `apps/web` because the package does not currently depend on it
  - [x] Create `apps/web/stores/use-document-store.ts` using the architecture's `use{Name}Store` convention
  - [x] Create `apps/web/app/editor/[id]/_components/canvas-stage.tsx` to own the `<canvas>` element, instantiate `CanvasRenderer`, seed or load an in-memory document, and bridge store mutations to typed event helpers
  - [x] Update `apps/web/app/editor/[id]/page.tsx` to render the canvas stage instead of the current static shell
  - [x] Keep toolbar, zoom/pan UI, transform handles, persistence, and autosave out of this story

- [x] Task 6: Preserve and harden undo/redo history behavior (AC: 6)
  - [x] Extend the existing `packages/canvas-engine/src/history-manager.ts` behavior rather than replacing it with an unrelated cache abstraction
  - [x] Add tests for eviction, undo, redo, and redo clearing after a fresh push

- [x] Task 7: Add renderer-focused tests and a benchmark harness (AC: 2, 3, 5, 7, 8)
  - [x] Add Vitest coverage next to source files for HiDPI sizing, typed event helpers, batched invalidation, history behavior, and basic hit testing
  - [x] Add a synthetic 200-element renderer benchmark/spec in `packages/canvas-engine` so the 60fps target has an executable verification path
  - [x] Add a test that simulates 50+ element move mutations and proves the renderer schedules one dirty render cycle

- [x] Task 8: Run workspace validation before handoff (AC: 1-8)
  - [x] Run `pnpm lint`
  - [x] Run `pnpm test`
  - [x] Run `pnpm build`

## Dev Notes

### Story Intent and Scope Boundaries

- This story establishes the rendering and document foundations that Stories 1.3 through 1.7 will build on.
- Implement the renderer, typed events, store integration, and base element model now.
- Do not pull future scope into this story: no zoom/pan UX, no shape creation toolbar, no text editing UI, no image upload flow, no selection handles, no z-order commands, and no autosave API calls yet.

### Current Codebase State

- `packages/canvas-engine/src/canvas-renderer.ts`, `element-factory.ts`, and `hit-tester.ts` are still stubs.
- `packages/canvas-engine/src/history-manager.ts` already enforces a 100-entry cap and has one smoke test; extend this implementation instead of rewriting it from scratch.
- `packages/canvas-engine/src/events.ts` is only a placeholder type today and must become the typed event boundary required by the architecture and epic.
- `packages/canvas-engine/vite.config.ts` already uses `vitest-canvas-mock` with `jsdom`; reuse that setup.
- `apps/web/app/editor/[id]/page.tsx` is currently just a shell that prints the document id.
- `apps/web` does not yet contain `stores/` or editor `_components/`, and `zustand` is not currently listed in `apps/web/package.json`.
- `packages/common-types/src/index.ts` currently exports `api-types` and `env`; renderer-facing document types still need to be introduced.

### Technical Requirements

- Keep `@design-editor/canvas-engine` dependency-free from React, Next.js, and Zustand. It may depend on `@design-editor/common-types` for shared types.
- Use Canvas 2D APIs directly. Do not introduce Konva, Fabric.js, Pixi, SVG-in-DOM rendering, or another rendering framework.
- Structure renderer invalidation around a dirty flag plus a single scheduled animation frame so bulk mutations coalesce naturally.
- HiDPI support must be handled in renderer setup by separating logical size from backing-store size and reapplying scale when the device pixel ratio changes.
- Keep the renderer API small and imperative. The React side should own lifecycle; the engine should own drawing.
- Use kebab-case file names and keep tests co-located with the source they verify.

### Architecture Compliance

- Frontend state belongs in Zustand store slices under `apps/web/stores/`; the renderer itself stays outside the React and Zustand dependency graph.
- The React/editor layer may subscribe to Zustand and call typed event helpers, but `packages/canvas-engine` must not import the store.
- Shared canvas/document types belong in `packages/common-types/src/`.
- The renderer foundation belongs in `packages/canvas-engine/src/`.
- Future element-specific rendering modules should live in `packages/canvas-engine/src/elements/`, matching the architecture's target structure.
- Browser APIs in play for this story are Canvas 2D, `Path2D` where useful, `OffscreenCanvas` where available, and `devicePixelRatio`. Do not add fallback rendering technology.

### Library / Framework Requirements

- Add `zustand` to `apps/web` for `useDocumentStore`.
- Reuse the existing Vitest setup in `packages/canvas-engine`; do not swap test frameworks.
- Keep `peerDependencies` empty in `packages/canvas-engine/package.json`.
- Do not add React-specific helpers to the engine package.

### File Structure Requirements

- Keep the existing renderer file names introduced in Story 1.1. In particular, continue using `packages/canvas-engine/src/canvas-renderer.ts`; do not rename it to `renderer.ts` in this story because the workspace already exports the current path.
- Expected new or updated files for this story:
  - `packages/common-types/src/elements.ts`
  - `packages/common-types/src/index.ts`
  - `packages/canvas-engine/src/canvas-renderer.ts`
  - `packages/canvas-engine/src/element-factory.ts`
  - `packages/canvas-engine/src/events.ts`
  - `packages/canvas-engine/src/hit-tester.ts`
  - `packages/canvas-engine/src/history-manager.ts`
  - `packages/canvas-engine/src/*.spec.ts`
  - `apps/web/stores/use-document-store.ts`
  - `apps/web/app/editor/[id]/_components/canvas-stage.tsx`
  - `apps/web/app/editor/[id]/page.tsx`
- Create only the directories this story needs. Do not scaffold full toolbar, layers panel, or properties panel trees yet unless a file is directly required by the editor shell.

### Testing Requirements

- Unit tests stay co-located with source in `packages/canvas-engine/src/`.
- Reuse `vitest-canvas-mock` for renderer and history tests.
- The benchmark/spec for the 200-element document must be executable inside the workspace, not just described in comments.
- Add assertions for render coalescing so the 50-element batch case is protected from regressions even if raw timing varies across machines.
- Before marking the story complete, the dev workflow must pass `pnpm lint`, `pnpm test`, and `pnpm build` from the monorepo root.

### Previous Story Intelligence

- Story 1.1 established and validated the monorepo, root `pnpm dev`, Docker services, CI scripts, and the initial `canvas-engine` package shell.
- Story 1.1 explicitly verified that `@design-editor/canvas-engine` does not pull React, Zustand, or Next.js. Preserve that guarantee in this story.
- Story 1.1 already configured `packages/canvas-engine` for Vitest and added the initial `HistoryManager` cap behavior. Build on those assets instead of replacing them.
- Root lint/test/build are already green after Story 1.1. Any implementation here should preserve those workspace-wide commands.

### Git Intelligence Summary

- Recent history is minimal (`init`, `first commit`), so the most reliable guidance comes from the current workspace structure and Story 1.1 implementation notes rather than commit archaeology.

### Latest Technical Information

- Official Zustand docs support a vanilla store API via `createStore`, which is useful when React ownership and non-React consumers need a clean boundary. Inference: this makes Zustand appropriate for the web-layer store while still keeping the renderer package framework-free.
- MDN documents `window.devicePixelRatio` as the mechanism for correcting canvas resolution on HiDPI displays and notes that the value can change when display density changes.
- MDN documents `OffscreenCanvas` as the browser primitive for off-main-thread canvas work. For this story, treat it as a forward-compatible renderer primitive, not a requirement to build worker rendering immediately.

### Project Structure Notes

- The architecture's long-term target tree includes `apps/web/stores/use-document-store.ts`, `apps/web/app/editor/[id]/_components/canvas-stage.tsx`, and `packages/canvas-engine/src/elements/`.
- The current repo does not contain those paths yet, so creating them in this story is aligned with the architecture rather than a divergence.
- The architecture sample names the main renderer file `renderer.ts`, but Story 1.1 created `canvas-renderer.ts`. Keep the existing file name to avoid unnecessary churn in the real codebase.

### References

- Epic story definition and acceptance criteria [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2-Canvas-Renderer--Element-Foundation]
- Epic cross-cutting requirements for Canvas engine, Zustand, and visual regression [Source: _bmad-output/planning-artifacts/epics.md#Additional-Requirements]
- PRD Phase 1 canvas/editor scope [Source: _bmad-output/planning-artifacts/prd.md#Phase-1--Core-Editor-Working-0--35-thang]
- PRD performance and image quality constraints [Source: _bmad-output/planning-artifacts/prd.md#Performance]
- PRD browser support and required browser APIs [Source: _bmad-output/planning-artifacts/prd.md#Browser-Compatibility]
- Architecture frontend renderer/store boundary [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- Architecture implementation patterns and naming rules [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- Architecture project structure and target file locations [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- Architecture structure mapping for FR1-20f [Source: _bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping]
- Previous implementation learnings [Source: _bmad-output/implementation-artifacts/1-1-monorepo-foundation-and-development-environment.md]
- Zustand official docs: `createStore` [Source: https://zustand.docs.pmnd.rs/apis/create-store]
- MDN: `OffscreenCanvas()` [Source: https://developer.mozilla.org/docs/Web/API/OffscreenCanvas/OffscreenCanvas]
- MDN: `window.devicePixelRatio` [Source: https://developer.mozilla.org/docs/Web/API/Window/devicePixelRatio]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-03-20 10:27 ICT: Loaded BMAD create-story workflow, sprint status, config, epics, PRD, architecture, Story 1.1, current renderer/web source files, and recent git history to build Story 1.2 context.
- 2026-03-20 10:35 ICT: Moved Story 1.2 and sprint tracking to `in-progress` before implementation.
- 2026-03-20 10:37 ICT: Added shared design document and canvas element types in `@design-editor/common-types`, added `zustand` to `apps/web`, and added `@design-editor/common-types` as the only runtime dependency of `@design-editor/canvas-engine`.
- 2026-03-20 10:40 ICT: Replaced canvas-engine stubs with a real `CanvasRenderer`, typed canvas event helpers, element draw strategies, and bounds-based hit testing; added Vitest coverage for renderer, events, hit testing, and history behavior.
- 2026-03-20 10:42 ICT: Wired `apps/web` editor shell to `useDocumentStore` and `canvas-stage`, dispatching `canvas:document-changed` via typed helpers instead of raw `CustomEvent` construction.
- 2026-03-20 10:43 ICT: `pnpm install` succeeded after adding the new workspace dependency footprint.
- 2026-03-20 10:44 ICT: `pnpm lint` passed on the first validation run.
- 2026-03-20 10:45 ICT: Initial `pnpm test`/`pnpm build` surfaced a `tsup` declaration-build failure because `packages/canvas-engine/tsconfig.json` constrained `rootDir` too tightly for shared workspace types; removed the local `rootDir` override and reran.
- 2026-03-20 10:46 ICT: Second validation pass surfaced declaration typing issues in `element-factory` and a Next.js build type issue around the `roundRect` fallback; refactored draw dispatch to a type-safe `switch` and hardened the rectangle fallback typing.
- 2026-03-20 10:49 ICT: Final `pnpm test` passed with 10 new `canvas-engine` tests green, and final `pnpm build` completed successfully across all workspace packages and apps.
- 2026-03-20 11:04 ICT: Addressed code-review findings by moving the benchmark into reusable engine utilities, scoping canvas events to a per-stage `EventTarget`, and updating hit testing so groups only win as a fallback when no concrete child element matches.
- 2026-03-20 11:09 ICT: Revalidated the review-fix pass with `pnpm lint` and `pnpm test`, both passing cleanly after the event and hit-test changes.
- 2026-03-20 11:12 ICT: First rerun of `pnpm build` hit a transient Next.js `/register` page-data collection failure; an immediate rerun succeeded without code changes, confirming the workspace build remained green after the review fixes.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created for Story 1.2.
- Added shared renderer-facing document and element types in `packages/common-types/src/elements.ts` and re-exported them for the web app and canvas engine.
- Implemented a pure TypeScript `CanvasRenderer` with HiDPI backing-store scaling, dirty-frame batching, render metrics, and hit testing while keeping framework dependencies out of `@design-editor/canvas-engine`.
- Added typed DOM event helpers for `canvas:document-changed` and `canvas:rendered`, and updated the web integration to use those helpers exclusively.
- Added element draw strategies for rectangle, ellipse, text, image placeholder, and group foundations under `packages/canvas-engine/src/elements/`.
- Extended `HistoryManager` verification with undo, redo, and redo-clearing coverage.
- Introduced `apps/web/stores/use-document-store.ts` plus `apps/web/app/editor/[id]/_components/canvas-stage.tsx` so the editor route now mounts a real canvas and sample document state.
- Validated the story with `pnpm install`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- Follow-up review fixes moved the 200-element renderer benchmark into reusable engine helpers and surfaced the real-browser benchmark average inside the editor route instead of asserting a mock `jsdom` frame-time threshold.
- The canvas event bridge now uses a per-instance `EventTarget`, preventing multiple `CanvasStage` mounts from broadcasting document changes across renderers.
- `HitTester` now prefers concrete visible child elements over a covering group and only returns the group as a fallback when no child matches the pointer.

### File List

- _bmad-output/implementation-artifacts/1-2-canvas-renderer-and-element-foundation.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/web/app/editor/[id]/_components/canvas-stage.tsx
- apps/web/app/editor/[id]/page.tsx
- apps/web/package.json
- apps/web/stores/use-document-store.ts
- packages/canvas-engine/package.json
- packages/canvas-engine/src/benchmark.ts
- packages/canvas-engine/src/canvas-renderer.spec.ts
- packages/canvas-engine/src/canvas-renderer.ts
- packages/canvas-engine/src/element-factory.ts
- packages/canvas-engine/src/elements/ellipse-element.ts
- packages/canvas-engine/src/elements/group-element.ts
- packages/canvas-engine/src/elements/image-element.ts
- packages/canvas-engine/src/elements/rect-element.ts
- packages/canvas-engine/src/elements/text-element.ts
- packages/canvas-engine/src/events.spec.ts
- packages/canvas-engine/src/events.ts
- packages/canvas-engine/src/history-manager.spec.ts
- packages/canvas-engine/src/history-manager.ts
- packages/canvas-engine/src/hit-tester.spec.ts
- packages/canvas-engine/src/hit-tester.ts
- packages/canvas-engine/tsconfig.json
- packages/common-types/src/elements.ts
- packages/common-types/src/index.ts
- pnpm-lock.yaml

### Change Log

- 2026-03-20: Created Story 1.2 in ready-for-dev state and captured implementation guardrails from epics, PRD, architecture, current workspace state, and Story 1.1 learnings.
- 2026-03-20: Implemented the canvas renderer foundation, typed event bus, shared element types, and the web editor canvas stage; validated the workspace with lint, test, and build; advanced the story to review.
- 2026-03-20: Fixed code-review findings by replacing the mock-only timing assertion with an executable benchmark harness, scoping canvas events per stage instance, and correcting group-vs-child hit-testing behavior; reran lint, test, and build validation successfully.
