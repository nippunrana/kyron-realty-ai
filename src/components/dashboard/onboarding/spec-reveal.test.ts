import test from "node:test";
import assert from "node:assert/strict";
import { diffSnapshot } from "./spec-reveal.ts";

test("diffSnapshot returns null on initial mount and initializes ref", () => {
  const ref = { current: null };
  const initial = { price: "95000", bedrooms: "3" };

  const result = diffSnapshot(ref, initial);

  assert.equal(result, null);
  assert.deepEqual(ref.current, initial);
});

test("diffSnapshot detects added and changed keys on subsequent updates", () => {
  const ref = { current: { price: "95000", bedrooms: "3" } };
  const updated = { price: "105000", bedrooms: "3", parking: "2 Covered" };

  const result = diffSnapshot(ref, updated);

  assert.notEqual(result, null);
  assert.deepEqual(result?.added, ["parking"]);
  assert.deepEqual(result?.changed, ["price"]);
  assert.deepEqual(ref.current, updated);
});

test("diffSnapshot returns empty arrays when nothing has changed", () => {
  const ref = { current: { price: "95000", bedrooms: "3" } };
  const same = { price: "95000", bedrooms: "3" };

  const result = diffSnapshot(ref, same);

  assert.notEqual(result, null);
  assert.deepEqual(result?.added, []);
  assert.deepEqual(result?.changed, []);
});
