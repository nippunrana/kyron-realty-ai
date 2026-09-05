# Authentication — Rules

Canonical source: **`src/auth.ts`** (NextAuth v5). Routes: `src/app/api/auth/`.
Password hashing: `src/lib/auth-passwords.ts`.

---

## Rules

- **Never crash `/login` when Google OAuth keys are absent.** Missing `AUTH_GOOGLE_*` env vars must degrade gracefully: the frontend reads `/api/auth/status` and disables the Google button with a notice. Treat absent keys as a supported configuration, not an error.
- **Never re-implement or duplicate password validation in a route handler.** Hashing and verification live in `src/lib/auth-passwords.ts` and nowhere else. Changing the policy means changing that one file.
- **The `sessions` table is not the session store.** The Drizzle adapter is configured, but the session strategy is JWT — so sessions are stateless and that table stays empty. Do not try to revoke a login by deleting a row; there is no row. Server-side invalidation requires a different mechanism, which does not exist yet.
- **NextAuth is mounted under the subpath**, not at the domain root. Callback and redirect URLs must carry the base path — see [architecture-and-basepath.md](architecture-and-basepath.md).
