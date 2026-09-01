# Project Context: Kyron Realty AI

## Overview
Kyron Realty AI is a modern real estate intelligence platform integrating AI capabilities for property analytics, automated valuations, real estate workflow automation, and real-time voice agents.

---

## 1. Single Sources of Truth (Read Directly)
Before writing or modifying features, consult the canonical source files and their dedicated system docs:
- **Design System & UI Tokens**: [docs/systems/design-system.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/systems/design-system.md) & [src/app/globals.css](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/app/globals.css)
- **Auth & Session System**: [docs/systems/auth.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/systems/auth.md) & [src/auth.ts](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/auth.ts)
- **Database & Schemas**: [docs/systems/database.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/systems/database.md) & [src/db/schema.ts](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/db/schema.ts)
- **Architecture & Subpath Hosting**: [docs/systems/architecture-and-basepath.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/systems/architecture-and-basepath.md)
- **VPS Infrastructure**: [docs/server-config.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/server-config.md)

---

## 2. Built Systems vs Roadmap
To prevent duplicate code or assuming features that do not yet exist:

| System / Feature | Status | System Spec | Code Location | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Built | [auth.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/systems/auth.md) | `src/app/login/page.tsx`, `src/auth.ts`, `src/app/api/auth/` | NextAuth credentials + Google OAuth fallback flow |
| **User Dashboard** | Built | [architecture-and-basepath.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/systems/architecture-and-basepath.md) | `src/app/dashboard/page.tsx`, `src/components/dashboard/` | Protected workspace with header, logout, and empty-state modules |
| **Landing Page** | Built | [architecture-and-basepath.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/systems/architecture-and-basepath.md) | `src/app/page.tsx` | Hero, social proof counter, waitlist form, feature highlights |
| **Database Pool & ORM**| Built | [database.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/systems/database.md) | `src/db/index.ts`, `src/db/schema.ts` | Drizzle ORM + PostgreSQL 17 pool connection |
| **Design System** | Built | [design-system.md](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/docs/systems/design-system.md) | `src/app/globals.css` | Dual-pane light/midnight luxury dark system |
| **Property Valuation / AI Pipelines** | Roadmap | *Pending* | Future backend services | Live MLS ingestion & automated ML valuation models |
| **Voice Agent / Agora Real-Time** | Roadmap | *Pending* (see `docs/pitch/`) | Future voice module | Voice SDK integration planned for subsequent phase |

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

