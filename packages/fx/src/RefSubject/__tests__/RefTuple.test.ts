import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as Tuple from "effect/Tuple";
import * as RefTuple from "../RefTuple.js";

describe("RefTuple", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const value = Tuple.make(1, "hello", true);
      const ref = yield* RefTuple.make(value);
      const current = yield* ref;
      expect(current).toEqual(value);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets value at index", () =>
    Effect.gen(function* () {
      const ref = yield* RefTuple.make(Tuple.make(1 as number, "hello" as string, true as boolean));
      yield* RefTuple.setAt(ref, 1, "world");
      const result = yield* ref;
      expect(result[1]).toBe("world");
      expect(result[0]).toBe(1);
      expect(result[2]).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("updates value at index", () =>
    Effect.gen(function* () {
      const ref = yield* RefTuple.make(Tuple.make(1 as number, 2 as number, 3 as number));
      yield* RefTuple.updateAt(ref, 1, (n) => n * 2);
      const result = yield* ref;
      expect(result[1]).toBe(4);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("appends element", () =>
    Effect.gen(function* () {
      const ref = yield* RefTuple.make(Tuple.make(1, 2));
      const result = yield* RefTuple.appendElement(ref, 3);
      expect(result).toEqual([1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("prepends element", () =>
    Effect.gen(function* () {
      const ref = yield* RefTuple.make(Tuple.make(2, 3));
      const result = yield* RefTuple.prependElement(ref, 1);
      expect(result).toEqual([1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("gets element at index", () =>
    Effect.gen(function* () {
      const ref = yield* RefTuple.make(Tuple.make(1, "hello", true));
      const value = yield* RefTuple.get(ref, 1);
      expect(value).toBe("hello");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("gets length", () =>
    Effect.gen(function* () {
      const ref = yield* RefTuple.make(Tuple.make(1, 2, 3));
      const length = yield* RefTuple.length(ref);
      expect(length).toBe(3);
    }).pipe(Effect.scoped, Effect.runPromise));
});
