# Sales Agent & Floating Presence — Rules

Canonical sources: `src/components/sales/FloatingSalesAgent.tsx` (global voice pod & page awareness), `src/app/layout.tsx`, `src/lib/agora-agent-client.ts`, `src/app/api/agora/session/start/route.ts`.

---

## Rules & Decisions

- **Strict System Separation**: The sales agent module (`src/components/sales/`) must remain completely isolated from the property onboarding studio (`src/components/dashboard/onboarding/` / Elena Vance). Changes, prompts, and brain logic for sales must never alter or create dependencies inside the onboarding system.
- **Standby on Property Onboarding Studio**: When navigating to `/dashboard/properties/new`, the sales agent must automatically enter standby mode to prevent audio crossover, visual overlap, or interference with Elena Vance's active WebRTC session.
- **Dynamic Route-Based Page Awareness**: The floating sales agent must consume Next.js router state (`usePathname()`) to dynamically adapt contextual titles and suggested inquiries without requiring parent page component prop drilling.
- **Microphone Permission Pre-Flight**: Microphone access must be checked via `navigator.mediaDevices.getUserMedia` before `/api/agora/session/start` is dispatched. If permission is denied, the start request is blocked client-side so zero ungrounded or billed Agora sessions are created.
- **Minutes Protection & Instant Teardown**: To prevent runaway Agora Cloud Gateway session minute charges, an active call must immediately terminate (`endCall()` / `/api/agora/session/stop`) when the user clicks Disconnect or closes the pod.
- **Dedicated `sales_agent` Caller Type & "Hi!" Greeting**: The sales agent connects using `callerType: "sales_agent"`, greeting with `"Hi!"` over Agora SD-RTN and powered by Gemini 3.5 Flash Lite (`gemini-3.5-flash-lite`).
