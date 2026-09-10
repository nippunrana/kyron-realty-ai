/**
 * Google Calendar link for a property owner.
 *
 * Scheduling is a Google-sign-in capability and nothing else. An owner who registered
 * with email and password, or who unticked the calendar boxes on Google's granular
 * consent screen, simply has no link — and that absence is the designed state, not a
 * failure. Every function here returns `null` instead of throwing, so a caller can skip
 * scheduling in silence.
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { getGoogleOAuthConfig } from "@/lib/google-oauth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

/**
 * The only Calendar scopes this app may request. `calendar.app.created` confines every
 * write to the one calendar we create; `calendar.freebusy` reads busy blocks without
 * event content. Both promises are published in src/app/privacy/page.tsx — widening this
 * list means editing that page in the same commit.
 */
export const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.app.created",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

/** Must stay character-for-character identical to the name promised in src/app/privacy/page.tsx. */
export const KYRON_CALENDAR_NAME = "Kyron Real Estate AI";

type GoogleAccount = typeof accounts.$inferSelect;

const googleAccount = (providerAccountId: string) =>
  and(eq(accounts.provider, "google"), eq(accounts.providerAccountId, providerAccountId));

/**
 * True only when the owner actually granted both calendar scopes AND left us a refresh
 * token. Google lets a user sign in while declining individual scopes, so "has a Google
 * account" is not the same question.
 */
function hasCalendarGrant(row: GoogleAccount): boolean {
  if (!row.refresh_token) return false;
  const granted = (row.scope ?? "").split(" ");
  return CALENDAR_SCOPES.every((scope) => granted.includes(scope));
}

/**
 * Write the tokens from a fresh sign-in over the stored ones.
 *
 * The Drizzle adapter only ever inserts an account row, on the very first link — it has
 * no update path — so without this every later sign-in would discard the tokens Google
 * just issued.
 */
export async function persistGoogleTokens(account: {
  providerAccountId: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  scope?: string | null;
}): Promise<void> {
  const patch: Partial<GoogleAccount> = {};
  if (account.access_token) patch.access_token = account.access_token;
  if (account.expires_at) patch.expires_at = account.expires_at;
  if (account.scope) patch.scope = account.scope;
  // Google omits refresh_token on repeat grants: never overwrite a stored one with null.
  if (account.refresh_token) patch.refresh_token = account.refresh_token;

  if (Object.keys(patch).length === 0) return;

  await db.update(accounts).set(patch).where(googleAccount(account.providerAccountId));
}

/**
 * Create the owner's Kyron calendar once and remember its id.
 *
 * Idempotent: the stored id short-circuits every later sign-in, so an owner never
 * accumulates duplicate calendars. Returns null when the owner declined the scopes.
 */
export async function ensureKyronCalendar(
  providerAccountId: string,
  accessToken: string
): Promise<string | null> {
  const [row] = await db
    .select()
    .from(accounts)
    .where(googleAccount(providerAccountId))
    .limit(1);

  if (!row || !hasCalendarGrant(row)) return null;
  if (row.calendarId) return row.calendarId;

  const response = await fetch(`${CALENDAR_API}/calendars`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ summary: KYRON_CALENDAR_NAME }),
  });

  if (!response.ok) {
    console.error(
      `Google Calendar create failed (${response.status}):`,
      await response.text().catch(() => "")
    );
    return null;
  }

  const created = (await response.json().catch(() => null)) as { id?: string } | null;
  if (!created?.id) return null;

  await db
    .update(accounts)
    .set({ calendarId: created.id })
    .where(googleAccount(providerAccountId));

  return created.id;
}

/**
 * Exchange the stored refresh token for a fresh access token.
 *
 * Only an explicit `invalid_grant` means the owner revoked us — that clears the stored
 * credentials so the link reads as absent from then on. Any other failure is treated as
 * transient and mutates nothing.
 */
async function refreshAccessToken(row: GoogleAccount): Promise<string | null> {
  const { clientId, clientSecret, isConfigured } = getGoogleOAuthConfig();
  if (!isConfigured || !row.refresh_token) return null;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: row.refresh_token,
    }),
  });

  const body = (await response.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error?: string }
    | null;

  if (!response.ok || !body?.access_token) {
    if (body?.error === "invalid_grant") {
      await db
        .update(accounts)
        .set({ refresh_token: null, access_token: null, expires_at: null })
        .where(googleAccount(row.providerAccountId));
    }
    console.error("Google token refresh failed:", body?.error ?? response.status);
    return null;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + (body.expires_in ?? 3600);
  await db
    .update(accounts)
    .set({ access_token: body.access_token, expires_at: expiresAt })
    .where(googleAccount(row.providerAccountId));

  return body.access_token;
}

/**
 * The one entry point for scheduling against an owner's calendar. Resolve a property's
 * owner with `properties.ownerId` and pass it here.
 *
 * Returns null — never throws — whenever the owner cannot be scheduled against: no
 * Google account, scopes declined, access revoked, or Google unreachable. Callers must
 * branch on null and carry on without scheduling.
 */
export async function getOwnerCalendarAccess(
  userId: string
): Promise<{ accessToken: string; calendarId: string } | null> {
  const [row] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")))
    .limit(1);

  if (!row || !row.calendarId || !hasCalendarGrant(row)) return null;

  // Refresh a minute early so a token cannot expire mid-request.
  const isExpired = (row.expires_at ?? 0) - 60 <= Math.floor(Date.now() / 1000);
  const accessToken = row.access_token && !isExpired
    ? row.access_token
    : await refreshAccessToken(row);

  return accessToken ? { accessToken, calendarId: row.calendarId } : null;
}
