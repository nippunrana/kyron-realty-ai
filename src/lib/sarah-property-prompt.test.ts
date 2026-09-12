/**
 * Pins the lines of the property-page prompt that change what Sarah does on a live call.
 * Run with `npm run test:intents`.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkPropertyFit, emptyRequirements, type BuyerRequirements, type FitProperty } from "./property-fit.ts";
import { buildPropertyPrompt, buildObserverPrompt, VIEWING_PIVOT_LINE, type PropertyPromptFacts } from "./sarah-property-prompt.ts";
import { emptyJourney } from "./sales-journey.ts";
import { buildSalesSearchPrompt } from "./sarah-search-prompt.ts";
import { summariseLocationValue, emptyLocationValue, type LocationInput } from "./location-value.ts";

/** A metro, two schools and a hospital, all measured and all close: clears the density gate. */
const DENSE: LocationInput = {
  measured: [
    { name: "Sector 21 Metro", category: "transit", walkSeconds: 360 },
    { name: "DPS Faridabad", category: "school", walkSeconds: 540 },
    { name: "Modern School", category: "school", walkSeconds: 720 },
    { name: "Asian Hospital", category: "hospital", driveSeconds: 420 },
  ],
  named: { transit: [], school: [], hospital: [] },
};

/** One measured school and nothing else - real numbers, but no claim about the area. */
const THIN: LocationInput = {
  measured: [{ name: "Modern School", category: "school", walkSeconds: 540 }],
  named: { transit: [], school: [], hospital: [] },
};

/** Enriched before distances were ever measured: names only. */
const NAMED_ONLY: LocationInput = {
  measured: [],
  named: { transit: ["Sector 21 Metro"], school: ["DPS Faridabad", "Modern School"], hospital: ["Asian Hospital"] },
};

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

function promptFor(
  overrides: Partial<BuyerRequirements>,
  entry: "handover" | "cold" = "handover",
  location: LocationInput = DENSE
) {
  const requirements = { ...emptyRequirements(), city: "Faridabad", listingType: "rent" as const, bedrooms: 3, ...overrides };
  const fit = checkPropertyFit(requirements, HOME);
  return {
    fit,
    ...buildPropertyPrompt({
      facts: FACTS,
      requirements,
      fit,
      location: summariseLocationValue(location),
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
      location: emptyLocationValue(),
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
      location: emptyLocationValue(),
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

describe("the location argument she is allowed to make", () => {
  test("a measured, service-dense address licenses the well-served claim", () => {
    const { systemPrompt } = promptFor({}, "handover", DENSE);
    assert.match(systemPrompt, /WHAT THIS ADDRESS MEASURABLY OFFERS - ALREADY COMPUTED, TREAT AS FACT:/);
    assert.match(systemPrompt, /well-served, established pocket/);
    assert.match(systemPrompt, /2 schools \(nearest 9 min walk\)/);
  });

  test("a thin one forbids any claim about the area at all", () => {
    const { systemPrompt } = promptFor({}, "handover", THIN);
    assert.match(systemPrompt, /NOT enough to make any claim about the neighbourhood/);
    assert.doesNotMatch(systemPrompt, /well-served, established pocket/);
  });

  test("names without measurements forbid every distance", () => {
    const { systemPrompt } = promptFor({}, "handover", NAMED_ONLY);
    assert.match(systemPrompt, /You may NOT say how far any of them is/);
    assert.doesNotMatch(systemPrompt, /well-served, established pocket/);
    assert.doesNotMatch(systemPrompt, /min walk\)/, "an unmeasured home must carry no travel times");
  });

  test("no neighbourhood data means no location section at all", () => {
    const { systemPrompt } = promptFor({}, "handover", { measured: [], named: { transit: [], school: [], hospital: [] } });
    assert.doesNotMatch(systemPrompt, /WHAT THIS ADDRESS MEASURABLY OFFERS/);
  });
});

describe("a price objection is answered with value before it is answered with a number", () => {
  const { systemPrompt } = promptFor({ budgetMax: 46000 });

  test("the reframe comes first, and the unstated budget is captured", () => {
    assert.match(systemPrompt, /WHEN THEY SAY THE PRICE IS TOO HIGH:/);
    assert.match(systemPrompt, /the first answer is never a number/);
    assert.match(systemPrompt, /If they have not named a figure yet, reframe first and then ask what they had in mind/);
  });

  test("but never on a hard miss, where the honest answer is to stop selling", () => {
    assert.match(systemPrompt, /EXCEPTION - if the verdict is HARD, do none of this/);
  });

  test("status adjectives are banned: service density does not prove them", () => {
    assert.match(systemPrompt, /Never call a location posh, prime, premium, upmarket or luxury/);
  });
});

describe("she answers the feeling, not only the question", () => {
  const { systemPrompt } = promptFor({ budgetMax: 50000 });

  test("what they said is reflected once, then attached to a measured fact", () => {
    assert.match(systemPrompt, /LISTEN FOR WHAT THIS MOVE ACTUALLY MEANS TO THEM:/);
    assert.match(systemPrompt, /say back the one thing you heard in a single short clause/);
    assert.match(systemPrompt, /Say it once, then move to the fact/);
  });

  test("a feeling they did not express is never put in their mouth", () => {
    assert.match(systemPrompt, /Never tell a caller how they feel, never invent a worry they have not voiced/);
  });

  test("a nearby service is never sold through the misfortune it would soften", () => {
    assert.match(systemPrompt, /never an accident, never an emergency, never someone falling ill/);
    assert.match(systemPrompt, /what it gives them, never as what it would rescue them from/);
  });
});

describe("she speaks plainly enough for everyone on the call", () => {
  test("both sales prompts carry the same plain-language rule", () => {
    for (const prompt of [promptFor({}).systemPrompt, buildSalesSearchPrompt().systemPrompt]) {
      assert.match(prompt, /HOW TO SPEAK SO THAT EVERYONE UNDERSTANDS YOU:/);
      assert.match(prompt, /Say "a quick trip" not "an errand"/);
      assert.match(prompt, /do not speak English as their first language/);
    }
  });

  test("simpler wording may never make a fact vaguer than the truth", () => {
    assert.match(
      promptFor({}).systemPrompt,
      /never let a simpler sentence turn a number, a price, a distance or a policy into something vaguer than the truth/
    );
  });

  test("the price reframe no longer reaches for a word a caller has to translate", () => {
    const { systemPrompt } = promptFor({ budgetMax: 46000 });
    assert.match(systemPrompt, /a short walk instead of a long trip to work/);
    assert.doesNotMatch(systemPrompt, /the errand that takes ten minutes/);
  });
});

describe("three-way manager call & observer mode", () => {
  test("when hasManagerPhone is true, escalation instructs the silent CALL_MANAGER tag", () => {
    const factsWithPhone: PropertyPromptFacts = {
      ...FACTS,
      hasManagerPhone: true,
      propertyId: 42,
    };
    const { systemPrompt } = buildPropertyPrompt({
      facts: factsWithPhone,
      requirements: emptyRequirements(),
      fit: checkPropertyFit(emptyRequirements(), HOME),
      location: emptyLocationValue(),
      visits: [],
      searchSummary: "",
      entry: "cold",
    });

    assert.match(systemPrompt, /THREE-WAY CALL TO PROPERTY MANAGER/);
    assert.match(systemPrompt, /\[CALL_MANAGER:property_id=42\]/);
    assert.match(systemPrompt, /NEVER recite, invent, or give out any phone number/);
  });

  test("when hasManagerPhone is false, CALL_MANAGER is not offered", () => {
    const { systemPrompt } = promptFor({});
    assert.doesNotMatch(systemPrompt, /THREE-WAY CALL TO PROPERTY MANAGER/);
    assert.doesNotMatch(systemPrompt, /\[CALL_MANAGER:/);
  });

  test("observer mode prompt enforces strict silence unless addressed by name", () => {
    const { systemPrompt } = buildObserverPrompt({
      propertyTitle: "Green Valley Residency",
      prospectName: "Rahul Sharma",
      facts: FACTS,
    });

    assert.match(systemPrompt, /PASSIVE OBSERVER MODE/);
    assert.match(systemPrompt, /KEEP YOUR MOUTH SHUT/);
    assert.match(systemPrompt, /SPEAK WHEN DIRECTLY ADDRESSED/);
    assert.match(systemPrompt, /ZERO NUMBER DISCLOSURE/);
  });
});
