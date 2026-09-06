import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Fx } from "../index.js";

describe("Fx.mapError", () => {
  it("maps typed failure to new error type", () =>
    Effect.gen(function* () {
      const fx = Fx.fail("err").pipe(Fx.mapError((s) => ({ msg: s })));
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      const result = Cause.findFail(exit.cause);
      assert(result._tag === "Success");
      assert.deepStrictEqual(result.success.error, { msg: "err" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dual call style: data-last", () =>
    Effect.gen(function* () {
      const fx = Fx.mapError(Fx.fail(42), (n) => `n=${n}`);
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      const result = Cause.findFail(exit.cause);
      assert(result._tag === "Success");
      assert.strictEqual(result.success.error, "n=42");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dual call style: data-first pipe", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2]).pipe(Fx.mapError((e: string) => e.toUpperCase()));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves success values", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(Fx.mapError((e: string) => e));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("defects are not mapped (Cause.map only maps Fail)", () =>
    Effect.gen(function* () {
      const fx = Fx.die("defect").pipe(Fx.mapError((_e: string) => "mapped"));
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      assert(Cause.hasDies(exit.cause));
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.mapBoth", () => {
  it("maps both success and failure channels", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(
        Fx.mapBoth({
          onSuccess: (n) => n * 10,
          onFailure: (e: string) => e.length,
        }),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [10, 20, 30]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("maps failure when stream fails", () =>
    Effect.gen(function* () {
      const fx = Fx.fail("boom").pipe(
        Fx.mapBoth({
          onSuccess: (a: number) => a,
          onFailure: (s: string) => ({ message: s }),
        }),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      const result = Cause.findFail(exit.cause);
      assert(result._tag === "Success");
      assert.deepStrictEqual(result.success.error, { message: "boom" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dual call style: data-last", () =>
    Effect.gen(function* () {
      const fx = Fx.mapBoth(Fx.fromIterable(["a", "b"]), {
        onSuccess: (s) => s.toUpperCase(),
        onFailure: (e: number) => String(e),
      });
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, ["A", "B"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves defects (onFailure only maps Fail)", () =>
    Effect.gen(function* () {
      const fx = Fx.die("oops").pipe(
        Fx.mapBoth({
          onSuccess: (a: number) => a,
          onFailure: (_e: string) => "mapped",
        }),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      assert(Cause.hasDies(exit.cause));
    }).pipe(Effect.scoped, Effect.runPromise));
});
