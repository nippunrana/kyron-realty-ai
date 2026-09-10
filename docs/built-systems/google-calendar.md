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

- `prompt: "consent"` in `src/auth.ts` shows the Google consent screen on *every* Google
  login. That is deliberate: it guarantees a refresh token even when a previous one was
  lost or expired. Relaxing it trades that guarantee for a quieter login.
- While the Google Cloud OAuth app is in **Testing**, refresh tokens expire after 7 days
  and only listed test users can consent. Calendar access will appear to work and then
  silently stop. Publishing the app is what fixes it, not code.
