# Story 1.5: Text Element - Create & Edit with Google Fonts

Status: done

## Story

As a designer,
I want to add and edit text elements with full Google Fonts support,
so that I can create professional typography in my designs.

## Acceptance Criteria

1. The editor exposes a Text tool, and clicking the canvas creates a `TextElement` at the viewport-aware canvas coordinate, auto-selects it, and enters text edit mode immediately without requiring a page reload. (FR12, FR7)
2. While a text element is in edit mode, typing updates the committed text content in near real time and the canvas re-renders using the selected font family, size, and fill color. The committed render path remains Canvas 2D based; any DOM text input used for editing is transient only. (FR12, FR20c)
3. The font picker searches Google Fonts metadata with a debounced, cached query path and applies the selected family immediately after the font is available to the page. Search results should feel responsive enough to satisfy the story target of appearing within 500ms for repeated or cached queries. (FR20)
4. For a selected text element, the editor exposes typography controls without losing cursor position: Simple mode shows font family, font size, and color; Pro mode additionally shows bold, italic, underline, and text alignment. (FR12, FR20f, UX-DR3)
5. Text editing and styling do not regress existing canvas behavior from Stories 1.3 and 1.4: wheel zoom, `Ctrl++`, `Ctrl+-`, `Ctrl+0`, `Space` + drag pan, shape tools, and viewport-aware rendering continue to work correctly. Keyboard shortcuts meant for canvas navigation must not hijack focused text input. (FR7, FR20c)
6. The implementation keeps `@design-editor/canvas-engine` free of React, Zustand, and Next.js dependencies, uses Google Fonts only for Phase 1 font sourcing, and the workspace still passes `pnpm lint`, `pnpm test`, and `pnpm build`. (FR12, FR20)

## Tasks / Subtasks

- [x] Task 1: Extend text model and renderer support for Phase 1 typography controls (AC: 2, 4, 6)
  - [x] Reuse the existing `TextElement` type and `packages/canvas-engine/src/elements/text-element.ts` draw path instead of introducing a parallel text-rendering system
  - [x] Add only the missing shared text style fields required by this story, such as underline, while keeping the model primitive and Canvas-friendly
  - [x] Keep committed text rendering in `packages/canvas-engine`; do not leave finalized text as DOM overlays after edit mode ends

- [x] Task 2: Add minimal document and UI state for text creation, editing, and typography controls (AC: 1, 2, 3, 4, 5)
  - [x] Extend `apps/web/stores/use-document-store.ts` with the minimum actions needed to create/select text elements, update text content, and patch selected text styles
  - [x] Extend `apps/web/stores/use-ui-store.ts` with text-tool and text-editing state, plus a narrow Simple/Pro typography mode for this story only
  - [x] If loading state is introduced for font search or font loading, model it as an explicit status union or enum rather than a boolean flag

- [x] Task 3: Implement text-tool interactions and transient edit UI in the editor shell (AC: 1, 2, 4, 5)
  - [x] Update `apps/web/app/editor/[id]/_components/canvas-stage.tsx` so the Text tool creates a new text element from a viewport-aware click rather than raw screen coordinates
  - [x] Prefer a positioned `<textarea>` or similarly simple transient editor over a rich `contenteditable` system, because this story is plain text only and must preserve cursor stability
  - [x] Keep the edit overlay transient and scoped to the web layer; do not move DOM editing concerns into `packages/canvas-engine`
  - [x] Ensure focused text input suppresses canvas shortcuts and Space-pan hijacking until editing is committed or canceled

- [x] Task 4: Add Google Fonts metadata search and runtime font loading in the web layer (AC: 2, 3, 6)
  - [x] Add a small `apps/web/lib/` helper for Google Fonts metadata fetch, query filtering, debounce/caching, and font stylesheet or `document.fonts.load(...)` orchestration
  - [x] Keep Google Fonts API usage out of `packages/canvas-engine`; the engine should only consume the chosen `fontFamily` string
  - [x] If a new public API key env var is required, update `.env.example`, `apps/web/.env.local.example`, and any shared env validation touched by the web app so local development remains explicit and reproducible

- [x] Task 5: Expose text properties with a scoped Simple/Pro control surface (AC: 3, 4, 5)
  - [x] Reuse the current editor shell and extract a small component such as `text-editor-overlay.tsx` or `font-picker.tsx` only if it materially reduces `canvas-stage.tsx` complexity
  - [x] Provide exactly the controls required by this story: font family, font size, fill color, bold, italic, underline, and alignment
  - [x] Do not expand this story into rich text spans, letter spacing, uploaded fonts, kerning controls, text-on-path, text box resize handles, or the full global Simple/Pro mode system planned later

- [x] Task 6: Add tests that lock in text-editing and font-loading guardrails (AC: 1, 2, 3, 4, 5, 6)
  - [x] Add or extend renderer tests for text style rendering behavior that is practical to assert in the current Vitest canvas setup
  - [x] Add `apps/web` store tests for text creation, text-style patches, mode separation, and editing-state boundaries
  - [x] Add focused tests around Google Fonts query caching or loading orchestration with mocked fetch and mocked `document.fonts`
  - [x] Add at least one interaction-oriented path proving that text creation uses viewport-aware coordinates and that focused text input does not trigger canvas navigation shortcuts

- [x] Task 7: Run workspace validation before handoff (AC: 6)
  - [x] Run `pnpm lint`
  - [x] Run `pnpm test`
  - [x] Run `pnpm build`

## Dev Notes

### Story Intent and Scope Boundaries

- This story adds the first text-authoring flow on top of the navigation foundation from Story 1.3 and the shape-authoring shell from Story 1.4.
- The goal is plain text editing with Google Fonts-backed family selection and basic typography controls.
- Keep the scope narrow: no rich text spans, no mixed styles within one text node, no text-on-path, no uploaded custom fonts, no advanced kerning/letter-spacing panel, no resize handles, no rotation handles, and no full layout/text-box editing suite.
- Treat the Simple/Pro requirement as the minimum text-controls split needed for this story. Do not implement the future full-editor mode-toggle system from Story 1.11 here.

### Current Codebase State

- `packages/common-types/src/elements.ts` already defines `TextElement` with `text`, `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `textAlign`, `fill`, and `lineHeight`.
- `packages/canvas-engine/src/elements/text-element.ts` already renders text elements on Canvas 2D, and `packages/canvas-engine/src/element-factory.ts` already routes `type: 'text'`.
- `apps/web/stores/use-document-store.ts` already seeds a `text-title` element and contains the existing pattern for shape commit and selected-shape style patching, but it has no text-specific creation or editing actions yet.
- `apps/web/stores/use-ui-store.ts` currently tracks viewport, active tool (`select`, `rectangle`, `ellipse`), and new-design dialog state; it does not yet model text editing, typography mode, or font search/loading status.
- `apps/web/app/editor/[id]/_components/canvas-stage.tsx` already owns the current editor shell, canvas stage, tool buttons, navigation shortcuts, and shape-authoring interactions. Story 1.5 should extend this shell rather than creating a second editor entry point.

### Technical Requirements

- Create text elements from viewport-aware canvas coordinates by reusing `renderer.screenToCanvas(...)` or equivalent renderer-owned math; do not use raw `clientX`/`clientY`.
- Prefer a transient HTML text editor overlay in the web layer for edit mode, but keep committed rendering on the canvas through `drawTextElement`.
- Preserve cursor position while typography controls change. Avoid remounting the editor overlay or recreating the input node on every style update.
- Use Google Fonts only for Phase 1 font sourcing. Do not introduce user-uploaded font files, local font scanning, or server-side font persistence in this story.
- Keep font metadata fetch and runtime font loading in `apps/web`, not in `packages/canvas-engine`.
- If using the Google Fonts Developer API, account for the documented API-key requirement and use a debounced, cached query path so repeated searches are fast enough for the story target.
- After selecting a font family, ensure the browser has the font available before treating the change as applied. Prefer a simple, explicit readiness path such as stylesheet loading plus `document.fonts.load(...)`.
- Add underline support only if the shared `TextElement` shape truly needs it for committed rendering. Keep style fields flat and serializable.
- Focused text input must suppress canvas navigation shortcuts such as `Space`-pan and zoom shortcuts until editing ends.

### Architecture Compliance

- Preserve the current split: `useDocumentStore` owns committed text content and selected element IDs; `useUIStore` owns tool mode, transient editing state, and font-search/loading UI state.
- `packages/canvas-engine` must remain pure TypeScript with zero imports from React, Next.js, or Zustand.
- Do not move Google Fonts networking, DOM font loading, or transient text-editing DOM concerns into the canvas engine package.
- Follow the existing direct engine API pattern from Stories 1.3 and 1.4 instead of reintroducing broad global events.
- Keep committed text as `TextElement` data plus renderer output, not as DOM nodes layered permanently over the canvas.

### Library / Framework Requirements

- Reuse the existing React 19, Next.js 15, Zustand 5, and Vitest setup already present in the workspace.
- Reuse browser-native Canvas 2D, `textarea`, and font-loading capabilities; avoid adding a rich-text editor dependency for this story.
- If external font metadata is fetched client-side, use official Google Fonts endpoints only and keep the fetch client small and testable.
- If a new env var is introduced for Google Fonts metadata access, wire it through the existing example env files and shared env validation path instead of hiding it inside ad hoc `process.env` reads.

### File Structure Requirements

- Expected files to update for this story:
  - `apps/web/app/editor/[id]/_components/canvas-stage.tsx`
  - `apps/web/stores/use-document-store.ts`
  - `apps/web/stores/use-document-store.spec.ts`
  - `apps/web/stores/use-ui-store.ts`
  - `apps/web/stores/use-ui-store.spec.ts`
  - `packages/common-types/src/elements.ts`
  - `packages/common-types/src/index.ts`
  - `packages/canvas-engine/src/elements/text-element.ts`
- Additional small files are acceptable only if they materially reduce complexity:
  - `apps/web/app/editor/[id]/_components/text-editor-overlay.tsx`
  - `apps/web/app/editor/[id]/_components/font-picker.tsx`
  - `apps/web/lib/google-fonts.ts`
- Follow the current repo shape first. Do not prematurely create the long-term `toolbar/` or `properties-panel/` directory system unless one small extracted file is directly justified.

### Testing Requirements

- Add deterministic coverage for text creation, text content updates, style patching, and any new shared text-style field such as underline.
- Add store-level assertions that text editing state stays separated between document content and UI-only state.
- Add focused tests for Google Fonts query caching/loading orchestration using mocked fetch and mocked `document.fonts`.
- Add at least one path proving text creation uses viewport-aware coordinates and that keyboard input focus blocks canvas navigation shortcuts while editing.
- Before marking the story complete, the monorepo root must pass `pnpm lint`, `pnpm test`, and `pnpm build`.

### Previous Story Intelligence

- Story 1.4 extended the existing editor shell instead of creating a separate authoring surface. Continue evolving `canvas-stage.tsx`, `useDocumentStore`, and `useUIStore` rather than introducing a parallel text subsystem.
- Story 1.4 reinforced that viewport-aware element creation must come from renderer-owned coordinate conversion, and that the committed document should not be dirtied by transient UI state.
- Story 1.4 also preserved the `useDocumentStore` / `useUIStore` boundary and kept `packages/canvas-engine` framework-free. Maintain both guarantees here.
- The final Story 1.4 review fix corrected a quadrant edge case in pure geometry math and added regression coverage. Carry that mindset forward for text editing edge cases such as cursor stability and shortcut suppression.

### Git Intelligence Summary

- Recent git history is still minimal, so the strongest implementation guidance comes from the current workspace and completed Story 1.3/1.4 artifacts rather than commit archaeology.
- The current editor architecture is centered on a single `canvas-stage.tsx` shell plus two Zustand stores and a pure TypeScript renderer package. Story 1.5 should keep that topology intact.

### Latest Technical Information

- Google Fonts Developer API is the official metadata source for available font families and documents that requests require an API key. It returns family metadata including variants, subsets, and sort/filter options. Inference: use it for the family catalog instead of hardcoding a stale list. [Source: https://developers.google.com/fonts/docs/developer_api]
- Google Fonts also documents the CSS API for loading selected families into a page. Inference: apply chosen families through the browser font-loading path rather than bundling font binaries into the repo. [Source: https://developers.google.com/fonts/docs/getting_started]
- MDN documents the CSS Font Loading API as the browser mechanism for tracking dynamic font availability. Inference: use `document.fonts` to know when a selected family is actually ready before assuming the canvas render is showing the final typeface. [Source: https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API]

### Project Structure Notes

- The architecture's target tree mentions dedicated `toolbar/` and `properties-panel/` folders, but the real workspace currently keeps the editor controls inline inside `canvas-stage.tsx`. Follow the current repo shape first and extract only the files this story truly needs.
- `packages/canvas-engine/src/elements/text-element.ts` already exists and should remain the sole committed text draw path.
- No `project-context.md` file was detected in the repository during story creation, so this story is grounded in the sprint tracker, epics, PRD, architecture, current workspace state, and the completed Story 1.4 artifact.

### References

- Epic story definition and acceptance criteria [Source: _bmad-output/planning-artifacts/epics.md#Story-1.5-Text-Element---Create--Edit-with-Google-Fonts]
- Epic cross-cutting requirements for core editor scope [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Core-Design-Editor--Create--Edit-Designs-Phase-1]
- PRD scope and legal constraint for Google Fonts only [Source: _bmad-output/planning-artifacts/prd.md#Implementation--Scope-Guardrails]
- PRD Phase 1 text/font requirements [Source: _bmad-output/planning-artifacts/prd.md#Phase-1--Core-Editor]
- PRD functional requirements FR12, FR20, FR20c, FR20f [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements]
- Architecture technical constraint for Google Fonts API [Source: _bmad-output/planning-artifacts/architecture.md#Technical-Constraints--Dependencies]
- Architecture frontend renderer/store boundary [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Architecture]
- Architecture implementation patterns and consistency rules [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns--Consistency-Rules]
- Architecture project structure and boundaries [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure--Boundaries]
- Previous implementation learnings [Source: _bmad-output/implementation-artifacts/1-4-basic-shape-tools-rectangle-and-ellipse.md]
- Google Fonts Developer API [Source: https://developers.google.com/fonts/docs/developer_api]
- Google Fonts CSS API getting started [Source: https://developers.google.com/fonts/docs/getting_started]
- MDN CSS Font Loading API [Source: https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-03-20 15:02 ICT: Loaded BMAD create-story workflow, sprint tracker, Epic 1 Story 1.5 requirements, PRD, architecture, current workspace files, and Story 1.4 artifact to build implementation-ready context.
- 2026-03-20 15:22 ICT: Implemented text-tool creation, transient textarea overlay, Simple/Pro typography controls, shared text-style updates, and Google Fonts metadata/loading helpers across the web and canvas-engine layers.
- 2026-03-20 15:30 ICT: Fixed the final Google Fonts helper spec by running it in `jsdom`, then re-ran `pnpm lint`, `pnpm test`, and `pnpm build` successfully.
- 2026-03-20 16:00 ICT: Fixed post-review follow-ups by targeting text mutations with explicit `elementId`s, closing edit-mode selection drift, and changing Google Fonts catalog search to require a configured API key instead of falling back to a partial shortlist.
- 2026-03-20 16:08 ICT: Corrected the shared env validation regression so `NEXT_PUBLIC_GOOGLE_FONTS_API_KEY` is required only for the web target, then re-ran `pnpm lint`, `pnpm test`, and `pnpm build` successfully.

### Completion Notes List

- Added viewport-aware text creation and transient DOM editing while keeping committed text rendering in Canvas 2D.
- Added debounced, cached Google Fonts search/loading in the web layer with explicit API-key validation for full-catalog search and clear UI error messaging when the key is missing.
- Extended typography controls with Simple/Pro mode, underline support, and focused-input shortcut suppression without pulling React/Zustand/Next.js into `@design-editor/canvas-engine`.
- Follow-up review fixes now bind text edits and async font application to the intended text element instead of the current selection, preventing cross-element mutations during edit mode.
- Shared env validation now keeps the Google Fonts API key scoped to the web app, so API and worker boot paths are no longer blocked by a frontend-only setting.
- Validation passed at monorepo root: `pnpm lint`, `pnpm test`, and `pnpm build`.

### File List

- .env
- .env.example
- _bmad-output/implementation-artifacts/1-5-text-element-create-and-edit-with-google-fonts.md
- apps/web/.env.local.example
- apps/web/app/editor/[id]/_components/canvas-stage.tsx
- apps/web/app/editor/[id]/_components/font-picker.tsx
- apps/web/app/editor/[id]/_components/text-editor-overlay.tsx
- apps/web/lib/google-fonts.spec.ts
- apps/web/lib/google-fonts.ts
- apps/web/stores/use-document-store.spec.ts
- apps/web/stores/use-document-store.ts
- apps/web/stores/use-ui-store.spec.ts
- apps/web/stores/use-ui-store.ts
- packages/canvas-engine/src/elements/text-element.spec.ts
- packages/canvas-engine/src/elements/text-element.ts
- packages/common-types/src/elements.ts
- packages/common-types/src/env.ts

## Change Log

- 2026-03-20: Implemented Story 1.5 text authoring flow with Google Fonts-backed typography controls and transient DOM editing.
- 2026-03-20: Added renderer/store/font-helper regression coverage and completed `pnpm lint`, `pnpm test`, and `pnpm build`.
- 2026-03-20: Fixed review findings around text edit targeting and Google Fonts catalog configuration, then re-ran `pnpm lint`, `pnpm test`, and `pnpm build`.
- 2026-03-20: Fixed the final review regression in shared env validation so the Google Fonts API key remains web-only, then re-ran `pnpm lint`, `pnpm test`, and `pnpm build`.
