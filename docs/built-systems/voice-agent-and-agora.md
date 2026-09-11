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
- **Register every toolkit event handler, then join and publish RTC, and only then call `subscribeMessage()`.** The toolkit does not wrap join/publish (see its README), events emitted before a handler is registered are lost, and `subscribeMessage()` must follow the RTC join. The hook in `src/hooks/` follows this order; an earlier version of this rule had it backwards.
- **`voice_sessions.agora_session_id` holds the remote agent id returned by the Cloud Gateway**, written right after a successful join. `/api/agora/session/stop` refuses ids that do not match a row on the same channel. Rows opened before 2026-09-05 were never closed (see the SQL note in the audit) because the id was never stored.
- **Deduplicate transcript turns by turn id.** The transcript stream re-emits partial turns; without dedup, extraction fires repeatedly on the same utterance.
- **The buyer prompt states only database facts.** Missing values render as "Not specified" and the agent is told to offer a broker follow-up. The single exception is `src/lib/demo-listing.ts`, used only when the homepage demo slug is requested and no row has that slug; never add another non-database fallback.
- **Owner identity comes from the session, never from the request body.** `/api/agora/session/start` rejects `owner_onboarding` without a session and reads name/email/id from the session only. The client sends no identity fields, and any that arrive in the body are ignored. The same route assigns the channel name and caller UID itself; never read either from the body, or a caller can mint tokens for an arbitrary channel or impersonate a UID. Caller and agent UIDs must be dynamically generated unique numbers per session (never a hardcoded constant like 1001), because Agora RTM enforces single-login per `userId` globally across the App ID and kicks off active connections on duplicate login with `SAME_UID_LOGIN`.
- **A UI-triggered message must never interrupt a speaking agent.** Every `sendTextMessage` carries an Agora priority. The default, `interrupted`, tells the Cloud Gateway to *abandon the agent's current interaction and answer now* — correct only for a message the human caller just sent and is waiting on. Any cue the app emits because background work finished (a search returned, a record saved, a panel opened) must pass `append`, which makes the gateway hold it until the current interaction ends. Getting this wrong does not look like a priority bug; it looks like the agent randomly getting cut off mid-word, and it sends you hunting through VAD thresholds and the LLM layer instead.
- **Never queue these cues client-side off `isAgentSpeaking` instead.** It was tried and it cannot work: that flag is written by five uncoordinated event sources (speaking/listening/state-changed events, volume indicators, publish/unpublish) and reads `false` during the gateway's *thinking* phase — precisely the window where a background cue arrives. Only the gateway knows when a turn truly ends, so let it do the queueing. `AGENT_INTERRUPTED` is the signal that proves this is working: it fires on every mid-turn cut, so a clean run shows caller barge-ins and nothing else.
- **One trigger per agent tag.** A silent tag must be dispatched by exactly one code path. Re-scanning the same transcript for the same tag in a component — even with its own dedup set — fires the work again and produces a second spoken announcement, because the dedup keys never collide across paths.
- **Two personas exist and are not interchangeable**: an owner-onboarding persona in `src/lib/elena-prompt.ts` and a buyer-facing sales persona assembled in `src/lib/agora-agent-client.ts`, selected by caller type. Read those files for current names and prompts — do not copy persona text into a document.
