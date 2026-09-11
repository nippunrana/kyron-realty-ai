# Sales Agent & Floating Presence — Rules

Canonical sources: `src/components/sales/FloatingSalesAgent.tsx` (global presence & page awareness), `src/app/layout.tsx`.

---

## Rules & Decisions

- **Strict System Separation**: The sales agent module (`src/components/sales/`) must remain completely isolated from the property onboarding studio (`src/components/dashboard/onboarding/` / Elena Vance). Changes, prompts, and brain logic for sales must never alter or create dependencies inside the onboarding system.
- **Standby on Property Onboarding Studio**: When navigating to `/dashboard/properties/new`, the sales agent must automatically enter standby mode to prevent audio crossover, visual overlap, or interference with Elena Vance's active WebRTC session.
- **Dynamic Route-Based Page Awareness**: The floating sales agent must consume Next.js router state (`usePathname()`) to dynamically adapt contextual titles and suggested inquiries without requiring parent page component prop drilling.
