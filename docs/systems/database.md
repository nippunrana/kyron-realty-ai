# Kyron Realty AI — Database & ORM System

This document describes the PostgreSQL database architecture, Drizzle ORM models, connection management, and migration protocols.

---

## 1. Stack & Architecture

- **Database Engine**: PostgreSQL 17.
- **ORM**: Drizzle ORM (`drizzle-orm`) + `postgres.js` driver.
- **Source of Truth**: [src/db/schema.ts](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/db/schema.ts).
- **Client & Connection Pool**: [src/db/index.ts](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/db/index.ts).

---

## 2. Defined Schemas

All schemas are defined in `src/db/schema.ts`:

1. **`users`**: User records, credentials, roles (`investor`, `broker`, `admin`), timestamps.
2. **`accounts`**: OAuth provider links (Google, etc.) linked to `users.id` with cascade deletion.
3. **`sessions`**: Active session tokens for session management.
4. **`verificationTokens`**: Ephemeral email verification tokens.
5. **`properties`**: Real estate assets with pricing, spatial specs, `aiValuationEstimate`, and `aiGrowthScore`.
6. **`inquiries`**: Lead captures with `aiSentiment` analysis tracking and processing state.
7. **`marketInsights`**: Regional macroeconomic metrics and AI analysis summaries.

---

## 3. Connection Management

Managed in `src/db/index.ts`:
- **Pool Limits**: Configured with `max: 10`, `idle_timeout: 20`, `connect_timeout: 10` to keep VPS memory footprint minimal under PM2 cluster mode.
- **Environment URL**: `DATABASE_URL` in `.env`.
  - **Local Development**: Connects remotely via `72.60.26.200:5432` to the isolated `kyron_realty_ai` database.
  - **VPS Production**: Connects internally via `localhost:5432`.

---

## 4. Migration & Schema Updates

Always update `src/db/schema.ts` directly and push changes:
```bash
# Push schema changes to the connected PostgreSQL database
npx drizzle-kit push
```
*Note: `deploy.sh` automatically runs `npx drizzle-kit push` on CI/CD deployment.*
