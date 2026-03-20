# Story 1.4: Basic Shape Tools - Rectangle and Ellipse

Status: done

## Story

As a designer,
I want to draw Rectangle and Ellipse shapes on the canvas with solid fills and strokes,
so that I can build fundamental geometric elements in my designs.

## Acceptance Criteria

1. The editor exposes Rectangle and Ellipse creation tools, and dragging on the canvas creates a `RectElement` or `EllipseElement` using canvas-space coordinates derived from the active viewport instead of raw screen coordinates. (FR11, FR7)
2. Rectangle and ellipse creation works correctly in every drag direction; committed elements always store normalized positive `width` and `height` even when the user drags leftward or upward. (FR11)
3. Holding `Shift` while drawing an ellipse constrains the draft and committed element to a perfect circle. (FR11)
4. Pressing `Escape` during an active shape-draw gesture cancels the draft without adding an element or mutating the committed document. (FR11)
5. After a new shape is committed, it becomes the active selected element, and the editor exposes fill color, stroke color, and stroke width controls for the selected rectangle or ellipse only. Changes re-render immediately without a page reload. (FR15)
6. Canvas navigation from Story 1.3 remains intact while shape tools are present: `Space` + drag still pans, wheel zoom still zooms, and shape drawing respects the current zoom/pan transform. (FR7, FR20c)
7. The implementation keeps `@design-editor/canvas-engine` free of React, Zustand, and Next.js dependencies, and the workspace still passes `pnpm lint`, `pnpm test`, and `pnpm build`. (FR11, FR15)

## Tasks / Subtasks

- [x] Task 1: Add shape-creation foundations without duplicating existing draw logic (AC: 1, 2, 3, 4, 7)
  - [x] Reuse the existing rectangle and ellipse draw strategies in `packages/canvas-engine/src/elements/` rather than introducing parallel drawing code in React components
  - [x] Add any small pure helpers needed for shape bounds normalization, circle constraint math, or transient draft rendering under `packages/canvas-engine/src/`
  - [x] Keep any draft-rendering support framework-free and scoped to the renderer package if a transient overlay path is needed

- [x] Task 2: Extend editor state for tool mode, minimal selection, and shape editing (AC: 1, 4, 5, 6)
  - [x] Add shape-tool state to `apps/web/stores/use-ui-store.ts` for at least `rectangle`, `ellipse`, and a non-drawing default mode
  - [x] Extend `apps/web/stores/use-document-store.ts` with the minimum actions needed to commit new shape elements, track the active selected shape, and update fill/stroke fields
  - [x] Keep selection scope intentionally narrow: auto-select the newly created shape and support editing that selected shape, but do not implement general click-selection, transform handles, z-order menus, or multi-select in this story

- [x] Task 3: Wire canvas interactions for drag-to-create and cancel behavior (AC: 1, 2, 3, 4, 6)
  - [x] Update `apps/web/app/editor/[id]/_components/canvas-stage.tsx` so pointer input branches correctly between Space-drag pan and shape drawing
  - [x] Convert pointer positions through `renderer.screenToCanvas(...)` or an equivalent renderer-owned viewport helper before computing element bounds
  - [x] Keep draft geometry transient during pointer move; do not commit partially dragged elements to the document until pointer up
  - [x] Support `Escape` cancellation for an active draw gesture without leaving behind hidden elements, stale selection, or dirty document state

- [x] Task 4: Add a minimal shape properties control surface (AC: 5, 6)
  - [x] Reuse the current editor shell in `canvas-stage.tsx` and extract a small component only if it materially reduces complexity
  - [x] Provide only the controls this story requires: fill color, stroke color, and stroke width for selected rectangles and ellipses
  - [x] Do not add gradients, opacity controls, blend modes, shadows, corner-radius editing, or the full long-term properties-panel system in this story

- [x] Task 5: Preserve established navigation and rendering behavior while adding shape tools (AC: 1, 5, 6, 7)
  - [x] Ensure wheel zoom, `Ctrl++`, `Ctrl+-`, `Ctrl+0`, and `Space` + drag continue to work with shape tools present
  - [x] Ensure draft and committed shapes render crisply at the current zoom level through the renderer transform stack rather than CSS scaling
  - [x] Do not regress the Story 1.3 fit-to-screen fix for oversized canvases or the per-stage event scoping established in Story 1.2

- [x] Task 6: Add tests that lock in shape-creation and editing guardrails (AC: 2, 3, 4, 5, 6, 7)
  - [x] Add renderer or pure-helper tests for drag normalization and circle constraint math
  - [x] Add `apps/web` store tests for tool-mode state, selected-shape updates, and shape-style mutations
  - [x] Add at least one interaction-oriented test path proving that canceling a draft leaves the committed document unchanged
  - [x] Add coverage proving shape creation still uses viewport-aware coordinates while navigation remains available

- [x] Task 7: Run workspace validation before handoff (AC: 7)
  - [x] Run `pnpm lint`
  - [x] Run `pnpm test`
  - [x] Run `pnpm build`

## Dev Notes

### Story Intent and Scope Boundaries

- This story adds the first authoring tools on top of the navigation foundation from Story 1.3.
- The outcome is limited to drawing rectangles and ellipses with solid fills and strokes.
- Do not pull future scope into this story: no polygon, star, line, or arrow tools; no text editing; no image upload; no transform handles; no move/resize/rotate interactions; no z-order controls; no undo/redo UX; no layers panel; and no full editor toolbar system.
- Selection in this story is intentionally minimal. Auto-select the newly created shape so its properties can be edited, but leave full hit-based selection, transform handles, and z-order operations to Story 1.7.

### Current Codebase State

- `packages/common-types/src/elements.ts` already defines `RectElement` and `EllipseElement` with `fill` and optional `stroke`, so this story should build on existing types instead of redefining shape models.
- `packages/canvas-engine/src/elements/rect-element.ts` and `packages/canvas-engine/src/elements/ellipse-element.ts` already render those element types, and `packages/canvas-engine/src/element-factory.ts` already routes them correctly.
- `apps/web/app/editor/[id]/_components/canvas-stage.tsx` currently owns stage measurement, zoom, pan, toolbar buttons, and the editor shell, but it has no shape-tool mode or draw gesture handling yet.
- `apps/web/stores/use-document-store.ts` can seed and create documents and mutate elements, but it does not yet expose minimal shape-selection or shape-style update actions.
- `apps/web/stores/use-ui-store.ts` currently tracks viewport and new-design dialog state only; it has no tool mode or draft shape state.

### Technical Requirements

- Use renderer-owned viewport math for shape creation. Pointer coordinates must be translated with `renderer.screenToCanvas(...)` or an equivalent renderer helper before any bounds math.
- Keep draft geometry out of the committed document until pointer up. Pointer move should update transient preview state only; canceled drafts must not touch committed elements or selection.
- Normalize bounds for all drag directions so committed elements always store positive `width` and `height`.
- While drawing an ellipse, `Shift` should constrain the draft and final geometry to equal width and height while preserving the drag quadrant.
- Rectangles should use a deterministic default `cornerRadius` value on creation, but radius editing belongs to a later story.
- Auto-select the newly created shape by writing to `document.selectedElementIds`, but do not implement the full selection UX from Story 1.7 here.
- `Space` + drag must keep panning precedence. If the user is in pan mode via the spacebar, shape drawing must not start.
- Existing zoom shortcuts and fit-to-screen behavior from Story 1.3 must remain functional while a shape tool is active.
- Keep fill/stroke data as simple string/number values compatible with existing shape types. Do not introduce gradients, effects, or rich style schemas in this story.

### Architecture Compliance

- Preserve the current split: `useDocumentStore` owns committed document content and selected element IDs; `useUIStore` owns view-only state such as tool mode and any transient draft interaction state.
- `packages/canvas-engine` must remain pure TypeScript with zero imports from React, Next.js, or Zustand.
- UI-only enums or draft-state shapes should stay in the web layer unless both the engine and the app genuinely need a shared zero-runtime type.
- Reuse direct renderer APIs where possible. Do not introduce new untyped global events for shape drawing if direct calls are sufficient.
- Keep file names in kebab-case and extend the real workspace path `packages/canvas-engine/src/canvas-renderer.ts` rather than inventing a parallel renderer entry point.

### Library / Framework Requirements

- Reuse the existing React 19, Next.js 15, Zustand 5, and Vitest setup already present in the workspace.
- Reuse browser-native Pointer and Keyboard APIs for draw/cancel behavior; do not add drag/gesture helper packages.
- Use native color inputs or simple CSS-color-compatible inputs for this story; do not add a third-party color picker dependency.
- Keep `peerDependencies` empty in `packages/canvas-engine/package.json`.

### File Structure Requirements

- Expected files to update for this story:
  - `apps/web/app/editor/[id]/_components/canvas-stage.tsx`
  - `apps/web/stores/use-document-store.ts`
  - `apps/web/stores/use-document-store.spec.ts`
  - `apps/web/stores/use-ui-store.ts`
  - `apps/web/stores/use-ui-store.spec.ts`
  - `packages/canvas-engine/src/canvas-renderer.ts`
  - `packages/canvas-engine/src/canvas-renderer.spec.ts`
  - `packages/canvas-engine/src/index.ts`
  - `packages/canvas-engine/src/elements/rect-element.ts`
  - `packages/canvas-engine/src/elements/ellipse-element.ts`
- A small extracted component such as a shape-properties control is acceptable under `apps/web/app/editor/[id]/_components/` only if it materially simplifies `canvas-stage.tsx`.
- A small pure helper under `packages/canvas-engine/src/` is acceptable for drag normalization or draft preview math if that keeps the app layer thin.
- Do not introduce the long-term `toolbar/`, `layers-panel/`, or full `properties-panel/` directory trees unless a single extracted file is directly justified by this story.

### Testing Requirements

- Add deterministic coverage for negative-direction drags, circle constraint math, and cancel-without-commit behavior.
- Add store-level assertions that shape-tool state and shape-style edits do not break document/store responsibility boundaries.
- Add at least one interaction-oriented path proving shape creation uses viewport-aware coordinates under non-default zoom/pan.
- Add assertions that `Space` + drag pan still wins over shape drawing.
- Before marking the story complete, the monorepo root must pass `pnpm lint`, `pnpm test`, and `pnpm build`.

### Previous Story Intelligence

- Story 1.3 established renderer-owned viewport math, so shape creation should use `screenToCanvas` rather than bespoke coordinate conversion in React.
- Story 1.3 also split editor state cleanly between `useDocumentStore` and `useUIStore`. Preserve that boundary instead of collapsing shape-tool state into the document store.
- Story 1.3 fixed `Ctrl+0` for oversized canvases. Shape-tool work must not regress that viewport behavior while adding draw gestures.
- Story 1.2 already scoped canvas events per stage instance and kept `canvas-engine` framework-free. Keep both guarantees intact.

### Git Intelligence Summary

- Recent history is still minimal, so the strongest implementation guidance comes from the current workspace and the completed Story 1.2/1.3 artifacts rather than long commit archaeology.
- The latest meaningful changes extended the existing editor shell and renderer boundary, so Story 1.4 should continue evolving `canvas-stage.tsx`, the two Zustand stores, and `canvas-engine` instead of introducing a parallel shape subsystem elsewhere.

### Latest Technical Information

- MDN documents `CanvasRenderingContext2D.ellipse()` as the standard Canvas 2D path API for ellipses. Inference: keep ellipse rendering in the engine layer using the native path API instead of approximating circles with ad hoc polygon math. [Source: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/ellipse]
- MDN documents `CanvasRenderingContext2D.roundRect()` as the native rounded-rectangle path API and notes that it adds to the current path rather than drawing immediately. Inference: preserve the current rect-element strategy of path creation plus `fill()`/`stroke()`, and keep the fallback path for environments where `roundRect` is unavailable. [Source: https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/roundRect]
- MDN documents `Element.setPointerCapture()` for keeping pointer-driven interactions routed to the active element even when the pointer leaves its bounds. Inference: if shape creation needs drag continuity beyond the canvas edge, use pointer capture intentionally rather than relying on fragile hover-state assumptions. [Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture]
- MDN documents `<input type="color">` as accepting CSS color values while UI presentation varies by browser/platform. Inference: keep the shape-style UI minimal and deterministic, and store normalized fill/stroke strings instead of depending on platform-specific picker behavior. [Source: https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/input/color]

### Project Structure Notes

- The architecture's target tree mentions dedicated `toolbar/` and `properties-panel/` folders, but the real workspace currently keeps the editor controls inline inside `canvas-stage.tsx`. Follow the current repo shape first and extract only the files this story actually needs.
- Shared element types already live in `packages/common-types/src/elements.ts`, so there is no justification to move shape tool UI state into `common-types`.
- No `project-context.md` file was detected in the repository during story creation, so this story is grounded in the sprint tracker, epics, PRD, architecture, and previous implementation artifacts only.

### References

- Epic story definition and acceptance criteria [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4-Basic-Shape-Tools---Rectangle--Ellipse]
- Epic cross-cutting requirements for core editor scope [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Core-Design-Editor--Create--Edit-Designs-Phase-1]
- PRD Phase 1 core editor scope and FR11/FR15 coverage [Source: _bmad-output/planning-artifacts/prd.md#Phase-1--Core-Editor]
- PRD performance requirements for editor responsiveness [Source: _bmad-output/planning-artifacts/prd.md#Performance]
- PRD accessibility requirements for toolbar and dialogs [Source: _bmad-output/planning-artifacts/prd.md#Accessibility]
- Architecture frontend renderer/store boundary [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- Architecture implementation patterns and naming rules [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- Architecture project structure and target file locations [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- Architecture requirements-to-structure mapping for FR11-20f [Source: _bmad-output/planning-artifacts/architecture.md#Requirements-to-Structure-Mapping]
- Previous implementation learnings [Source: _bmad-output/implementation-artifacts/1-3-canvas-navigation-new-design-and-zoom-pan.md]
- MDN: `CanvasRenderingContext2D.ellipse()` [Source: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/ellipse]
- MDN: `CanvasRenderingContext2D.roundRect()` [Source: https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/roundRect]
- MDN: `Element.setPointerCapture()` [Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture]
- MDN: `<input type="color">` [Source: https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/input/color]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-03-20 13:56 ICT: Loaded BMAD create-story workflow, sprint tracker, Epic 1 Story 1.4 requirements, PRD, architecture, current workspace files, and Story 1.3 artifact to build implementation-ready context.
- 2026-03-20 14:00 ICT: Moved Story 1.4 into `in-progress`, added red-phase coverage for shape bounds math, preview rendering, store tool mode, and selected-shape style mutations.
- 2026-03-20 14:07 ICT: Added pure `shape-creation` helpers plus renderer preview support so draft shapes render through the existing Canvas 2D transform stack without mutating the committed document.
- 2026-03-20 14:12 ICT: Extended `use-document-store` and `use-ui-store` with minimal shape-selection and active-tool state, then rebuilt `canvas-stage.tsx` for rectangle/ellipse drag creation, Escape cancel, and fill/stroke controls.
- 2026-03-20 14:19 ICT: Validation passed with `pnpm lint`, `pnpm test`, and `pnpm build` after the Story 1.4 shape-tool implementation.
- 2026-03-20 14:34 ICT: Fixed the Shift-constrained ellipse quadrant edge case for axis-aligned drags, added regression coverage, and re-ran workspace validation before closing the story.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created for Story 1.4.
- Added pure shape-draft math helpers and renderer preview support so transient rectangle/ellipse drafts render on the canvas without being committed to the document.
- Extended the editor stores with active tool state, shape commit selection, and selected-shape fill/stroke updates while preserving the `useDocumentStore` / `useUIStore` split from Story 1.3.
- Reworked the editor shell to expose Pointer, Rectangle, and Ellipse tools, drag-to-create interactions, Shift-constrained circles, Escape cancellation, and a minimal shape properties control surface.
- Validated the workspace with `pnpm lint`, `pnpm test`, and `pnpm build`.
- Fixed the review finding where Shift-drawing a circle straight along one axis could jump into the wrong quadrant, then locked it in with regression coverage.

### File List

- _bmad-output/implementation-artifacts/1-4-basic-shape-tools-rectangle-and-ellipse.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/web/app/editor/[id]/_components/canvas-stage.tsx
- apps/web/stores/use-document-store.ts
- apps/web/stores/use-document-store.spec.ts
- apps/web/stores/use-ui-store.ts
- apps/web/stores/use-ui-store.spec.ts
- packages/canvas-engine/src/canvas-renderer.ts
- packages/canvas-engine/src/canvas-renderer.spec.ts
- packages/canvas-engine/src/index.ts
- packages/canvas-engine/src/shape-creation.ts
- packages/canvas-engine/src/shape-creation.spec.ts

### Change Log

- 2026-03-20: Created Story 1.4 in ready-for-dev state with implementation guardrails derived from epics, PRD, architecture, current workspace state, Story 1.3 learnings, and official browser API references.
- 2026-03-20: Implemented rectangle and ellipse shape tools with viewport-aware drag creation, renderer draft previews, minimal selected-shape styling controls, and validation via lint/test/build.
- 2026-03-20: Resolved the review follow-up for Shift-constrained ellipse quadrant handling and revalidated the workspace before marking the story done.
