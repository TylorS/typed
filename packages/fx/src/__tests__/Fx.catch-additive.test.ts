import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import { Data } from "effect";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Result from "effect/Result";
import { catchCauseIf, catchIf, catchTags } from "../Fx/combinators/catch.js";
import { Fx } from "../index.js";

describe("Fx.catchIf", () => {
  it("recovers when predicate is true (typed failure)", () =>
    Effect.gen(function* () {
      const fx = Fx.fail(42).pipe(
        catchIf(
          (n: number) => n > 10,
          (n) => Fx.succeed(`recovered:${n}`),
        ),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, ["recovered:42"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not recover when predicate is false (re-fails)", () =>
    Effect.gen(function* () {
      const fx = Fx.fail(3).pipe(
        catchIf(
          (n: number) => n > 10,
          (n) => Fx.succeed(`recovered:${n}`),
        ),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      const failResult = Cause.findFail(exit.cause);
      assert(failResult._tag === "Success");
      assert.strictEqual(failResult.success.error, 3);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not recover from defects (only Fail is considered)", () =>
    Effect.gen(function* () {
      const fx = Fx.die("defect").pipe(
        catchIf(
          () => true,
          () => Fx.succeed("nope"),
        ),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      assert(Cause.hasDies(exit.cause));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("success path is unchanged", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(
        catchIf(
          (_: string) => true,
          () => Fx.succeed(-1),
        ),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dual call style (data-first)", () =>
    Effect.gen(function* () {
      const fx = catchIf(
        Fx.fail("err"),
        (e: string) => e.length > 0,
        (e) => Fx.succeed(e.toUpperCase()),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, ["ERR"]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.catchCauseIf", () => {
  it("recovers when predicate is true (e.g. has fails)", () =>
    Effect.gen(function* () {
      const fx = Fx.fail("boom").pipe(
        catchCauseIf(Cause.hasFails, (cause) => {
          const r = Cause.findFail(cause);
          const msg = Result.isSuccess(r) ? r.success.error : "?";
          return Fx.succeed(`recovered:${msg}`);
        }),
      );
      const result = yield* Fx.collectAll(fx);
      assert.strictEqual(result[0], "recovered:boom");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("recovers from defects when predicate matches cause", () =>
    Effect.gen(function* () {
      const fx = Fx.die("defect").pipe(catchCauseIf(Cause.hasDies, () => Fx.succeed("ok")));
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, ["ok"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not recover when predicate is false", () =>
    Effect.gen(function* () {
      const fx = Fx.die("oops").pipe(
        catchCauseIf(
          () => false,
          () => Fx.succeed("no"),
        ),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      assert(Cause.hasDies(exit.cause));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("success path is unchanged", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2]).pipe(
        catchCauseIf(
          () => true,
          () => Fx.succeed(0),
        ),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dual call style (data-first)", () =>
    Effect.gen(function* () {
      const fx = catchCauseIf(Fx.fail("x"), Cause.hasFails, (cause) =>
        Fx.succeed(Result.isSuccess(Cause.findFail(cause)) ? "handled" : "unhandled"),
      );
      const result = yield* Fx.collectAll(fx);
      assert.strictEqual(result[0], "handled");
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.catchTags", () => {
  class ErrorA extends Data.TaggedError("A")<{ readonly n: number }> {}
  class ErrorB extends Data.TaggedError("B")<{ readonly msg: string }> {}

  it("recovers from multiple tagged failures with one call", () =>
    Effect.gen(function* () {
      const failure: Fx.Fx<never, ErrorA | ErrorB> = Fx.fail(new ErrorA({ n: 1 }));
      const fx = failure.pipe(
        catchTags({
          A: (e: ErrorA) => Fx.succeed(`A:${e.n}`),
          B: (e: ErrorB) => Fx.succeed(`B:${e.msg}`),
        }),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, ["A:1"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("matches second tag when first fails with B", () =>
    Effect.gen(function* () {
      const failure: Fx.Fx<never, ErrorA | ErrorB> = Fx.fail(new ErrorB({ msg: "hello" }));
      const fx = failure.pipe(
        catchTags({
          A: (e: ErrorA) => Fx.succeed(`A:${e.n}`),
          B: (e: ErrorB) => Fx.succeed(`B:${e.msg}`),
        }),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, ["B:hello"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not catch untagged or other tags (re-fails)", () =>
    Effect.gen(function* () {
      const fx = Fx.fail("plain").pipe(
        catchTags({
          A: () => Fx.succeed(1),
          B: () => Fx.succeed(2),
        }),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      const failResult = Cause.findFail(exit.cause);
      assert(failResult._tag === "Success");
      assert.strictEqual(failResult.success.error, "plain");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not recover from defects (only Fail with _tag)", () =>
    Effect.gen(function* () {
      const fx = Fx.die("defect").pipe(
        catchTags({
          A: () => Fx.succeed(1),
          B: () => Fx.succeed(2),
        }),
      );
      const exit = yield* Effect.exit(Fx.collectAll(fx));
      assert(Exit.isFailure(exit));
      assert(Cause.hasDies(exit.cause));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("success path is unchanged", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(
        catchTags({
          A: () => Fx.succeed(-1),
          B: () => Fx.succeed(-2),
        }),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dual call style (data-first)", () =>
    Effect.gen(function* () {
      const fx = catchTags(Fx.fail(new ErrorA({ n: 42 })), {
        A: (e) => Fx.succeed(e.n * 2),
        B: () => Fx.succeed(0),
      });
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [84]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
