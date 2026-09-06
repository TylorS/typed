import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Result from "effect/Result";
import { changesWithEffect } from "../Fx/combinators/changesWithEffect.js";
import { result } from "../Fx/combinators/result.js";
import { Fx } from "../index.js";

describe("Fx.result", () => {
  it("materializes success values as Result.succeed", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(result);
      const collected = yield* Fx.collectAll(fx);
      assert.strictEqual(collected.length, 3);
      assert(Result.isSuccess(collected[0]!) && collected[0].success === 1);
      assert(Result.isSuccess(collected[1]!) && collected[1].success === 2);
      assert(Result.isSuccess(collected[2]!) && collected[2].success === 3);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("materializes typed failure as Result.fail(Cause)", () =>
    Effect.gen(function* () {
      const fx = Fx.fail("err").pipe(result);
      const collected = yield* Fx.collectAll(fx);
      assert.strictEqual(collected.length, 1);
      assert(Result.isFailure(collected[0]!));
      const cause = collected[0].failure;
      const failResult = Cause.findFail(cause);
      assert(failResult._tag === "Success");
      assert.strictEqual(failResult.success.error, "err");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("materializes defect as Result.fail(Cause) with die", () =>
    Effect.gen(function* () {
      const fx = Fx.die("defect").pipe(result);
      const collected = yield* Fx.collectAll(fx);
      assert.strictEqual(collected.length, 1);
      assert(Result.isFailure(collected[0]!));
      assert(Cause.hasDies(collected[0].failure));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("materializes interrupt as Result.fail(Cause) with interrupt", () =>
    Effect.gen(function* () {
      const fx = result(Fx.interrupt());
      const collected = yield* Fx.collectAll(fx);
      assert.strictEqual(collected.length, 1);
      assert(Result.isFailure(collected[0]!));
      assert(Cause.hasInterrupts(collected[0].failure));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits both successes and failures in order", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2]).pipe(
        Fx.continueWith(() => Fx.fail("e")),
        Fx.continueWith(() => Fx.fromIterable([3])),
        result,
      );
      const collected = yield* Fx.collectAll(fx);
      assert.strictEqual(collected.length, 4);
      assert(Result.isSuccess(collected[0]!) && collected[0].success === 1);
      assert(Result.isSuccess(collected[1]!) && collected[1].success === 2);
      assert(Result.isFailure(collected[2]!));
      assert(Result.isSuccess(collected[3]!) && collected[3].success === 3);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.changesWithEffect", () => {
  it("emits first value and then only when effect returns false (changed)", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 2, 3, 3, 3]).pipe(
        changesWithEffect((prev, next) => Effect.succeed(prev === next)),
      );
      const out = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(out, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits all when effect always returns false", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(changesWithEffect(() => Effect.succeed(false)));
      const out = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(out, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits only first when effect always returns true after first", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(
        changesWithEffect((_prev, next) => Effect.succeed(next > 1)),
      );
      const out = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(out, [1]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("propagates failure when effect fails", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2]).pipe(
        changesWithEffect((_prev, next) =>
          next === 2 ? Effect.fail("err" as const) : Effect.succeed(false),
        ),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(exit._tag === "Failure");
      const fail = Cause.findFail(exit.cause);
      assert(fail._tag === "Success" && fail.success.error === "err");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dual call style: data-first", () =>
    Effect.gen(function* () {
      const fx = changesWithEffect(Fx.fromIterable([1, 1, 2, 2]), (a, b) =>
        Effect.succeed(a === b),
      );
      const out = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(out, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
