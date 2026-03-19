---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'critical-fixes-c1-c2-c3']
inputDocuments: ['_bmad-output/brainstorming/brainstorming-session-2026-03-19-1000.md']
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 1
projectDocsCount: 0
classification:
  appType: Web SaaS Application
  domain: Creative Tools / Graphic Design
  complexity: High
  projectNature: Greenfield
  primaryMarket: B2C (Individual designers, marketers, content creators)
  secondaryMarket: B2B (Agencies, teams)
  businessModel: Freemium
  userTiers:
    - Free: Content creators (limited exports, watermark)
    - Pro: Marketers & designers (AI/PSD import, brand kit, full export)
    - Studio: Agencies & teams (collaboration, print-ready, CMYK)
  uiModes:
    - Simple: Marketer mode (text, color, template-focused)
    - Pro: Designer mode (layers, effects, paths, full control)
  killerDifferentiator: Import AI/.ai/PSD from Illustrator/Photoshop → fully editable in browser
  importFidelityTarget: 90%+ with explicit quality gate acceptance criteria
elicitation:
  methodsRun: ['User Persona Focus Group', 'Shark Tank Pitch', 'Pre-mortem Analysis', 'Cross-Functional War Room']
  keyPersonas: ['Minh (freelance designer)', 'Lan (marketing manager)', 'Tuấn (content creator)', 'Nam (agency owner)']
  keyInsights:
    - Import-to-customize is use case #1, not create-from-scratch
    - Trust = Import Quality (acceptance criteria required)
    - Asset marketplace integration (Freepik/Envato) as acquisition channel
    - Moat = proprietary import pipeline + template ecosystem + network effect
    - Import = Pro-only feature (paywall for free→paid conversion)
  criticalRisks:
    - FATAL: Import fidelity destroys trust on day 1 → need Quality Gate + graceful degradation UX
    - FATAL: Inkscape server not scalable → containerized workers + async import UX required
    - HIGH: Feature creep vs Canva → hard Phase 1 scope freeze + anti-scope list required
    - HIGH: Font licensing legal issue → Google Fonts only + substitution disclosure
    - HIGH: Yjs overhead hurts solo users → lazy init, activate only on collab session
  nfrRequirements:
    - Import wait time P95 <= 10s, async UX for queue
    - Rate limit: Free=3 imports/day, Pro=unlimited, priority queue by tier
    - Canvas 2D render loop < 16ms (60fps) on 200-element document, solo mode
    - Yjs overhead = 0ms on solo user (lazy init)
    - Import Quality Gate: font preserved or substitution disclosed, color delta < 5%, effects warn if approximated
  antiScope_phase1:
    - No presentation mode
    - No asset marketplace
    - No CMYK/print-ready (Phase 3)
    - No real-time simultaneous editing (Phase 3)
    - No PSD import (Phase 4)
    - No effects/gradients (Phase 2)
    - No video/animation (Phase 2)
    - No WASM effects engine (Phase 2)
  warRoomResolutions:
    importUX:
      - Async 3-stage import: Upload → Processing (poll 3s with status messages) → QA Report modal
      - Import QA Report: show font substitutions, color accuracy, effect approximations BEFORE opening document
      - User confirms before opening (trust preserved, no surprise)
    freeTier:
      - Export limit: Free = max 1080px, 3 exports/day, no watermark
      - Pro = unlimited exports, up to 4K, PNG/SVG/PDF/print
      - Import AI/PSD = hard Pro paywall (no preview for Free)
      - Share link view-only = Free (viral loop)
    phase1Scope:
      elements: [Rectangle, Ellipse, Text, Image, Group]
      features: [AI import, basic shapes, text editing, image placement, async collab, share link, comments]
      timeline: 3.5 months firm — reduce scope not time
    collaboration:
      phase1: Share link (view-only) + comment threads (async)
      phase2: Real-time presence (show who's viewing)
      phase3: Full Yjs CRDT simultaneous editing
      phase1StudioSelling: Advanced import + team async collab + priority support
    testing:
      - Visual regression test suite (Percy or Chromatic) from day 1
      - Canvas pixel-diff automated on every renderer commit
---

# Product Requirements Document - Design Editor

**Author:** Tantr
**Date:** 2026-03-19

---

## Executive Summary

DesignEditor là nền tảng thiết kế đồ họa web-based all-in-one, cho phép người dùng tạo design chuyên nghiệp từ đầu hoặc import file Adobe Illustrator (.ai) và Photoshop (.psd) để chỉnh sửa trực tiếp trong browser — không cần cài đặt phần mềm. Nền tảng hướng đến ba nhóm người dùng chính: **freelance designers** cần chia sẻ editable assets với khách hàng, **marketing managers** cần customize brand assets từ design team, và **content creators** cần công cụ thiết kế nhanh với chất lượng chuyên nghiệp. Sản phẩm vận hành theo mô hình freemium B2C với ba tiers: Free, Pro, và Studio.

### What Makes This Special

Canva đã chứng minh nhu cầu thị trường cho web-based design tools ($40B valuation, 200M+ users) nhưng bị giới hạn bởi kiến trúc flat-asset từ 2013 — không thể import và preserve editability của file Adobe chuyên nghiệp. Adobe Express và Figma phục vụ UI design và CC ecosystem, không phải general creative design. DesignEditor lấp đầy khoảng trống này: **import AI/PSD với 90%+ fidelity** — text được preserve là TextElement editable, vector paths là PathElement editable, chỉ rasterize các elements có blend modes không hỗ trợ. Đây là tính năng mà không có competitor nào trong segment này làm được, tạo ra entry moat trước khi scale thành full creative ecosystem (template marketplace, AI generation, real-time collaboration).

## Project Classification

| Attribute | Value |
|---|---|
| **App Type** | Web SaaS Application |
| **Domain** | Creative Tools / Graphic Design |
| **Complexity** | High — custom Canvas 2D renderer, file format parsing (AI/PSD), real-time state management |
| **Nature** | Greenfield |
| **Primary Market** | B2C — Individual designers, marketers, content creators |
| **Secondary Market** | B2B — Agencies, design teams |
| **Business Model** | Freemium (Free / Pro $15/mo / Studio $49/mo) — billing Phase 4 |
| **Timeline** | 14+ months to full production (Phase 1: 3.5mo, Phase 2: 6.5mo, Phase 3: 10mo, Phase 4: 14mo+) |

---

## Success Criteria

### User Success

- **"Aha! moment"**: User import file AI lần đầu → text vẫn editable, layers intact, colors chính xác → cảm giác **professional** ngay trong browser, không cần Adobe CC
- **Create from scratch**: User không có design background tạo xong một design hoàn chỉnh (social post, banner, flyer) trong dưới 10 phút từ template
- **Import & customize**: Designer nhận file AI từ client → customize text và màu → export → gửi cho client trong dưới 5 phút
- **Trust metric**: Sau lần import đầu tiên, ≥80% users mở file thứ hai trong cùng session
- **Retention**: Day-30 retention ≥ 40% (benchmark: Canva ~45% D30)

### Business Success

| Metric | Target | Ghi chú |
|---|---|---|
| **Free signup** | 10,000 users | Từ organic / SEO / template sharing |
| **Pro conversion rate** | ≥ 5% free→Pro | Import feature là primary driver |
| **Pro users** | 500 paying users | Minimum viable revenue base |
| **MRR** | $7,500/mo | 500 Pro × $15 |
| **Import success rate** | ≥ 90% fidelity gate pass | Core quality metric |
| **Import→upgrade conversion** | ≥ 15% | User thử import (gated) → upgrade Pro |
| **Viral coefficient** | ≥ 0.3 | Mỗi user share ít nhất 1 design/tháng |

*Timeline: không có deadline cứng — launch khi chất lượng đạt, không phải khi đúng ngày*

### Technical Success

- **Render performance**: 60fps stable trên document 200 elements (solo mode)
- **Import latency**: P95 ≤ 10 giây cho file ≤ 50MB
- **Import fidelity**: ≥ 90% elements preserve đúng type (text → editable, vector → editable path)
- **Uptime**: ≥ 99.5% (~4h downtime/month max)
- **Export quality**: PNG transparent background, SVG vector-clean, PDF print-ready
- **Yjs collab overhead**: 0ms impact trên solo users

### Measurable Outcomes

- **Phase 1 launch gate**: 100 users import AI file thành công với fidelity ≥ 90% — *trước khi thêm bất kỳ feature mới*
- **Phase 2 launch gate**: D30 retention ≥ 35% + NPS ≥ 40
- **Phase 3 launch gate**: 500 active users + template marketplace live
- **Phase 4 launch gate**: 500 Pro paying users + collab session stable với 5 concurrent users

## Product Scope

### Phase 1 — Core Editor *(0 → 3.5 tháng)*

Rectangle, Ellipse, Text, Image, Group · AI import (.ai) · Export PNG/PDF/HTML · Share link · Comment threads · 20 templates · Google Fonts · Full access, no paywall

### Phase 2 — Visual Depth *(3.5 → 6.5 tháng)*

Gradients · Shadows/blur/blend modes · WASM effects engine · Pen tool + advanced shapes · Multi-page · Animation + video/GIF export · Font upload

### Phase 3 — Platform & Scale *(6.5 → 10 tháng)*

Advanced .ai import (gradients, symbols, masks native) · SVG import · Brand Kit · Template marketplace · 200+ templates · Freepik API · 4K export · Print-ready PDF · Workspace + team features

### Phase 4 — Monetization + AI + Collab *(10 → 14+ tháng)*

Subscription tiers (Free/Pro/Studio) · Stripe billing · Yjs real-time collab · AI features (BG remove, Text-to-Image, Magic Resize) · PSD import · Plugin marketplace

---

## User Journeys

### Journey 1 — Minh (Freelance Designer) · *Import & Deliver*

**Persona:** Freelance designer, 5 năm kinh nghiệm, dùng Illustrator daily. Nhận jobs từ SME clients cần brand customization.

**Opening Scene:** 10:30pm. Client gửi file AI (logo system 45MB, 12 layers) cần edit tên công ty + màu trước 8am. Minh đang ở quán cafe, không có máy có Illustrator.

**Journey:**
1. Mở DesignEditor browser → drag-drop file AI
2. Upload nhanh, progress status: *"Đang phân tích layers... Đang convert text... Đang optimize paths..."* (7 giây)
3. **Import QA Report** modal xuất hiện với visual before/after: ✅ Text (8/8) · ⚠️ Font 'Helvetica Neue' → Arial (visual preview hiện sẵn) · ✅ Colors (ΔE < 2) · ⚠️ 2 effects rasterized (preview so sánh)
4. Click **[Open anyway]** → document intact, tất cả text editable
5. Font warning badge → click → upload Helvetica Neue từ máy → badge biến mất
6. Edit text + màu → export PNG transparent + PDF → gửi client
7. Client reply sáng: *"Perfect!"* → Minh upgrade Pro ngay tối đó

**Edge cases handled:**
- Tab đóng nhầm giữa import → Job persistent, notification khi complete, result cached 24h
- File AI từ Illustrator CS3 → Pre-validation, specific error: *"Re-save sang AI CS6+ hoặc SVG"* + fallback rasterize option
- Font upload = malware scan + magic byte validation + per-user isolation

**Capabilities:** AI import pipeline, Import QA Report (visual preview), font upload (sandboxed), layer panel, text editing, color picker, transparent PNG export, PDF export, job persistence + notification

---

### Journey 2 — Lan (Marketing Manager) · *Create Campaign from Scratch*

**Persona:** Marketing manager, không có design background, cần tạo assets nhanh không phụ thuộc design team.

**Opening Scene:** Thứ Hai sáng. Campaign launch thứ Sáu. Cần 5 assets. Design team bận. Budget không có freelancer.

**Journey:**
1. Mở DesignEditor → *"Create new"* → Template library, filter Social Media
2. Switch **Simple Mode** — panel gọn: chỉ Text, Colors, Images
3. Chọn template, upload logo, đổi headline, chỉnh màu brand
4. Duplicate design 5 lần, adjust từng size (Phase 1: manual; Phase 3: Magic Resize)
5. Share link view-only → agency comment trực tiếp trên design → sửa ngay → approve
6. Export tất cả assets → campaign launch đúng hạn

**Edge cases handled:**
- Export PDF cho in ấn → Export dialog label rõ: **"PDF (Screen)"** vs **"PDF (Print/300dpi - Studio)"** + warning khi chọn screen PDF cho khổ lớn
- Xóa design nhầm → Toast ngay: *"Design đã xóa. [Undo] [View Trash]"* · Trash giữ 30 ngày (Pro)

**Capabilities:** Template library, Simple/Pro mode toggle, duplicate design, share link, comment threads, branded export formats, delete undo toast, Trash (7 ngày Free / 30 ngày Pro)

---

### Journey 3 — Tuấn (Content Creator) · *Free Tier → Viral → Convert*

**Persona:** YouTuber/content creator, tech-savvy, budget-conscious, cần thumbnails và social assets nhanh.

**Opening Scene:** Thấy design đẹp được share trên Twitter — footer: *"Made with DesignEditor"*. Click link.

**Journey:**
1. Landing page → template gallery với hero demo AI import → *"Try for free — no signup"*
2. Editor mở → kéo template, đổi text, upload ảnh → cảm thấy snappy (60fps)
3. Click Export → *"Sign up free để export"* → Google OAuth 1 click → export ngay
4. Ngày 3: hết 3 exports/ngày free → thấy upgrade prompt
5. Pro unlock: unlimited exports + AI import feature highlight
6. Upgrade. Share design: *"Made with DesignEditor"* → viral loop (Free users giữ branding badge; Pro opt-out)

**Edge cases handled:**
- Export queue overload → Async queue + position indicator: *"#12 trong hàng đợi (~45s)"* + email khi ready
- Multi-tab cùng document → Conflict detection banner + read-only warning option

**Capabilities:** SEO template pages, try-without-signup mode, Google OAuth, frictionless onboarding, export limit UX, viral branding badge (Free), async export queue + position indicator + Pro priority, email export delivery

---

### Journey 4 — Nam (Agency Owner) · *Team Workflow*

**Persona:** Agency owner, 5 designers, 12 client projects. Cần centralize brand assets và streamline approval.

**Opening Scene:** Designer mới dùng sai màu brand client. Nam cần role control và brand protection.

**Journey:**
1. Upgrade Studio → tạo **Brand Kit** cho mỗi client (logo, màu, fonts)
2. **Lock Brand Kit** — chỉ Owner/Admin edit, Member chỉ view/use *(Phase 1 must-have)*
3. Invite 4 designers → Pending invite list với delivery status (Sent/Accepted/Bounced)
4. Bounce detected → notification: *"Invite đến X không gửi được. Kiểm tra email?"* + Resend button
5. Client gửi file AI → assign cho designer → import → QA Report → customize → share link
6. Nam review qua comment threads → approve → export

**Edge cases handled:**
- Invite email typo → bounce notification + resend capability
- Role escalation via API → server-side role check mọi mutation (security critical)
- Brand Kit xóa nhầm → Owner-only lock + Trash recovery

**Capabilities:** Brand kit, Brand Kit lock (Owner-only), team workspace, role-based permissions (Owner/Editor/Viewer), invite management + delivery status + bounce notification, comment threads, design approval flow

---

### Journey 5 — First-time Visitor · *Discover & Convert*

**Persona:** User Google *"canva alternative free"*, chưa biết DesignEditor.

**Journey:**
1. SEO landing page (template-specific pages) → hero animation: AI import demo
2. *"Try for free — no signup"* → editor với blank canvas + template suggestions
3. Thử template → snappy UX → muốn export → Google OAuth popup → export ngay
4. Email welcome sau 10 phút: *"Bạn vừa tạo design đầu tiên. Có file AI/PSD? Import ngay với Pro."*
5. D3 email: use case story của Minh → conversion nudge

**Capabilities:** SEO-optimized template pages, try-without-signup mode, Google OAuth, frictionless onboarding, email nurture sequence (D0/D3/D7)

---

### Journey 6 — Platform Admin · *Moderation & Operations*

**Persona:** Internal admin team, monitor platform health và user issues.

**Journey:**
1. **Admin Dashboard** → User Management → tìm user → xem published designs → unpublish vi phạm → auto warning email
2. **Import Job Queue** → thấy stuck jobs → Retry → monitor resolution
3. **System Health Dashboard**: import success rate, P95 latency, DAU, conversion rate
4. Weekly report export → gửi founder

**Security requirements handled:**
- Inkscape process hang → 30s timeout + force kill + cleanup (prevent resource leak)
- DDoS import endpoint → rate limit per IP + per account + auth required + max 100MB
- Secrets không được log → Secrets vault + log scrubber + CI secret scanning

**Capabilities:** Admin dashboard, user management, design moderation, import job queue monitor, system health metrics, analytics/reporting, rate limiting controls

---

### Journey Requirements Summary

| Journey | Core Capabilities |
|---|---|
| Minh (Import) | AI import + QA Report (visual) + font upload (sandboxed) + job persistence + notification |
| Lan (Create) | Template library + Simple/Pro mode + export format labels + delete undo toast + Trash |
| Tuấn (Free→Pro) | Try-without-signup + async export queue + viral badge + email nurture |
| Nam (Agency) | Brand Kit lock (Phase 1) + role permissions + invite bounce detection |
| First-time visitor | SEO template pages + frictionless onboarding + email nurture |
| Admin | Moderation tools + import queue monitor + analytics + rate limiting |

### Security Requirements from Journey Analysis (Must-fix pre-launch)

1. **SVG XSS** — sanitize text content trước SVG export (DOMPurify)
2. **Import job privacy** — Job ID per-user UUID, server validate ownership
3. **Role escalation** — server-side role check mọi API mutation
4. **Invite token security** — cryptographic UUID, expire 7 ngày, single-use
5. **Inkscape timeout** — 30s process kill + cleanup, prevent resource leak
6. **Secrets management** — vault + log scrubber + CI secret scan
7. **Font upload sandboxing** — magic byte validation + malware scan + per-user isolation
8. **DDoS prevention** — rate limit import endpoint per IP + per account + auth required

---

## Innovation & Novel Patterns

### Detected Innovation Areas

**Innovation 1 — Browser-native Adobe file editing (Primary Differentiator)**
DesignEditor là sản phẩm đầu tiên ở consumer web level parse file format AI/PSD và rebuild **editable document model trực tiếp trong browser** — không chỉ convert sang hình ảnh. Text layers giữ nguyên là TextElement editable, vector paths giữ nguyên là PathElement editable. Canva, Adobe Express, và các web design tools hiện tại không làm được điều này vì architectural lock-in từ thiết kế ban đầu.

**Innovation 2 — Smart Hybrid Rendering Algorithm**
Thay vì binary choice "rasterize all" hay "vector all", Smart Hybrid tự động quyết định per-element dựa trên complexity analysis:
- Text layers → `TextElement` (always editable)
- Pure vector paths → `PathElement` (editable with Path2D)
- Complex blend modes / unsupported effects → `ImageElement` (rasterized at 2x DPI, transparent PNG)

Không có tool nào hiện tại implement per-element mixed rendering decision như thế này trong consumer design editor.

**Innovation 3 — Import Quality Gate UX**
Trước khi user commit mở document, Import QA Report modal hiển thị **visual before/after preview** cho từng element bị approximate. User thấy chính xác sẽ mất gì trước khi quyết định — không bị surprise sau khi đã mở. Đây là UX pattern chưa có precedent trong file conversion tools.

### Market Context & Competitive Landscape

| Competitor | Import AI/PSD | Editable Layers | Web-based | Freemium |
|---|---|---|---|---|
| **Canva** | ❌ | ❌ | ✅ | ✅ |
| **Adobe Express** | Partial (flatten) | ❌ | ✅ | Freemium |
| **Figma** | SVG only | Partial | ✅ | ✅ |
| **Photopea** | ✅ PSD | ✅ | ✅ | Ad-based |
| **DesignEditor** | ✅ AI + PSD | ✅ Full | ✅ | ✅ |

**Window of opportunity:** Photopea gần nhất về technical (PSD support) nhưng UX professional-grade kém, không có template ecosystem, không có team features. DesignEditor kết hợp Photopea-level import fidelity với Canva-level UX + team/marketplace ecosystem.

### Validation Approach

- **Phase 1 validation gate:** 100 users import AI file successfully với fidelity ≥ 90% — đo bằng automated QA checker
- **Import quality benchmark:** So sánh pixel-diff giữa Illustrator export PNG và DesignEditor export PNG — target ΔE < 5 trung bình
- **User trust validation:** Exit survey sau lần import đầu: *"Bạn có tin tưởng kết quả import không?"* — target ≥ 80% Yes
- **Smart Hybrid accuracy:** Audit 100 test files — đo % elements categorized correctly (text as text, vector as vector)

### Risk Mitigation

| Innovation Risk | Mitigation |
|---|---|
| Inkscape SVG output khác Illustrator render | Comprehensive test suite: 500+ AI files từ real designers |
| Font rendering browser vs desktop khác | Font metrics validation + visual regression tests |
| Smart Hybrid mis-categorize element | User can override: "Treat as editable vector" / "Treat as image" per-element |
| Adobe thay đổi AI file format | File format detection versioned, update parser khi cần |
| Quality Gate tạo friction → drop-off | A/B test: với và không có QA Report modal → measure conversion |

---

## Web SaaS Specific Requirements

### Browser Support

| Browser | Minimum Version | Notes |
|---|---|---|
| **Chrome** | 100+ | Primary target — Canvas 2D + Path2D full support |
| **Firefox** | 110+ | Full support |
| **Safari** | 16+ | WebKit — cần test font rendering carefully |
| **Edge** | 100+ | Chromium-based, same as Chrome |
| **Mobile Safari** | iOS 16+ | View-only mode; editor limited |
| **Chrome Android** | 100+ | View-only mode; editor limited |
| ❌ IE | Not supported | |
| ❌ Safari < 16 | Not supported | Offscreen Canvas không support |

**Progressive Enhancement:** Core editor works on all supported browsers. Advanced features (WASM effects Phase 2) fallback gracefully nếu browser không support.

### Accessibility

**Target: WCAG 2.1 Level AA**

- Keyboard navigation cho toàn bộ editor (Tab, Arrow keys để chọn elements, Enter để edit)
- Screen reader: toolbar buttons có `aria-label`, dialogs có focus trap
- Color contrast: UI controls ≥ 4.5:1 ratio
- Focus indicator visible trên tất cả interactive elements
- Import QA Report modal: keyboard navigable, screen reader announces warnings
- Export dialog: form fields đầy đủ labels

**Canvas accessibility note:** Canvas 2D content không accessible với screen reader — supplement bởi accessible element list panel (text description của từng layer).

### Multi-tenancy Architecture

- **Tenant = User account** (B2C) hoặc **Workspace** (B2B Studio tier)
- Data isolation: row-level security PostgreSQL — mỗi user chỉ access designs/assets của mình
- Studio tier = Workspace với multiple members, shared Brand Kit, shared designs folder
- Font assets: per-user storage, không shared cross-account (security isolation)
- Import jobs: per-user queue với rate limiting per tier

### Permission Model (RBAC)

| Role | Designs | Brand Kit | Members | Billing |
|---|---|---|---|---|
| **Workspace Owner** | Full CRUD | Full CRUD + Lock | Invite/Remove | Manage |
| **Admin** | Full CRUD | Full CRUD | Invite | View |
| **Editor** | Full CRUD own + shared | View + Use only | — | — |
| **Viewer** | View + Comment | View only | — | — |
| **Free/Pro (personal)** | Full CRUD own | N/A | N/A | Self |

### Subscription Tiers *(Phase 4 — billing không active trước Phase 4)*

| Feature | Free | Pro ($15/mo) | Studio ($49/mo) |
|---|---|---|---|
| Designs | Unlimited | Unlimited | Unlimited |
| Export | 1080px max, 3/day | Unlimited, 4K | Unlimited, 4K |
| AI Import (.ai) | ❌ (upgrade prompt) | ✅ Unlimited | ✅ Unlimited |
| PSD Import | ❌ | ✅ | ✅ |
| Brand Kit | ❌ | ✅ Personal | ✅ Team + Lock |
| Share link view-only | ✅ | ✅ | ✅ |
| Comment threads | ✅ | ✅ | ✅ |
| Team workspace | ❌ | ❌ | ✅ (up to 10 members) |
| Export formats | PNG/PDF/HTML | PNG/PDF/HTML/4K | All + Print |
| Font upload | ❌ | ✅ | ✅ |
| Trash retention | 7 days | 30 days | 90 days |
| Priority import queue | ❌ | ✅ | ✅ (highest) |

### SEO Strategy

- Template-specific landing pages: `/templates/social-media/facebook-post` → SEO-indexed với preview images
- "Made with DesignEditor" share links: public view pages indexed, canonical URLs
- `/explore` gallery: public designs (user opt-in) → UGC SEO
- Sitemap auto-generated từ template library
- OG meta tags cho share links (design thumbnail, title)

### Integration Requirements

| Integration | Phase | Purpose |
|---|---|---|
| Google OAuth | Phase 1 | Authentication |
| Google Fonts API | Phase 1 | Font library |
| S3-compatible storage | Phase 1 | Asset + design storage |
| Email (SendGrid/Postmark) | Phase 1 | Notifications, nurture |
| Stripe / Paddle | Phase 4 | Subscription billing |
| Inkscape CLI (containerized) | Phase 1 | AI file server-side processing |
| Freepik API | Phase 3 | Asset marketplace |
| OpenAI / Stability AI | Phase 4 | Text-to-Image generation |
| remove.bg API | Phase 4 | Background removal |

> **Lưu ý:** Stripe/Paddle và AI integrations được chuyển sang Phase 4 theo quyết định scope — Phase 1-3 không có billing enforcement.

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — ưu tiên tính mượt mà và reliability của core editing loop hơn breadth of features. Một editor với 5 element types hoạt động hoàn hảo > editor với 20 types hoạt động không nhất quán.

**Core Hypothesis:** Users sẵn sàng rời Canva nếu AI/PSD import fidelity cao hơn và editor không bị paywall friction.

**Philosophy:** Ship working product, validate product-market fit, monetize sau. Phases 1-3 = full access cho tất cả users, không paywall.

**Resource Requirements:** 3-4 engineers (1 FE specialist Canvas/rendering, 1 BE/infra, 1 fullstack, optional QA/DevOps), 1 designer UX.

**Scope Freeze Protocol:** Sau Week 2 của mỗi Phase, không feature nào được thêm vào backlog mà không có 2/3 vote founding team + written justification.

---

### Phase 1 — Core Editor Working (0 → 3.5 tháng)

> **Mục tiêu:** Mọi core feature hoạt động đúng, smooth, reliable. Zero monetization friction. Tất cả users full access.

**Entry Points (equal priority):**
- Create from scratch: drag, drop, design, export
- Import .ai file: upload → QA Report → customize → export

**Element Types (hard scope freeze):**
- Rectangle, Ellipse, Text, Image, Group
- ❌ Không thêm Phase 1: Polygon, Star, Arrow, Line, Path

**Canvas Operations:**
- Select, Move, Resize (proportional + free), Rotate
- Z-order (bring forward/back/to front/to back)
- Copy/Paste, Duplicate, Delete + Undo toast
- Align & Distribute (left/center/right/top/middle/bottom)
- Keyboard shortcuts (Ctrl+Z/Y, Ctrl+C/V/D, Backspace, Space pan)

**Text:** Google Fonts (full library), font size, bold/italic/underline, alignment, solid color fill

**Color & Fill:** Solid color fill + stroke, opacity, hex/RGB color picker

**AI Import (.ai files):**
- Server-side Inkscape CLI processing (containerized, timeout 30s)
- Smart Hybrid: text → TextElement, vector → PathElement, complex effects → ImageElement (PNG 2x DPI transparent)
- Pre-validation gate (file size ≤ 50MB, format check, virus scan)
- Import QA Report modal với visual before/after preview
- 3-stage async UX: Upload → Processing (poll 3s) → QA Report
- Single queue, P95 ≤ 10s total (processing + wait)

**Export:** PNG (transparent background), SVG, PDF — không giới hạn kích thước hoặc số lần

**Collaboration (Async):**
- Share link (view-only, password-optional)
- Comment threads (anchor to layer)
- Version history (last 10 saves, 30 ngày)

**Templates:** 20 templates chất lượng cao (IG post/story/reel, Facebook post/cover, LinkedIn post/banner)

**Auth & Infrastructure:**
- Google OAuth + email/password
- Design autosave (30s + navigate away)
- Trash (30 ngày, tất cả users)
- PostgreSQL row-level security
- BullMQ + Redis job queue cho import

---

### Phase 2 — Visual Depth (3.5 → 6.5 tháng)

> **Mục tiêu:** Nâng chất lượng design output. Full access tiếp tục.

**Advanced Elements:** Polygon, Star, Arrow, Line, QR Code, Barcode; Pen/Bezier vector path editor

**Effects & Visual:**
- Linear/radial gradients
- Drop shadow, inner shadow, blur, inner glow
- Image filters (brightness, contrast, saturation, hue)
- Blend modes (Multiply, Screen, Overlay, Soft Light...)
- WASM effects engine (Rust → WASM): Gaussian blur, curves, HSL, sharpen

**Typography Upgrade:** Letter spacing, line height, all caps, strikethrough, text case transforms

**Multi-page:** Multi-page document support, page reorder/duplicate/thumbnail navigation

**Animation / Video:**
- Per-element entrance/exit animations
- Slide transition animations
- Export as MP4 (max 30s, 1080p), GIF export

**Font Upload:** TTF/OTF upload + malware scan + substitution disclosure

---

### Phase 3 — Platform & Scale (6.5 → 10 tháng)

> **Mục tiêu:** Mở rộng import, brand tools, trở thành platform. Full access tiếp tục.

**Import Expansion:**
- SVG import full fidelity
- Advanced .ai import: gradients phức tạp, patterns, symbols, masks xử lý native (không rasterize)

**Brand Kit:** Team color palette, logo upload, brand fonts, Brand Kit version history

**Templates & Assets:**
- Template marketplace (user-submit + curate)
- 200+ templates, element libraries, icon packs
- Freepik API integration (stock photos/vectors)

**Export Upgrade:** 4K export, print-ready PDF (CMYK, 300dpi, bleed marks, trim lines)

**Collaboration Upgrade:** Multiplayer awareness (cursor presence, pre-Yjs), Studio workspace beta (shared folder, shared Brand Kit)

---

### Phase 4 — Monetization + AI + Collab + PSD (10 → 14+ tháng)

> **Mục tiêu:** Monetize sau khi product proven. Ship billing, AI features, real-time collab, PSD.

**Freemium & Billing:**
- Subscription tiers live: Free / Pro ($15/mo) / Studio ($49/mo)
- Stripe/Paddle fully operational
- Paywall enforcement + upgrade flows
- Export limits per tier, priority queue per tier
- "Made with DesignEditor" badge on Free (opt-out Pro+)
- Trash retention per tier (7/30/90 ngày)

**AI Features:**
- Background removal (remove.bg API)
- Text-to-Image generation (OpenAI / Stability AI)
- Magic Resize (reformat design cho platform khác)
- AI template suggestion từ user brief

**Real-time Collaboration (Yjs CRDT):**
- Full multiplayer co-editing (lazy init — Yjs activate chỉ khi user mở collab session)
- Conflict resolution UI
- RBAC trong collab session

**Import Expansion:**
- PSD import (ag-psd / @webtoon/psd)
- Advanced PSD: layer effects, smart objects, adjustment layers

**Platform:**
- Plugin marketplace (third-party extensions)
- API + webhooks cho enterprise integrations
- White-label / Enterprise tier
- Analytics dashboard Studio admins

---

### .ai Import Evolution Across Phases

| Phase | .ai Import Capability |
|---|---|
| Phase 1 | Core: text → TextElement, vector → PathElement, complex → ImageElement (PNG 2x DPI) |
| Phase 3 | Advanced: gradients, patterns, symbols, masks xử lý native thay vì rasterize |
| Phase 4 | PSD import thêm vào sau khi .ai hoàn chỉnh |

---

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Custom renderer performance >500 elements | Medium | High | Virtualized render (viewport culling) từ Phase 1; hard limit 300 elements/page Phase 1 |
| Inkscape CLI memory leak/crash under load | High | High | Container-per-job, max memory limit, timeout 30s, circuit breaker, weekly load test |
| Safari Canvas 2D rendering differences | High | Medium | Safari-specific test suite từ ngày 1; visual regression CI |
| WASM compilation toolchain issues (Phase 2) | Low | Medium | Spike WASM setup Week 1 Phase 2; maintain JS fallback |
| Yjs CRDT merge conflicts (Phase 4) | Medium | High | Schema design review trước Phase 4; prototype 2 tuần trước kick-off |

**Market Risks:**

| Risk | Mitigation |
|---|---|
| Canva copies AI import | Speed to market Phase 1; focus on fidelity depth vs breadth |
| Users không convert sang paid (Phase 4) | Validate product-market fit qua Phases 1-3 trước khi charge |
| Free tier quá generous → không upgrade | Usage data từ Phases 1-3 inform tier design trước khi launch billing |

**Resource Risks:**

| Scenario | Contingency |
|---|---|
| Team < 4 engineers | Drop: multi-page Phase 1, templates giảm xuống 10, Brand Kit → Phase 4 |
| Timeline slip Phase 1 > 1 tháng | Cut theo order: Comment threads → Template search → Version history |
| Inkscape CLI quá chậm cho production | Evaluate paid alternative (Aspose, Cloudmersive) hoặc cache layer |
| Phase 4 billing complexity underestimated | Stripe billing infrastructure có thể implement cuối Phase 3 không enforce |

**Scope Freeze Rules:**
- Week 2 của mỗi Phase: scope freeze — không add features mới
- Exception process: 2/3 founding team vote + written impact assessment
- Defer mọi "nice to have" sang phase sau, không negotiate trong sprint

---

## Functional Requirements

### 1. Canvas & Design Editing

- **FR1:** Users can create a new design canvas with custom dimensions
- **FR2:** Users can select, move, resize (proportional + free), and rotate elements on the canvas
- **FR3:** Users can control element z-order (bring forward/back/to front/to back)
- **FR4:** Users can copy, paste, duplicate, and delete design elements
- **FR5:** Users can align and distribute multiple elements relative to each other or the canvas
- **FR6:** Users can undo and redo any canvas action with history preserved
- **FR7:** Users can pan and zoom the canvas view
- **FR8:** Users can group and ungroup multiple elements into a single unit
- **FR9:** Users can lock elements to prevent accidental editing
- **FR10:** Users can toggle element visibility

### 2. Element Types & Content

- **FR11:** Users can create and edit geometric shapes (Rectangle, Ellipse, Polygon, Star, Line, Arrow)
- **FR12:** Users can create and edit text elements with font, size, style, and alignment controls
- **FR13:** Users can upload and place image elements on the canvas
- **FR14:** Users can draw vector path elements using a Bezier pen tool
- **FR15:** Users can apply solid color fills and strokes to elements
- **FR16:** Users can apply gradient fills (linear, radial) to elements
- **FR17:** Users can control element opacity and blend modes
- **FR18:** Users can apply visual effects (drop shadow, inner shadow, blur, glow) to elements
- **FR19:** Users can apply non-destructive image adjustment filters (brightness, contrast, saturation, hue) to image elements — filters stored as metadata, original asset unmodified
- **FR20:** Users can access and apply fonts from the Google Fonts library
- **FR20e:** Users can snap elements to the canvas grid, other elements' edges/centers, and canvas boundaries with smart distance guides visible during drag
- **FR20f:** Users can switch between Simple mode (condensed toolbar for non-designers) and Pro mode (full toolbar with all controls)
- **FR20b:** The system renders images on canvas at full source resolution without downsampling or quality loss
- **FR20c:** Users can view designs at any zoom level (up to 800%) with crisp, non-pixelated vector and text elements
- **FR20d:** The system preserves original image resolution when importing assets — no automatic compression or resizing without user confirmation

### 3. AI File Import

- **FR21:** Users can upload .ai (Adobe Illustrator) files for import into the editor
- **FR22:** The system validates uploaded files before processing (size ≤ 50MB, format integrity, malware check)
- **FR23:** The system converts .ai file content into editable design elements using Smart Hybrid conversion (text → TextElement, vector → PathElement, complex effects → rasterized ImageElement)
- **FR24:** Users can view an Import QA Report with visual before/after preview before confirming import
- **FR25:** Users can track import processing status in real-time (3-stage: Upload → Processing → QA Report)
- **FR26:** The system provides specific, actionable error messages when import fails or partially succeeds
- **FR27:** Users can import advanced .ai features (complex gradients, patterns, symbols, masks) as native editable elements *(Phase 3)*

### 4. Export & Output

- **FR28:** Users can export designs as PNG with transparent background support
- **FR28b:** PNG export renders at the exact pixel dimensions specified — no upscaling artifacts or quality degradation
- **FR29:** Users can export designs as PDF (screen-optimized)
- **FR30:** Users can export designs as a self-contained static HTML/CSS web page
- **FR30b:** HTML/CSS export produces valid, self-contained HTML5 with inline CSS — no external dependencies
- **FR31:** HTML/CSS export uses original asset files at full resolution — no recompression
- **FR32:** Users can configure export dimensions for PNG output
- **FR33:** The system provides export progress feedback for long-running exports
- **FR34:** Users receive email notification when an async export job completes

> **Phase 4 (defer):** SVG export, MP4/GIF video export, 4K export, print-ready PDF (CMYK, bleed marks)

### 5. Templates & Assets

- **FR35:** Users can browse and search a curated template library by category and keyword
- **FR36:** Users can preview a template before opening it as a new design
- **FR37:** Users can open any template as an editable design
- **FR38:** Users can submit templates to a community marketplace *(Phase 3)*
- **FR39:** Users can browse and use stock assets from an integrated asset library *(Phase 3)*

### 6. Document & Page Management

- **FR40:** Users can create and manage multi-page documents
- **FR41:** Users can reorder, duplicate, and delete pages within a document
- **FR42:** Users can add entrance/exit animations to individual elements *(Phase 2)*
- **FR43:** Users can add transition animations between pages *(Phase 2)*

### 7. Collaboration & Sharing

- **FR44:** Users can share a design via a view-only link
- **FR45:** Users can password-protect shared design links
- **FR46:** Users can add comments anchored to specific layers or positions in a design
- **FR47:** Users can reply to and resolve comment threads
- **FR48:** Users can view version history and restore previous saved versions
- **FR49:** Multiple users can edit the same design simultaneously in real-time *(Phase 4)*
- **FR50:** Users can see collaborators' cursor positions and selections in real-time *(Phase 4)*

### 8. User & Design Management

- **FR51:** Users can register and authenticate via Google OAuth or email/password
- **FR52:** Visitors can use the editor and preview a design without creating an account (try-without-signup mode)
- **FR53:** Users can create, rename, organize, and delete their designs
- **FR54:** The system autosaves designs automatically at regular intervals and on navigation
- **FR55:** Users can recover deleted designs from a trash folder within their retention window
- **FR56:** Users can upload custom fonts (TTF/OTF) for use in their designs *(Phase 2)*
- **FR57:** The system sends automated email notifications for key events (export complete, invite received, email nurture sequence for new signups)

### 9. Brand Kit

- **FR58:** Users can create and manage a Brand Kit containing colors, logos, and fonts *(Phase 3)*
- **FR59:** Workspace administrators can lock Brand Kit elements to enforce brand consistency *(Phase 3)*
- **FR60:** Users can apply Brand Kit assets directly from within the editor *(Phase 3)*

### 10. Workspace & Team Management

- **FR61:** Users can create team workspaces and invite members *(Phase 3)*
- **FR62:** Workspace administrators can assign roles (Owner, Admin, Editor, Viewer) to members *(Phase 3)*
- **FR63:** Team members can access and collaborate on shared designs within a workspace *(Phase 3)*

### 11. Platform Administration

- **FR64:** Platform admins can search, view, and manage all user accounts
- **FR65:** Platform admins can unpublish or remove designs that violate content policy
- **FR66:** Platform admins can monitor the import job queue and manually retry or cancel stuck jobs
- **FR67:** Platform admins can view system health metrics (import success rate, P95 latency, DAU, conversion rate)
- **FR68:** Platform admins can export analytics reports

### 12. Subscription & Billing *(Phase 4)*

- **FR69:** Users can subscribe to paid plans and manage billing information
- **FR70:** The system enforces feature access and usage limits based on subscription tier
- **FR71:** Free-tier exports display an attribution badge (opt-out for paid tiers)

### 13. AI-Assisted Features *(Phase 4)*

- **FR72:** Users can remove image backgrounds using AI
- **FR73:** Users can generate images from text prompts using AI
- **FR74:** Users can automatically resize and reformat designs for different platforms (Magic Resize)
- **FR75:** Users can receive AI-suggested templates based on a brief description

---

## Non-Functional Requirements

### Performance

| Metric | Target | Rationale |
|---|---|---|
| First Contentful Paint (FCP) | < 1.5s | Editor phải load nhanh — users không đợi |
| Time to Interactive — Editor | < 3s | Canvas sẵn sàng trong 3s để không bounce |
| Canvas render loop | ≤ 16ms / frame (60fps) | Smooth drag/resize — lag phá trải nghiệm |
| Canvas render loop — phức tạp | ≤ 33ms / frame (30fps min) với >100 elements | Acceptable floor |
| Element selection/transform response | < 50ms | Cảm giác instant |
| AI Import P95 (file ≤ 50MB) | ≤ 10s total (queue + processing) | User có thể chờ nếu biết đang xử lý |
| Export PNG P95 | ≤ 5s (full canvas, any size) | |
| Export HTML/CSS P95 | ≤ 8s | |
| API response P95 (save, load, auth) | < 200ms | |
| Design autosave latency | < 500ms background, không block UI | |

**Image Quality Constraints:**
- Canvas renders tại `devicePixelRatio` thực tế của màn hình (HiDPI/Retina: 2x render, không blur)
- Zoom 100%–800%: vector và text phải crisp, không pixelate
- Images trên canvas: render bằng `imageSmoothingQuality = 'high'`
- PNG export: output tại full source resolution, không downsample
- Không auto-compress ảnh user upload — preserve original

---

### Security

**Data Protection:**
- Tất cả data in transit: HTTPS/TLS 1.3 minimum
- Assets (images, fonts, design files) lưu trên S3 với signed URLs — không expose trực tiếp
- Signed URLs expire sau 1 giờ
- Design data at rest: encrypted (AES-256) trên database
- Khi design bị permanent delete (hết trash period hoặc user xóa từ trash), toàn bộ associated assets phải bị xóa khỏi S3 storage trong vòng 24 giờ

**Import Security:**
- File upload: virus scan (ClamAV hoặc equivalent) trước khi process
- File type validation bằng magic bytes — không chỉ extension
- SVG và vector content từ import pipeline không được inject vào DOM tại bất kỳ điểm nào — toàn bộ vector rendering thực hiện qua Canvas 2D Path2D API
- Inkscape CLI: chạy trong isolated container, disable PostScript interpreter và JavaScript execution, không access network, timeout cứng 30s, memory limit 512MB per job
- Import job IDs phải là UUIDv4 (random, không enumerate được); server validates job ownership trên mọi status/result API call
- Import endpoint rate limit: max 5 jobs/giờ/user, max 3 concurrent jobs/user → HTTP 429 + Retry-After nếu exceed

**Font Security:**
- Font files (TTF/OTF) chỉ được parse để extract metadata (tên, weight, style) server-side — không server-side font rendering
- Font execution chỉ xảy ra trong browser CSS context
- Malware scan trước khi lưu

**Authentication & Authorization:**
- JWT access tokens expire sau 15 phút, refresh tokens 30 ngày
- Google OAuth: validate `aud` claim, không trust unverified tokens
- Role escalation prevention: server-side role check mọi API call
- Invite tokens: single-use, expire sau 48 giờ
- Rate limiting: login attempts max 10/phút per IP

**Infrastructure:**
- Secrets management: environment variables qua secrets manager (AWS Secrets Manager / Vault), không hardcode
- CORS: chỉ allow production domain + localhost dev
- SQL injection prevention: parameterized queries toàn bộ — không string interpolation
- DDoS protection: rate limiting tại API gateway layer, max 100 requests/phút/user (general); import endpoint stricter per above

---

### Scalability

- **Concurrent users Phase 1 target:** 500 concurrent editors mà không degrade performance
- **Import queue:** Scale horizontally — thêm Inkscape worker containers khi queue depth > 50 jobs
- **Storage:** S3-compatible → không bound bởi local disk
- **Database:** PostgreSQL connection pooling (PgBouncer); read replicas nếu Phase 3 traffic tăng
- **Stateless API servers:** Horizontal scale behind load balancer; session state trong Redis
- **Phase 4 target:** 10,000 concurrent users với < 10% performance degradation vs Phase 1 baseline

---

### Reliability

- **Uptime SLA:** ≥ 99.5% monthly (cho phép ~3.6 giờ downtime/tháng)
- **Autosave durability:** Design data không được mất nếu browser crash — mọi autosave confirm server-side trước khi clear local buffer
- **Import job persistence:** Job state survive server restart — BullMQ Redis-backed, không in-memory
- **Graceful degradation:** Nếu import service down, editor vẫn hoạt động đầy đủ cho create/export
- **Export failure retry:** Nếu export fail, retry tự động 1 lần trước khi báo lỗi user
- **Backup:** Database daily backup, point-in-time recovery minimum 7 ngày

---

### Browser Compatibility

| Browser | Min Version | Level |
|---|---|---|
| Chrome | 100+ | Full support |
| Firefox | 110+ | Full support |
| Safari | 16+ | Full support (HiDPI test riêng) |
| Edge | 100+ | Full support |
| Mobile (iOS Safari, Chrome Android) | iOS 16+, Android 100+ | View-only |
| IE | Any | ❌ Not supported |

- Progressive Enhancement: core editor chạy trên tất cả supported browsers; WASM effects (Phase 2) fallback sang JS nếu không support
- Required APIs: Canvas 2D `Path2D`, `OffscreenCanvas`, `devicePixelRatio`

---

### Accessibility

- **Target:** WCAG 2.1 Level AA
- Toàn bộ toolbar và panel controls: keyboard navigable (Tab order, Enter/Space activate)
- Dialogs (Import QA Report, Export, Settings): focus trap khi mở, Escape đóng
- `aria-label` cho mọi icon button, toolbar item, dropdown
- Color contrast cho UI controls: ≥ 4.5:1 ratio
- Canvas content supplement: accessible layer list panel (text description của từng layer cho screen reader)
- Focus indicator visible trên tất cả interactive elements
