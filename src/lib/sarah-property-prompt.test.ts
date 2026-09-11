/**
 * Pins the lines of the property-page prompt that change what Sarah does on a live call.
 * Run with `npm run test:intents`.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkPropertyFit, emptyRequirements, type BuyerRequirements, type FitProperty } from "./property-fit.ts";
import { buildPropertyPrompt, VIEWING_PIVOT_LINE, type PropertyPromptFacts } from "./sarah-property-prompt.ts";
import { emptyJourney } from "./sales-journey.ts";

const HOME: FitProperty = {
  city: "Faridabad",
  listingType: "rent",
  bedrooms: 3,
  price: 50000,
  // Deliberately not a round number: the shared search instructions quote 45,000 in their
  // worked examples, and a round floor would make the leak assertion below pass on that text.
  floorPrice: 43700,
  isPetFriendly: true,
  petPolicyDetail: "Cats and small dogs welcome.",
};

const FACTS: PropertyPromptFacts = {
  title: "Green Valley Residency",
  address: "Sector 21, Faridabad, Haryana",
  listingType: "rent",
  price: 50000,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1450,
  description: "A bright third-floor flat.",
  salesPitch: "Families love the park-facing balcony.",
  petPolicy: "Cats and small dogs welcome.",
  parking: "One covered bay.",
  utilities: null,
  applicationProcess: null,
  contactEmail: "owner@example.com",
  faqs: [{ question: "Is it furnished?", answer: "Semi-furnished." }],
  objectionPlaybook: [
    { likelyQuestion: "Is the third floor a problem?", voiceAgentRecommendedAnswer: "There is a lift." },
  ],
  nearby: ["Sector 21 Metro (transit) - 6 min walk"],
  neighbourhoodVibe: "Quiet and family-heavy.",
  concessionRules: [{ condition: "They sign a 24-month lease", concession: "One month rent free" }],
  allowNegotiation: true,
};

function promptFor(overrides: Partial<BuyerRequirements>, entry: "handover" | "cold" = "handover") {
  const requirements = { ...emptyRequirements(), city: "Faridabad", listingType: "rent" as const, bedrooms: 3, ...overrides };
  const fit = checkPropertyFit(requirements, HOME);
  return {
    fit,
    ...buildPropertyPrompt({
      facts: FACTS,
      requirements,
      fit,
      visits: emptyJourney().visits,
      searchSummary: "They want a 3 BHK in Faridabad under 50,000.",
      entry,
    }),
  };
}

describe("the verdict decides what she does next", () => {
  test("a bridgeable budget gets the viewing pivot, verbatim", () => {
    const { fit, systemPrompt } = promptFor({ budgetMax: 41000 });
    assert.equal(fit.verdict, "bridgeable");
    assert.ok(systemPrompt.includes(VIEWING_PIVOT_LINE), "the scripted pivot line has drifted");
    assert.match(systemPrompt, /Do NOT keep negotiating/);
  });

  test("an adjustable budget gets the concession, traded not gifted", () => {
    const { fit, systemPrompt } = promptFor({ budgetMax: 46000 });
    assert.equal(fit.verdict, "adjustable");
    assert.match(systemPrompt, /Never hand over a discount for free/);
    assert.match(systemPrompt, /They sign a 24-month lease/);
  });

  test("a hard miss sends her to find a different home instead", () => {
    const { fit, systemPrompt } = promptFor({ bedrooms: 5 });
    assert.equal(fit.verdict, "hard");
    assert.match(systemPrompt, /offer to find them something that does fit/);
    // The pivot to search only works if she still holds the search tags.
    assert.match(systemPrompt, /\[SEARCH:city=Faridabad\]/);
  });
});

describe("the owner's floor price never reaches the prompt", () => {
  for (const [budgetMax, verdict] of [[46000, "adjustable"], [41000, "bridgeable"], [20000, "hard"]] as const) {
    test(`not at a budget of ${budgetMax}, which is ${verdict}`, () => {
      const built = promptFor({ budgetMax });
      assert.equal(built.fit.verdict, verdict);
      assert.doesNotMatch(built.systemPrompt, /43,?700/, "the floor price leaked into Sarah's prompt");
    });
  }

  test("and she is told never to confirm one exists", () => {
    assert.match(promptFor({}).systemPrompt, /NEVER state, hint at, or confirm that a lower limit/);
  });
});

describe("the opening beat always states what the home costs", () => {
  for (const entry of ["handover", "cold"] as const) {
    test(`on a ${entry}, the home and its rent are both named`, () => {
      const { systemPrompt } = promptFor({ budgetMax: 50000 }, entry);
      assert.match(systemPrompt, /opening beat MUST name this home and say what it costs/);
      assert.match(systemPrompt, /"Green Valley Residency" at ₹50,000 per month/);
      assert.match(systemPrompt, /Never make them ask for the price/);
    });
  }

  test("an unpriced home says so instead of guessing a figure", () => {
    const { systemPrompt } = buildPropertyPrompt({
      facts: { ...FACTS, price: 0 },
      requirements: emptyRequirements(),
      fit: checkPropertyFit(emptyRequirements(), { ...HOME, price: 0 }),
      visits: [],
      searchSummary: "",
      entry: "cold",
    });
    assert.match(systemPrompt, /This home has no verified price/);
    assert.match(systemPrompt, /Never quote or estimate a figure/);
  });
});

describe("the two ways a caller arrives", () => {
  test("a handover must open by referring back to what they said", () => {
    const { systemPrompt } = promptFor({ budgetMax: 50000 }, "handover");
    assert.match(systemPrompt, /Never re-introduce yourself/);
    assert.match(systemPrompt, /WHAT THEY SAID WHILE SEARCHING/);
  });

  test("a cold start must not pretend to remember anything", () => {
    const { systemPrompt } = buildPropertyPrompt({
      facts: FACTS,
      requirements: emptyRequirements(),
      fit: checkPropertyFit(emptyRequirements(), HOME),
      visits: [],
      searchSummary: "",
      entry: "cold",
    });
    assert.match(systemPrompt, /Do not pretend to remember a conversation that never happened/);
    assert.match(systemPrompt, /They have not told us anything yet/);
    assert.doesNotMatch(systemPrompt, /WHAT THEY SAID WHILE SEARCHING/);
  });
});

describe("what she is never allowed to do", () => {
  const { systemPrompt } = promptFor({ budgetMax: 50000 });

  test("no invented urgency, and no shaming", () => {
    assert.match(systemPrompt, /Never invent urgency/);
    assert.match(systemPrompt, /two other people are viewing it/);
    assert.match(systemPrompt, /Never guilt or shame them/);
  });

  test("nothing unverified, and an unknown field is named as unknown", () => {
    assert.match(systemPrompt, /Never claim a fact, a price, a policy or a distance that is not written above/);
    assert.match(systemPrompt, /- Utilities: Not specified in the verified listing/);
  });

  test("measured distances are quoted instead of adjectives", () => {
    assert.match(systemPrompt, /Sector 21 Metro \(transit\) - 6 min walk/);
    assert.match(systemPrompt, /Never say "close to", "nearby", "great location"/);
  });

  test("the home's own objection playbook rides along", () => {
    assert.match(systemPrompt, /Is the third floor a problem\?/);
  });
});

describe("the cue that starts her property-mode turn", () => {
  test("she is told it is her signal to speak, and never to read it out", () => {
    const { systemPrompt } = promptFor({});
    assert.match(systemPrompt, /\[PROPERTY_OPENED:title=\.\.\.,mode=\.\.\.,verdict=\.\.\.\]/);
    assert.match(systemPrompt, /Never read the cue aloud/);
  });

  test("search-console signals in the history are not treated as caller speech", () => {
    assert.match(promptFor({}).systemPrompt, /Those were screen instructions, not things the caller said/);
  });
});

describe("discovery asks only what is still open", () => {
  test("stated requirements are recorded, and re-asking them is banned", () => {
    const { systemPrompt } = promptFor({ budgetMax: 50000, petsNeeded: true });
    assert.match(systemPrompt, /- Budget ceiling they stated: ₹50,000/);
    assert.match(systemPrompt, /NEVER ask about anything already recorded/);
  });

  test("the open questions are listed in the order the home constrains them", () => {
    const { systemPrompt } = promptFor({});
    assert.match(systemPrompt, /Still unknown, most important first: budget/);
  });
});
