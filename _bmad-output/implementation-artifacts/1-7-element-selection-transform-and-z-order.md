# Story 1.7: Element Selection, Transform & Z-Order

Status: ready-for-dev

## Story

As a designer,
I want to select, move, resize, rotate, and reorder elements precisely,
so that I have full professional control over layout and composition.

## Acceptance Criteria

1. Clicking a visible element on the canvas in `select` mode selects exactly that element and renders visible selection handles for corner and edge transforms. (FR2)
2. Dragging a selected element moves it using viewport-aware canvas coordinates, with interaction latency that preserves the existing `<= 16ms/frame` render target and `selection feels instant` bar from Epic 1. (FR2, NFR3, NFR5)
3. Dragging a corner handle resizes proportionally, while dragging an edge handle resizes freely. The implementation works for the Phase 1 element set already present in the repo: rectangle, ellipse, text, and image. (FR2)
4. Dragging the rotation handle rotates the element around its center, and holding `Shift` snaps rotation to 15-degree increments. (FR2)
5. A selected element exposes z-order actions for Bring Forward, Send Backward, Bring to Front, and Send to Back, and invoking them updates render order without losing the current selection. (FR3)
6. The new selection/transform workflow does not regress Stories 1.3 through 1.6: wheel zoom, `Ctrl++`, `Ctrl+-`, `Ctrl+0`, `Space` + drag pan, shape creation, text editing, and image placement/rendering continue to work correctly. (FR2, FR3, FR7, FR11, FR12, FR13)
7. The implementation keeps `@design-editor/canvas-engine` free of React, Zustand, and Next.js dependencies, keeps transient drag/transform session state out of committed document data, and the workspace still passes `pnpm lint`, `pnpm test`, and `pnpm build`. (FR2, FR3)

## Tasks / Subtasks

- [ ] Task 1: Extend engine-side selection and transform foundations for the current Phase 1 element set (AC: 1, 3, 4, 7)
  - [ ] Reuse `CanvasRenderer.hitTest(...)` and `HitTester` as the foundation, but extend them so selection remains correct after rotation instead of relying on the current axis-aligned-only bounds check
  - [ ] Add focused transform geometry helpers in `packages/canvas-engine/src/` for selection bounds, handle positions, proportional/free resize math, and center-based rotation math with 15-degree snap support
  - [ ] Keep these helpers pure TypeScript and reusable by both renderer tests and web interaction code; do not pull React/Zustand concerns into the engine package

- [ ] Task 2: Add the narrow committed document mutations needed for transforms and z-order (AC: 2, 3, 4, 5, 7)
  - [ ] Extend `apps/web/stores/use-document-store.ts` with explicit actions for move, resize, rotate, and reorder that preserve element-specific metadata such as text properties and image asset metadata
  - [ ] Preserve the current single-selection model for this story; do not expand into marquee selection or multi-select, which belongs to Story 1.9
  - [ ] Keep transient drag/handle session state out of the committed document; if session state is needed, place it in `useUIStore` or component-local state only

- [ ] Task 3: Wire `canvas-stage.tsx` for selection, move, resize, and rotate interactions (AC: 1, 2, 3, 4, 6, 7)
  - [ ] In `select` mode, use renderer-owned hit-testing and viewport coordinate conversion to select and drag elements directly on the canvas
  - [ ] Render visible selection affordances for the selected element, including corner handles, edge handles, and a rotation handle, without regressing the existing canvas drawing flow
  - [ ] Ensure interaction precedence remains correct: `Space` + drag pan still wins, active text editing still blocks unrelated canvas shortcuts, and selecting/moving elements does not interfere with shape creation or image upload flows

- [ ] Task 4: Add minimal z-order controls without jumping ahead to the layers-panel story (AC: 5, 6, 7)
  - [ ] Expose Bring Forward, Send Backward, Bring to Front, and Send to Back from the current editor shell in the smallest viable way for the existing UI
  - [ ] Update document element ordering deterministically and keep the selected element selected after the reorder
  - [ ] Do not implement drag-to-reorder layer rows, full layer management, visibility toggles, or lock controls here; those belong to later stories

- [ ] Task 5: Add focused coverage for transform math, z-order behavior, and interaction regressions (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] Add engine-level tests for rotated hit-testing, handle geometry, proportional resize, free resize, and snapped rotation
  - [ ] Add store tests for transform and z-order mutations, including preservation of text/image metadata during updates
  - [ ] Add at least one interaction-oriented `canvas-stage` path proving select-drag, handle resize/rotate, and z-order actions work without breaking pan/text/image flows

- [ ] Task 6: Run workspace validation before handoff (AC: 7)
  - [ ] Run `pnpm lint`
  - [ ] Run `pnpm test`
  - [ ] Run `pnpm build`

## Dev Notes

### Story Intent and Scope Boundaries

- This story is the first professional transform pass for canvas elements. The target is precise single-element selection and manipulation, not the full desktop-designer feature matrix.
- Keep the scope narrow to single-selection plus transform and z-order for the current Phase 1 elements already in the workspace: rectangle, ellipse, text, and image.
- Do not expand into marquee selection, multi-select, align/distribute, clipboard operations, undo/redo UX, grouping/ungrouping, lock/visibility controls, or a full layers panel. Those belong to Stories 1.8 through 1.11.
- Respect the current `locked` field if encountered, but do not turn this story into the full lock/visibility story. The primary goal here is correct selection/transform mechanics and render ordering.

### Current Codebase State

- `packages/canvas-engine/src/canvas-renderer.ts` already renders element rotation correctly and exposes `hitTest(x, y)`, but `packages/canvas-engine/src/hit-tester.ts` currently uses simple axis-aligned bounds and does not yet account for rotated interaction geometry.
- `apps/web/stores/use-document-store.ts` already supports `selectedElementIds`, `moveElements(...)`, and `resizeElement(...)`, but it does not yet expose a coherent transform/z-order API for selection interactions, rotation, or reorder commands.
- `apps/web/stores/use-ui-store.ts` already owns transient editor state such as tool mode, zoom/pan, text editing, and async UI status. It is the correct place for any additional non-committed transform session state this story needs.
- `apps/web/app/editor/[id]/_components/canvas-stage.tsx` already handles viewport-aware pointer flows for pan, shapes, text placement, and image placement, but `select` mode currently does not drive actual on-canvas selection/transform interactions.
- Stories 1.5 and 1.6 added text/image-specific metadata and async handling. Transform updates must preserve those element-specific fields instead of recreating elements loosely.

### Technical Requirements

- Use renderer-owned viewport math for all select/move/resize/rotate interactions. Do not derive transform deltas from raw screen coordinates alone.
- Corner-handle resize must preserve aspect ratio. Edge-handle resize must remain free on the relevant axis.
- Rotation must happen around the selected element center, and `Shift` must snap to 15-degree increments.
- Z-order updates must only reorder the element list. They must not mutate unrelated style/content metadata or drop selection.
- Keep selection visuals consistent with current canvas behavior. If you introduce overlay drawing or helper rendering, it must stay synchronized with zoom/pan and not become a separate DOM editing surface.
- Preserve the image and text flows from earlier stories: selection/transform must not break text editing overlays, renewable image URLs, image cache behavior, or font application.

### Architecture Compliance

- Preserve the current split from the architecture and prior stories: committed element/document state in `useDocumentStore`, transient interaction state in `useUIStore` or component-local state, and geometry/render helpers in `@design-editor/canvas-engine`.
- `packages/canvas-engine` must remain pure TypeScript with zero imports from React, Next.js, or Zustand.
- Follow the current editor topology instead of introducing a second renderer host, global event bus, or new parallel editing surface.
- Keep REST/API/auth/storage concerns out of this story unless a tiny existing helper must be touched for regression safety.

### Library / Framework Requirements

- Reuse the current React 19, Next.js 15, Zustand 5, Vitest, and monorepo package boundaries already established in the workspace.
- Reuse the existing `CanvasRenderer`, `HitTester`, `ImageCache`, and shared type packages before introducing new abstractions.
- If a new helper file is added in `packages/canvas-engine/src/`, keep it small, deterministic, and focused on transform geometry rather than general framework plumbing.

### File Structure Requirements

- Expected files to update for this story:
  - `apps/web/app/editor/[id]/_components/canvas-stage.tsx`
  - `apps/web/app/editor/[id]/_components/canvas-stage.spec.tsx`
  - `apps/web/stores/use-document-store.ts`
  - `apps/web/stores/use-document-store.spec.ts`
  - `apps/web/stores/use-ui-store.ts`
  - `apps/web/stores/use-ui-store.spec.ts`
  - `packages/canvas-engine/src/canvas-renderer.ts`
  - `packages/canvas-engine/src/canvas-renderer.spec.ts`
  - `packages/canvas-engine/src/hit-tester.ts`
  - `packages/canvas-engine/src/hit-tester.spec.ts`
  - `packages/common-types/src/elements.ts`
- Additional small helper files are acceptable only if they materially reduce transform complexity:
  - `packages/canvas-engine/src/transform.ts`
  - `packages/canvas-engine/src/selection.ts`
- Prefer extending the existing `canvas-stage` shell rather than prematurely refactoring into the future toolbar/layers panel architecture target.

### Testing Requirements

- Add deterministic coverage for rotated hit-testing and selection-handle geometry; the current AABB-only tests are not enough once rotation is interactive.
- Add interaction coverage for select-drag move, proportional resize, free resize, rotation snapping, and z-order updates.
- Add regression coverage that `Space` + drag pan, text editing, and image behavior still work while selection/transform support is present.
- Before marking the story complete, the monorepo root must pass `pnpm lint`, `pnpm test`, and `pnpm build`.

### Previous Story Intelligence

- Story 1.6 introduced renewable signed image URLs and image cache lifecycle fixes. Transforming images must preserve `assetId`, `src`, `intrinsicWidth`, `intrinsicHeight`, and `readUrlExpiresAt` instead of overwriting or dropping them.
- Stories 1.5 and 1.6 both reinforced the rule that asynchronous or transient UI behavior should not be tied to whichever element happens to be selected later. Keep transform sessions explicitly targeted to the active element.
- Stories 1.3 and 1.4 established that viewport-aware pointer math belongs to the renderer path and that `Space` + drag pan must keep precedence over authoring gestures.

### Git Intelligence Summary

- Recent git history in this workspace is sparse and less informative than the working tree plus completed story artifacts. The strongest guidance comes from the current editor shell and the implementation patterns already established in Stories 1.3 through 1.6.

### Latest Technical Information

- No additional external research was required during story creation. This story is grounded in the local epics, PRD, architecture, current workspace state, and the completed Story 1.6 artifact.

### Project Structure Notes

- The architecture target tree mentions dedicated toolbar/layers-panel component folders, but the real workspace still centralizes most editor interactions in `apps/web/app/editor/[id]/_components/canvas-stage.tsx`. Follow the current repo shape first.
- `packages/canvas-engine/src/hit-tester.ts` and `packages/canvas-engine/src/canvas-renderer.ts` are already the right low-level extension points for selection and transform math in the current codebase.
- No `project-context.md` file was detected in the repository during story creation, so this story is grounded in the sprint tracker, epics, PRD, architecture, current workspace state, and Story 1.6 learnings.

### References

- Epic story definition and acceptance criteria [Source: _bmad-output/planning-artifacts/epics.md#Story-1.7-Element-Selection-Transform--Z-Order]
- Epic cross-cutting scope for Phase 1 core editor [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Core-Design-Editor--Create--Edit-Designs]
- PRD Phase 1 editor capability list and functional requirements FR2, FR3 [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements]
- PRD performance target for instant-feeling transform interactions [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional-Requirements]
- Architecture frontend state/store split [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- Architecture technical constraints and canvas-engine isolation [Source: _bmad-output/planning-artifacts/architecture.md#Technical-Constraints--Dependencies]
- Architecture implementation consistency rules and project boundaries [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- Previous implementation learnings [Source: _bmad-output/implementation-artifacts/1-6-image-element-upload-and-place-at-full-resolution.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-03-20 18:12 ICT: Loaded BMAD config, sprint tracker, Epic 1 Story 1.7 acceptance criteria, PRD, architecture, current workspace state, and Story 1.6 artifact to build implementation-ready context.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.

### File List

- _bmad-output/implementation-artifacts/1-7-element-selection-transform-and-z-order.md

## Change Log

- 2026-03-20: Created Story 1.7 implementation context and moved it to `ready-for-dev`.
