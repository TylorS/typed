import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Result from "effect/Result";
import { filterMapLoop } from "../Fx/combinators/filterMapLoop.js";
import { filterMapLoopCause } from "../Fx/combinators/filterMapLoopCause.js";
import { filterMapLoopCauseEffect } from "../Fx/combinators/filterMapLoopCauseEffect.js";
import { filterMapLoopEffect } from "../Fx/combinators/filterMapLoopEffect.js";
import { loop } from "../Fx/combinators/loop.js";
import { loopCause } from "../Fx/combinators/loopCause.js";
import { loopCauseEffect } from "../Fx/combinators/loopCauseEffect.js";
import { loopEffect } from "../Fx/combinators/loopEffect.js";
import { result } from "../Fx/combinators/result.js";
import { Fx } from "../index.js";

describe("Fx.loop / loopEffect", () => {
  it("emits transformed values while folding state", () =>
    Effect.gen(function* () {
      const out = yield* Fx.fromIterable([1, 2, 3]).pipe(
        loop(0, (acc, n) => [acc + n, acc + n] as const),
        Fx.collectAll,
      );
      assert.deepStrictEqual(out, [1, 3, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("loopEffect folds state effectfully", () =>
    Effect.gen(function* () {
      const out = yield* Fx.fromIterable([1, 2, 3]).pipe(
        loopEffect(0, (acc, n) => Effect.succeed([acc + n, acc + n] as const)),
        Fx.collectAll,
      );
      assert.deepStrictEqual(out, [1, 3, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("loopEffect propagates reducer failures", () =>
    Effect.gen(function* () {
      const exit = yield* Fx.fromIterable([1, 2, 3]).pipe(
        loopEffect(0, (acc, n) =>
          n === 2 ? Effect.fail("boom" as const) : Effect.succeed([n, acc + n] as const),
        ),
        Fx.collectAll,
        Effect.exit,
      );
      assert(exit._tag === "Failure");
      const fail = Cause.findFail(exit.cause);
      assert(fail._tag === "Success" && fail.success.error === "boom");
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.filterMapLoop / filterMapLoopEffect", () => {
  it("filters and maps with accumulated state", () =>
    Effect.gen(function* () {
      const out = yield* Fx.fromIterable([1, 2, 3, 4]).pipe(
        filterMapLoop(0, (acc, n) =>
          n % 2 === 0
            ? ([Option.some(acc + n), acc + n] as const)
            : ([Option.none(), acc] as const),
        ),
        Fx.collectAll,
      );
      assert.deepStrictEqual(out, [2, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("filterMapLoopEffect filters and maps effectfully", () =>
    Effect.gen(function* () {
      const out = yield* Fx.fromIterable([1, 2, 3, 4]).pipe(
        filterMapLoopEffect(0, (acc, n) =>
          Effect.succeed(
            n % 2 === 0
              ? ([Option.some(acc + n), acc + n] as const)
              : ([Option.none(), acc] as const),
          ),
        ),
        Fx.collectAll,
      );
      assert.deepStrictEqual(out, [2, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.loopCause / loopCauseEffect / filterMapLoopCause*", () => {
  const prefixCause =
    (prefix: string) =>
    (cause: Cause.Cause<string>): Cause.Cause<string> => {
      const fail = Cause.findFail(cause);
      return fail._tag === "Success"
        ? Cause.fail(`${prefix}${fail.success.error}`)
        : cause;
    };

  it("loopCause transforms failure causes with accumulated state", () =>
    Effect.gen(function* () {
      const collected = yield* Fx.fail("a").pipe(
        loopCause(0, (acc, cause) => [prefixCause(`n${acc}:`)(cause), acc + 1] as const),
        result,
        Fx.collectAll,
      );
      assert.strictEqual(collected.length, 1);
      assert(Result.isFailure(collected[0]!));
      const fail = Cause.findFail(collected[0]!.failure);
      assert(fail._tag === "Success");
      assert.strictEqual(fail.success.error, "n0:a");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("loopCauseEffect transforms failure causes effectfully", () =>
    Effect.gen(function* () {
      const collected = yield* Fx.fail("x").pipe(
        loopCauseEffect(1, (acc, cause) =>
          Effect.succeed([prefixCause(`acc${acc}:`)(cause), acc + 1] as const),
        ),
        result,
        Fx.collectAll,
      );
      assert.strictEqual(collected.length, 1);
      assert(Result.isFailure(collected[0]!));
      const fail = Cause.findFail(collected[0]!.failure);
      assert(fail._tag === "Success");
      assert.strictEqual(fail.success.error, "acc1:x");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("filterMapLoopCause can drop transformed causes", () =>
    Effect.gen(function* () {
      const collected = yield* Fx.fail("drop-me").pipe(
        filterMapLoopCause(0, (_acc) => [Option.none(), 1] as const),
        result,
        Fx.collectAll,
      );
      assert.deepStrictEqual(collected, []);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("filterMapLoopCauseEffect can emit transformed causes effectfully", () =>
    Effect.gen(function* () {
      const collected = yield* Fx.fail("err").pipe(
        filterMapLoopCauseEffect(0, (_acc, cause) =>
          Effect.succeed([Option.some(prefixCause("mapped:")(cause)), 1] as const),
        ),
        result,
        Fx.collectAll,
      );
      assert.strictEqual(collected.length, 1);
      assert(Result.isFailure(collected[0]!));
      const fail = Cause.findFail(collected[0]!.failure);
      assert(fail._tag === "Success");
      assert.strictEqual(fail.success.error, "mapped:err");
    }).pipe(Effect.scoped, Effect.runPromise));
});
