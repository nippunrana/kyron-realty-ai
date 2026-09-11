import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function backfill() {
  try {
    console.log("Starting backfill for historical onboarding sessions...");

    // Session 157 -> Property 23
    const [sess157] = await sql`
      UPDATE voice_sessions
      SET property_id = 23
      WHERE id = 157 AND (property_id IS NULL OR property_id = 23)
      RETURNING id, property_id, caller_type, duration_seconds;
    `;
    console.log("Backfilled session 157:", sess157);

    // Session 158 -> Property 24
    const [sess158] = await sql`
      UPDATE voice_sessions
      SET property_id = 24
      WHERE id = 158 AND (property_id IS NULL OR property_id = 24)
      RETURNING id, property_id, caller_type, duration_seconds;
    `;
    console.log("Backfilled session 158:", sess158);

    // Verify properties
    const props = await sql`
      SELECT p.id, p.title, p.status, p.slug, v.id as voice_session_id, v.duration_seconds
      FROM properties p
      LEFT JOIN voice_sessions v ON v.property_id = p.id
      WHERE p.id IN (23, 24)
      ORDER BY p.id ASC;
    `;
    console.log("Verified linked properties:");
    console.table(props);
  } catch (err) {
    console.error("Backfill failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

backfill();
