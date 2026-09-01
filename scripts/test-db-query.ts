import "dotenv/config";
import { db } from "../src/db";
import { properties, propertyKnowledgeBases, negotiationMatrices } from "../src/db/schema";
import { count } from "drizzle-orm";

async function testDb() {
  try {
    const [{ value: propertyCount }] = await db.select({ value: count() }).from(properties);
    console.log(`[✓] Drizzle ORM connected. Total properties in DB: ${propertyCount}`);
    
    const [{ value: kbCount }] = await db.select({ value: count() }).from(propertyKnowledgeBases);
    console.log(`[✓] Total knowledge bases in DB: ${kbCount}`);

    const [{ value: matrixCount }] = await db.select({ value: count() }).from(negotiationMatrices);
    console.log(`[✓] Total negotiation matrices in DB: ${matrixCount}`);

    console.log("\nPhase 1 Database Verification: All systems operational! 🚀");
  } catch (error) {
    console.error("Database query test failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testDb();
