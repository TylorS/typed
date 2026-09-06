import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as Result from "effect/Result";
import * as RefResult from "../RefResult.js";

describe("RefResult", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const value = Result.succeed(42);
      const ref = yield* RefResult.make(value);
      const current = yield* ref;
      expect(Result.isSuccess(current)).toBe(true);
      if (Result.isSuccess(current)) {
        expect(current.success).toBe(42);
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets Success value", () =>
    Effect.gen(function* () {
      const ref = yield* RefResult.make<number, string>(Result.fail("error"));
      yield* RefResult.setSuccess(ref, 10);
      const result = yield* ref;
      expect(Result.isSuccess(result)).toBe(true);
      if (Result.isSuccess(result)) {
        expect(result.success).toBe(10);
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets Failure value", () =>
    Effect.gen(function* () {
      const ref = yield* RefResult.make<number, string>(Result.succeed(42));
      yield* RefResult.setFailure(ref, "error");
      const result = yield* ref;
      expect(Result.isFailure(result)).toBe(true);
      if (Result.isFailure(result)) {
        expect(result.failure).toBe("error");
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("maps Success value", () =>
    Effect.gen(function* () {
      const ref = yield* RefResult.make(Result.succeed(5));
      const result = yield* RefResult.map(ref, (n) => n * 2);
      expect(Result.isSuccess(result)).toBe(true);
      if (Result.isSuccess(result)) {
        expect(result.success).toBe(10);
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if Success", () =>
    Effect.gen(function* () {
      const ref = yield* RefResult.make(Result.succeed(42));
      const isSuccess = yield* RefResult.isSuccess(ref);
      expect(isSuccess).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if Failure", () =>
    Effect.gen(function* () {
      const ref = yield* RefResult.make(Result.fail("error"));
      const isFailure = yield* RefResult.isFailure(ref);
      expect(isFailure).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));
});
