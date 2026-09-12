# Project Context: Kyron Realty AI

## Overview
Kyron Realty AI is a modern real estate intelligence platform integrating AI capabilities for property analytics, automated valuations, real estate workflow automation, and real-time voice agents.

---

## 1. Single Sources of Truth (Read Directly)
Before writing or modifying features, consult the canonical source files and their dedicated system docs:
- **Design System & UI Tokens**: [docs/built-systems/design-system.md](docs/built-systems/design-system.md) & [src/app/globals.css](src/app/globals.css)
- **Auth & Session System**: [docs/built-systems/auth.md](docs/built-systems/auth.md) & [src/auth.ts](src/auth.ts)
- **Google Calendar Link**: [docs/built-systems/google-calendar.md](docs/built-systems/google-calendar.md) & [src/lib/google-calendar.ts](src/lib/google-calendar.ts)
- **Database & Schemas**: [src/db/schema.ts](src/db/schema.ts) is the only description of the schema — read it directly; rules and traps in [docs/built-systems/database.md](docs/built-systems/database.md)
- **Voice Agent & Agora SD-RTN**: [docs/built-systems/voice-agent-and-agora.md](docs/built-systems/voice-agent-and-agora.md)
- **Property Onboarding**: [docs/built-systems/property-onboarding.md](docs/built-systems/property-onboarding.md)
- **Public Listings & Leads**: [docs/built-systems/public-listings-and-leads.md](docs/built-systems/public-listings-and-leads.md)
- **Original Design Intent (historical)**: [docs/plan/](docs/plan/) — pre-implementation planning, frozen at authoring time. Useful for *why* the system was shaped this way. **Never treat it as current truth**: it contains copied schema and architecture snapshots that the code has since moved past.
- **Architecture & Subpath Hosting**: [docs/built-systems/architecture-and-basepath.md](docs/built-systems/architecture-and-basepath.md)
- **VPS Infrastructure**: [docs/server-config.md](docs/server-config.md)

### Strict Agora-Only Conversational AI Policy (Zero Browser Fallbacks)
For this project, all conversational AI voice capabilities must run strictly and exclusively on **Agora SD-RTN WebRTC** and **Agora Signaling (RTM)** via the Agora Conversational AI Cloud Gateway:
- **Strictly Prohibited**: Browser SpeechSynthesis (`window.speechSynthesis`), browser speech recognition (`webkitSpeechRecognition`), client-side fake assistant reply scripts, and silent backend fake-success fallbacks.
- **Approved Cloud Services**: Agora-managed cloud services and the ASR, TTS, and LLM vendors wired in `src/lib/agora-agent-client.ts` (selected by which API keys are present) are standard approved components. The restriction is on browser-local speech, not on cloud vendors.
- **Fail-Fast Error Contract**: If Agora Cloud Gateway or RTC/RTM connection fails, the system must fail explicitly, mark the DB session as `failed`, and surface the error to the user immediately. Never fake success.
- **Never Let the UI Interrupt a Speaking Agent**: A message the app sends to the agent because something finished on screen (a search returned, a record saved, a panel opened) must **never** cut the agent off mid-sentence. Send it with `append` priority so the Agora gateway holds it until the agent's current interaction ends. Only the human caller may interrupt the agent. See [voice-agent-and-agora.md](docs/built-systems/voice-agent-and-agora.md) for why client-side queueing is not an acceptable substitute.

---

## 2. Built Systems vs Roadmap
To prevent duplicate code or assuming features that do not yet exist:

| System / Feature | Status | System Spec | Code Location | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Built | [auth.md](docs/built-systems/auth.md) | `src/app/login/page.tsx`, `src/auth.ts`, `src/app/api/auth/` | NextAuth credentials + Google OAuth fallback flow |
| **User Dashboard** | Built | [architecture-and-basepath.md](docs/built-systems/architecture-and-basepath.md) | `src/app/dashboard/page.tsx`, `src/components/dashboard/` | Protected workspace with header, logout, and active inventory |
| **Landing Page** | Built | [architecture-and-basepath.md](docs/built-systems/architecture-and-basepath.md) | `src/app/page.tsx`, `src/components/home/` | Light-surface funnel ordered hero → cost of silence → personas → onboarding story → negotiation proof → human handover → demo listing → objections → close. Marketing copy names no vendor, and every spoken line must stay true to `src/lib/demo-listing.ts` |
| **Database Pool & ORM**| Built | [database.md](docs/built-systems/database.md) | `src/db/index.ts`, `src/db/schema.ts` | Drizzle ORM + PostgreSQL 17 pool connection |
| **Design System** | Built | [design-system.md](docs/built-systems/design-system.md) | `src/app/globals.css` | Dual-pane light/midnight luxury dark system |
| **Voice Agent / Agora Real-Time** | Built | [voice-agent-and-agora.md](docs/built-systems/voice-agent-and-agora.md) | `src/app/api/agora/`, `src/hooks/`, `src/components/voice/` | Agora Conversational AI Cloud Gateway + WebRTC client |
| **Conversational Onboarding** | Built | [property-onboarding.md](docs/built-systems/property-onboarding.md) | `src/app/dashboard/properties/new`, `src/lib/kb-extractor.ts` | Split-screen voice studio + KB synthesizer |
| **Public Listing & Discovery** | Built | [public-listings-and-leads.md](docs/built-systems/public-listings-and-leads.md) | `src/app/listings/`, `src/app/api/properties/search/` | Search & city discovery, QR Code generator, Voice Sales Modal, Tour booking |
| **Google Calendar Link & Tour Scheduling** | Built | [google-calendar.md](docs/built-systems/google-calendar.md) | `src/lib/google-calendar.ts`, `src/lib/calendar-service.ts` | Voice sales agent 1-hr tour scheduling via Google Calendar freeBusy + DB bookings |
| **Legal Pages** | Built | [auth.md](docs/built-systems/auth.md) | `src/app/privacy/`, `src/app/terms/`, `src/components/legal/` | Public, unauthenticated by requirement — Google OAuth verification reads them |
| **Sales Agent (Floating Presence)** | Built | [sales-agent.md](docs/built-systems/sales-agent.md) | `src/components/sales/FloatingSalesAgent.tsx`, `src/app/layout.tsx` | Global floating presence with dynamic page awareness, isolated from onboarding |
| **Sales Agent Property-Page Mode** | Built | [sales-agent.md](docs/built-systems/sales-agent.md) | `src/lib/sarah-property-prompt.ts`, `src/lib/property-fit.ts`, `src/app/api/agora/session/retarget/` | Mid-call prompt swap onto one listing's KB, code-computed fit verdict, two-thread call memory |
| **Three-Way Owner/Manager Call** | Built | [sales-agent.md](docs/built-systems/sales-agent.md) | `src/lib/agora-telephony.ts`, `src/app/api/agora/telephony/` | Dial manager/owner via Twilio Media Stream WebSocket relay, private whisper, RTC bridge (UID 888), silent observer mode |

---

## 3. Subpath & `basePath` Rules (`/projects/kyron-realty-ai`)
The application runs under the subpath prefix **`/projects/kyron-realty-ai`**:
- **`src/lib/base-path.ts`** is the only declaration of the prefix; `next.config.ts` imports it for `basePath`. Never write the literal anywhere else.
- **Client-side Fetch Calls**: Must explicitly prepend `BASE_PATH` imported from `@/lib/base-path` (e.g. `fetch(`${BASE_PATH}/api/auth/status`)`).
- **Static Assets & Next/Image**: Static assets in `public/images/` must be referenced using `${BASE_PATH}/images/filename.jpg` with `unoptimized={true}` on `<Image />` to prevent Next.js image optimizer 400 path mismatches.
- **NextAuth Callbacks**: Redirect URLs must specify `${BASE_PATH}/` (e.g. callbackUrl: `/projects/kyron-realty-ai/`).
- **Persistent Upload Storage**: All uploaded property files must resolve through `@/lib/storage` (`getUploadsDir()`), which resolves to root `public/uploads/` outside `.next/`. **Never** use raw `process.cwd()` for file uploads — Next.js standalone runs `process.chdir(__dirname)` into `.next/standalone`, which is wiped clean on every `next build`.

---

## 4. Technology Stack & Versions
- **Framework**: Next.js 16 (v16.3.3) with App Router, Turbopack, React 19, TypeScript
- **Database**: PostgreSQL 17 (DB: `kyron_realty_ai`, User: `kyron_realty_ai_user`)
- **ORM**: Drizzle ORM (v0.40.x) + `postgres.js`
- **Styling**: Tailwind CSS v4 + Lucide React
- **Process Manager**: PM2 (`ecosystem.config.cjs` standalone output)
- **Reverse Proxy**: Nginx (FastCGI cache at `/var/cache/nginx/egnitech.com`)
- **CI/CD Pipeline**: GitHub Actions (`.github/workflows/deploy.yml`)
- **Repository**: [nippunrana/kyron-realty-ai](https://github.com/nippunrana/kyron-realty-ai)

---

## 5. Development & Deployment Guidelines
- **Database Connectivity**:
  - **Local Dev**: Connects remotely via `72.60.26.200:5432` to the isolated `kyron_realty_ai` database.
  - **VPS Production**: Connects internally via `localhost:5432`.
- **Zero Secrets in Git**: Sensitive keys and database passwords must only reside in `.env`.
- **Standalone Build**: `next.config.ts` uses `output: 'standalone'` for minimal VPS memory footprint.
- **Database Migrations**: Always manage schema changes through `src/db/schema.ts`, generate migrations with `npm run db:generate`, and apply via `drizzle-kit migrate` (automated in CI/CD).
- **CI/CD Verification Gate (`.github/workflows/deploy.yml`)**: Pushes to `main` trigger GitHub Actions deployment to VPS. Every change must be validated against the CI gates before pushing:
  - `npm run lint`: Zero ESLint errors. Strictly enforce React 19 render purity (never assign or access `ref.current` during render; update refs in `useEffect` or event handlers).
  - `npm run lint:unused`: Knip dead-code & unused export detection.
  - `npm run test:intents`: Voice intent & scripted prompt alignment.
  - `npm run build`: Strict TypeScript check + Next.js standalone production build.
  - Agora policy: Zero browser speech APIs (`speechSynthesis`, `webkitSpeechRecognition`) in `src/`.

