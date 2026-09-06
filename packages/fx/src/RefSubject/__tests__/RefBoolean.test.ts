import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as RefBoolean from "../RefBoolean.js";

describe("RefBoolean", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const ref = yield* RefBoolean.make(true);
      const current = yield* ref;
      expect(current).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("toggles boolean value", () =>
    Effect.gen(function* () {
      const ref = yield* RefBoolean.make(true);
      yield* RefBoolean.toggle(ref);
      const result = yield* ref;
      expect(result).toBe(false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets to true", () =>
    Effect.gen(function* () {
      const ref = yield* RefBoolean.make(false);
      yield* RefBoolean.setTrue(ref);
      const result = yield* ref;
      expect(result).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets to false", () =>
    Effect.gen(function* () {
      const ref = yield* RefBoolean.make(true);
      yield* RefBoolean.setFalse(ref);
      const result = yield* ref;
      expect(result).toBe(false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("applies AND operation", () =>
    Effect.gen(function* () {
      const ref = yield* RefBoolean.make(true);
      const result = yield* RefBoolean.and(ref, false);
      expect(result).toBe(false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("applies OR operation", () =>
    Effect.gen(function* () {
      const ref = yield* RefBoolean.make(false);
      const result = yield* RefBoolean.or(ref, true);
      expect(result).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if true", () =>
    Effect.gen(function* () {
      const ref = yield* RefBoolean.make(true);
      const isTrue = yield* RefBoolean.isTrue(ref);
      expect(isTrue).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));
});
