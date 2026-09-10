# Authentication — Rules

Canonical source: **`src/auth.ts`** (NextAuth v5). Routes: `src/app/api/auth/`.
Password hashing: `src/lib/auth-passwords.ts`.

---

## Rules

- **Never crash `/login` when Google OAuth keys are absent.** Missing `AUTH_GOOGLE_*` env vars must degrade gracefully: the frontend reads `/api/auth/status` and disables the Google button with a notice. Treat absent keys as a supported configuration, not an error.
- **Never re-implement or duplicate password validation in a route handler.** Hashing and verification live in `src/lib/auth-passwords.ts` and nowhere else; the length limits and email pattern that the login form and the register route share live in `src/lib/auth-policy.ts`. Changing the policy means changing those files, never a caller.
- **The `sessions` table is not the session store.** The Drizzle adapter is configured, but the session strategy is JWT — so sessions are stateless and that table stays empty. Do not try to revoke a login by deleting a row; there is no row. Server-side invalidation requires a different mechanism, which does not exist yet.
- **Never accept a plaintext stored password.** `verifyPassword` only verifies the `salt:hash` scrypt format; the old "development plaintext fallback" was removed on 2026-09-05 after confirming the shared database held no plaintext rows. Seed accounts through `/api/auth/register` or `hashPassword`, never by writing a raw password column.
- **Never add a fallback `AUTH_SECRET`.** `src/auth.ts` passes only the env value; a missing secret must fail at startup rather than sign JWTs with a string that is in the repo.
- **`/api/onboarding/*` and `/api/properties/create` require a session.** They spend Gemini credits and publish listings, and are only reachable from the authenticated studio. Never make them public. Buyer-facing routes (`/api/agora/session/start` with `buyer_inquiry`, `/api/leads/capture`) stay public by design.
- **The Google provider requests Calendar scopes, and that is not optional plumbing.** Scope list, token handling and the "absence is silent" contract live in [google-calendar.md](google-calendar.md). Never edit the Google `authorization.params` in `src/auth.ts` without reading it.
- **NextAuth is mounted under the subpath**, not at the domain root. Callback and redirect URLs must carry the base path — see [architecture-and-basepath.md](architecture-and-basepath.md).
- **`/privacy` and `/terms` must stay publicly reachable.** Google's OAuth verification reviewer fetches the privacy policy URL without a session before approving Calendar scopes; putting these routes behind a guard fails verification. There is no global middleware today, so this holds by default — do not add one that catches them.
- **Never claim a safeguard or feature the code does not implement.** The privacy policy is a verification artifact Google checks against real behaviour. It currently states tokens are held under access controls (not "encrypted at rest") and that account deletion is by email request (there is no self-service delete). If either changes in code, update `src/app/privacy/page.tsx` in the same commit — and never the other way round.
