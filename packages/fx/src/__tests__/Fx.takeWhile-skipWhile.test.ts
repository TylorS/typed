import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Fx } from "../index.js";

describe("Fx takeWhile / skipWhile combinators", () => {
  it("takeWhile emits while predicate is true and excludes first false", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4, 5]).pipe(Fx.takeWhile((n) => n < 4));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("takeWhile emits all when predicate always true", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(Fx.takeWhile(() => true));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("takeWhile emits none when predicate false on first", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(Fx.takeWhile((n) => n > 1));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, []);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("takeWhileEffect emits while effectful predicate is true", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4]).pipe(
        Fx.takeWhileEffect((n) => Effect.succeed(n < 3)),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("takeWhileEffect fails when predicate effect fails", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(
        Fx.takeWhileEffect((n) => (n === 2 ? Effect.fail("err") : Effect.succeed(true))),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("skipWhile skips while predicate true and emits from first false", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4, 5]).pipe(Fx.skipWhile((n) => n < 3));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [3, 4, 5]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("skipWhile emits all when predicate always false", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(Fx.skipWhile(() => false));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("skipWhile emits none when predicate always true", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(Fx.skipWhile(() => true));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, []);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("skipWhileEffect skips while effectful predicate is true", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4]).pipe(
        Fx.skipWhileEffect((n) => Effect.succeed(n < 3)),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [3, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("skipWhileEffect fails when predicate effect fails", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(
        Fx.skipWhileEffect((n) => (n === 1 ? Effect.fail("err") : Effect.succeed(true))),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
    }).pipe(Effect.scoped, Effect.runPromise));
});
