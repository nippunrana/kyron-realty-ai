import "dotenv/config";
import postgres from "postgres";

async function alignSchema() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log("Aligning `properties` table columns with new schema...");

    const columnAlterations = [
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_id text REFERENCES users(id) ON DELETE CASCADE;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS slug text;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'rent';`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS security_deposit numeric(12, 2);`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS min_lease_months integer DEFAULT 12;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS hoa_fee_monthly numeric(10, 2) DEFAULT 0;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS unit_number text;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS country text DEFAULT 'USA';`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built integer;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS available_date timestamp;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS cover_image_url text;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '[]'::jsonb;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS qr_code_svg text;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS share_url text;`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS onboarding_source text DEFAULT 'conversational_wizard';`,
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS source_url text;`,
    ];

    for (const alt of columnAlterations) {
      await sql.unsafe(alt);
      console.log(`  [✓] Applied: ${alt.trim()}`);
    }

    // Ensure unique slug constraint or index exists
    try {
      await sql.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS properties_slug_unique_idx ON properties (slug);`);
      console.log(`  [✓] Created unique index on properties(slug)`);
    } catch (e: any) {
      console.log(`  [!] Index note: ${e.message}`);
    }

    // Check all tables in schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log("\nActive Database Tables in kyron_realty_ai:");
    tables.forEach((t) => console.log(`  - ${t.table_name}`));

    console.log("\nSchema alignment complete! 🚀");
  } catch (error) {
    console.error("Alignment error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

alignSchema();
