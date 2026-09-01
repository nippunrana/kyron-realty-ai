# Project Context: Kyron Realty AI

## Overview
Kyron Realty AI is a modern real estate intelligence platform integrating AI capabilities for property analytics, automated valuations, real estate workflow automation, and real-time voice agents.

---

## 1. Single Sources of Truth (Read Directly)
Before writing or modifying features, consult the canonical source files:
- **Database Schema**: [src/db/schema.ts](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/db/schema.ts) — PostgreSQL models (`users`, `accounts`, `sessions`, `verificationTokens`, `properties`, `deals`).
- **Auth & Session Config**: [src/auth.ts](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/auth.ts) — NextAuth v5 configuration, credentials verification, and Google OAuth handlers.
- **Design System & UI Tokens**: [docs/design-system.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/design-system.md) & [src/app/globals.css](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/app/globals.css) — Color palettes, `.luxury-card` (light) vs `.luxury-dark-card` (midnight dark) rules, and animation easing.
- **Infrastructure & Deployment**: [docs/server-config.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/server-config.md) — VPS architecture, PM2 cluster, PostgreSQL 17, and Nginx reverse proxy.

---

## 2. Built Systems vs Roadmap
To prevent duplicate code or assuming features that do not yet exist:

| System / Feature | Status | Location | Notes |
| :--- | :--- | :--- | :--- |
| **Authentication** | Built | `src/app/login/page.tsx`, `src/auth.ts`, `src/app/api/auth/` | NextAuth credentials + Google OAuth fallback flow |
| **Landing Page** | Built | `src/app/page.tsx` | Hero, social proof counter, waitlist form, feature highlights |
| **Database Pool & ORM**| Built | `src/db/index.ts`, `src/db/schema.ts` | Drizzle ORM + PostgreSQL 17 pool connection |
| **Design System** | Built | `docs/design-system.md`, `src/app/globals.css` | Dual-pane light/midnight luxury dark system |
| **Property Valuation / AI Pipelines** | Roadmap | Pending implementation | Future backend services for live MLS ingestion & ML valuation |
| **Voice Agent / Agora Real-Time** | Roadmap | Historical specs in `docs/pitch/` | Voice SDK integration planned for subsequent phase |

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
- **Database Migrations**: Always manage schema changes through `src/db/schema.ts` and `drizzle-kit push`.
- **CI/CD**: Pushes to `main` automatically trigger GitHub Actions to deploy to the VPS with zero downtime.

