import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Ref from "effect/Ref";
import { gen } from "../Fx/combinators/gen.js";
import { genScoped } from "../Fx/combinators/genScoped.js";
import { unwrapScoped } from "../Fx/combinators/unwrapScoped.js";
import { Fx } from "../index.js";

describe("Fx.unwrapScoped / genScoped / gen", () => {
  it("unwrapScoped runs an effect that produces an Fx", () =>
    Effect.gen(function* () {
      const result = yield* unwrapScoped(Effect.succeed(Fx.fromIterable([1, 2, 3]))).pipe(
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("unwrapScoped propagates effect failures", () =>
    Effect.gen(function* () {
      const exit = yield* unwrapScoped(Effect.fail("boom" as const).pipe(Effect.as(Fx.empty))).pipe(
        Fx.collectAll,
        Effect.exit,
      );
      assert(Exit.isFailure(exit));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("genScoped acquires scope for the generator and releases it after the Fx completes", () =>
    Effect.gen(function* () {
      const finalized = yield* Ref.make(false);
      const fx = genScoped(function* () {
        yield* Effect.addFinalizer(() => Ref.set(finalized, true));
        return Fx.fromIterable([10, 20]);
      });
      assert.deepStrictEqual(yield* Fx.collectAll(fx), [10, 20]);
      assert.strictEqual(yield* Ref.get(finalized), true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("gen unwraps an Effect.gen that returns an Fx", () =>
    Effect.gen(function* () {
      const fx = gen(function* () {
        const n = yield* Effect.succeed(2);
        return Fx.fromIterable([n, n * 2]);
      });
      assert.deepStrictEqual(yield* Fx.collectAll(fx), [2, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
