import * as Cause from "effect/Cause";
import { describe, expect, it } from "vitest";
import {
  encodeManyKey,
  getUniqueManyKeys,
  validateHydratableManyKeys,
} from "../internal/manyKey.js";

const keys: Array<PropertyKey> = [
  "",
  "a",
  "__proto__",
  "constructor",
  "</script>-->",
  "💚",
  "\ud800",
  0,
  1,
  -1,
  NaN,
  Infinity,
  -Infinity,
  Symbol.for("a"),
];

describe("many keys", () => {
  it.each(keys.map((key) => ({ label: String(key), key })))(
    "rejects duplicate $label keys before rendering",
    ({ key }) => {
      const result = getUniqueManyKeys([{ key }, { key }], (item) => item.key);
      expect(Cause.isIllegalArgumentError(result)).toBe(true);
    },
  );

  it.each(keys.map((key) => ({ label: String(key), key })))(
    "accepts and safely encodes $label for hydration",
    ({ key }) => {
      expect(getUniqueManyKeys([key], (value) => value)).toEqual([key]);
      expect(validateHydratableManyKeys([key])).toBeUndefined();
      expect(encodeManyKey(key, new Map())).toMatch(/^v1_[sng]\.[A-Za-z0-9_-]*$/);
    },
  );

  it("keeps number, string and symbol identities distinct", () => {
    const distinct = [1, "1", Symbol.for("1"), Symbol("1"), Symbol("1")];
    expect(getUniqueManyKeys(distinct, (key) => key)).toEqual(distinct);
    const ordinals = new Map<symbol, number>();
    expect(new Set(distinct.map((key) => encodeManyKey(key, ordinals))).size).toBe(5);
  });

  it("uses SameValueZero for numeric key collisions", () => {
    expect(Cause.isIllegalArgumentError(getUniqueManyKeys([0, -0], (key) => key))).toBe(true);
    expect(encodeManyKey(0, new Map())).toBe(encodeManyKey(-0, new Map()));
  });

  it("rejects local symbols only at the hydration boundary", () => {
    const local = Symbol("local");
    expect(getUniqueManyKeys([local], (key) => key)).toEqual([local]);
    expect(Cause.isIllegalArgumentError(validateHydratableManyKeys([local]))).toBe(true);
    expect(validateHydratableManyKeys([Symbol.for("local")])).toBeUndefined();
  });

  it("keeps the same local symbol encoding across repeated lookups", () => {
    const ordinals = new Map<symbol, number>();
    const first = Symbol("same");
    const second = Symbol("same");
    const encoded = encodeManyKey(first, ordinals);
    expect(encodeManyKey(second, ordinals)).not.toBe(encoded);
    expect(encodeManyKey(first, ordinals)).toBe(encoded);
  });

  it("extracts every key exactly once in source order", () => {
    const visited: Array<number> = [];
    expect(
      getUniqueManyKeys([3, 1, 2], (value) => {
        visited.push(value);
        return value;
      }),
    ).toEqual([3, 1, 2]);
    expect(visited).toEqual([3, 1, 2]);
    expect(getUniqueManyKeys([], (value) => value)).toEqual([]);
  });
});
