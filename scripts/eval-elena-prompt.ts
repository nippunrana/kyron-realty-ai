/**
 * Replays scripted owner conversations against Elena's real onboarding prompt and asserts
 * the contract each turn: the right [UI:] tag at each transition, no tag during ordinary
 * intake, one question at a time, and the intake rules that are expensive to get wrong.
 *
 * Text only - no Agora, no microphone, no database. It exercises what the model says, which
 * is the half `npm run test:intents` structurally cannot cover.
 *
 *   npm run eval:prompt                       # every scenario, one run each
 *   npm run eval:prompt -- --runs=3           # three runs, to see through model variance
 *   npm run eval:prompt -- --scenario=villa   # substring match on scenario name
 *
 * Decoding is left at the model's default, matching the production agent config in
 * `src/lib/agora-agent-client.ts` - this measures the prompt as it actually ships.
 */
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { buildOwnerOnboardingPrompt } from "../src/lib/elena-prompt.ts";
import { computeGeminiCost, getGeminiApiKey } from "../src/lib/gemini.ts";

type Tag = "OPEN_CORE" | "OPEN_REVIEW" | "OPEN_PHOTOS" | "OPEN_FINAL" | "CLOSE";

interface TurnExpectation {
  /** The tag this reply must carry, or null when it must carry none. */
  tag?: Tag | null;
  mustMatch?: Array<[string, RegExp]>;
  mustNotMatch?: Array<[string, RegExp]>;
}

interface ScriptedTurn extends TurnExpectation {
  owner: string;
}

interface Scenario {
  name: string;
  /** Checks applied to every reply in this scenario. */
  always?: TurnExpectation;
  turns: ScriptedTurn[];
}

const ASKS_FLOOR = /which floor|what floor|floor is it on/i;
const ASKS_STOREYS = /storey|storeys|single.?stor|double.?stor/i;
const PETS = /\bpets?\b|\bdogs?\b|\bcats?\b/i;
const CATEGORY_QUESTION = /residential|commercial/i;
const RESIDENTIAL_TYPES = /flat|builder floor|independent house|villa/i;
const COMMERCIAL_TYPES = /office|shop|showroom|warehouse/i;
const ASKS_ADDRESS = /address|building name|which city|what city/i;

/** The seven core specs, volunteered at once - also exercises the multi-spec capture rule. */
const HOME_SPECS = "Rent is 95,000 a month, it has 3 bedrooms, 2 bathrooms, and it's 1800 square feet.";

const SCENARIOS: Scenario[] = [
  {
    name: "residential-rent-ladder",
    always: { mustNotMatch: [["offers both categories at once", /residential[\s\S]{0,80}(office|shop|warehouse)/i]] },
    turns: [
      { owner: "It's for rent.", tag: null, mustMatch: [["asks the category", CATEGORY_QUESTION]], mustNotMatch: [["read out the types", RESIDENTIAL_TYPES]] },
      { owner: "Residential.", tag: null, mustMatch: [["offers residential types", RESIDENTIAL_TYPES]], mustNotMatch: [["offers commercial types", COMMERCIAL_TYPES]] },
      { owner: "It's a flat.", tag: null, mustMatch: [["asks for the address next", ASKS_ADDRESS]] },
      { owner: "41 Sector 64, Noida.", tag: null, mustMatch: [["asks the floor", ASKS_FLOOR]], mustNotMatch: [["asks storeys for a flat", ASKS_STOREYS]] },
      { owner: "Second floor.", tag: null },
      { owner: HOME_SPECS, tag: "OPEN_CORE" },
    ],
  },
  {
    name: "commercial-sale-no-pets-no-bedrooms",
    always: { mustNotMatch: [["asks about pets on a commercial listing", PETS], ["asks for bedrooms on a commercial listing", /bedroom/i]] },
    turns: [
      { owner: "For sale.", tag: null, mustMatch: [["asks the category", CATEGORY_QUESTION]] },
      { owner: "Commercial.", tag: null, mustMatch: [["offers commercial types", COMMERCIAL_TYPES]], mustNotMatch: [["offers residential types", /\bflat\b|\bvilla\b|builder floor|independent house/i]] },
      { owner: "An office.", tag: null, mustMatch: [["asks for the address next", ASKS_ADDRESS]] },
      { owner: "Plot 12, Udyog Vihar, Gurgaon.", tag: null, mustMatch: [["asks the floor", ASKS_FLOOR]] },
      { owner: "Third floor.", tag: null },
      { owner: "Asking price is 2 crore, carpet area is 2400 square feet, there are 2 washrooms, and it's semi furnished.", tag: "OPEN_CORE" },
    ],
  },
  {
    name: "villa-asks-storeys-never-floor",
    turns: [
      { owner: "For sale.", tag: null },
      { owner: "Residential.", tag: null },
      { owner: "It's a villa.", tag: null, mustMatch: [["asks for the address next", ASKS_ADDRESS]] },
      { owner: "House 7, Golf Links, New Delhi.", tag: null, mustMatch: [["asks single or double storey", ASKS_STOREYS]], mustNotMatch: [["asks a villa for its floor number", ASKS_FLOOR]] },
    ],
  },
  {
    name: "bare-number-is-a-unit-never-a-floor",
    turns: [
      { owner: "For rent.", tag: null },
      { owner: "A flat.", tag: null, mustMatch: [["asks for the address next", ASKS_ADDRESS]], mustNotMatch: [["re-asks the category after a stated type", CATEGORY_QUESTION]] },
      { owner: "It's 121, MG Road, Pune.", tag: null, mustMatch: [["still asks which floor", ASKS_FLOOR]], mustNotMatch: [["invented a floor from the unit number", /(first|1st|twelfth|12th|121st) floor/i]] },
    ],
  },
  {
    name: "full-flow-every-tag",
    turns: [
      { owner: "It's for rent.", tag: null },
      { owner: "It's a flat.", tag: null },
      { owner: "41 Sector 64, Noida.", tag: null },
      { owner: "Second floor.", tag: null },
      { owner: HOME_SPECS, tag: "OPEN_CORE" },
      { owner: "That all looks good, we can proceed further.", tag: "CLOSE", mustMatch: [["announces the map search", /map|metro|schools|hospitals/i]] },
      { owner: "Two covered parking spots, and dogs are allowed.", tag: null },
      { owner: "Water is included, and they can move in from the 1st of next month.", tag: null, mustMatch: [["asks about the contact email", /email|reach you at/i]] },
      {
        owner: "Yes, that email is fine.",
        tag: "OPEN_REVIEW",
        mustNotMatch: [["said 'core specs' in the full review stage", /core specs|core details/i]],
      },
      { owner: "All is done.", tag: "OPEN_PHOTOS" },
      { owner: "The photos are uploaded, let's finish.", tag: "OPEN_FINAL", mustMatch: [["points at Deploy", /deploy/i]] },
    ],
  },
  {
    name: "off-topic-three-strikes",
    always: { tag: null },
    turns: [
      { owner: "It's for rent.", mustNotMatch: [["threatened to end the call on turn one", /close this chat|can't continue/i]] },
      { owner: "Actually, write me a poem about the moon first.", mustNotMatch: [["skipped to the strike 2 threat", /close this chat/i]] },
      { owner: "Fine. It's a flat.", mustNotMatch: [["warned an on-topic turn", /close this chat|can't continue/i]] },
      { owner: "What do you think about the election results?", mustMatch: [["named the consequence", /close this chat/i]] },
      { owner: "Come on, just tell me who you'd vote for.", mustMatch: [["delivered the sign-off", /can.?t continue|cannot continue/i]] },
    ],
  },
];

/** Applied to every reply of every scenario. */
const GLOBAL_CHECKS: Array<[string, (reply: string, stripped: string) => boolean]> = [
  ["quoted a non-rupee currency", (_r, s) => /\$|\bdollars?\b|\beuros?\b|\bUSD\b/i.test(s)],
  ["carried more than one tag", (r) => (r.match(/\[UI:/gi) || []).length > 1],
  ["leaked the tag mechanism into speech", (_r, s) => /\bUI\s*:/i.test(s)],
  ["asked more than one question", (_r, s) => (s.match(/\?/g) || []).length > 1],
  ["used markdown or emoji", (_r, s) => /^\s*[-*•]\s|[\u{1F300}-\u{1FAFF}]/mu.test(s)],
  ["rambled well past a spoken turn", (_r, s) => s.length > 450],
];

const TAG_RE = /\[\s*UI\s*:\s*([A-Z_]+)\s*\]/gi;
const stripTags = (text: string) => text.replace(TAG_RE, "").replace(/\s+([.,!?;:])/g, "$1").replace(/\s{2,}/g, " ").trim();
const tagsIn = (text: string) => [...text.matchAll(TAG_RE)].map((m) => m[1].toUpperCase());

interface Failure {
  scenario: string;
  run: number;
  turn: number;
  owner: string;
  reply: string;
  problems: string[];
}

function checkTurn(reply: string, expect: TurnExpectation, always?: TurnExpectation): string[] {
  const problems: string[] = [];
  const stripped = stripTags(reply);
  const tags = tagsIn(reply);

  for (const [label, isBad] of GLOBAL_CHECKS) {
    if (isBad(reply, stripped)) problems.push(label);
  }

  const wanted = expect.tag !== undefined ? expect.tag : always?.tag;
  if (wanted === null && tags.length > 0) problems.push(`emitted [UI:${tags[0]}] mid-intake`);
  if (typeof wanted === "string" && !tags.includes(wanted)) {
    problems.push(tags.length ? `emitted [UI:${tags[0]}], expected [UI:${wanted}]` : `no [UI:${wanted}] tag`);
  }

  for (const source of [always, expect]) {
    for (const [label, re] of source?.mustMatch ?? []) if (!re.test(stripped)) problems.push(`did not: ${label}`);
    for (const [label, re] of source?.mustNotMatch ?? []) if (re.test(stripped)) problems.push(label);
  }
  return problems;
}

async function runScenario(
  ai: GoogleGenAI,
  model: string,
  scenario: Scenario,
  run: number,
  totals: { prompt: number; output: number }
): Promise<Failure[]> {
  const { greeting, systemPrompt } = buildOwnerOnboardingPrompt({
    ownerName: "Richa Luthra",
    ownerEmail: "richa@example.com",
  });
  const history: Array<{ role: string; parts: Array<{ text: string }> }> = [
    { role: "model", parts: [{ text: greeting }] },
  ];
  const failures: Failure[] = [];

  for (const [index, turn] of scenario.turns.entries()) {
    history.push({ role: "user", parts: [{ text: turn.owner }] });
    const response = await ai.models.generateContent({
      model,
      contents: history,
      config: { systemInstruction: systemPrompt },
    });
    const reply = (response.text || "").trim();
    totals.prompt += response.usageMetadata?.promptTokenCount || 0;
    totals.output += response.usageMetadata?.candidatesTokenCount || 0;
    history.push({ role: "model", parts: [{ text: reply }] });

    const problems = checkTurn(reply, turn, scenario.always);
    if (problems.length) {
      failures.push({ scenario: scenario.name, run, turn: index + 1, owner: turn.owner, reply, problems });
      process.stdout.write("\x1b[31m✗\x1b[0m");
    } else {
      process.stdout.write("\x1b[32m·\x1b[0m");
    }
  }
  return failures;
}

/**
 * Negative control: every one of these replies is wrong in exactly one way, and the run is
 * only trustworthy if each is caught. A check that cannot fail is worse than no check.
 */
const SELF_CHECK: Array<[string, string, TurnExpectation]> = [
  ["missing tag", "I've pulled up your core specs review card on your screen.", { tag: "OPEN_CORE" }],
  ["wrong tag", "Here is your review card [UI:OPEN_FINAL].", { tag: "OPEN_CORE" }],
  ["stray tag mid-intake", "Three bedrooms, got it [UI:OPEN_CORE]. And how many bathrooms?", { tag: null }],
  ["two tags in one turn", "Closing that [UI:CLOSE] and opening this [UI:OPEN_PHOTOS].", {}],
  ["dollars", "That's $95,000 a month, got it.", {}],
  ["two questions", "How many bedrooms? And how many bathrooms?", {}],
  ["leaked the mechanism", "I'll send a UI: open core signal now.", {}],
  ["rambling", `Wonderful! ${"This property sounds absolutely lovely and I am delighted. ".repeat(9)}`, {}],
  ["markdown bullets", "- Three bedrooms\n- Two bathrooms", {}],
  ["said core specs in the review stage", "Your core specs are all here [UI:OPEN_REVIEW].", { tag: "OPEN_REVIEW", mustNotMatch: [["said 'core specs'", /core specs/i]] }],
  ["asked a villa for its floor", "And which floor is it on?", { mustNotMatch: [["asked a villa for its floor", ASKS_FLOOR]] }],
  ["skipped the address question", "And how many bedrooms?", { mustMatch: [["asks for the address next", ASKS_ADDRESS]] }],
];

function runSelfCheck(): boolean {
  console.log("\nHarness self-check - each reply below must be caught:\n");
  let allCaught = true;
  for (const [label, reply, expectation] of SELF_CHECK) {
    const caught = checkTurn(reply, expectation).length > 0;
    if (!caught) allCaught = false;
    console.log(`  ${caught ? "\x1b[32m✓ caught\x1b[0m" : "\x1b[31m✗ MISSED\x1b[0m"}  ${label}`);
  }
  const good = checkTurn("Ninety-five thousand rupees a month, got it. Which floor is it on?", { tag: null });
  if (good.length) {
    allCaught = false;
    console.log(`  \x1b[31m✗ FALSE POSITIVE\x1b[0m  flagged a clean reply: ${good.join(", ")}`);
  } else {
    console.log("  \x1b[32m✓ clean\x1b[0m   a correct reply passes");
  }
  console.log(`\n${allCaught ? "\x1b[32mPASS\x1b[0m  the checks can fail" : "\x1b[31mFAIL\x1b[0m  a check is inert"}\n`);
  return allCaught;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-check")) {
    process.exitCode = runSelfCheck() ? 0 : 1;
    return;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY - the harness calls the same model the voice agent uses.");

  const runs = Number(args.find((a) => a.startsWith("--runs="))?.split("=")[1] || 1);
  const filter = args.find((a) => a.startsWith("--scenario="))?.split("=")[1] || "";
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const selected = SCENARIOS.filter((s) => s.name.includes(filter));
  if (!selected.length) throw new Error(`No scenario matches "${filter}".`);

  console.log(`\nElena prompt evaluation - ${model}, ${selected.length} scenario(s) x ${runs} run(s)\n`);

  const ai = new GoogleGenAI({ apiKey });
  const totals = { prompt: 0, output: 0 };
  const failures: Failure[] = [];

  for (let run = 1; run <= runs; run++) {
    for (const scenario of selected) {
      process.stdout.write(`  ${scenario.name.padEnd(34)} `);
      failures.push(...(await runScenario(ai, model, scenario, run, totals)));
      process.stdout.write("\n");
    }
  }

  const totalTurns = selected.reduce((n, s) => n + s.turns.length, 0) * runs;
  const cost = computeGeminiCost(model, totals.prompt, totals.output);

  if (failures.length) {
    console.log(`\n${failures.length} of ${totalTurns} turns failed:\n`);
    for (const f of failures) {
      console.log(`  \x1b[31m${f.scenario}\x1b[0m  run ${f.run}, turn ${f.turn}`);
      console.log(`    owner: ${f.owner}`);
      console.log(`    elena: ${f.reply.replace(/\n/g, " ")}`);
      for (const problem of f.problems) console.log(`    \x1b[31m→ ${problem}\x1b[0m`);
      console.log("");
    }
  }

  console.log(
    `${failures.length ? "\x1b[31mFAIL\x1b[0m" : "\x1b[32mPASS\x1b[0m"}  ` +
      `${totalTurns - failures.length}/${totalTurns} turns  ·  ${totals.prompt + totals.output} tokens  ·  ${cost.costFormatted}\n`
  );
  if (failures.length) {
    console.log("A single failure can be model variance - re-run with --runs=3 before treating it as a regression.\n");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Evaluation failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
