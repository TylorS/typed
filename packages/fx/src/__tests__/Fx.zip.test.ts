import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "../index.js";
import * as Sink from "../Sink/index.js";

describe("Fx zip combinators", () => {
  describe("zip", () => {
    it("emits pairs when run directly with a sink (no observe)", () =>
      Effect.gen(function* () {
        const arr: Array<readonly [number, string]> = [];
        const sink = Sink.make(
          () => Effect.void,
          (pair: readonly [number, string]) => Effect.sync(() => arr.push(pair)),
        );
        yield* Fx.zip(Fx.fromIterable([1, 2, 3]), Fx.fromIterable(["a", "b", "c", "d"])).run(sink);
        assert.deepStrictEqual(arr, [
          [1, "a"],
          [2, "b"],
          [3, "c"],
        ]);
      }).pipe(Effect.runPromise));

    it("emits pairs in lockstep; completes when first stream completes", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2, 3]);
        const right = Fx.fromIterable(["a", "b", "c", "d"]);
        const result = yield* Fx.collectAll(Fx.zip(left, right));
        assert.deepStrictEqual(result, [
          [1, "a"],
          [2, "b"],
          [3, "c"],
        ]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("completes when right is shorter than left", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2, 3, 4]);
        const right = Fx.fromIterable(["a", "b"]);
        const result = yield* Fx.collectAll(Fx.zip(left, right));
        assert.deepStrictEqual(result, [
          [1, "a"],
          [2, "b"],
        ]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-last form: pipe(self, Fx.zip(that))", () =>
      Effect.gen(function* () {
        const result = yield* Fx.fromIterable([1, 2]).pipe(
          Fx.zip(Fx.fromIterable(["x", "y"])),
          Fx.collectAll,
        );
        assert.deepStrictEqual(result, [
          [1, "x"],
          [2, "y"],
        ]);
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("zipWith", () => {
    it("emits f(a,b) in lockstep", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2, 3]);
        const right = Fx.fromIterable([10, 20, 30]);
        const result = yield* Fx.collectAll(Fx.zipWith(left, right, (a, b) => a + b));
        assert.deepStrictEqual(result, [11, 22, 33]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("completes when first stream completes", () =>
      Effect.gen(function* () {
        const result = yield* Fx.collectAll(
          Fx.zipWith(Fx.fromIterable([1, 2, 3]), Fx.fromIterable([0, 0]), (a, b) => a + b),
        );
        assert.deepStrictEqual(result, [1, 2]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-last form: pipe(self, Fx.zipWith(that, f))", () =>
      Effect.gen(function* () {
        const result = yield* Fx.fromIterable(["a", "b"]).pipe(
          Fx.zipWith(Fx.fromIterable([1, 2]), (s, n) => `${s}${n}`),
          Fx.collectAll,
        );
        assert.deepStrictEqual(result, ["a1", "b2"]);
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("zipLatest", () => {
    it("waits for both to emit once then emits on every update from either", () =>
      Effect.gen(function* () {
        const left = Fx.fromIterable([1, 2, 3]);
        const right = Fx.fromIterable(["a", "b"]);
        const result = yield* Fx.collectAll(Fx.zipLatest(left, right));
        // tuple runs both streams; emission order depends on scheduling.
        assert.ok(result.length >= 2, "at least two emissions");
        assert.ok(
          result.some((p) => p[0] === 3 && p[1] === "b"),
          "should contain [3, 'b']",
        );
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-last form: pipe(self, Fx.zipLatest(that))", () =>
      Effect.gen(function* () {
        const result = yield* Fx.fromIterable([1, 2]).pipe(
          Fx.zipLatest(Fx.fromIterable(["a", "b"])),
          Fx.collectAll,
        );
        assert.ok(result.length >= 2);
        assert.deepStrictEqual(result[result.length - 1], [2, "b"]);
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("zipLatestWith", () => {
    it("emits f(left, right) on every update from either stream", () =>
      Effect.gen(function* () {
        const result = yield* Fx.collectAll(
          Fx.zipLatestWith(Fx.fromIterable([1, 2]), Fx.fromIterable([10, 20]), (a, b) => a + b),
        );
        assert.ok(result.length >= 2);
        // First emission depends on which stream fills first (1+10=11 or 2+10=12 or 1+20=21)
        assert.ok([11, 12, 21, 22].includes(result[0]));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-last form: pipe(self, Fx.zipLatestWith(that, f))", () =>
      Effect.gen(function* () {
        const result = yield* Fx.fromIterable([1, 2]).pipe(
          Fx.zipLatestWith(Fx.fromIterable(["a", "b"]), (n, s) => `${n}${s}`),
          Fx.collectAll,
        );
        assert.ok(result.length >= 2);
        // First emission is combined first values; last includes latest from both
        assert.ok(
          result.includes("1a") || result.includes("2a") || result.includes("2b"),
          "should contain a combined pair",
        );
        assert.ok(result.includes("2b"), "should contain final pair 2b");
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
