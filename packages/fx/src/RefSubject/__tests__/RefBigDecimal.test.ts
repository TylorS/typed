import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as BigDecimal from "effect/BigDecimal";
import * as RefBigDecimal from "../RefBigDecimal.js";

describe("RefBigDecimal", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const value = BigDecimal.fromStringUnsafe("123.45");
      const ref = yield* RefBigDecimal.make(value);
      const current = yield* ref;
      expect(BigDecimal.equals(current, value)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("adds two BigDecimal values", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigDecimal.make(BigDecimal.fromStringUnsafe("10.5"));
      const result = yield* RefBigDecimal.add(ref, BigDecimal.fromStringUnsafe("5.25"));
      expect(BigDecimal.format(result)).toBe("15.75");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("subtracts two BigDecimal values", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigDecimal.make(BigDecimal.fromStringUnsafe("10.5"));
      const result = yield* RefBigDecimal.subtract(ref, BigDecimal.fromStringUnsafe("3.25"));
      expect(BigDecimal.format(result)).toBe("7.25");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("multiplies two BigDecimal values", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigDecimal.make(BigDecimal.fromStringUnsafe("2.5"));
      const result = yield* RefBigDecimal.multiply(ref, BigDecimal.fromStringUnsafe("4"));
      expect(BigDecimal.format(result)).toBe("10");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("gets absolute value", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigDecimal.make(BigDecimal.fromStringUnsafe("-5.5"));
      const result = yield* RefBigDecimal.abs(ref);
      expect(BigDecimal.format(result)).toBe("5.5");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if zero", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigDecimal.make(BigDecimal.fromStringUnsafe("0"));
      const isZero = yield* RefBigDecimal.isZero(ref);
      expect(isZero).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if less than", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigDecimal.make(BigDecimal.fromStringUnsafe("5"));
      const isLess = yield* RefBigDecimal.isLessThan(ref, BigDecimal.fromStringUnsafe("10"));
      expect(isLess).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));
});
