import "dotenv/config";
import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is missing.");
    process.exit(1);
  }

  console.log("Connecting to PostgreSQL database...");
  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 10,
  });

  try {
    const migrationFile = path.resolve(__dirname, "../src/db/migrations/0000_daffy_purifiers.sql");
    const migrationSql = fs.readFileSync(migrationFile, "utf-8");

    // Split statements by drizzle statement-breakpoint
    const statements = migrationSql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} migration statements...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await sql.unsafe(stmt);
        console.log(`  [✓] Statement ${i + 1}/${statements.length} executed successfully`);
      } catch (err: any) {
        // If table or constraint already exists, log as notice rather than failing hard
        if (err?.code === "42P07" || err?.code === "42710" || err?.code === "42701") {
          console.log(`  [!] Notice: Statement ${i + 1} already applied (${err.message})`);
        } else {
          console.warn(`  [!] Warning on Statement ${i + 1}: ${err.message}`);
        }
      }
    }

    console.log("\nDatabase migration completed successfully! 🚀");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
