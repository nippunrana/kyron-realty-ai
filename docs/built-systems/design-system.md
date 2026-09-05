# Design System — Rules

Canonical source: **`src/app/globals.css`**. Token values, card classes, and easing curves are defined there — read them, never copy them into a document.

---

## Rules

- **Never introduce a new color, shadow, or easing value inline.** Compose from the existing utility classes and CSS custom properties in `globals.css`. If something genuinely new is needed, add it there first so it exists in one place.
- **The two themes are not decorative variants — they carry meaning.** The light surface is for operational work: forms, authentication, tables, dashboards. The dark surface is for intelligence and showcase: telemetry, valuations, live metrics, the landing page. Do not switch a surface to the other theme for visual variety; it changes what the screen is claiming to be.
- **Reuse the `luxury-*` card and hover classes** rather than rebuilding glass effects. They encode the backdrop blur, border treatment, and the shared easing curve that make the micro-interactions feel consistent.
- **Icons come from Lucide with explicit sizing.** Unsized icons inherit inconsistently and break alignment inside badges and buttons.
