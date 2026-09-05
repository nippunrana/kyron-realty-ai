# Public Listings & Lead Capture — Rules

Canonical sources: `src/app/listings/[slug]/`, `src/components/public/`, `src/app/api/leads/`.

---

## Rules

- **Public listing URLs are printed onto QR codes and shared into WhatsApp.** They are effectively permanent once distributed. Never change the public listing route shape or a property's slug after a listing has been deployed — an existing QR code cannot be recalled.
- **Listing URLs must be absolute and base-path-correct** wherever they are embedded (QR payloads, share links, OpenGraph tags). A relative URL is unusable in a QR code and breaks link previews. See [architecture-and-basepath.md](architecture-and-basepath.md).
- **Lead capture writes to two tables in one flow** — the lead record and, when a viewing is requested, the appointment. Both must succeed or the lead is half-recorded; check `src/app/api/leads/capture/` before changing either write.
- **Write leads to `inquiries_and_leads`, never to the legacy `inquiries` table.** See [database.md](database.md).
