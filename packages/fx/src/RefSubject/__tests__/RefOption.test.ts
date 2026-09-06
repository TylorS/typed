import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as Option from "effect/Option";
import * as RefOption from "../RefOption.js";

describe("RefOption", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const value = Option.some(42);
      const ref = yield* RefOption.make(value);
      const current = yield* ref;
      expect(Option.isSome(current)).toBe(true);
      if (Option.isSome(current)) {
        expect(current.value).toBe(42);
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets Some value", () =>
    Effect.gen(function* () {
      const ref = yield* RefOption.make<number>(Option.none());
      yield* RefOption.setSome(ref, 10);
      const result = yield* ref;
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value).toBe(10);
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets None value", () =>
    Effect.gen(function* () {
      const ref = yield* RefOption.make(Option.some(42));
      yield* RefOption.setNone(ref);
      const result = yield* ref;
      expect(Option.isNone(result)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("maps Option value", () =>
    Effect.gen(function* () {
      const ref = yield* RefOption.make(Option.some(5));
      const result = yield* RefOption.map(ref, (n) => n * 2);
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value).toBe(10);
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if Some", () =>
    Effect.gen(function* () {
      const ref = yield* RefOption.make(Option.some(42));
      const isSome = yield* RefOption.isSome(ref);
      expect(isSome).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if None", () =>
    Effect.gen(function* () {
      const ref = yield* RefOption.make(Option.none());
      const isNone = yield* RefOption.isNone(ref);
      expect(isNone).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks contains", () =>
    Effect.gen(function* () {
      const ref = yield* RefOption.make(Option.some(42));
      const contains = yield* RefOption.contains(ref, 42);
      expect(contains).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));
});
