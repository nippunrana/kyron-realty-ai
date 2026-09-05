/**
 * Account-policy constants shared by the login form and the register route so the
 * two can never disagree. Hashing and verification stay in auth-passwords.ts, which
 * is server-only; this module must stay free of Node imports.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const EMAIL_MAX_LENGTH = 255;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}
