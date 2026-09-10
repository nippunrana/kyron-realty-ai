# Google Calendar — Rules

Canonical source: **`src/lib/google-calendar.ts`**. Wired into sign-in by `src/auth.ts`
(`events.signIn`). Token and calendar id columns live on `accounts` in `src/db/schema.ts`.

---

## Rules

- **Calendar is a Google-sign-in capability only, and its absence is never an error.** An
  owner who registered with email and password gets no calendar; signing in with Google is
  the only acquisition path, and there is no separate "connect calendar" action. (An
  existing password owner who later clicks "Continue with Google" is linked by email and
  does get one.) Every caller must branch on a `null` return and carry on
  without scheduling — never surface an error, never prompt, never fall back. Decided
  2026-09-10 in preference to a universal "Connect Calendar" action, so that scheduling has
  exactly one acquisition path to reason about.
- **"Has a Google account" is not the question — `hasCalendarGrant` is.** Google's granular
  consent lets someone sign in with Google while unticking the calendar boxes; login still
  succeeds. Presence means both scopes granted *and* a stored refresh token. Never infer
  calendar access from `provider = 'google'`.
- **Never widen `CALENDAR_SCOPES`, and never request `calendar` or `calendar.events`.**
  `calendar.app.created` is what confines every write to the calendar this app created;
  a broader scope would hand us the owner's primary calendar. The exact scope list and the
  calendar's name are published in `src/app/privacy/page.tsx`, which Google's verification
  reviewer reads — changing either here means editing that page in the same commit.
- **Never put Google tokens on the JWT.** The session strategy is JWT, so the token is a
  browser cookie; the privacy policy promises tokens stay in the database. Tokens are read
  from `accounts` at use time and nowhere else.
- **Nothing in the sign-in hook may throw.** A Google outage or database hiccup must cost
  the owner their calendar for that session, not their login. The hook is wrapped in
  try/catch and must stay that way.
- **Only `invalid_grant` clears stored credentials.** That response means the owner revoked
  access. Any other refresh failure is transient — return null and mutate nothing, or a
  network blip permanently unlinks a paying owner.
- **Never overwrite a stored refresh token with null.** Google omits `refresh_token` on
  repeat grants, so a blind write would destroy the only long-lived credential we hold.
- **The Drizzle adapter never updates an account row.** `linkAccount` is an insert that
  fires once, on first link. Fresh tokens reach the database only through
  `persistGoogleTokens`. Do not assume the adapter keeps them current.

---

## Traps

- **Never add `prompt: "consent"` back to the Google provider.** It was removed on
  2026-09-10 because it is redundant: Google already shows the consent screen by itself
  whenever the request asks for a scope the user has not yet granted this client, and that
  grant is what issues the refresh token. On repeat logins Google returns no refresh token,
  and `persistGoogleTokens` deliberately keeps the stored one — that pair is what makes
  repeat logins silent. Forcing consent globally would tax every owner, every login, to
  cover a state that Google's own behaviour already repairs.
- **A stuck link is repaired per-account, never globally.** The one state Google will not
  fix on its own is "both scopes present in `scope` but `refresh_token` null" — Google sees
  nothing new to ask for, so it skips consent and returns no refresh token. The remedy is a
  one-shot re-consent for that owner, not a global prompt. No such repair path is built
  today; the link simply reads as absent, which is the designed contract.
- **Refresh tokens do not expire on a timer.** The OAuth app is published, so a stored
  refresh token stays valid until the owner revokes access or six months pass with no use.
  Access tokens last about an hour and are refreshed automatically.
