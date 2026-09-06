import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { mergeLeft, mergeRight, zipLeft, zipRight } from "../Fx/combinators/additive.js";
import { Fx } from "../index.js";

describe("Fx zip/merge additive combinators", () => {
  describe("zipLeft", () => {
    it("emits only left values in lockstep; completes when first completes", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2, 3]);
        const right = Fx.fromIterable(["a", "b", "c", "d"]);
        const result = yield* Fx.collectAll(zipLeft(left, right));
        assert.deepStrictEqual(result, [1, 2, 3]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("completes when right is shorter (lockstep)", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2, 3, 4]);
        const right = Fx.fromIterable(["a", "b"]);
        const result = yield* Fx.collectAll(zipLeft(left, right));
        assert.deepStrictEqual(result, [1, 2]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-last form: pipe(self, zipLeft(that))", () =>
      Effect.gen(function* () {
        const result = yield* Fx.fromIterable([10, 20]).pipe(
          zipLeft(Fx.fromIterable(["x", "y", "z"])),
          Fx.collectAll,
        );
        assert.deepStrictEqual(result, [10, 20]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("fails when left fails", () =>
      Effect.gen(function* () {
        const exit = yield* Effect.exit(
          Fx.collectAll(zipLeft(Fx.fail("err" as const), Fx.fromIterable([1]))),
        );
        assert(Exit.isFailure(exit));
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("zipRight", () => {
    it("emits only right values in lockstep; completes when first completes", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2, 3, 4]);
        const right = Fx.fromIterable(["a", "b", "c"]);
        const result = yield* Fx.collectAll(zipRight(left, right));
        assert.deepStrictEqual(result, ["a", "b", "c"]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("completes when left is shorter (lockstep)", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2]);
        const right = Fx.fromIterable([10, 20, 30]);
        const result = yield* Fx.collectAll(zipRight(left, right));
        assert.deepStrictEqual(result, [10, 20]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-last form: pipe(self, zipRight(that))", () =>
      Effect.gen(function* () {
        const result = yield* Fx.fromIterable([1, 2, 3]).pipe(
          zipRight(Fx.fromIterable(["a", "b"])),
          Fx.collectAll,
        );
        assert.deepStrictEqual(result, ["a", "b"]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("fails when right fails", () =>
      Effect.gen(function* () {
        const exit = yield* Effect.exit(
          Fx.collectAll(zipRight(Fx.fromIterable([1]), Fx.fail("err" as const))),
        );
        assert(Exit.isFailure(exit));
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("mergeLeft", () => {
    it("emits only values from the left stream; both run concurrently", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2, 3]);
        const right = Fx.fromIterable(["a", "b"]);
        const result = yield* Fx.collectAll(mergeLeft(left, right));
        assert.strictEqual(result.length, 3);
        assert.deepStrictEqual(
          [...result].sort((a, b) => a - b),
          [1, 2, 3],
        );
      }).pipe(Effect.scoped, Effect.runPromise));

    it("completes when both streams complete", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1]);
        const right = Fx.fromIterable([2, 3]);
        const result = yield* Fx.collectAll(mergeLeft(left, right));
        assert.deepStrictEqual(result, [1]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("emits left values only (order non-deterministic)", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([10, 20]);
        const right = Fx.fromIterable([30, 40]);
        const result = yield* Fx.collectAll(mergeLeft(left, right));
        assert.strictEqual(result.length, 2);
        assert.ok(result.every((n) => n === 10 || n === 20));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("fails when left fails", () =>
      Effect.gen(function* () {
        const exit = yield* Effect.exit(
          Fx.collectAll(mergeLeft(Fx.fail("err" as const), Fx.fromIterable([1]))),
        );
        assert(Exit.isFailure(exit));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-last form: pipe(self, mergeLeft(that))", () =>
      Effect.gen(function* () {
        const result = yield* Fx.fromIterable([1, 2]).pipe(
          mergeLeft(Fx.fromIterable(["a", "b", "c"])),
          Fx.collectAll,
        );
        assert.strictEqual(result.length, 2);
        assert.deepStrictEqual(
          [...result].sort((a, b) => a - b),
          [1, 2],
        );
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("mergeRight", () => {
    it("emits only values from the right stream; both run concurrently", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2]);
        const right = Fx.fromIterable(["a", "b", "c"]);
        const result = yield* Fx.collectAll(mergeRight(left, right));
        assert.strictEqual(result.length, 3);
        assert.deepStrictEqual([...result].sort(), ["a", "b", "c"]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("completes when both streams complete", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2]);
        const right = Fx.fromIterable([3]);
        const result = yield* Fx.collectAll(mergeRight(left, right));
        assert.deepStrictEqual(result, [3]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("emits right values only (order non-deterministic)", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2]);
        const right = Fx.fromIterable([10, 20]);
        const result = yield* Fx.collectAll(mergeRight(left, right));
        assert.strictEqual(result.length, 2);
        assert.ok(result.every((n) => n === 10 || n === 20));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("fails when right fails", () =>
      Effect.gen(function* () {
        const exit = yield* Effect.exit(
          Fx.collectAll(mergeRight(Fx.fromIterable([1]), Fx.fail("err" as const))),
        );
        assert(Exit.isFailure(exit));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-last form: pipe(self, mergeRight(that))", () =>
      Effect.gen(function* () {
        const result = yield* Fx.fromIterable([1, 2, 3]).pipe(
          mergeRight(Fx.fromIterable(["x", "y"])),
          Fx.collectAll,
        );
        assert.strictEqual(result.length, 2);
        assert.deepStrictEqual([...result].sort(), ["x", "y"]);
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
