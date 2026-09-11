# Sales Agent & Floating Presence — Rules

Canonical sources: `src/components/sales/FloatingSalesAgent.tsx` (global voice pod & page awareness), `src/app/layout.tsx`, `src/lib/agora-agent-client.ts`, `src/app/api/agora/session/start/route.ts`.

---

## Rules & Decisions

- **Strict System Separation**: The sales agent module (`src/components/sales/`) must remain completely isolated from the property onboarding studio (`src/components/dashboard/onboarding/` / Elena Vance). Changes, prompts, and brain logic for sales must never alter or create dependencies inside the onboarding system.
- **Cross-Page Voice Call Persistence**: Because `FloatingSalesAgent` is mounted at root layout level (`src/app/layout.tsx`), Agora WebRTC voice sessions remain active and uninterrupted during client-side navigation between public pages (e.g. Home, Listings, Listing Details).
- **Dashboard Exclusion & Unmount**: Sarah is strictly forbidden inside the Owner Dashboard. When navigating to `/dashboard` or any subpage, Sarah is completely unmounted (`return null`), and any active voice session is terminated immediately.
- **Dashboard Navigation Interception**: If a user attempts to navigate to `/dashboard` or its subpages while an Agora voice call is active, navigation is intercepted to display a confirmation prompt:
  - `[Disconnect & Go to Dashboard]`: Disconnects the call (`endCall()`) to stop Agora billing and proceeds to the dashboard.
  - `[Stay Here]`: Cancels navigation and keeps the call active.
- **Call Close & Disconnect Confirmation**: Clicking "Disconnect" or the "X" close button during an active call must prompt: `"Are you sure you want to close this call?"` with `[Yes, End Call]` and `[Keep Talking]`, preventing accidental termination.
- **Microphone Permission Pre-Flight**: Microphone access must be checked via `navigator.mediaDevices.getUserMedia` before `/api/agora/session/start` is dispatched. If permission is denied, the start request is blocked client-side so zero ungrounded or billed Agora sessions are created.
- **Dedicated `sales_agent` Caller Type & "Hi!" Greeting**: The sales agent connects using `callerType: "sales_agent"`, greeting with `"Hi!"` over Agora SD-RTN and powered by Gemini 3.5 Flash Lite (`gemini-3.5-flash-lite`).
