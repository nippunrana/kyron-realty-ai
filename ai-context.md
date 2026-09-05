# Project Context: Kyron Realty AI

## Overview
Kyron Realty AI is a modern real estate intelligence platform integrating AI capabilities for property analytics, automated valuations, real estate workflow automation, and real-time voice agents.

---

## 1. Single Sources of Truth (Read Directly)
Before writing or modifying features, consult the canonical source files and their dedicated system docs:
- **Design System & UI Tokens**: [docs/built-systems/design-system.md](docs/built-systems/design-system.md) & [src/app/globals.css](src/app/globals.css)
- **Auth & Session System**: [docs/built-systems/auth.md](docs/built-systems/auth.md) & [src/auth.ts](src/auth.ts)
- **Database & Schemas**: [src/db/schema.ts](src/db/schema.ts) is the only description of the schema — read it directly; rules and traps in [docs/built-systems/database.md](docs/built-systems/database.md)
- **Voice Agent & Agora SD-RTN**: [docs/built-systems/voice-agent-and-agora.md](docs/built-systems/voice-agent-and-agora.md)
- **Property Onboarding & Apify**: [docs/built-systems/property-onboarding-and-apify.md](docs/built-systems/property-onboarding-and-apify.md)
- **Public Listings & Leads**: [docs/built-systems/public-listings-and-leads.md](docs/built-systems/public-listings-and-leads.md)
- **Original Design Intent (historical)**: [docs/plan/](docs/plan/) — pre-implementation planning, frozen at authoring time. Useful for *why* the system was shaped this way. **Never treat it as current truth**: it contains copied schema and architecture snapshots that the code has since moved past.
- **Architecture & Subpath Hosting**: [docs/built-systems/architecture-and-basepath.md](docs/built-systems/architecture-and-basepath.md)
- **VPS Infrastructure**: [docs/server-config.md](docs/server-config.md)

### Strict Agora-Only Conversational AI Policy (Zero Browser Fallbacks)
For this project, all conversational AI voice capabilities must run strictly and exclusively on **Agora SD-RTN WebRTC** and **Agora Signaling (RTM)** via the Agora Conversational AI Cloud Gateway:
- **Strictly Prohibited**: Browser SpeechSynthesis (`window.speechSynthesis`), browser speech recognition (`webkitSpeechRecognition`), client-side fake assistant reply scripts, and silent backend fake-success fallbacks.
- **Approved Cloud Services**: Agora-managed cloud services (such as Agora Managed TTS via MiniMax `speech-2.6-turbo` and Agora Cloud ASR) and configured cloud LLMs (Gemini/OpenAI) are standard approved components.
- **Fail-Fast Error Contract**: If Agora Cloud Gateway or RTC/RTM connection fails, the system must fail explicitly, mark the DB session as `failed`, and surface the error to the user immediately. Never fake success.

---

## 2. Built Systems vs Roadmap
To prevent duplicate code or assuming features that do not yet exist:

| System / Feature | Status | System Spec | Code Location | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Built | [auth.md](docs/built-systems/auth.md) | `src/app/login/page.tsx`, `src/auth.ts`, `src/app/api/auth/` | NextAuth credentials + Google OAuth fallback flow |
| **User Dashboard** | Built | [architecture-and-basepath.md](docs/built-systems/architecture-and-basepath.md) | `src/app/dashboard/page.tsx`, `src/components/dashboard/` | Protected workspace with header, logout, and active inventory |
| **Landing Page** | Built | [architecture-and-basepath.md](docs/built-systems/architecture-and-basepath.md) | `src/app/page.tsx`, `src/components/home/` | Light-mode luxury: Hero voice simulator, speed-to-lead comparison, 3-step engine, negotiation matrix, demo listing, Agora modal |
| **Database Pool & ORM**| Built | [database.md](docs/built-systems/database.md) | `src/db/index.ts`, `src/db/schema.ts` | Drizzle ORM + PostgreSQL 17 pool connection |
| **Design System** | Built | [design-system.md](docs/built-systems/design-system.md) | `src/app/globals.css` | Dual-pane light/midnight luxury dark system |
| **Voice Agent / Agora Real-Time** | Built | [voice-agent-and-agora.md](docs/built-systems/voice-agent-and-agora.md) | `src/app/api/agora/`, `src/hooks/`, `src/components/voice/` | Agora Conversational AI Cloud Gateway + WebRTC client |
| **Conversational Onboarding & Apify**| Built | [property-onboarding-and-apify.md](docs/built-systems/property-onboarding-and-apify.md) | `src/app/dashboard/properties/new`, `src/lib/apify-crawler.ts` | Split-screen studio + Apify crawler + KB synthesizer |
| **Public Listing & QR Sales Agent** | Built | [public-listings-and-leads.md](docs/built-systems/public-listings-and-leads.md) | `src/app/listings/[slug]`, `src/app/api/leads/` | QR Code generator, Voice Sales Modal, Tour booking |

---

## 3. Subpath & `basePath` Rules (`/projects/kyron-realty-ai`)
The application runs under the subpath prefix **`/projects/kyron-realty-ai`**:
- **`next.config.ts`**: Configures `basePath: "/projects/kyron-realty-ai"`.
- **Client-side Fetch Calls**: Must explicitly prepend `${BASE_PATH}` (e.g. `fetch('/projects/kyron-realty-ai/api/auth/status')`).
- **Static Assets & Next/Image**: Static assets in `public/images/` must be referenced using `${BASE_PATH}/images/filename.jpg` with `unoptimized={true}` on `<Image />` to prevent Next.js image optimizer 400 path mismatches.
- **NextAuth Callbacks**: Redirect URLs must specify `${BASE_PATH}/` (e.g. callbackUrl: `/projects/kyron-realty-ai/`).

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
- **CI/CD**: Pushes to `main` automatically trigger GitHub Actions to deploy to the VPS with zero downtime.

