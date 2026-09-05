import crypto from "node:crypto";

/**
 * Hashes a plaintext password using crypto.scrypt with a unique random salt.
 * Stored format: <salt_hex>:<derivedKey_hex>
 */
export function hashPassword(password: string): string {
  if (typeof password !== "string" || !password) {
    throw new Error("Password must be a non-empty string");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password attempt against the stored salt:hash string.
 * Uses timingSafeEqual to protect against timing attacks.
 * Only the salt:hash format is accepted; a stored value in any other shape never verifies.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  if (typeof password !== "string" || typeof storedHash !== "string") return false;

  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;

  const [salt, key] = parts;
  if (!salt || !key) return false;

  try {
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);

    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
