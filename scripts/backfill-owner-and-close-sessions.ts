// One-off data fix from the 2026-09-05 audit. Runs both statements in a single transaction and
// rolls back unless the row counts match what was verified beforehand (1 listing, 84 sessions).
// Run once with:  node --env-file=.env --experimental-strip-types scripts/backfill-owner-and-close-sessions.ts
// then delete this file.
import "dotenv/config";
import postgres from "postgres";

// nippun@egnitech.com: the listing was created 71 minutes after this account and every
// owner-onboarding session that carries a real user id belongs to it.
const OWNER_ID = "6055bcce-2d2b-4064-81ea-2c13aa0e6db4";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

try {
  const result = await sql.begin(async (tx) => {
    const owner = await tx`select email from users where id = ${OWNER_ID}`;
    if (owner.length !== 1) throw new Error("Owner account not found; nothing changed.");

    const listings = await tx`
      update properties set owner_id = ${OWNER_ID} where owner_id is null returning slug`;
    const sessions = await tx`
      update voice_sessions set status = 'completed', ended_at = coalesce(ended_at, now())
      where status = 'active' returning id`;

    if (listings.length !== 1 || sessions.length !== 84) {
      throw new Error(
        `Unexpected counts (listings=${listings.length}, sessions=${sessions.length}); rolled back.`,
      );
    }
    return { owner: owner[0].email, listings: listings.map((l) => l.slug), sessions: sessions.length };
  });
  console.log("Done:", result);
} finally {
  await sql.end();
}
