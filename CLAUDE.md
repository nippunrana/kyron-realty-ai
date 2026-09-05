# AI Coding Guidelines

@docs/globalrule-v3.md

<!-- The guidelines above are IMPORTED, not copied. docs/globalrule-v3.md is the single
     source of truth for these rules and is shared with the project's other AI tools.
     Never paste its contents back into this file: a second copy is a second thing to
     keep true, and it will drift. This is the same rule the guidelines themselves state. -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI Coding Guidelines

## 0. Project Context First & Knowledge Hub
**Read the project's context file before doing anything else. Keep it true afterward.**

### On session start
- Look for `ai-context.md` in the project root; if not found, look for `AGENTS.md`.
- If either exists, read it fully before planning or editing — it holds project-specific context these global rules can't.
- If neither exists, tell the user the project is missing an `ai-context.md` file and offer to create one using the structure below.

### Structure (hub-and-spoke, under 150 lines)
The hub stays small enough to read every session; depth lives in spokes loaded only when needed.

1. **Overview & Tech Stack** — what the project is; framework, database, and tooling versions.
2. **Single Sources of Truth** — direct pointers to the canonical schema, auth, and config files.
3. **Built Systems vs Roadmap** — a status table (`Built` / `Roadmap`) pointing to `docs/built-systems/*.md` and code locations. Prevents rebuilding what already exists or assuming what doesn't.
4. **Environment & Deployment Constraints** — anything that silently breaks when ignored: base paths, subpath hosting, local-vs-production splits, proxy rules, build mode.
5. **Development & Deployment Guidelines** — migrations, secrets handling, CI/CD.

### What belongs in a doc — the two tests
**The code is the single source of truth. Documentation carries only what the code cannot say.**

Before writing any line into `ai-context.md` or `docs/built-systems/*.md`, apply both tests:

1. **Recoverability** — *could an agent recover this by reading the code in under a minute?* If yes, delete it and point at the file instead.
2. **Impact** — *would removing this line cause an agent to make a mistake?* If no, delete it.

A line must pass **both** to stay.

| ✅ Write this | ❌ Never write this |
| :--- | :--- |
| Prohibitions and non-negotiable policies | Table, column, endpoint, or route enumerations |
| Why a decision was made, and what breaks if reversed | Config values, model names, timeouts, version pins |
| Traps the code does not announce | Code snippets copied out of the repo |
| Which of several similar paths is canonical | File-by-file descriptions of the codebase |
| Environment quirks and local-vs-production splits | Anything an agent can grep in seconds |

**Prohibitions are the highest-value content.** Code shows what exists, never what is forbidden. An absent fallback looks like an unbuilt feature to the next agent, who will helpfully add it.

**Phrase rules as bans or decisions, not principles.** "**Never** call the browser Speech API" changes behaviour; "audio should be handled consistently" does not.

**Point at files or directories — never at line numbers.** `src/lib/agora-token.ts` survives edits; `src/lib/agora-token.ts:49` does not. A stale pointer fails loudly — the agent searches and recovers. A stale enumeration fails silently — the agent believes it.

### Maintenance protocol
**Applies only when `ai-context.md` already exists.** If the user declined to create one, skip this section entirely — never write documentation unprompted.

**The trigger is a decision, not a code change.** Update documentation when a rule, constraint, prohibition, or non-obvious decision is **established, changed, or reversed**. Building, editing, or refactoring code implies no documentation edit on its own.

When that trigger fires:

1. Record the rule in `docs/built-systems/<feature>.md` as a ban or a decision, with the reason it exists.
2. Add or remove a row in the **Built Systems vs Roadmap** table in `ai-context.md` only when a system is *born* or *retired* — not when it is edited.
3. Keep `ai-context.md` under 150 lines.

- **Never document what isn't built**: planned work is marked `Roadmap`, never described as if it exists.
- **Delete rather than guess**: if you cannot verify a documentation claim against the code in this session, delete the claim. A confident false statement is worse than a missing one.
- **Enforce what matters deterministically**: a rule the build can check belongs in CI as well as in prose. Documentation is advisory; a failing build is not.
- **Name what you touched**: list any documentation files you changed in your summary, so the user reviews them alongside the code.

---

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- **State assumptions explicitly**: If a request is ambiguous, state your interpretation before proceeding. If uncertain, ask—don't guess.
- **Present multiple interpretations**: If there's more than one way to achieve a goal, present them with tradeoffs — don't pick silently.
- **Push back when warranted**: If a simpler approach exists or if the requested approach is suboptimal/wrong, say so. Prioritize accuracy over agreement.
- **Stop when confused**: Name exactly what is unclear and ask for clarification immediately.

---

## 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- **No features beyond what was asked.**
- **No abstractions for single-use code**: Don't build "frameworks" or complex patterns for one-off tasks.
- **No speculative features**: Don't add "flexibility," "configurability," or features that weren't explicitly requested.
- **No error handling for impossible scenarios.**
- **The Senior Engineer Test**: If a senior engineer would call the code overcomplicated, simplify it. If 200 lines could be 50, rewrite it.
- **Prefer readability**: Use simple, readable code over clever one-liners or complex abstractions.

---

## 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- **No orthogonal edits**: Don't "improve" adjacent code, comments, or formatting unless specifically asked.
- **Don't refactor things that aren't broken.**
- **Rule of Least Surprise**: Match the existing code style and conventions exactly. Do not introduce new patterns inconsistently.
- **Mention, don't delete**: If you notice unrelated dead code, mention it — don't delete it.
- **Git Commits**: Do not include the AI assistant's name (e.g., 'Antigravity', 'Gemini', 'Claude') in git commit messages or contributors list.

When your changes create orphans:
- **Clean up your own mess**: Remove any imports, variables, or functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** Every changed line of code should trace directly to the user's request.

---

## 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals. When the project has test infrastructure, prefer test-first verification:
- "Add validation" → "Write tests for invalid inputs, then make them pass."
- "Fix the bug" → "Write a test that reproduces it, then make it pass."
- "Refactor X" → "Ensure tests pass before and after."

If the project has no test infrastructure, verify by running or exercising the code directly instead.

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]


- **Propose a brief plan first**: For non-trivial tasks, outline the steps and verification criteria before making edits.
- **Confirm the fix**: Always confirm that the change actually addresses the root cause of the problem. Don't assume it works.
- **Highlight side effects**: Explicitly call out any breaking changes, side effects, or risks before proceeding.

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. File Size & Modularity
**Keep new code under 600 lines per file. Isolate responsibilities.**

- When writing new files, never let them exceed 600 lines; if a new file approaches the limit, split it.
- Extract helper functions, data-access code, and distinct UI components into separate, single-responsibility modules.
- Wire modules back together with normal language-native imports (`require_once`, `import`, etc.).
- Don't split pre-existing files that already exceed 600 lines unless the user asks — mention that they're oversized instead (see Rule 3: Surgical Changes).

---

## After Every Fix or Edit
After completing a **bug fix**, always provide a brief **"Root Cause & Fix"** summary:

> **Root Cause:** [1–2 plain-English sentences on what was actually wrong]
> **Fix:** [1–2 plain-English sentences on what was changed and why it solves the problem]

For other changes (features, refactors, config), give a brief **"What changed & why"** line instead — a root cause doesn't apply when nothing was broken.

Keep it concise — no jargon, no lengthy explanations. Just the core insight.

---

## Final Self-Check (before ending any task)

Before considering a task done, verify:

- **Traceability**: Every changed line of code traces directly to the user's request. Documentation updates under Rule 0 are the only sanctioned exception.
- **No drive-by changes**: No unrelated refactoring, comments, or formatting were touched.
- **Questions asked first**: Ambiguity was clarified before implementing, not discovered after.
- **Documentation synced**: A doc was edited only because a rule or decision changed — not merely because code changed. Every line written passed both tests (recoverability, impact), and each file touched is named in the summary.
- **Senior Engineer Test**: The solution is the simplest one that solves the problem — nothing speculative was added.
