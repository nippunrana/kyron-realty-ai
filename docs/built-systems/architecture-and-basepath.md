# Architecture, Subpath & Hosting — Rules

The app is served from a **subpath**, not a domain root. The prefix is set once in `next.config.ts` (`basePath`) — read it there, never hardcode a second copy.

Process config: `ecosystem.config.cjs` (PM2). Deploy script: `scripts/deploy.sh`. CI: `.github/workflows/deploy.yml`.

---

## Rules

The subpath is the single largest source of silent breakage in this project. Next.js rewrites some paths for you and not others:

- **Client-side `fetch` is NOT rewritten.** `basePath` rewrites Next.js routing and `<Link>`, but not `fetch` URLs you write by hand. Every browser-side fetch must prepend the base path explicitly or it 404s.
- **`next/image` must use `unoptimized` for local static assets.** The optimizer mishandles subpath-prefixed sources and returns `400 Bad Request`. Prefix the `src` with the base path *and* set `unoptimized`.
- **NextAuth callback URLs must include the base path.** A bare `/` redirect lands outside the app.
- **Never hardcode the prefix as a second literal.** It is declared once in `next.config.ts`; a duplicated string is a second thing to keep true when it changes.

## Deployment

- **Never restart PM2 to pick up new environment variables** — reload with `--update-env`, or the cluster workers keep the old environment silently.
- **Nginx caches responses.** After a deploy that changes markup, a stale page can persist until the cache is purged. If a fix "didn't deploy," check the cache before re-deploying.
