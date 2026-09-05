# Property Onboarding & Apify Ingestion — Rules

Canonical sources: `src/lib/apify-crawler.ts` (ingestion), `src/lib/kb-extractor.ts` (synthesis), `src/components/dashboard/onboarding/` (UI), `src/app/api/onboarding/`.

---

## Rules

- **Never fabricate property facts.** The knowledge-base synthesizer operates under a strict fact-vs-copy split: marketing copy may be written, but specs, lease terms, and policies may only be restated from crawled or spoken input. Inventing an unstated term is the worst failure mode in this system — it puts false claims into a sales agent's mouth.
- **Never block a live conversational turn on the LLM.** Turn-time extraction uses deterministic heuristics; full synthesis runs once after the call against the accumulated transcript. Moving synthesis into the turn loop breaks the real-time voice experience.
- **Never pre-fill the inspector pane with empty form fields.** Parameters are revealed only as they are genuinely detected. The design intent is that visible state always reflects real extracted data, so an owner can trust the checklist.
- **The deploy action stays locked until every required attribute is verified.** Do not add a bypass.
- **Apify runs in strict mode**: a missing token or a failed crawl throws immediately rather than returning partial data. Preserve that — see the fail-fast contract in [voice-agent-and-agora.md](voice-agent-and-agora.md).
