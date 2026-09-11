import path from "node:path";
import { mkdir } from "node:fs/promises";

/**
 * Resolves the absolute project root directory.
 * In Next.js standalone mode (production under PM2), process.cwd() is set to
 * `.next/standalone` by server.js (via process.chdir). In that case, we resolve
 * two levels up to reach the persistent project root.
 */
export function getProjectRoot(): string {
  if (process.env.STORAGE_DIR) {
    return path.resolve(process.env.STORAGE_DIR);
  }

  const cwd = process.cwd();
  if (cwd.endsWith(path.join(".next", "standalone")) || cwd.includes(path.join(".next", "standalone"))) {
    return path.resolve(cwd, "../..");
  }

  return cwd;
}

/**
 * Returns the absolute path to the persistent public/uploads directory
 * or a specific subpath inside it.
 */
export function getUploadsDir(...subpaths: string[]): string {
  return path.join(getProjectRoot(), "public", "uploads", ...subpaths);
}

/**
 * Ensures a directory inside the persistent public/uploads folder exists.
 */
export async function ensureUploadsDir(...subpaths: string[]): Promise<string> {
  const dirPath = getUploadsDir(...subpaths);
  await mkdir(dirPath, { recursive: true });
  return dirPath;
}
