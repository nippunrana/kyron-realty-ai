/**
 * Pins the density gate. Everything here exists to stop one sentence being spoken on a live
 * call: "this is a really well-connected area", said about a home with a clinic near it.
 * Run with `npm run test:intents`.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { summariseLocationValue, emptyLocationValue, type LocationInput, type MeasuredPlace } from "./location-value.ts";

const NO_NAMES = { transit: [], school: [], hospital: [] };

function measured(...places: MeasuredPlace[]): LocationInput {
  return { measured: places, named: NO_NAMES };
}

const METRO: MeasuredPlace = { name: "Sector 21 Metro", category: "transit", walkSeconds: 360 };
const SCHOOL_A: MeasuredPlace = { name: "DPS Faridabad", category: "school", walkSeconds: 540 };
const SCHOOL_B: MeasuredPlace = { name: "Modern School", category: "school", walkSeconds: 720 };
const HOSPITAL: MeasuredPlace = { name: "Asian Hospital", category: "hospital", driveSeconds: 420 };

describe("the density gate", () => {
  test("all three kinds of service within reach clears it", () => {
    const value = summariseLocationValue(measured(METRO, SCHOOL_A, HOSPITAL));
    assert.equal(value.tier, "measured");
    assert.equal(value.serviceDense, true);
    assert.match(value.summary!, /well-served, established pocket/);
  });

  test("two kinds clears it only when one of them offers a real choice", () => {
    assert.equal(summariseLocationValue(measured(METRO, SCHOOL_A)).serviceDense, false);
    assert.equal(summariseLocationValue(measured(METRO, SCHOOL_A, SCHOOL_B)).serviceDense, true);
  });

  test("one category never clears it, however many places are in it", () => {
    const value = summariseLocationValue(measured(SCHOOL_A, SCHOOL_B, { ...SCHOOL_A, name: "Third School" }));
    assert.equal(value.serviceDense, false);
    assert.match(value.summary!, /NOT enough to make any claim about the neighbourhood/);
  });

  test("places too far to walk or drive to do not count as served", () => {
    const far: MeasuredPlace = { name: "Far Hospital", category: "hospital", walkSeconds: 4200, driveSeconds: 1800 };
    const value = summariseLocationValue(measured(METRO, SCHOOL_A, far));
    assert.equal(value.serviceDense, false, "a 30-minute drive is not a service within reach");
    assert.equal(value.categories.find((c) => c.category === "hospital")?.closeCount, 0);
  });
});

describe("the summary never says more than was measured", () => {
  test("a dense address quotes its own shortest real time", () => {
    const summary = summariseLocationValue(measured(METRO, SCHOOL_A, SCHOOL_B, HOSPITAL)).summary!;
    assert.match(summary, /1 transit stop \(nearest 6 min walk\)/);
    assert.match(summary, /2 schools \(nearest 9 min walk\)/);
    assert.match(summary, /1 hospital \(nearest 7 min drive\)/);
  });

  test("names with no measurement forbid distance outright", () => {
    const value = summariseLocationValue({
      measured: [],
      named: { transit: ["Sector 21 Metro"], school: ["DPS Faridabad", "Modern School"], hospital: [] },
    });
    assert.equal(value.tier, "named");
    assert.equal(value.serviceDense, false);
    assert.match(value.summary!, /1 transit stop, 2 schools are named near this home/);
    assert.match(value.summary!, /You may NOT say how far any of them is/);
    assert.doesNotMatch(value.summary!, /min walk|min drive/);
  });

  test("a single real measurement drops the named fallback entirely", () => {
    const value = summariseLocationValue({
      measured: [SCHOOL_A],
      named: { transit: ["Sector 21 Metro"], school: [], hospital: ["Asian Hospital", "City Clinic"] },
    });
    assert.equal(value.tier, "measured");
    assert.deepEqual(value.categories.map((c) => c.category), ["school"]);
    assert.equal(value.serviceDense, false, "unmeasured names must never top a thin measured set up to dense");
  });

  test("a place carrying no usable time at all is discarded, not treated as measured", () => {
    const value = summariseLocationValue(measured({ name: "Unknown Stop", category: "transit" }));
    assert.equal(value.tier, "none");
    assert.equal(value.summary, null);
  });

  test("nothing known means nothing to say", () => {
    assert.deepEqual(summariseLocationValue({ measured: [], named: NO_NAMES }), emptyLocationValue());
  });
});
