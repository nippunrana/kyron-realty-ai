# Property Onboarding & Apify Ingestion — Rules

Canonical sources: `src/lib/apify-crawler.ts` (ingestion), `src/lib/kb-extractor.ts` (synthesis), `src/components/dashboard/onboarding/` (UI), `src/app/api/onboarding/`.

---

## Rules

- **Never fabricate property facts.** The knowledge-base synthesizer operates under a strict fact-vs-copy split: marketing copy may be written, but specs, lease terms, and policies may only be restated from crawled or spoken input. Inventing an unstated term is the worst failure mode in this system — it puts false claims into a sales agent's mouth.
- **Never block Agora WebRTC voice turns on LLM extraction.** Turn-level extraction runs asynchronously out-of-band on dual-signal `AGENT_SPEAKING_CHANGED` (`isSpeaking: false`) and 800ms transcript-settling boundaries using Gemini 3.5 Flash-Lite with single-flight latest-wins concurrency. The WebRTC voice audio stream flows continuously with zero interruption or audio latency. Continuous listening stays active throughout the call to capture verbal corrections.
- **Never feed the extractor user-only transcripts.** Always include labeled assistant turns (`[ELENA VANCE]` and `[OWNER]`) so the model can repair ASR speech-to-text phonetic slips from question and confirmation context — and never let assistant text be treated as owner facts.
- **Never let end-of-call synthesis clobber live verified attributes.** Live verified specs on screen are immutable ground truth; post-call synthesis enriches descriptions, sales pitches, FAQs, and negotiation rules, but must never overwrite verified specs with empty or ungrounded values.
- **Never pre-fill the inspector pane with empty form fields.** Parameters are revealed only as they are genuinely detected. The design intent is that visible state always reflects real extracted data, so an owner can trust the checklist.
- **The deploy action stays locked until every required attribute is verified.** Do not add a bypass.
- **Never trigger the Review Specs modal via automatic 6/6 thresholding or synthetic RTM text injection.** Modal presentation is strictly conversational or user-driven (via Elena's verbal completion cue `COMPLETION FLOW`, explicit owner voice commands like "pull up / show the review card", or manual UI clicks). Programmatic popups at 6/6 cut off ongoing agent speech mid-sentence, and injecting synthetic RTM user messages mid-call causes Agora's cloud conversational gateway to abort active speech playback.
- **Apify runs in strict mode**: a missing token or a failed crawl throws immediately rather than returning partial data. Preserve that — see the fail-fast contract in [voice-agent-and-agora.md](voice-agent-and-agora.md).
- **Owner identity is pre-authenticated**: Elena Vance must always address the owner by their account first name (using strict fallback `"Hello there!"` if the display name is blank) and weave in a confirmation of their account email for public listing inquiries, rather than treating the owner as an anonymous caller.
- **Two-tier onboarding flow**: Elena Vance verifies the 6 core specifications first and opens the Core Specs review card. Additional property specs (parking, utilities, HOA, availability) are gathered only after the owner confirms the core specs.
- **Never ask home sellers for a universal pet policy**: Pet policies are strictly rental-specific; asking a seller for a pet policy on a single-family home violates natural real estate conventions. On sales, pet bylaws are scoped strictly to condo/co-op HOA inquiries.
