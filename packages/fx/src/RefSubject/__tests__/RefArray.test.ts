import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as RefArray from "../RefArray.js";

describe("RefArray", () => {
  it("creates and reads an initial array", () =>
    Effect.gen(function* () {
      const ref = yield* RefArray.make([1, 2, 3]);
      expect(yield* ref).toEqual([1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("appends and prepends values", () =>
    Effect.gen(function* () {
      const ref = yield* RefArray.make([2]);
      yield* RefArray.prepend(ref, 1);
      yield* RefArray.append(ref, 3);
      expect(yield* ref).toEqual([1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("inserts, replaces, drops, and filters values", () =>
    Effect.gen(function* () {
      const ref = yield* RefArray.make([1, 2, 3]);
      yield* RefArray.insertAt(ref, 0, 0);
      yield* RefArray.replaceAt(ref, 1, 10);
      yield* RefArray.drop(ref, 1);
      yield* RefArray.filterValues(ref, (value) => value > 1);
      expect(yield* ref).toEqual([10, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
