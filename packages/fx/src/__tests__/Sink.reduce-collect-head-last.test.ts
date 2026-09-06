import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import { Fx, Sink } from "../index.js";

describe("Sink.reduce", () => {
  it("reduces values with pure function", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make(0);
      const sink = Sink.reduce(ref, (acc: number, n: number) => acc + n);
      yield* Fx.fromIterable([1, 2, 3]).run(sink);
      const result = yield* Ref.get(ref);
      assert.strictEqual(result, 6);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses initial value when no elements", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make(10);
      const sink = Sink.reduce(ref, (acc: number, n: number) => acc + n);
      yield* Fx.fromIterable<number>([]).run(sink);
      const result = yield* Ref.get(ref);
      assert.strictEqual(result, 10);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Sink.reduceEffect", () => {
  it("reduces values with effectful function", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make(0);
      const sink = Sink.reduceEffect(ref, (acc: number, n: number) => Effect.succeed(acc + n));
      yield* Fx.fromIterable([1, 2, 3]).run(sink);
      const result = yield* Ref.get(ref);
      assert.strictEqual(result, 6);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("skips step when reducer effect fails, continues with rest", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make(0);
      const sink = Sink.reduceEffect(ref, (acc: number, n: number) =>
        n === 2 ? Effect.fail("skip") : Effect.succeed(acc + n),
      );
      yield* Fx.fromIterable([1, 2, 3]).run(sink);
      const result = yield* Ref.get(ref);
      assert.strictEqual(result, 4);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Sink.collect", () => {
  it("collects all values into array", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make<ReadonlyArray<number>>([]);
      const sink = Sink.collect(ref);
      yield* Fx.fromIterable([1, 2, 3]).run(sink);
      const result = yield* Ref.get(ref);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("returns empty array when no elements", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make<ReadonlyArray<number>>([]);
      const sink = Sink.collect(ref);
      yield* Fx.fromIterable<number>([]).run(sink);
      const result = yield* Ref.get(ref);
      assert.deepStrictEqual(result, []);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Sink.head", () => {
  it("keeps only first value", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make(Option.none<number>());
      const sink = Sink.head(ref);
      yield* Fx.fromIterable([1, 2, 3]).run(sink);
      const result = yield* Ref.get(ref);
      assert.deepStrictEqual(result, Option.some(1));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("remains none when no elements", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make(Option.none<number>());
      const sink = Sink.head(ref);
      yield* Fx.fromIterable<number>([]).run(sink);
      const result = yield* Ref.get(ref);
      assert.deepStrictEqual(result, Option.none());
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Sink.last", () => {
  it("keeps only last value", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make(Option.none<number>());
      const sink = Sink.last(ref);
      yield* Fx.fromIterable([1, 2, 3]).run(sink);
      const result = yield* Ref.get(ref);
      assert.deepStrictEqual(result, Option.some(3));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("remains none when no elements", () =>
    Effect.gen(function* () {
      const ref = yield* Ref.make(Option.none<number>());
      const sink = Sink.last(ref);
      yield* Fx.fromIterable<number>([]).run(sink);
      const result = yield* Ref.get(ref);
      assert.deepStrictEqual(result, Option.none());
    }).pipe(Effect.scoped, Effect.runPromise));
});
