import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Fail fast at runtime: silently connecting to a default local database looks like the
// product working. `next build` imports route modules without env, so the build phase is exempt.
if (!connectionString && process.env.NEXT_PHASE !== "phase-production-build") {
  throw new Error("DATABASE_URL is not set. Add it to .env before starting the server.");
}

// Configure client with reasonable connection pool limits for VPS
const client = postgres(connectionString ?? "", {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
