import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as DateTime from "effect/DateTime";
import * as Duration from "effect/Duration";
import * as RefDateTime from "../RefDateTime.js";

describe("RefDateTime", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const value = DateTime.nowUnsafe();
      const ref = yield* RefDateTime.make(value);
      const current = yield* ref;
      expect(DateTime.toEpochMillis(current)).toBe(DateTime.toEpochMillis(value));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("adds duration", () =>
    Effect.gen(function* () {
      const ref = yield* RefDateTime.make(DateTime.makeUnsafe(0));
      const result = yield* RefDateTime.addDuration(ref, Duration.seconds(5));
      expect(DateTime.toEpochMillis(result)).toBe(5000);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("subtracts duration", () =>
    Effect.gen(function* () {
      const ref = yield* RefDateTime.make(DateTime.makeUnsafe(10000));
      const result = yield* RefDateTime.subtractDuration(ref, Duration.seconds(3));
      expect(DateTime.toEpochMillis(result)).toBe(7000);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("gets epoch milliseconds", () =>
    Effect.gen(function* () {
      const ref = yield* RefDateTime.make(DateTime.makeUnsafe(12345));
      const epochMillis = yield* RefDateTime.epochMillis(ref);
      expect(epochMillis).toBe(12345);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if before", () =>
    Effect.gen(function* () {
      const ref = yield* RefDateTime.make(DateTime.makeUnsafe(1000));
      const isBefore = yield* RefDateTime.isBefore(ref, DateTime.makeUnsafe(2000));
      expect(isBefore).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));
});
