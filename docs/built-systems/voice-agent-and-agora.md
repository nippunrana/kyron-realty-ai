# Voice Agent & Agora — Rules

Canonical sources: `src/lib/agora-agent-client.ts` (orchestration), `src/lib/agora-token.ts` (tokens), `src/hooks/` (client hook), `src/app/api/agora/` (routes).

---

## The hard prohibition

**All conversational voice runs strictly on Agora SD-RTN WebRTC + Agora Signaling (RTM), via the Agora Conversational AI Cloud Gateway. There are no fallbacks of any kind.**

Strictly prohibited — these are banned even as a temporary measure, a demo shim, or an offline convenience:

- **Never** use browser `speechSynthesis` or `webkitSpeechRecognition`.
- **Never** generate assistant replies client-side.
- **Never** return a fake success from the backend when the gateway fails.

> This ban is enforced by CI: the **Enforce Agora-only policy** step in `.github/workflows/deploy.yml` fails the build if browser speech APIs appear under `src/`. Do not work around the check — if the ban genuinely needs to change, change it here and in CI deliberately.

Approved cloud components are Agora-managed services (managed TTS, cloud ASR) and the configured cloud LLMs. The restriction is on *browser-local* speech, not on cloud vendors.

## Fail-fast contract

**Never mask a connection failure.** If the Cloud Gateway or the RTC/RTM connection fails, the system must fail loudly: mark the database session `failed` and surface the error to the user immediately. A silent degradation here is worse than an outage, because it looks like the product working.

## Rules

- **The agent identity needs a dual RTC+RTM token**, not a plain RTC token — the Cloud Gateway rejects the agent otherwise once RTM is enabled. Caller and agent use distinct reserved UIDs; see `src/lib/agora-token.ts`.
- **Subscribe to the RTM channel before joining RTC.** Reversing the order drops the opening transcripts.
- **Deduplicate transcript turns by turn id.** The transcript stream re-emits partial turns; without dedup, extraction fires repeatedly on the same utterance.
- **Owner identity comes from the session, never from the request body.** `/api/agora/session/start` rejects `owner_onboarding` without a session and prefers the signed-in name/email/id over any client-supplied values. The client still sends them for now; treat those body fields as redundant, not authoritative.
- **Two personas exist and are not interchangeable**: an owner-onboarding persona and a buyer-facing sales persona, selected by caller type in `src/lib/agora-agent-client.ts`. Read the file for current names and prompts — do not copy persona text into a document.
