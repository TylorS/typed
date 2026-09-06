import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Equivalence from "effect/Equivalence";
import * as Ref from "effect/Ref";
import { causes } from "../Fx/combinators/causes.js";
import { filterEffect } from "../Fx/combinators/filterEffect.js";
import { skipRepeats } from "../Fx/combinators/skipRepeats.js";
import { skipRepeatsWith } from "../Fx/combinators/skipRepeatsWith.js";
import { tap } from "../Fx/combinators/tapEffect.js";
import { Fx } from "../index.js";

describe("Fx.filterEffect", () => {
  it("keeps elements when the effectful predicate returns true", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3, 4]).pipe(
        filterEffect((n) => Effect.succeed(n % 2 === 0)),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [2, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("propagates predicate failures", () =>
    Effect.gen(function* () {
      const exit = yield* Fx.fromIterable([1, 2, 3]).pipe(
        filterEffect((n) => (n === 2 ? Effect.fail("boom" as const) : Effect.succeed(true))),
        Fx.collectAll,
        Effect.exit,
      );
      assert(exit._tag === "Failure");
      const fail = Cause.findFail(exit.cause);
      assert(fail._tag === "Success" && fail.success.error === "boom");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports data-first call style", () =>
    Effect.gen(function* () {
      const result = yield* filterEffect(Fx.fromIterable([1, 2, 3]), (n) =>
        Effect.succeed(n > 1),
      ).pipe(Fx.collectAll);
      assert.deepStrictEqual(result, [2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.tap", () => {
  it("runs a side effect without changing emitted values", () =>
    Effect.gen(function* () {
      const tapped = yield* Ref.make<Array<number>>([]);
      const result = yield* Fx.fromIterable([1, 2, 3]).pipe(
        tap((n) => Ref.update(tapped, (xs) => [...xs, n])),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [1, 2, 3]);
      assert.deepStrictEqual(yield* Ref.get(tapped), [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports synchronous tap callbacks", () =>
    Effect.gen(function* () {
      const tapped: Array<string> = [];
      const result = yield* Fx.fromIterable(["a", "b"]).pipe(
        tap((s) => {
          tapped.push(s.toUpperCase());
        }),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, ["a", "b"]);
      assert.deepStrictEqual(tapped, ["A", "B"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("propagates failures from effectful tap callbacks", () =>
    Effect.gen(function* () {
      const exit = yield* Fx.fromIterable([1, 2]).pipe(
        tap((n) => (n === 2 ? Effect.fail("tap-fail" as const) : Effect.void)),
        Fx.collectAll,
        Effect.exit,
      );
      assert(exit._tag === "Failure");
      const fail = Cause.findFail(exit.cause);
      assert(fail._tag === "Success" && fail.success.error === "tap-fail");
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.skipRepeats / skipRepeatsWith", () => {
  it("drops consecutive equal values with default equality", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 1, 2, 2, 2, 3, 3, 1]).pipe(
        skipRepeats,
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [1, 2, 3, 1]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses a custom equivalence function", () =>
    Effect.gen(function* () {
      const byFloor = Equivalence.make<number>((a, b) => Math.floor(a) === Math.floor(b));
      const result = yield* Fx.fromIterable([1.1, 1.9, 2.0, 2.5, 3.1]).pipe(
        skipRepeatsWith(byFloor),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [1.1, 2.0, 3.1]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits the first value even when the stream is a single repeated value", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([7, 7, 7]).pipe(skipRepeats, Fx.collectAll);
      assert.deepStrictEqual(result, [7]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.causes", () => {
  it("emits only failure causes and ignores successful values", () =>
    Effect.gen(function* () {
      const fx = Fx.succeed(1).pipe(Fx.concat(Fx.fail("err")), Fx.concat(Fx.succeed(2)), causes);
      const collected = yield* Fx.collectAll(fx);
      assert.strictEqual(collected.length, 1);
      const fail = Cause.findFail(collected[0]!);
      assert(fail._tag === "Success");
      assert.strictEqual(fail.success.error, "err");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits nothing for an all-success stream", () =>
    Effect.gen(function* () {
      const collected = yield* Fx.fromIterable([1, 2, 3]).pipe(causes, Fx.collectAll);
      assert.deepStrictEqual(collected, []);
    }).pipe(Effect.scoped, Effect.runPromise));
});
