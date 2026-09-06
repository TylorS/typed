import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as Duration from "effect/Duration";
import * as RefDuration from "../RefDuration.js";

describe("RefDuration", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const value = Duration.seconds(5);
      const ref = yield* RefDuration.make(value);
      const current = yield* ref;
      expect(Duration.equals(current, value)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("adds two durations", () =>
    Effect.gen(function* () {
      const ref = yield* RefDuration.make(Duration.seconds(5));
      const result = yield* RefDuration.add(ref, Duration.seconds(3));
      expect(Duration.toSeconds(result)).toBe(8);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("subtracts two durations", () =>
    Effect.gen(function* () {
      const ref = yield* RefDuration.make(Duration.seconds(10));
      const result = yield* RefDuration.subtract(ref, Duration.seconds(3));
      expect(Duration.toSeconds(result)).toBe(7);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("multiplies duration by number", () =>
    Effect.gen(function* () {
      const ref = yield* RefDuration.make(Duration.seconds(5));
      const result = yield* RefDuration.multiply(ref, 2);
      expect(Duration.toSeconds(result)).toBe(10);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if zero", () =>
    Effect.gen(function* () {
      const ref = yield* RefDuration.make(Duration.zero);
      const isZero = yield* RefDuration.isZero(ref);
      expect(isZero).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("gets seconds", () =>
    Effect.gen(function* () {
      const ref = yield* RefDuration.make(Duration.seconds(5));
      const seconds = yield* RefDuration.seconds(ref);
      expect(seconds).toBe(5);
    }).pipe(Effect.scoped, Effect.runPromise));
});
