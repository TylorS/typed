import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as Cause from "effect/Cause";
import type * as Scope from "effect/Scope";
import * as RefCause from "../RefCause.js";

describe("RefCause", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const value = Cause.fail("error");
      const ref = yield* RefCause.make(value);
      const current = yield* ref;
      expect(Cause.hasFails(current)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets Fail cause", () =>
    Effect.gen(function* () {
      const ref = yield* RefCause.make<string, unknown, Scope.Scope>(Cause.empty);
      yield* RefCause.setFail(ref, "error");
      const result = yield* ref;
      expect(Cause.hasFails(result)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets Die cause", () =>
    Effect.gen(function* () {
      const ref = yield* RefCause.make(Cause.empty);
      yield* RefCause.setDie(ref, new Error("defect"));
      const result = yield* ref;
      expect(Cause.hasDies(result)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets Interrupt cause", () =>
    Effect.gen(function* () {
      const ref = yield* RefCause.make(Cause.empty);
      yield* RefCause.setInterrupt(ref, 123);
      const result = yield* ref;
      expect(Cause.hasInterrupts(result)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if has Fail", () =>
    Effect.gen(function* () {
      const ref = yield* RefCause.make(Cause.fail("error"));
      const hasFail = yield* RefCause.hasFails(ref);
      expect(hasFail).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks size", () =>
    Effect.gen(function* () {
      const ref = yield* RefCause.make(Cause.fail("error"));
      const size = yield* RefCause.size(ref);
      expect(size).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise));
});
