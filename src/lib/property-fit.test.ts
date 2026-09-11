/**
 * Pins the fit verdict Sarah is handed on a property page. Run with `npm run test:intents`.
 * The severity of a miss decides whether she negotiates, invites the caller to a viewing, or
 * tells them this home cannot work - so a wrong verdict here is a wrong sales call.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkPropertyFit, emptyRequirements, type BuyerRequirements, type FitProperty } from "./property-fit.ts";

/** A 3 BHK rental in Faridabad: asking 50,000, owner's floor 45,000, pets allowed. */
const HOME: FitProperty = {
  city: "Faridabad",
  listingType: "rent",
  bedrooms: 3,
  price: 50000,
  floorPrice: 45000,
  isPetFriendly: true,
  petPolicyDetail: "Cats and small dogs welcome with a refundable deposit.",
};

function buyer(overrides: Partial<BuyerRequirements> = {}): BuyerRequirements {
  return {
    ...emptyRequirements(),
    city: "Faridabad",
    budgetMax: 50000,
    bedrooms: 3,
    petsNeeded: false,
    listingType: "rent",
    moveInTimeline: "next month",
    ...overrides,
  };
}

describe("a caller whose requirements this home already satisfies", () => {
  test("verdict is fit, with nothing missed or unknown", () => {
    const result = checkPropertyFit(buyer(), HOME);
    assert.equal(result.verdict, "fit");
    assert.deepEqual(result.missed, []);
    assert.deepEqual(result.unknown, []);
  });

  test("more bedrooms than asked for still counts as met", () => {
    const result = checkPropertyFit(buyer({ bedrooms: 2 }), HOME);
    assert.equal(result.verdict, "fit");
    assert.ok(result.met.includes("bedrooms"));
  });
});

describe("the three budget bands", () => {
  test("inside the owner's authorised range is adjustable, so she negotiates", () => {
    const result = checkPropertyFit(buyer({ budgetMax: 46000 }), HOME);
    assert.equal(result.verdict, "adjustable");
    assert.equal(result.missed[0].severity, "adjustable");
  });

  test("just below the floor is bridgeable, so she invites them to view instead", () => {
    // 45,000 floor, 10% band -> 40,500 is the lowest budget still worth a viewing.
    const result = checkPropertyFit(buyer({ budgetMax: 41000 }), HOME);
    assert.equal(result.verdict, "bridgeable");
    assert.match(result.missed[0].detail, /meet the owner/i);
  });

  test("the band is measured from the floor, and its bottom edge is inclusive", () => {
    assert.equal(checkPropertyFit(buyer({ budgetMax: 40500 }), HOME).verdict, "bridgeable");
    assert.equal(checkPropertyFit(buyer({ budgetMax: 40499 }), HOME).verdict, "hard");
  });

  test("far below the floor is hard, so she helps them look elsewhere", () => {
    const result = checkPropertyFit(buyer({ budgetMax: 25000 }), HOME);
    assert.equal(result.verdict, "hard");
    assert.equal(result.missed[0].severity, "hard");
  });

  test("the owner's floor is never quoted back in the detail Sarah reads", () => {
    for (const budgetMax of [46000, 41000, 25000]) {
      const { missed } = checkPropertyFit(buyer({ budgetMax }), HOME);
      assert.doesNotMatch(missed[0].detail, /45,?000/, `floor leaked at budget ${budgetMax}`);
    }
  });
});

describe("requirements no concession can move", () => {
  test("a different city is hard", () => {
    const result = checkPropertyFit(buyer({ city: "Delhi" }), HOME);
    assert.equal(result.verdict, "hard");
    assert.equal(result.missed[0].requirement, "city");
  });

  test("wanting to buy a rental listing is hard", () => {
    const result = checkPropertyFit(buyer({ listingType: "sale" }), HOME);
    assert.equal(result.verdict, "hard");
    assert.equal(result.missed[0].requirement, "rent or buy");
  });

  test("needing more bedrooms than exist is hard", () => {
    const result = checkPropertyFit(buyer({ bedrooms: 4 }), HOME);
    assert.equal(result.verdict, "hard");
    assert.equal(result.missed[0].requirement, "bedrooms");
  });

  test("one hard miss outranks an adjustable one", () => {
    const result = checkPropertyFit(buyer({ city: "Delhi", budgetMax: 46000 }), HOME);
    assert.equal(result.verdict, "hard");
    assert.equal(result.missed.length, 2);
  });
});

describe("pets: only a stated prohibition is a refusal", () => {
  const noPets: FitProperty = {
    ...HOME,
    isPetFriendly: false,
    petPolicyDetail: "No pets allowed in this building.",
  };
  const unstated: FitProperty = { ...HOME, isPetFriendly: false, petPolicyDetail: null };

  test("a stated no-pets policy is a hard miss", () => {
    const result = checkPropertyFit(buyer({ petsNeeded: true }), noPets);
    assert.equal(result.verdict, "hard");
    assert.equal(result.missed[0].requirement, "pets");
  });

  test("an unverified policy is unknown, never a refusal she invents", () => {
    const result = checkPropertyFit(buyer({ petsNeeded: true }), unstated);
    assert.equal(result.verdict, "fit");
    assert.ok(result.unknown.includes("pets"));
    assert.deepEqual(result.missed, []);
  });

  test("a caller with no pet is met, whatever the building allows", () => {
    assert.ok(checkPropertyFit(buyer({ petsNeeded: false }), noPets).met.includes("pets"));
  });
});

describe("a cold start, where nothing has been said yet", () => {
  const cold = checkPropertyFit(emptyRequirements(), HOME);

  test("everything is unknown and nothing is missed", () => {
    assert.equal(cold.verdict, "fit");
    assert.deepEqual(cold.missed, []);
    assert.deepEqual(cold.met, []);
  });

  test("the questions she asks are the ones this home constrains", () => {
    assert.ok(cold.unknown.length >= 5);
    assert.deepEqual(cold.unknown.slice(0, 1), ["budget"]);
  });

  test("a home that bans pets pushes the pet question to the front", () => {
    const result = checkPropertyFit(emptyRequirements(), { ...HOME, isPetFriendly: false });
    assert.deepEqual(result.unknown.slice(0, 2).sort(), ["budget", "pets"]);
  });
});

describe("missing data never manufactures a verdict", () => {
  test("an unpriced listing leaves budget unknown rather than failed", () => {
    const result = checkPropertyFit(buyer({ budgetMax: 1000 }), { ...HOME, price: 0 });
    assert.ok(result.unknown.includes("budget"));
    assert.deepEqual(result.missed, []);
  });

  test("an unrecorded bedroom count is unknown, not a shortfall", () => {
    const result = checkPropertyFit(buyer({ bedrooms: 3 }), { ...HOME, bedrooms: null });
    assert.ok(result.unknown.includes("bedrooms"));
    assert.deepEqual(result.missed, []);
  });

  test("with no floor on file the asking price is treated as the floor", () => {
    const noFloor = { ...HOME, floorPrice: 0 };
    assert.equal(checkPropertyFit(buyer({ budgetMax: 48000 }), noFloor).verdict, "bridgeable");
    assert.equal(checkPropertyFit(buyer({ budgetMax: 20000 }), noFloor).verdict, "hard");
  });
});
