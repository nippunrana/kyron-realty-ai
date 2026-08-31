# Project Context: Agora Realty AI

## Overview
Agora Realty AI is a modern real estate intelligence platform integrating AI capabilities for property analytics, automated valuations, and real estate workflow automation.

## Technology Stack & Versions
- **Framework**: Next.js 16 (v16.3.3) with App Router, Turbopack, React 19, TypeScript
- **Database**: PostgreSQL 17
- **ORM**: Drizzle ORM (v0.40.x) + `postgres.js`
- **Styling**: Tailwind CSS v4 + Lucide React
- **Process Manager**: PM2 (`ecosystem.config.cjs` standalone output)
- **Reverse Proxy**: Nginx
- **CI/CD Pipeline**: GitHub Actions (`.github/workflows/deploy.yml`)
- **Repository**: [nippunrana/agora-realty-ai](https://github.com/nippunrana/agora-realty-ai)

## Architecture & Directory Structure
- `src/app/`: Next.js App Router pages, layout, and global CSS tokens.
- `src/db/`: Drizzle ORM schema definitions and database connection pool.
- `scripts/`: Production deployment scripts (`deploy.sh`).
- `.github/workflows/`: GitHub Actions push-to-deploy workflow.
- `ecosystem.config.cjs`: PM2 cluster mode configuration for Next.js standalone build.
- `nginx.conf.example`: Reference Nginx reverse proxy configuration.

## Development & Deployment Guidelines
- **Zero Secrets in Git**: Sensitive keys and database passwords must only reside in `.env`.
- **Standalone Build**: `next.config.ts` uses `output: 'standalone'` for minimal VPS memory footprint.
- **Database Migrations**: Always manage schema changes through `src/db/schema.ts` and `drizzle-kit`.
- **CI/CD**: Pushes to `main` automatically trigger GitHub Actions to deploy to the VPS.
