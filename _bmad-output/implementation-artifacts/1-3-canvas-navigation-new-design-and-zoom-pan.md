# Story 1.3: Canvas Navigation - New Design and Zoom/Pan

Status: done

## Story

As a designer,
I want to create a new design canvas with custom dimensions and navigate it freely,
so that I can set up my workspace before starting to design.

## Acceptance Criteria

1. The editor can create a new in-memory design with custom canvas `width` and `height` in pixels, and the new document replaces the seeded document without reloading the page. (FR1)
2. Mouse-wheel zoom and trackpad pinch-style zoom work on the editor canvas, clamp between `10%` and `800%`, and keep the focal point stable instead of always zooming toward the top-left corner. (FR7, FR20c)
3. Holding `Space` while dragging pans the canvas smoothly, and the pan interaction continues reliably even if the pointer leaves the canvas bounds during the drag. (FR7)
4. `Ctrl++`, `Ctrl+-`, and `Ctrl+0` work on the editor page, with `Ctrl+0` fitting the full canvas inside the available stage viewport. (FR7)
5. Text and vector elements remain crisp while zooming and panning because viewport transforms are applied through the renderer transform stack on top of the existing HiDPI backing-store handling rather than by stretching the canvas with CSS. (FR20c)
6. The navigation implementation keeps `@design-editor/canvas-engine` free of React, Zustand, and Next.js dependencies, and workspace validation still passes with `pnpm lint`, `pnpm test`, and `pnpm build`. (FR7)

## Tasks / Subtasks

- [x] Task 1: Add viewport and navigation primitives to the renderer foundation (AC: 2, 3, 4, 5, 6)
  - [x] Extend `packages/canvas-engine/src/canvas-renderer.ts` so it owns viewport state needed for navigation: zoom scale, pan offset, coordinate conversion, and fit-to-viewport behavior
  - [x] Keep HiDPI scaling separate from navigation transforms so device-pixel-ratio handling from Story 1.2 remains intact
  - [x] Add or extract small pure helpers under `packages/canvas-engine/src/` if needed for clamp math, focal-point zoom math, or viewport fitting, but keep the package framework-free

- [x] Task 2: Expose renderer APIs the editor shell can call imperatively (AC: 2, 3, 4, 5)
  - [x] Add renderer methods for setting viewport state, zooming around a screen point, panning by a delta, fitting the current document to the stage viewport, and converting screen coordinates to canvas coordinates
  - [x] Do not introduce raw `CustomEvent(...)` construction in app code for navigation; prefer direct renderer APIs unless a typed canvas helper is genuinely needed
  - [x] Preserve current document-change event behavior from Story 1.2 so navigation work does not regress document rendering

- [x] Task 3: Introduce editor UI state for viewport and new-design flow (AC: 1, 2, 3, 4)
  - [x] Create `apps/web/stores/use-ui-store.ts` following the architecture naming convention for editor UI state
  - [x] Store only view-level state there: zoom percentage, pan offset, stage viewport size, and transient new-design dialog state
  - [x] Keep document content in `useDocumentStore`; do not collapse document state and UI state into one store

- [x] Task 4: Add new-design document creation actions without pulling persistence forward (AC: 1)
  - [x] Extend `apps/web/stores/use-document-store.ts` so the editor can create a fresh in-memory document with custom canvas dimensions instead of only seeding the fixed Story 1.2 sample
  - [x] Keep the sample element set minimal and deterministic for local testing, but ensure the new canvas size is respected by the created document
  - [x] Do not add API persistence, autosave, template loading, or dashboard-driven creation in this story

- [x] Task 5: Wire the editor shell for wheel zoom, Space+drag pan, shortcuts, and a minimal new-design dialog (AC: 1, 2, 3, 4)
  - [x] Update `apps/web/app/editor/[id]/_components/canvas-stage.tsx` to listen for wheel, pointer, resize, and keyboard events needed for navigation
  - [x] Use pointer capture or an equivalent browser-safe pattern so panning does not break when the pointer exits the canvas bounds mid-drag
  - [x] Add a small editor control surface for creating a new design and displaying current zoom; create only the components this story needs
  - [x] Keep the UI intentionally narrow in scope: no full toolbar, no shape tools, no selection handles, no layers panel, and no properties panel yet

- [x] Task 6: Add tests that lock in viewport math and interaction guardrails (AC: 2, 3, 4, 5, 6)
  - [x] Extend `packages/canvas-engine/src/canvas-renderer.spec.ts` with coverage for zoom clamping, fit-to-viewport behavior, viewport transforms, and coordinate conversion
  - [x] Add `apps/web` tests for `use-ui-store.ts` and any pure keyboard or viewport helpers introduced by this story
  - [x] Add assertions that wheel or shortcut-driven zoom does not mutate document data and that fit-to-screen produces a deterministic viewport result for a known stage size

- [x] Task 7: Run workspace validation before handoff (AC: 6)
  - [x] Run `pnpm lint`
  - [x] Run `pnpm test`
  - [x] Run `pnpm build`

## Dev Notes

### Story Intent and Scope Boundaries

- This story adds editor navigation and first-step document setup on top of the renderer foundation from Story 1.2.
- The target outcome is a navigable canvas stage with zoom, pan, and custom canvas creation, not full editing interactions.
- Do not pull future scope into this story: no shape creation, no selection or transform handles, no z-order controls, no autosave, no persistence API calls, and no full editor toolbar system.

### Current Codebase State

- `packages/canvas-engine/src/canvas-renderer.ts` currently renders documents at origin with HiDPI support, batching, and hit testing, but it has no viewport/camera model for zoom and pan yet.
- `apps/web/stores/use-document-store.ts` exists and seeds a fixed sample document, but it does not yet support a user-provided canvas size or a separate editor UI store.
- `apps/web/app/editor/[id]/_components/canvas-stage.tsx` mounts the canvas, dispatches typed document-change events, and shows simple render metrics, but it has no wheel handlers, keyboard shortcuts, pointer-drag pan logic, or new-design dialog.
- `apps/web/stores/` currently contains only `use-document-store.ts`; the architecture-targeted `use-ui-store.ts` does not exist yet.
- Story 1.2 already proved that `@design-editor/canvas-engine` can stay independent from React/Zustand/Next.js while being driven by the web layer; preserve that boundary.

### Technical Requirements

- Keep viewport math inside the renderer or pure helper modules; React components should orchestrate lifecycle and input handling, not duplicate transform logic.
- Treat zoom as a viewport transform, not a CSS scale on the `<canvas>` element. The canvas backing store should still be sized via device pixel ratio, while zoom/pan are applied through `CanvasRenderingContext2D` transforms during render.
- Clamp zoom to `0.1` through `8` internally so the UI can show `10%` through `800%`.
- Focal-point zoom matters: wheel zoom should keep the content under the pointer stable as the zoom changes.
- Fit-to-screen should use the actual stage viewport size and current document canvas size; do not hardcode a single zoom preset.
- Panning should be temporary while `Space` is held; do not overload this story with permanent hand-tool mode or multi-touch gesture state machines unless required for the acceptance criteria.

### Architecture Compliance

- Frontend state remains split by responsibility: `useDocumentStore` for document data and `useUIStore` for editor UI state.
- `packages/canvas-engine` must not import Zustand stores or React hooks. The web layer may subscribe to stores and call renderer methods directly.
- Shared zero-runtime types belong in `packages/common-types/src/` only if both the web layer and renderer genuinely need them. Do not move transient UI-only types there without a clear reason.
- Keep file names in kebab-case and stay aligned with the existing `canvas-renderer.ts` path rather than renaming it to `renderer.ts`.

### Library / Framework Requirements

- Reuse the existing React 19, Next.js 15, Zustand 5, and Vitest setup already present in the workspace.
- Do not add a canvas abstraction library such as Konva, Fabric.js, Pixi, or a gesture package just to satisfy zoom/pan.
- Keep `peerDependencies` empty in `packages/canvas-engine/package.json`.
- Reuse browser-native Pointer and Wheel APIs instead of adding a drag/gesture dependency.

### File Structure Requirements

- Expected new or updated files for this story:
  - `apps/web/stores/use-document-store.ts`
  - `apps/web/stores/use-ui-store.ts`
  - `apps/web/app/editor/[id]/_components/canvas-stage.tsx`
  - `apps/web/app/editor/[id]/_components/new-design-dialog.tsx`
  - `apps/web/app/editor/[id]/page.tsx`
  - `packages/canvas-engine/src/canvas-renderer.ts`
  - `packages/canvas-engine/src/canvas-renderer.spec.ts`
  - `packages/canvas-engine/src/index.ts`
- If a small pure viewport helper module is warranted, place it under `packages/canvas-engine/src/` and keep it co-located with renderer tests.
- Do not scaffold the long-term toolbar, layers panel, or properties panel trees yet unless one file is directly required to satisfy this story.

### Testing Requirements

- Unit tests for viewport math should stay close to `packages/canvas-engine/src/`.
- Reuse `vitest-canvas-mock` for renderer tests; do not switch test frameworks.
- Add deterministic assertions for zoom clamping, fit-to-screen math, and screen-to-canvas coordinate conversion.
- Add at least one interaction-oriented test path that proves panning updates viewport state without mutating the design document.
- Before marking the story complete, the monorepo root must pass `pnpm lint`, `pnpm test`, and `pnpm build`.

### Previous Story Intelligence

- Story 1.2 established the renderer foundation, typed event helpers, benchmark utilities, deterministic sample document state, and the editor canvas stage shell.
- Story 1.2 review fixes are directly relevant here:
  - renderer benchmarking now lives in reusable engine utilities instead of a mock-only timing assertion
  - canvas events are scoped per stage instance instead of `window`
  - hit testing prefers concrete child elements over a covering group fallback
- Story 1.2 already warned against pushing future editing scope into the foundation. Continue that discipline here and stop at navigation plus new-design setup.

### Git Intelligence Summary

- Recent history is still minimal, so the most reliable implementation guidance comes from the current workspace and Story 1.2 artifact rather than long commit archaeology.
- The latest meaningful code changes focused on the renderer/web editor boundary, so Story 1.3 should extend those same files instead of introducing parallel navigation infrastructure elsewhere.

### Latest Technical Information

- MDN documents that the `wheel` event is the standard input for mouse-wheel and trackpad-wheel interactions, replaces deprecated `mousewheel`, and may fire with `ctrlKey = true` for zoom gestures generated by trackpads. Inference: use `wheel`, not deprecated browser-specific events, and normalize behavior in editor code. [Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event]
- MDN documents Pointer Events as the browser model for unified mouse/pen/touch pointer handling. Inference: use pointer capture for Space-drag panning so drag state survives when the pointer exits the canvas bounds. [Source: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events]
- MDN documents `touch-action` as the browser hint that determines whether the browser handles panning/zooming gestures itself or leaves them to app code. Inference: if touch or trackpad interactions need custom handling on the stage container, set `touch-action` deliberately rather than relying only on `preventDefault()`. [Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action]
- MDN documents `CanvasRenderingContext2D.setTransform()` as resetting the transform and then applying the provided matrix. Inference: combine HiDPI scaling and viewport transforms explicitly in render code instead of stacking ad hoc scale/translate calls across frames. [Source: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform]
- Zustand's official Flux-inspired practice guide recommends colocating actions with store state and using `set` / `setState` for updates. Inference: `use-ui-store.ts` should own viewport actions directly instead of spreading navigation mutations across components. [Source: https://zustand.docs.pmnd.rs/guides/flux-inspired-practice]

### Project Structure Notes

- The architecture's target tree already reserves `apps/web/stores/use-ui-store.ts` for editor UI state, so creating it in this story aligns with the intended structure.
- The current repo already has `apps/web/app/editor/[id]/_components/canvas-stage.tsx` as the editor shell entry, making it the correct place to integrate viewport input handling.
- The renderer file path remains `packages/canvas-engine/src/canvas-renderer.ts` in the real workspace; preserve that path and extend it instead of introducing a parallel main renderer file.

### References

- Epic story definition and acceptance criteria [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3-Canvas-Navigation---New-Design--ZoomPan]
- Epic cross-cutting requirements for canvas performance and state management [Source: _bmad-output/planning-artifacts/epics.md#Additional-Requirements]
- PRD Phase 1 core editor scope [Source: _bmad-output/planning-artifacts/prd.md#Phase-1--Core-Editor]
- PRD performance requirements for zoom clarity and render loop targets [Source: _bmad-output/planning-artifacts/prd.md#Performance]
- PRD browser compatibility and required browser APIs [Source: _bmad-output/planning-artifacts/prd.md#Browser-Compatibility]
- Architecture frontend renderer/store boundary [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- Architecture implementation patterns and naming rules [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- Architecture project structure and target file locations [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- Architecture structure mapping for FR1-FR20f [Source: _bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping]
- Previous implementation learnings [Source: _bmad-output/implementation-artifacts/1-2-canvas-renderer-and-element-foundation.md]
- MDN: Element `wheel` event [Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event]
- MDN: Pointer events [Source: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events]
- MDN: CSS `touch-action` [Source: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action]
- MDN: `CanvasRenderingContext2D.setTransform()` [Source: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform]
- Zustand official guide: Flux inspired practice [Source: https://zustand.docs.pmnd.rs/guides/flux-inspired-practice]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-03-20 11:23 ICT: Loaded BMAD create-story workflow, sprint tracker, Epic 1 Story 1.3 requirements, PRD, architecture, Story 1.2 artifact, and current editor/canvas source files to build Story 1.3 context.
- 2026-03-20 11:28 ICT: Moved Story 1.3 and sprint tracking to `in-progress` before implementation.
- 2026-03-20 11:31 ICT: Added pure viewport math helpers and extended `CanvasRenderer` with zoom, pan, fit-to-viewport, and screen-to-canvas APIs while preserving HiDPI backing-store scaling.
- 2026-03-20 11:35 ICT: Added `use-ui-store`, extended `use-document-store` with custom canvas creation, and added store-level Vitest coverage for viewport state and new-design flow.
- 2026-03-20 11:39 ICT: Rebuilt `canvas-stage` with a measured stage viewport, wheel zoom, Space-drag pan via pointer capture, keyboard shortcuts, and a minimal `new-design-dialog` control surface.
- 2026-03-20 11:42 ICT: Validation passed with `pnpm lint`, `pnpm test`, and `pnpm build`, including new renderer viewport tests and new `apps/web` store tests.
- 2026-03-20 13:44 ICT: Fixed the `Ctrl+0` fit-to-screen review finding by allowing fit zoom below the interactive 10% floor for oversized canvases, added a regression test for a 20000x20000 canvas, and reran `pnpm lint`, `pnpm test`, and `pnpm build`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created for Story 1.3.
- Added viewport math helpers in `packages/canvas-engine` and upgraded `CanvasRenderer` to support clamped zoom, pan, fit-to-screen, and screen-to-canvas conversion without breaking HiDPI rendering.
- Added `use-ui-store.ts` for editor navigation state and extended `use-document-store.ts` so the editor can create a fresh in-memory design with custom pixel dimensions.
- Reworked `canvas-stage.tsx` into a real navigation shell with wheel zoom, Space-drag pan, `Ctrl++`, `Ctrl+-`, `Ctrl+0`, stage resize observation, and a minimal new-design dialog.
- Added renderer viewport tests plus `apps/web` store tests to lock in zoom math, fit behavior, and the guarantee that viewport updates do not mutate document data.
- Validated the full workspace with `pnpm lint`, `pnpm test`, and `pnpm build`.
- Resolved the code-review finding for oversized custom canvases so `Ctrl+0` now fits the full canvas into the stage viewport even when the required fit zoom is below `10%`.

### File List

- _bmad-output/implementation-artifacts/1-3-canvas-navigation-new-design-and-zoom-pan.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/web/app/editor/[id]/_components/canvas-stage.tsx
- apps/web/app/editor/[id]/_components/new-design-dialog.tsx
- apps/web/stores/use-document-store.ts
- apps/web/stores/use-document-store.spec.ts
- apps/web/stores/use-ui-store.ts
- apps/web/stores/use-ui-store.spec.ts
- packages/canvas-engine/src/canvas-renderer.spec.ts
- packages/canvas-engine/src/canvas-renderer.ts
- packages/canvas-engine/src/viewport.ts

### Change Log

- 2026-03-20: Created Story 1.3 in ready-for-dev state and captured navigation-specific guardrails from epics, PRD, architecture, current workspace state, Story 1.2 learnings, and official browser/state-management references.
- 2026-03-20: Implemented canvas navigation and new-design setup, added viewport/store tests, validated the workspace with lint/test/build, and advanced the story to review.
- 2026-03-20: Fixed the `Ctrl+0` fit-to-screen review finding for oversized canvases, reran lint/test/build, and marked the story done.
