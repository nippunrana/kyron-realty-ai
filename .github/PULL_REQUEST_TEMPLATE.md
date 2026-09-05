## What changed and why

<!-- One paragraph. Link the issue if there is one. -->

## Checklist

- [ ] No new copy of logic that already exists in `src/lib/` (title, slug, floor price, base path, credentials).
- [ ] No dead code introduced: `npx tsc --noEmit` and `npm run lint` pass with zero errors; `npm run lint:unused` reports nothing new.
- [ ] Any new route under `/api/onboarding` or `/api/properties` starts with the session check (see `docs/built-systems/auth.md`).
- [ ] No property fact is invented for a listing: missing data renders as "Not specified" and the voice prompt says so.
- [ ] If a rule or decision changed, the matching `docs/built-systems/*.md` file says so.
