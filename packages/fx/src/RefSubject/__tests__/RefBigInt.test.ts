import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as BigInt_ from "effect/BigInt";
import * as RefBigInt from "../RefBigInt.js";

describe("RefBigInt", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const value = BigInt_.BigInt(123);
      const ref = yield* RefBigInt.make(value);
      const current = yield* ref;
      expect(current).toBe(value);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("adds two BigInt values", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigInt.make(BigInt_.BigInt(10));
      const result = yield* RefBigInt.add(ref, BigInt_.BigInt(5));
      expect(result).toBe(BigInt_.BigInt(15));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("subtracts two BigInt values", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigInt.make(BigInt_.BigInt(10));
      const result = yield* RefBigInt.subtract(ref, BigInt_.BigInt(3));
      expect(result).toBe(BigInt_.BigInt(7));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("multiplies two BigInt values", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigInt.make(BigInt_.BigInt(5));
      const result = yield* RefBigInt.multiply(ref, BigInt_.BigInt(4));
      expect(result).toBe(BigInt_.BigInt(20));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("gets absolute value", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigInt.make(BigInt_.BigInt(-5));
      const result = yield* RefBigInt.abs(ref);
      expect(result).toBe(BigInt_.BigInt(5));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if zero", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigInt.make(BigInt_.BigInt(0));
      const isZero = yield* RefBigInt.isZero(ref);
      expect(isZero).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if less than", () =>
    Effect.gen(function* () {
      const ref = yield* RefBigInt.make(BigInt_.BigInt(5));
      const isLess = yield* RefBigInt.isLessThan(ref, BigInt_.BigInt(10));
      expect(isLess).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));
});
