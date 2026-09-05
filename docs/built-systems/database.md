# Database & ORM — Rules

Canonical source: **`src/db/schema.ts`**. Read it directly.
Connection pool: `src/db/index.ts`. Migrations: `src/db/migrations/`.

> **Never trust a table, column, or relationship list written in any document — including this one.**
> This file records decisions and traps only. The schema file is the only description of the schema.

---

## Rules

- **Never hand-run a migration against production.** `scripts/deploy.sh` applies migrations automatically on every deploy. Generate locally with `npm run db:generate` and commit the result; CI does the rest.
- **`scripts/run-migration.ts` is not the deployment path.** It is a local utility. The canonical apply step is the one in `scripts/deploy.sh` — if the two ever disagree, `deploy.sh` is what actually ran.
- **Never add features to the `inquiries` table.** It is retained for legacy compatibility only. All lead capture goes to `inquiries_and_leads`. The two names are similar enough to pick wrong; check which one you are writing to.
- **`properties.owner_id` is the tenancy boundary.** The dashboard shows only the signed-in user's rows plus rows whose `owner_id` is null (listings created before authentication existed). Never widen that query. Assign the legacy rows with `UPDATE properties SET owner_id = '<user id>' WHERE owner_id IS NULL;` and the null clause can then be dropped.
- **Never assume a local database exists.** Local development connects to the *remote* shared Postgres host (see `.env`); production connects over `localhost`. A local dev session writes to the shared server — destructive queries are not sandboxed.
