/**
 * The subpath the app is served under. Declared once here: next.config.ts
 * imports it for `basePath`, and every hand-written fetch/redirect URL imports
 * it too. Next.js rewrites <Link> and routing for basePath, but NOT fetch().
 */
export const BASE_PATH = "/projects/kyron-realty-ai";
export const AUTH_BASE_PATH = `${BASE_PATH}/api/auth`;

/**
 * Where the app is publicly served. Used only where a request's own host is not
 * available: static marketing copy and the share-URL fallback for older rows.
 */
export const PUBLIC_ORIGIN = "https://egnitech.com";
