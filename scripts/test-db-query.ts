import "dotenv/config";
import { db } from "../src/db";
import { properties } from "../src/db/schema";
import { count } from "drizzle-orm";

async function testDb() {
  try {
    const [{ value: propertyCount }] = await db.select({ value: count() }).from(properties);
    console.log(`[✓] Drizzle ORM connected. Total properties in DB: ${propertyCount}`);

    console.log("\nDatabase Verification: Single-table consolidated schema operational! 🚀");
  } catch (error) {
    console.error("Database query test failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testDb();
