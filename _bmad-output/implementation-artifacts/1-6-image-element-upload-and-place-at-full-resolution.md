# Story 1.6: Image Element - Upload & Place at Full Resolution

Status: done

## Story

As a designer,
I want to upload images and place them on the canvas at full source resolution,
so that my designs use high-quality assets without quality degradation.

## Acceptance Criteria

1. The editor exposes an Image tool and canvas drag-and-drop path for JPG, PNG, and WebP files. Selecting a file from the Image tool places it on the current canvas without a page reload, and dropping a supported file onto the canvas places it at the viewport-aware drop coordinate. (FR13, FR7)
2. Committed image elements render through the existing Canvas 2D renderer using the uploaded asset, preserve the source file's intrinsic pixel dimensions in element metadata, and do not automatically downsample, compress, or resize the original asset. (FR13, FR20b, FR20d)
3. Uploaded image files are stored unmodified in S3-compatible storage under the asset namespace, and the editor uses signed URLs rather than direct bucket access. Read URLs used by the client expire after 1 hour. (FR13, FR20d)
4. The runtime image draw path uses high-quality smoothing for raster rendering and remains crisp across the existing zoom and pan workflow from Story 1.3. (FR7, FR20b, FR20c)
5. Image upload and placement do not regress existing editor behavior from Stories 1.3, 1.4, and 1.5: wheel zoom, `Ctrl++`, `Ctrl+-`, `Ctrl+0`, `Space` + drag pan, shape tools, text editing, and viewport-aware coordinate handling continue to work correctly. (FR7, FR11, FR12, FR13)
6. The implementation keeps `@design-editor/canvas-engine` free of React, Zustand, and Next.js dependencies, keeps storage/networking concerns out of the engine package, and the workspace still passes `pnpm lint`, `pnpm test`, and `pnpm build`. (FR13)

## Tasks / Subtasks

- [x] Task 1: Reuse and extend the existing image element contract and renderer path (AC: 2, 4, 6)
  - [x] Reuse `ImageElement` in `packages/common-types/src/elements.ts` and the existing `packages/canvas-engine/src/elements/image-element.ts` draw path instead of introducing a parallel image element type
  - [x] Replace the current placeholder cross-box rendering with a real bitmap draw path that can render signed asset URLs while preserving `intrinsicWidth` and `intrinsicHeight`
  - [x] Keep raster rendering concerns inside `packages/canvas-engine`, but keep fetch/upload/signing concerns outside the engine package
  - [x] Ensure the committed element dimensions default to full source pixel dimensions unless a later transform story changes them explicitly

- [x] Task 2: Add minimal document and UI state for image tool, upload state, and placement flow (AC: 1, 2, 5)
  - [x] Extend `apps/web/stores/use-document-store.ts` with the narrow actions needed to commit and select uploaded image elements
  - [x] Extend `apps/web/stores/use-ui-store.ts` with an `image` tool and explicit `AsyncStatus` state for image upload and image load feedback
  - [x] Keep transient file input, drag-over state, and upload progress state in the web layer only; do not dirty the committed document until the upload and placement are ready to commit

- [x] Task 3: Implement a minimal API-backed signed upload and read flow for image assets (AC: 1, 2, 3, 6)
  - [x] Add the smallest backend surface needed in the current repo shape to validate file type for JPG, PNG, and WebP, issue a signed upload path, and return signed read metadata for the placed asset
  - [x] Store original bytes unmodified under the S3 asset namespace and keep signed read URLs time-limited rather than exposing direct bucket URLs
  - [x] Because the current workspace does not yet have a completed auth/user flow, isolate any temporary development user namespace behind the API boundary so Story 7.x can replace it with a real authenticated `userId` later without changing the web contract
  - [x] Reuse `packages/common-types/src/env.ts` and existing S3 env configuration rather than introducing ad hoc storage config

- [x] Task 4: Wire the editor shell for image upload, drag-and-drop, and viewport-aware placement (AC: 1, 4, 5, 6)
  - [x] Update `apps/web/app/editor/[id]/_components/canvas-stage.tsx` so the Image tool opens a file picker and places the committed image at a deterministic viewport-aware position, while canvas drag-and-drop places it at the drop point converted through renderer-owned coordinates
  - [x] Keep drag-and-drop scoped to supported raster image types only; do not expand this story into SVG import, clipboard paste, filters, cropping, masking, opacity tools, or AI import flows
  - [x] Preserve navigation and authoring guardrails from previous stories so active text editing still blocks canvas shortcuts appropriately and `Space` + drag pan still wins over draw-like interactions

- [x] Task 5: Add focused helpers and tests for signed URL image rendering and upload orchestration (AC: 1, 2, 3, 4, 5, 6)
  - [x] Add or extend renderer tests proving that committed image elements use the bitmap draw path with high-quality smoothing and do not regress viewport math
  - [x] Add store tests covering image commit behavior, tool mode boundaries, and UI-only async state separation
  - [x] Add web helper tests for upload/signing orchestration with mocked fetch, including unsupported file rejection and signed URL handling
  - [x] Add at least one interaction-oriented path proving that drag-and-drop uses viewport-aware coordinates and that existing navigation/text flows still behave correctly while image upload support is present

- [x] Task 6: Run workspace validation before handoff (AC: 6)
  - [x] Run `pnpm lint`
  - [x] Run `pnpm test`
  - [x] Run `pnpm build`

## Dev Notes

### Story Intent and Scope Boundaries

- This story adds the first real image asset flow on top of the current canvas foundation. The scope is upload plus placement at full source resolution, not advanced image editing.
- Keep the scope narrow: no SVG upload, no GIF/HEIC support, no filters, no crop UI, no resize handles beyond future selection/transform stories, no opacity/blend controls, no background removal, and no AI import crossover.
- The key quality bar is "original asset preserved." Do not silently compress, resize, recompress, or generate a lower-resolution derivative as the committed source asset in this story.
- If an uploaded image is larger than the canvas, keep the committed element tied to its full intrinsic dimensions rather than auto-fitting it down. Users already have viewport navigation from Story 1.3.

### Current Codebase State

- `packages/common-types/src/elements.ts` already defines `ImageElement` with `src`, `alt`, `intrinsicWidth`, and `intrinsicHeight`.
- `packages/canvas-engine/src/element-factory.ts` already routes `type: 'image'`, and `packages/canvas-engine/src/elements/image-element.ts` exists, but it currently draws only a placeholder box and label rather than a real bitmap.
- `apps/web/stores/use-document-store.ts` already seeds an `image-placeholder` element in the sample document, but it has no dedicated image upload or commit flow yet.
- `apps/web/stores/use-ui-store.ts` currently supports `select`, `rectangle`, `ellipse`, and `text` tools only. It already uses the `AsyncStatus` string union pattern that this story should keep.
- `apps/web/app/editor/[id]/_components/canvas-stage.tsx` is the active editor shell for navigation, shape creation, text creation/editing, and properties UI. Story 1.6 should extend this shell rather than creating a second editor surface.
- `apps/api/src/designs/` and `apps/api/src/import/` are still skeletal. There is not yet a storage module or typed web API client in the current workspace, so this story may introduce the smallest necessary backend and web helper files to support signed image upload.

### Technical Requirements

- Use renderer-owned coordinate conversion for placement. Drag-and-drop must convert the drop point through `renderer.screenToCanvas(...)` or an equivalent renderer method.
- Keep the committed image draw path Canvas-based. Do not leave placed images as DOM `<img>` overlays after upload finishes.
- Preserve the original file bytes in storage. If previews or browser-decoded bitmaps are needed for rendering, they must be derived at runtime without mutating the stored source asset.
- Use `imageSmoothingQuality = 'high'` for raster drawing, and ensure the image draw path works with the existing zoom/pan and HiDPI renderer behavior.
- If the Image tool opens a file picker without a click location, place the new image at a deterministic viewport-aware anchor such as the visible canvas center rather than a hard-coded absolute coordinate.
- Keep upload validation scoped to the supported Phase 1 raster formats in the story: JPG, PNG, and WebP only.
- Keep signed URL issuance and S3 key construction in the API layer. The web app should never know bucket credentials.
- If a helper is added for upload orchestration, keep it small and testable in `apps/web/lib/` rather than embedding long fetch logic directly inside `canvas-stage.tsx`.

### Architecture Compliance

- Preserve the current split: `useDocumentStore` owns committed elements and selection; `useUIStore` owns tool mode and async UI state.
- `packages/canvas-engine` must remain pure TypeScript with zero imports from React, Next.js, or Zustand.
- Keep storage, signed URL generation, and any S3 SDK usage out of `packages/canvas-engine`.
- The web layer may pass signed asset URLs into committed `ImageElement.src`, but the engine should treat `src` as opaque render input only.
- Follow the existing editor topology from Stories 1.3 through 1.5 instead of introducing broad global events or a second renderer host.

### Library / Framework Requirements

- Reuse the existing React 19, Next.js 15, Zustand 5, NestJS 11, Vitest, and current monorepo structure already present in the workspace.
- Reuse the existing shared env validation in `packages/common-types/src/env.ts` for S3-related configuration.
- Use the browser's image decoding path and Canvas 2D draw APIs rather than adding a third-party image rendering dependency.
- Use signed S3-compatible URLs from the API boundary. Do not add direct client-side AWS credentials or a public bucket shortcut.

### File Structure Requirements

- Expected files to update for this story:
  - `apps/web/app/editor/[id]/_components/canvas-stage.tsx`
  - `apps/web/stores/use-document-store.ts`
  - `apps/web/stores/use-document-store.spec.ts`
  - `apps/web/stores/use-ui-store.ts`
  - `apps/web/stores/use-ui-store.spec.ts`
  - `packages/common-types/src/elements.ts`
  - `packages/common-types/src/index.ts`
  - `packages/canvas-engine/src/canvas-renderer.ts`
  - `packages/canvas-engine/src/canvas-renderer.spec.ts`
  - `packages/canvas-engine/src/elements/image-element.ts`
- Additional small files are acceptable only if they materially reduce complexity:
  - `apps/web/lib/image-upload.ts`
  - `apps/api/src/storage/storage.module.ts`
  - `apps/api/src/storage/storage.controller.ts`
  - `apps/api/src/storage/storage.service.ts`
  - `apps/api/src/storage/dto/*.ts`
  - `packages/canvas-engine/src/image-cache.ts`
- Follow the current repo shape first. The architecture mentions a broader `storage/` module and typed `api-client.ts`, but the current workspace does not yet contain them. Introduce only the minimum viable files needed for this story.

### Testing Requirements

- Add deterministic coverage for image commit behavior, signed URL upload orchestration, and unsupported file rejection.
- Add renderer coverage proving that image elements use the real bitmap path and configure high-quality smoothing for raster rendering.
- Add at least one path proving drag-and-drop placement is viewport-aware rather than raw screen-space placement.
- Add coverage that existing navigation and text-editing flows still behave correctly while image support is present.
- Before marking the story complete, the monorepo root must pass `pnpm lint`, `pnpm test`, and `pnpm build`.

### Previous Story Intelligence

- Story 1.5 kept committed rendering inside `packages/canvas-engine` while leaving transient editing and external service integration in the web layer. Follow the same split here: committed image drawing in the engine, upload/signing flow outside it.
- Story 1.5 also fixed a targeting bug by keying mutations to the intended element rather than current selection state. Keep that discipline for image placement and any async upload completion path so late async completions do not mutate the wrong element or selection.
- Stories 1.3 and 1.4 established that viewport-aware placement must use renderer-owned math and that transient UI state should not dirty the committed document until the action is actually committed.

### Git Intelligence Summary

- Recent git history in this workspace is still less useful than the current working tree and completed story artifacts. The strongest guidance comes from the established editor shell plus the store split implemented in Stories 1.3 to 1.5.
- The current repo already contains the `ImageElement` type and image element routing in the engine. The missing work is real upload, placement, and bitmap rendering, so the implementation should extend the existing path rather than replace it.

### Latest Technical Information

- No additional external research was required during story creation. This story is grounded in the local epics, PRD, architecture, current workspace state, and the completed Story 1.5 artifact.

### Project Structure Notes

- The architecture target tree includes `apps/api/src/storage/` and `apps/web/lib/api-client.ts`, but the real workspace has not created those files yet. It is acceptable for this story to introduce the smallest subset needed for signed image upload and retrieval.
- `packages/canvas-engine/src/elements/image-element.ts` already exists and should remain the single committed image draw path.
- No `project-context.md` file was detected in the repository during story creation, so this story is grounded in the sprint tracker, epics, PRD, architecture, current workspace state, and Story 1.5 learnings.

### References

- Epic story definition and acceptance criteria [Source: _bmad-output/planning-artifacts/epics.md#Story-1.6-Image-Element---Upload--Place-at-Full-Resolution]
- Epic cross-cutting scope for Phase 1 core editor [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Core-Design-Editor--Create--Edit-Designs-Phase-1]
- PRD Phase 1 core editor scope and element list [Source: _bmad-output/planning-artifacts/prd.md#Phase-1---Core-Editor-Working-0---35-thang]
- PRD functional requirements FR13, FR20b, FR20c, FR20d [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements]
- PRD image quality constraints and signed URL security requirements [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional-Requirements]
- Architecture technical constraints for S3-compatible storage [Source: _bmad-output/planning-artifacts/architecture.md#Technical-Constraints--Dependencies]
- Architecture frontend/store boundary [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- Architecture implementation patterns and consistency rules [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- Architecture project structure, storage boundary, and data boundaries [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- Previous implementation learnings [Source: _bmad-output/implementation-artifacts/1-5-text-element-create-and-edit-with-google-fonts.md]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-03-20 16:17 ICT: Loaded the BMAD create-story workflow, sprint tracker, Epic 1 Story 1.6 requirements, PRD, architecture, current workspace state, and Story 1.5 artifact to build implementation-ready context.
- 2026-03-20 16:22 ICT: Marked Story 1.6 as in-progress in the sprint tracker, then implemented canvas-engine image caching and replaced the placeholder image draw path with real bitmap rendering plus regression coverage.
- 2026-03-20 16:36 ICT: Added signed image upload/read flow in `apps/api/src/storage`, plus the web upload helper, image tool state, and viewport-aware drag-and-drop placement in `canvas-stage.tsx`.
- 2026-03-20 16:52 ICT: Added focused web interaction coverage for drag-and-drop image placement and resolved JSX/runtime test issues in editor components.
- 2026-03-20 16:58 ICT: Ran `pnpm lint`, `pnpm test`, and `pnpm build` successfully after fixing the final API build-time typing issues.
- 2026-03-20 17:54 ICT: Fixed review findings by adding renewable signed read URLs for committed image elements, wiring background read URL refresh in the web layer, and removing image cache listener leaks; reran `pnpm lint`, `pnpm test`, and `pnpm build`.

### Completion Notes List

- Added a real image rendering path in `@design-editor/canvas-engine` backed by an image cache that invalidates the renderer when signed image assets finish loading.
- Added explicit image commit support in `useDocumentStore` and image upload status state in `useUIStore` without mixing transient upload UI into committed document data.
- Added a minimal signed storage flow in `apps/api/src/storage` that prepares signed upload/read URLs, uploads original bytes into S3-compatible storage, and serves images back through time-limited signed API URLs.
- Extended `canvas-stage.tsx` with an Image tool, hidden file picker, supported drag-and-drop, upload feedback, and viewport-aware placement that preserves full intrinsic dimensions.
- Added regression coverage for engine rendering, upload orchestration, store boundaries, and drag-and-drop placement while preserving text edit mode and navigation guardrails.
- Validation passed at the monorepo root: `pnpm lint`, `pnpm test`, and `pnpm build`.
- Follow-up review fixes now persist renewable image asset metadata in committed `ImageElement`s, mint fresh signed read URLs through the API, and refresh expiring URLs in the web layer before they break active sessions.
- `ImageCache` now deduplicates renderer invalidation callbacks and clears one-shot listeners after image load/error, eliminating the review-reported listener leak.

### File List

- _bmad-output/implementation-artifacts/1-6-image-element-upload-and-place-at-full-resolution.md
- apps/api/src/app.module.ts
- apps/api/src/storage/dto/prepare-image-upload.dto.ts
- apps/api/src/storage/storage.controller.ts
- apps/api/src/storage/storage.module.ts
- apps/api/src/storage/storage.service.spec.ts
- apps/api/src/storage/storage.service.ts
- apps/web/app/editor/[id]/_components/canvas-stage.spec.tsx
- apps/web/app/editor/[id]/_components/canvas-stage.tsx
- apps/web/app/editor/[id]/_components/font-picker.tsx
- apps/web/app/editor/[id]/_components/new-design-dialog.tsx
- apps/web/app/editor/[id]/_components/text-editor-overlay.tsx
- apps/web/lib/image-upload.spec.ts
- apps/web/lib/image-upload.ts
- apps/web/stores/use-document-store.spec.ts
- apps/web/stores/use-document-store.ts
- apps/web/stores/use-ui-store.spec.ts
- apps/web/stores/use-ui-store.ts
- packages/canvas-engine/src/canvas-renderer.spec.ts
- packages/canvas-engine/src/canvas-renderer.ts
- packages/canvas-engine/src/elements/image-element.ts
- packages/canvas-engine/src/image-cache.spec.ts
- packages/canvas-engine/src/image-cache.ts
- packages/canvas-engine/src/index.ts

## Change Log

- 2026-03-20: Implemented Story 1.6 signed image upload, full-resolution image placement, and canvas bitmap rendering.
- 2026-03-20: Added engine, web helper, store, API, and interaction regression tests for image upload and placement.
- 2026-03-20: Validated the workspace with `pnpm lint`, `pnpm test`, and `pnpm build`.
- 2026-03-20: Fixed code-review findings by adding renewable signed image read URLs plus background refresh, and by removing `ImageCache` listener accumulation.
