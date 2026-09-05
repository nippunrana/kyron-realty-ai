/**
 * The phase scripts insert fabricated listings, leads, and voice sessions into
 * whatever DATABASE_URL points at, which for local development is the shared
 * server. They refuse to run unless the writes are requested explicitly.
 */
export function assertSampleDataWritesAllowed(): void {
  if (process.env.ALLOW_SAMPLE_DATA_WRITES === "1") return;
  console.error(
    "Refusing to run: this script writes sample rows to the database at DATABASE_URL. Set ALLOW_SAMPLE_DATA_WRITES=1 to run it deliberately."
  );
  process.exit(1);
}
