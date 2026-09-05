/** Single place that decides whether Google OAuth is configured; used by NextAuth and the /api/auth/status probe. */
export function getGoogleOAuthConfig() {
  const clientId = (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "").trim();
  return { clientId, clientSecret, isConfigured: Boolean(clientId && clientSecret) };
}
