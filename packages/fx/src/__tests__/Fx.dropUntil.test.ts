import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Fx } from "../index.js";

describe("Fx dropUntil / dropUntilEffect combinators", () => {
  it("dropUntil drops until predicate is true and includes first match", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4, 5]).pipe(Fx.dropUntil((n) => n >= 4));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [4, 5]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dropUntil emits all when predicate true on first element", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(Fx.dropUntil(() => true));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dropUntil emits none when predicate never true", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(Fx.dropUntil(() => false));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, []);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dropUntil includes first matching element only once", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4, 5]).pipe(Fx.dropUntil((n) => n === 3));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [3, 4, 5]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dropUntilEffect drops until effectful predicate is true", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4]).pipe(
        Fx.dropUntilEffect((n) => Effect.succeed(n >= 3)),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [3, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dropUntilEffect fails when predicate effect fails", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(
        Fx.dropUntilEffect((n) => (n === 2 ? Effect.fail("err") : Effect.succeed(false))),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dropUntilEffect emits from first element when predicate effect succeeds true immediately", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([10, 20, 30]).pipe(
        Fx.dropUntilEffect((n) => Effect.succeed(n > 0)),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [10, 20, 30]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
