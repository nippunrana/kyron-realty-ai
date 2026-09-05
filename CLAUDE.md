# AI Coding Guidelines

<!-- The guidelines above are IMPORTED, not copied. docs/globalrule-v3.md is the single
     source of truth for these rules and is shared with the project's other AI tools.
     Never paste its contents back into this file: a second copy is a second thing to
     keep true, and it will drift. This is the same rule the guidelines themselves state. -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
