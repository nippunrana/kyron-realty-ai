/**
 * Proves the Google Calendar link end to end against a real owner: both scopes, the
 * stored refresh token, event creation on the Kyron calendar, and the free/busy read the
 * sales agent will schedule against.
 *
 * Writes a real event into the owner's calendar, so run it deliberately:
 *   npx tsx scripts/test-calendar-booking.ts [owner-email]
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import {
  DEFAULT_CALENDAR_TIME_ZONE,
  getOwnerCalendarAccess,
  KYRON_CALENDAR_NAME,
} from "../src/lib/google-calendar";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

/** Booking in the machine's zone rather than the owner's would be a silent hour-shift bug. */
const TIME_ZONE = DEFAULT_CALENDAR_TIME_ZONE;

const ownerEmail = process.argv[2];
if (!ownerEmail) {
  // No default: a bare run would book a real event into whichever calendar was hardcoded.
  console.error("Usage: npx tsx scripts/test-calendar-booking.ts <owner-email>");
  process.exit(1);
}

/** "Tomorrow" as the owner experiences it, not as the machine running this does. */
function tomorrowInOwnerZone(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
}

async function calendarApi(
  accessToken: string,
  path: string,
  init?: { method?: string; body?: unknown }
) {
  const response = await fetch(`${CALENDAR_API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} → ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log(`=== Google Calendar link test: ${ownerEmail} ===\n`);

  const [owner] = await db.select().from(users).where(eq(users.email, ownerEmail)).limit(1);
  if (!owner) throw new Error(`No user with email ${ownerEmail}`);
  console.log(`Owner: ${owner.name} (${owner.id})`);

  // Step 1 — the exact accessor the sales agent will call. Null here means "no calendar",
  // which is a supported state, not a failure of the app.
  const access = await getOwnerCalendarAccess(owner.id);
  if (!access) {
    console.log("\nNo calendar link for this owner.");
    console.log("Expected when: they signed up with a password, declined the calendar");
    console.log("scopes, or revoked access. The app skips scheduling silently.");
    process.exit(1);
  }
  console.log(`Access token obtained (refreshed automatically if it had expired).`);
  console.log(`Calendar id: ${access.calendarId}\n`);

  // Step 2 — read the calendar back, confirming calendar.app.created works and that we
  // are pointed at the calendar this app made rather than the owner's primary.
  const calendar = await calendarApi(access.accessToken, `/calendars/${encodeURIComponent(access.calendarId)}`);
  console.log(`[calendar.app.created] Calendar reads back as: "${calendar.summary}"`);
  console.log(`  Calendar's own time zone: ${calendar.timeZone}` +
    (calendar.timeZone === TIME_ZONE ? " (correct)" : ` — EXPECTED ${TIME_ZONE}`));
  if (calendar.summary !== KYRON_CALENDAR_NAME) {
    console.warn(`  WARNING: expected "${KYRON_CALENDAR_NAME}"`);
  }

  // Step 3 — book tomorrow 17:00–18:00. The explicit timeZone is what stops Google from
  // interpreting a bare timestamp in the calendar's zone.
  const date = tomorrowInOwnerZone();
  const start = `${date}T17:00:00`;
  const end = `${date}T18:00:00`;
  console.log(`\nBooking ${start} → ${end} (${TIME_ZONE})`);

  const created = await calendarApi(access.accessToken, `/calendars/${encodeURIComponent(access.calendarId)}/events`, {
    method: "POST",
    body: {
      summary: "Test viewing — Kyron Realty AI",
      description: "Created by scripts/test-calendar-booking.ts to verify calendar write access.",
      start: { dateTime: start, timeZone: TIME_ZONE },
      end: { dateTime: end, timeZone: TIME_ZONE },
    },
  });
  console.log(`[calendar.app.created] Event created: ${created.id}`);

  // Step 4 — read it back. Creating and assuming is how timezone bugs survive; what Google
  // stored is the only answer that counts.
  const stored = await calendarApi(
    access.accessToken,
    `/calendars/${encodeURIComponent(access.calendarId)}/events/${created.id}`
  );
  console.log(`\nGoogle stored:`);
  console.log(`  start: ${stored.start.dateTime}  (timeZone ${stored.start.timeZone})`);
  console.log(`  end:   ${stored.end.dateTime}  (timeZone ${stored.end.timeZone})`);

  const storedLocal = new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(stored.start.dateTime));
  console.log(`  reads as: ${storedLocal} IST`);

  const startsAtFive = new Date(stored.start.dateTime).getTime() === new Date(`${start}+05:30`).getTime();
  console.log(`  correct wall-clock time (17:00 IST): ${startsAtFive ? "YES" : "NO — TIME SHIFTED"}`);

  // Step 5 — free/busy is the other half: the sales agent reads this to avoid offering a
  // slot the owner is already booked for. Includes primary, which we can never read events from.
  const freeBusy = await calendarApi(access.accessToken, `/freeBusy`, {
    method: "POST",
    body: {
      timeMin: `${date}T00:00:00+05:30`,
      timeMax: `${date}T23:59:59+05:30`,
      timeZone: TIME_ZONE,
      items: [{ id: access.calendarId }, { id: "primary" }],
    },
  });

  console.log(`\n[calendar.freebusy] Busy blocks on ${date}:`);
  for (const [id, value] of Object.entries<{ busy?: { start: string; end: string }[]; errors?: unknown }>(freeBusy.calendars)) {
    const label = id === "primary" ? "primary" : "Kyron calendar";
    if ((value as { errors?: unknown }).errors) {
      console.log(`  ${label}: ERROR ${JSON.stringify((value as { errors: unknown }).errors)}`);
      continue;
    }
    const busy = value.busy ?? [];
    console.log(`  ${label}: ${busy.length} busy block(s)`);
    for (const block of busy) {
      console.log(`    ${block.start} → ${block.end}`);
    }
  }

  console.log(`\nDone. The event is live at: ${created.htmlLink}`);
  console.log(`Delete it from Google Calendar when you are finished looking at it.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nFAILED:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
