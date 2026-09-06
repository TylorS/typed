import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { concat, merge } from "../Fx/combinators/additive.js";
import { Fx } from "../index.js";

describe("Fx additive combinators", () => {
  describe("merge (binary)", () => {
    it("emits values from both streams and completes when both complete", () =>
      Effect.gen(function* () {
        const fx1 = Fx.fromIterable([1, 2]);
        const fx2 = Fx.fromIterable([3, 4]);
        const merged = merge(fx1, fx2);
        const result = yield* Fx.collectAll(merged);
        assert.strictEqual(result.length, 4);
        assert.deepStrictEqual(
          [...result].sort((a, b) => a - b),
          [1, 2, 3, 4],
        );
      }).pipe(Effect.scoped, Effect.runPromise));

    it("completes when both streams are empty", () =>
      Effect.gen(function* () {
        const merged = merge(Fx.fromIterable([]), Fx.fromIterable([]));
        const result = yield* Fx.collectAll(merged);
        assert.deepStrictEqual(result, []);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("fails when first stream fails", () =>
      Effect.gen(function* () {
        const failFx = Fx.fail("err" as const);
        const goodFx = Fx.fromIterable([1, 2]);
        const merged = merge(failFx, goodFx);
        const exit = yield* Effect.exit(Fx.collectAll(merged));
        assert(Exit.isFailure(exit));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("fails when second stream fails", () =>
      Effect.gen(function* () {
        const goodFx = Fx.fromIterable([1, 2]);
        const failFx = Fx.fail("err" as const);
        const merged = merge(goodFx, failFx);
        const exit = yield* Effect.exit(Fx.collectAll(merged));
        assert(Exit.isFailure(exit));
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("concat", () => {
    it("emits first stream then second stream in order", () =>
      Effect.gen(function* () {
        const fx1 = Fx.fromIterable([1, 2]);
        const fx2 = Fx.fromIterable([3, 4]);
        const concatenated = concat(fx1, fx2);
        const result = yield* Fx.collectAll(concatenated);
        assert.deepStrictEqual(result, [1, 2, 3, 4]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("completes when second stream completes", () =>
      Effect.gen(function* () {
        const concatenated = concat(Fx.fromIterable([1]), Fx.fromIterable([2, 3]));
        const result = yield* Fx.collectAll(concatenated);
        assert.deepStrictEqual(result, [1, 2, 3]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("fails when first stream fails (second never runs)", () =>
      Effect.gen(function* () {
        const concatenated = concat(Fx.fail("err" as const), Fx.fromIterable([1, 2]));
        const exit = yield* Effect.exit(Fx.collectAll(concatenated));
        assert(Exit.isFailure(exit));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("fails when second stream fails after first completed", () =>
      Effect.gen(function* () {
        const concatenated = concat(Fx.fromIterable([1, 2]), Fx.fail("err" as const));
        const exit = yield* Effect.exit(Fx.collectAll(concatenated));
        assert(Exit.isFailure(exit));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("completes with first stream only when second is empty", () =>
      Effect.gen(function* () {
        const concatenated = concat(Fx.fromIterable([1, 2]), Fx.fromIterable([]));
        const result = yield* Fx.collectAll(concatenated);
        assert.deepStrictEqual(result, [1, 2]);
      }).pipe(Effect.scoped, Effect.runPromise));
  });
  it("takeEffect uses count from Effect", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4]).pipe(Fx.takeEffect(Effect.succeed(2)));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("skipEffect uses count from Effect", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4]).pipe(Fx.skipEffect(Effect.succeed(2)));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [3, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sliceEffect uses bounds from Effect", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4]).pipe(
        Fx.sliceEffect(Effect.succeed({ skip: 1, take: 2 })),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("takeUntilEffect stops when predicate effect succeeds with true", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4]).pipe(
        Fx.takeUntilEffect((n) => Effect.succeed(n > 2)),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("takeUntilEffect fails when predicate effect fails", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(
        Fx.takeUntilEffect((n) => (n === 2 ? Effect.fail("boom") : Effect.succeed(false))),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
    }).pipe(Effect.scoped, Effect.runPromise));
});
