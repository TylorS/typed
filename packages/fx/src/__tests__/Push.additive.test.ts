import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Fx, Push, Sink } from "../index.js";

describe("Push.mapError", () => {
  it("maps Fx output error channel to new type", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fail("err"),
      );
      const mapped = Push.mapError(push, (s) => ({ msg: s }));
      const exit = yield* Effect.exit(Fx.collectAll(mapped));
      assert(Exit.isFailure(exit));
      const result = Cause.findFail(exit.cause);
      assert(result._tag === "Success");
      assert.deepStrictEqual(result.success.error, { msg: "err" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dual call style: data-last", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fail(42),
      );
      const mapped = Push.mapError(push, (n) => `n=${n}`);
      const exit = yield* Effect.exit(Fx.collectAll(mapped));
      assert(Exit.isFailure(exit));
      const result = Cause.findFail(exit.cause);
      assert(result._tag === "Success");
      assert.strictEqual(result.success.error, "n=42");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves success values on Fx side", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fromIterable([1, 2, 3]),
      );
      const mapped = push.pipe(Push.mapError((e: string) => e));
      const result = yield* Fx.collectAll(mapped);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not map defects (Cause.map only maps Fail)", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.die("defect"),
      );
      const mapped = Push.mapError(push, (_e: string) => "mapped");
      const exit = yield* Effect.exit(Fx.collectAll(mapped));
      assert(Exit.isFailure(exit));
      assert(Cause.hasDies(exit.cause));
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Push.mapBoth", () => {
  it("maps both Fx success and error channels", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fromIterable([1, 2, 3]),
      );
      const mapped = Push.mapBoth(push, {
        onSuccess: (n) => n * 10,
        onFailure: (e: string) => e.length,
      });
      const result = yield* Fx.collectAll(mapped);
      assert.deepStrictEqual(result, [10, 20, 30]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("maps Fx failure when stream fails", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fail("boom"),
      );
      const mapped = Push.mapBoth(push, {
        onSuccess: (a: number) => a,
        onFailure: (s: string) => ({ message: s }),
      });
      const exit = yield* Effect.exit(Fx.collectAll(mapped));
      assert(Exit.isFailure(exit));
      const result = Cause.findFail(exit.cause);
      assert(result._tag === "Success");
      assert.deepStrictEqual(result.success.error, { message: "boom" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dual call style: data-last", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fromIterable(["a", "b"]),
      );
      const mapped = Push.mapBoth(push, {
        onSuccess: (s) => s.toUpperCase(),
        onFailure: (e: number) => String(e),
      });
      const result = yield* Fx.collectAll(mapped);
      assert.deepStrictEqual(result, ["A", "B"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves defects (onFailure only maps Fail)", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.die("oops"),
      );
      const mapped = Push.mapBoth(push, {
        onSuccess: (a: number) => a,
        onFailure: (_e: string) => "mapped",
      });
      const exit = yield* Effect.exit(Fx.collectAll(mapped));
      assert(Exit.isFailure(exit));
      assert(Cause.hasDies(exit.cause));
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Push.mapAccum", () => {
  it("emits accumulated values from (state, value) => [nextState, emitted]", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fromIterable([1, 2, 3, 4]),
      );
      const accumulated = Push.mapAccum(push, 0, (sum, n) => [sum + n, sum + n] as const);
      const result = yield* Fx.collectAll(accumulated);
      assert.deepStrictEqual(result, [1, 3, 6, 10]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("data-last form: pipe(push, mapAccum(initial, f))", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fromIterable(["a", "b", "c"]),
      );
      const accumulated = push.pipe(
        Push.mapAccum("", (acc, s) => [`${acc}${s}`, `${acc}${s}`] as const),
      );
      const result = yield* Fx.collectAll(accumulated);
      assert.deepStrictEqual(result, ["a", "ab", "abc"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("data-first form: mapAccum(push, initial, f)", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fromIterable([2, 3, 4]),
      );
      const accumulated = Push.mapAccum(push, 1, (prod, n) => [prod * n, prod * n] as const);
      const result = yield* Fx.collectAll(accumulated);
      assert.deepStrictEqual(result, [2, 6, 24]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("single value emits one accumulated result", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.succeed(42),
      );
      const accumulated = Push.mapAccum(push, 0, (s, n) => [s + n, n] as const);
      const result = yield* Fx.collectAll(accumulated);
      assert.deepStrictEqual(result, [42]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Push.mapAccumEffect", () => {
  it("emits accumulated values from effectful reducer", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fromIterable([1, 2, 3]),
      );
      const accumulated = Push.mapAccumEffect(push, 0, (sum, n) =>
        Effect.succeed([sum + n, sum + n] as const),
      );
      const result = yield* Fx.collectAll(accumulated);
      assert.deepStrictEqual(result, [1, 3, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("data-first form: mapAccumEffect(push, initial, f)", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fromIterable([10, 20]),
      );
      const accumulated = Push.mapAccumEffect(push, 1, (acc, n) =>
        Effect.succeed([acc * n, acc * n] as const),
      );
      const result = yield* Fx.collectAll(accumulated);
      assert.deepStrictEqual(result, [10, 200]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("propagates effect failure", () =>
    Effect.gen(function* () {
      const push = Push.make(
        Sink.make(
          () => Effect.void,
          () => Effect.void,
        ),
        Fx.fromIterable([1, 2, 3]),
      );
      const accumulated = Push.mapAccumEffect(push, 0, (sum, n) =>
        n === 2 ? Effect.fail("stop" as const) : Effect.succeed([sum + n, sum + n] as const),
      );
      const exit = yield* Effect.exit(Fx.collectAll(accumulated));
      assert(Exit.isFailure(exit));
      const fail = Cause.findFail(exit.cause);
      assert(fail._tag === "Success" && fail.success.error === "stop");
    }).pipe(Effect.scoped, Effect.runPromise));
});
