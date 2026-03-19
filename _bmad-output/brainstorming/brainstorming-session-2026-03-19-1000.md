---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Xây dựng Design Editor Web App giống Canva — Tech Stack + PSD/AI Import'
session_goals: 'Khám phá tech stack, kiến trúc hệ thống; tìm giải pháp xử lý import file .psd và .ai và convert sang editor'
selected_approach: 'ai-recommended'
techniques_used: ['First Principles Thinking', 'Cross-Pollination', 'Quality-First Import Analysis']
ideas_generated: [
  'Scene Graph Renderer architecture',
  'Canvas 2D vs WebGL decision matrix',
  'Hybrid Renderer with IRenderer interface',
  'Custom Canvas 2D Renderer — full implementation',
  'Effects Renderer — offscreen compositing',
  'Text Layout Engine — word wrap + inline editing',
  'AI file import — Smart Hybrid rasterize strategy',
  'Layer merge algorithm — preserve text + merge vectors',
  'Transparency pipeline — no white background',
  'Rasterize-to-Image for complex blend modes',
  'ECS composition from game engines',
  'R-Tree spatial index for hit testing',
  'Object pooling for offscreen canvases',
  'Worker thread renderer separation',
  'Non-destructive image adjustments',
  'Layer cache per element (Chromium-inspired)',
  'Snap engine + smart guides (CAD-inspired)',
  'Yjs CRDT for real-time collaboration',
  'Command Pattern undo/redo',
  'Font resolution pipeline',
  'Quality gate checker after import'
]
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Tantr
**Date:** 2026-03-19

## Session Overview

**Topic:** Xây dựng Design Editor Web App giống Canva — Tech Stack + PSD/AI Import
**Goals:** Khám phá tech stack, kiến trúc hệ thống; tìm giải pháp xử lý import file .psd và .ai và convert sang editor

### Session Setup

Phiên brainstorming tập trung vào hai trục chính:
1. Tech stack & kiến trúc để xây dựng design editor trên web tương tự Canva
2. Kỹ thuật xử lý/import/convert file .psd (Photoshop) và .ai (Adobe Illustrator)

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Design Editor Web App với focus kỹ thuật sâu về rendering, state management và file format parsing

**Recommended Techniques:**
- **First Principles Thinking:** Phân rã nguyên lý cốt lõi của design editor trên web
- **Cross-Pollination:** Học từ game engine, CAD, Figma, PDF renderer, video editor
- **Quality-First Import Analysis:** Đảm bảo fidelity, transparency, layer merging

---

# 🏗️ TECH ARCHITECTURE DECISION DOCUMENT
## Design Editor Web App — Canva-like

> Tổng hợp từ phiên brainstorming 2026-03-19

---

## 1. RENDERING ENGINE

### Quyết định: Custom Canvas 2D từ đầu (Không dùng Konva.js)

**Lý do Canva dùng Canvas 2D + WASM thay vì WebGL (như Figma):**
- Target user: designer phổ thông → ưu tiên time-to-market > raw performance
- Canvas 2D đủ cho 20–80 elements/page (typical Canva usage)
- WebGL = viết mini GPU pipeline, dev cost 10x cao hơn

**Lý do bỏ Konva.js hoàn toàn:**
- Build cả 3 phases trước production → lý do "launch nhanh" không còn giá trị
- Không có migration cost Phase 1→2 (~3–4 tuần tiết kiệm)
- Không couple business logic vào Konva API
- Net: +10 ngày Phase 1 (viết handles/drag), -3 tuần migration = tiết kiệm ~2 tuần tổng

| Path | Timeline | Migration Cost | Decision |
|------|----------|----------------|----------|
| ~~Konva.js~~ | ~~3 tháng~~ | ~~Cao~~ | ❌ Bỏ |
| **Custom Canvas 2D** | **3.5 tháng** | **Không có** | **⭐ Chọn** |
| WebGL/PixiJS | 6+ tháng | N/A | Phase 3+ nếu cần |

**Architecture quyết định:**
```
src/
├── core/          # KHÔNG phụ thuộc renderer (document, commands, store)
├── renderer/
│   ├── IRenderer.ts          # Interface abstraction (giữ cho future-proof)
│   └── canvas/CanvasRenderer # Custom Canvas 2D — dùng từ Phase 1
├── editor/        # React UI — chỉ dùng IRenderer interface
└── importers/     # AI, SVG, PSD parsers
```

**Phần tự viết thay Konva (Phase 1, ~10 ngày):**
- `TransformHandleRenderer` — 8 resize handles + rotation handle
- `InteractionManager` — drag, resize, rotate via mousemove delta
- `LassoSelector` — rectangle select + R-Tree query

**Custom Canvas 2D Renderer — Core Components:**
- `Viewport` — pan/zoom với camera transform matrix
- `CanvasRenderer` — RAF loop + dirty rectangle optimization + double buffering
- `HitTester` — toLocalSpace transform + R-Tree spatial index (O log n)
- `EffectRenderer` — offscreen canvas compositing (drop shadow, glow, blur)
- `TextLayoutEngine` — word wrap, line break, inline styles
- `TextEditor` — HTML contenteditable overlay với coordinate transform
- `FontLoader` — document.fonts.load() với preload pipeline

---

## 2. DOCUMENT MODEL

### Core Types

```typescript
interface Document {
  id: string; version: number
  pages: Page[]
  assets: AssetMap
}

interface Page {
  id: string; width: number; height: number
  elements: Element[]
  background: Fill
}

type Element = RectElement | EllipseElement | PathElement
             | TextElement | ImageElement | GroupElement | FrameElement

interface BaseElement {
  id: string; type: string
  transform: Transform    // x, y, width, height, rotation, scaleX, scaleY, originX, originY
  opacity: number
  blendMode: GlobalCompositeOperation
  visible: boolean; locked: boolean
  effects: Effect[]       // dropShadow, innerShadow, blur, glow
  name: string
}
```

### Fill System
```
Fill = solid | linear gradient | radial gradient | image | none
```

### Effect Pipeline (Photoshop order)
```
1. Drop shadows (dưới element)
2. Outer glow
3. Element body
4. Inner shadow (clip bởi shape)
5. Stroke
6. Color overlay
```

---

## 3. STATE MANAGEMENT

### Zustand + Immer
- Boilerplate thấp, không cần Provider wrap
- Immer handles immutability tự động

### Undo/Redo — Command Pattern
```typescript
interface Command {
  execute(): void
  undo(): void
  merge?(other: Command): Command | null  // typing → merge thành 1 undo
}
// HistoryManager: undoStack + redoStack
// MoveElementCommand, ResizeCommand, UpdateTextCommand...
```

**Key rule:** Typing text = merge commands → 1 Ctrl+Z undo cả đoạn text

---

## 4. REAL-TIME COLLABORATION

### Yjs CRDT (Industry standard 2026)
- Serverless-friendly, offline support tốt
- Dùng bởi Figma, Notion, Linear
- `y-websocket` provider tự handle sync + reconnect

```typescript
const ydoc    = new Y.Doc()
const yElems  = ydoc.getMap('elements')  // shared state
// Awareness: cursor positions, user presence
provider.awareness.setLocalState({ user: { name, color }, cursor })
```

---

## 5. CROSS-POLLINATION INSIGHTS (từ 6 domain)

| Domain | Pattern | Áp dụng |
|--------|---------|---------|
| Game Engine | ECS composition | Element types dùng composition, không inheritance |
| Game Engine | R-Tree spatial index | Hit testing O(log n), lasso select nhanh |
| Game Engine | Object pooling | Reuse offscreen canvas, không tạo mới mỗi frame |
| Figma | UI/Render thread split | Worker thread cho renderer — không jank UI |
| Figma | WASM cho heavy lifting | Blur, font shaping, image effects → WASM/Rust |
| Photopea | PSD compositing pipeline | Blend modes, layer masks chính xác |
| Video Editor | Non-destructive adjustments | Image filters stored as metadata, never destroy original |
| Video Editor | Keyframe interpolation | Animation system với cubic bezier easing |
| CAD Software | Snap engine | 9-point snap per element + equidistant snap |
| CAD Software | Smart guides | Distance labels khi drag gần element khác |
| Browser Engine | Paint invalidation | Layer cache per element — chỉ redraw changed |
| Browser Engine | CSS contain | HTML overlay isolation — no reflow |

---

## 6. AI FILE IMPORT PIPELINE

### Fidelity Target: 90%+ cho standard marketing/design files

### Smart Hybrid Strategy

```
AI File
  ↓ Server-side: Inkscape CLI → SVG
  ↓ stripAIBackground() + fixSVGRoot()   ← remove injected white bg
  ↓ SmartLayerMerger.process()
        ├── Text              → TextElement    (100% editable, NEVER rasterize)
        ├── Simple vector     → PathElement    (100% editable)
        ├── Pure vector group → 1 compound     (merged ≥3 same-fill paths)
        │   (no text/image)     PathElement
        ├── Canvas blend mode → ImageElement   (resize/rotate) + blendMode preserved
        └── Complex effects   → ImageElement   (Inkscape render → PNG → alpha preserved)
            gradient mesh       source-over     visual 100% correct
            live effects
            unsupported blend
```

### Layer Decision Table

| Layer type | Strategy | Editable |
|------------|----------|----------|
| Text | TextElement | ✅ Full edit |
| Simple path/shape | PathElement | ✅ Full edit |
| Pure vector group (≥3 paths, same fill) | Merged compound Path | ✅ Shape edit |
| Group with Canvas-supported blend mode | ImageElement + blendMode | ↔ Resize/rotate |
| Complex effects (gradient mesh, 3D, live warp, unsupported blend) | ImageElement (Inkscape render) | ↔ Resize/rotate |

### Transparency Rules (KHÔNG bao giờ có nền trắng)
1. `canvas.getContext('2d', { alpha: true })` — explicit
2. KHÔNG bao giờ `fillRect` white trước khi draw
3. Output LUÔN `image/png` — không bao giờ `image/jpeg`
4. Inkscape: `--export-background-opacity=0`
5. Strip injected background rectangle từ SVG output
6. Effect bleed padding = shadow_offset + blur*2 + spread + 8px safety

### Font Resolution Pipeline
```
1. Check embedded fonts trong AI file
2. Map → Google Fonts catalog (~200 common fonts)
3. Search font library
4. Fallback: visual-similar font + warning toast
```

### Blend Mode Coverage
- Canvas API native: 16/28 blend modes
- Unsupported modes (dissolve, linearBurn, divide...): rasterize composite
- Result: 100% visual accuracy cho mọi blend mode

### Quality Gate (sau mỗi import)
- Detect white background bằng corner pixel sampling
- Verify text layer count preserved
- Check layer reduction ratio (>30% reduction = good merge)
- Verify rasterized DPI ≥ 96 (preferably 144 = 2x)

---

## 7. TECH STACK TỔNG HỢP

### Frontend
```
Framework:     React 19 + TypeScript
State:         Zustand + Immer
Styling:       Tailwind CSS (UI panels) + CSS Modules
Canvas:        Phase 1: Konva.js | Phase 2: Custom Canvas 2D
Collaboration: Yjs + y-websocket
Font loading:  document.fonts API + FontFace
Path2D:        Native browser API (SVG path strings)
```

### Backend
```
Runtime:       Node.js (Fastify) hoặc Go
Rasterizer:    Inkscape CLI (headless) — AI/SVG → PNG
File parsing:  Server-side SVG processing
Storage:       S3-compatible (assets)
WebSocket:     Yjs WebSocket provider server
Queue:         Rasterize jobs (Bull/BullMQ)
```

### WASM Modules (Phase 2+)
```
Image effects: Rust → WASM (Gaussian blur, brightness, contrast)
Font shaping:  HarfBuzz WASM (OpenType, complex scripts)
PSD parsing:   ag-psd (TypeScript) | @webtoon/psd (WASM)
```

---

## 8. PHASED ROADMAP

### Phase 1 — Core Foundation (0–3.5 tháng)
```
✅ Custom Canvas 2D renderer (IRenderer interface)
✅ Core element types: rect, ellipse, path, text, image, group, frame
✅ Viewport: pan/zoom với camera transform
✅ Hit testing: R-Tree spatial index O(log n)
✅ Selection + Transform handles (resize 8 points + rotate)
✅ Drag & drop, lasso select
✅ Basic text (single style)
✅ Undo/redo (Command Pattern)
✅ React UI shell (toolbar, properties panel, layer panel)
✅ Export PNG
✅ Basic AI import (Inkscape server-side → Smart Hybrid v1)
```

### Phase 2 — Full Feature (3.5–6.5 tháng)
```
✅ Effects renderer: drop shadow, blur, glow, inner shadow
✅ Text engine full: multiline, inline styles, 3 overflow modes
✅ Non-destructive image adjustments (brightness, contrast, HSL, filters)
✅ Snap engine: 9-point per element + equidistant snap
✅ Smart guides: alignment lines + distance labels
✅ AI import v2: font resolution pipeline, blend mode WebGL shaders
✅ Worker thread renderer (UI thread không bao giờ block)
✅ Layer cache per element + Object pool (60fps stable)
✅ Layer merge UI (user có thể manual merge groups)
```

### Phase 3 — Scale & Polish (6.5–12 tháng)
```
✅ Yjs real-time collaboration + WebSocket server
✅ WASM image effects: Rust → WASM (blur, curves, levels)
✅ PSD import pipeline (ag-psd + Smart Hybrid)
✅ Animation system: keyframe + cubic bezier interpolation
✅ Export: PDF, SVG, WebP
✅ Template system + asset library
✅ Font management (upload custom fonts)
✅ Comment / review mode

→ Production launch sau Phase 3 với full Canva-level quality
```

---

## 9. KEY ARCHITECTURAL DECISIONS — TÓM TẮT

| Quyết định | Lựa chọn | Lý do |
|------------|---------|-------|
| Rendering | Custom Canvas 2D từ Phase 1 (bỏ Konva) | Full control, no migration cost, net -2 tuần tổng |
| State | Zustand + Immer | Low boilerplate, predictable |
| Undo/Redo | Command Pattern | Text merge, granular control |
| Collaboration | Yjs CRDT | Offline-first, serverless-friendly |
| AI Import | Inkscape server + Smart Hybrid | 90%+ fidelity, 100% text editable |
| Complex effects | Rasterize → ImageElement | Visual accuracy > editability |
| Transparency | PNG only + alpha:true + no fill | No white background ever |
| Text editing | HTML contenteditable overlay | Best UX, full browser support |
| Hit testing | R-Tree spatial index | O(log n) — scales to 1000+ elements |
| Performance | Dirty rect + Layer cache + Object pool | 60fps without GPU |

---

## 10. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Konva.js ceiling ở 500+ elements | Medium | IRenderer interface → swap dễ |
| AI file có gradient mesh / 3D | High | Rasterize fallback đã có sẵn |
| Font mismatch khi import | Medium | Font resolution pipeline + user upload |
| Inkscape server bottleneck | Medium | Queue + cache rasterized results |
| Text editing UX với rotated elements | High | HTML overlay với CSS transform |
| Real-time collab conflict resolution | High | Yjs CRDT xử lý tự động |

