import crypto from "node:crypto";

/**
 * Hashes a plaintext password using crypto.scrypt with a unique random salt.
 * Stored format: <salt_hex>:<derivedKey_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password attempt against the stored salt:hash string.
 * Uses timingSafeEqual to protect against timing attacks.
 * Includes fallback for plaintext credentials if present in development.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    // Development plaintext fallback with constant-time equality
    const storedBuf = Buffer.from(storedHash);
    const passBuf = Buffer.from(password);
    if (storedBuf.length !== passBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(storedBuf, passBuf);
  }

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
