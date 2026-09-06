import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Ref from "effect/Ref";
import * as Schedule from "effect/Schedule";
import { TestClock } from "effect/testing";
import { Fx } from "../index.js";

const testClock = TestClock.layer();

describe("Fx.switchMap", () => {
  it("switches to the latest inner stream and cancels the previous one", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3]).pipe(
        Fx.switchMap((n) => Fx.fromIterable([n, n * 2])),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [3, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.concatMap", () => {
  it("runs inner streams sequentially", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3]).pipe(
        Fx.concatMap((n) => Fx.fromIterable([n, n * 10])),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [1, 10, 2, 20, 3, 30]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not start the next inner until the previous completes", () =>
    Effect.gen(function* () {
      const seen = yield* Ref.make<Array<number>>([]);
      const fiber = yield* Fx.fromIterable([1, 2]).pipe(
        Fx.concatMap((n) =>
          Ref.update(seen, (xs) => [...xs, n]).pipe(Effect.as(Fx.at(n, 50)), Fx.unwrap),
        ),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(25);
      assert.deepStrictEqual(yield* Ref.get(seen), [1]);
      yield* TestClock.adjust(50);
      assert.deepStrictEqual(yield* Ref.get(seen), [1, 2]);
      yield* TestClock.adjust(50);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 2]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("concatMapEffect is sequential", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3]).pipe(
        Fx.concatMapEffect((n) => Effect.succeed(n * 2)),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [2, 4, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.withLatestFrom", () => {
  it("emits only when the source emits, using the latest other value", () =>
    Effect.gen(function* () {
      const source = Fx.mergeAll(Fx.at("a", 20), Fx.at("b", 40));
      const other = Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 30));
      const fiber = yield* source.pipe(Fx.withLatestFrom(other), Fx.collectAll, Effect.forkScoped);
      yield* TestClock.adjust(50);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [
        ["a", 1],
        ["b", 2],
      ]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("drops source values before the other stream has emitted", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.at("early", 0).pipe(
        Fx.withLatestFrom(Fx.at(1, 10)),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(20);
      assert.deepStrictEqual(yield* Fiber.join(fiber), []);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("does not emit when only the other stream updates", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.at("once", 0).pipe(
        Fx.withLatestFrom(Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 10))),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(20);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [["once", 1]]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("withLatestFromWith combines the pair", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable(["a", "b"]).pipe(
        Fx.withLatestFromWith(Fx.succeed(1), (s, n) => `${s}${n}`),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, ["a1", "b1"]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.race / raceAll", () => {
  it("mirrors the first stream to emit and interrupts the other", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.at(1, 100).pipe(
        Fx.race(Fx.mergeAll(Fx.at(2, 10), Fx.at(3, 20))),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(150);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [2, 3]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("does not let an empty stream win against a later emitter", () =>
    Effect.gen(function* () {
      const result = yield* Fx.empty.pipe(Fx.race(Fx.fromIterable([0, 1, 2])), Fx.collectAll);
      assert.deepStrictEqual(result, [0, 1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not let an early failure win against a later emitter", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.fail("boom").pipe(
        Fx.race(Fx.at(1, 10)),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(20);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("fails when every side fails without emitting", () =>
    Effect.gen(function* () {
      const exit = yield* Fx.fail("a").pipe(Fx.race(Fx.fail("b")), Fx.collectAll, Effect.exit);
      assert(Exit.isFailure(exit));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("raceAll picks the first emitter among many", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.raceAll(Fx.at("slow", 50), Fx.at("fast", 5), Fx.at("mid", 20)).pipe(
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(60);
      assert.deepStrictEqual(yield* Fiber.join(fiber), ["fast"]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx.retry / repeat", () => {
  it("retries typed failures according to the schedule", () =>
    Effect.gen(function* () {
      const attempts = yield* Ref.make(0);
      const result = yield* Effect.gen(function* () {
        const n = yield* Ref.updateAndGet(attempts, (x) => x + 1);
        return n < 3 ? Fx.fail("boom") : Fx.succeed(n);
      }).pipe(Fx.unwrap, Fx.retry(Schedule.recurs(2)), Fx.collectAll);
      assert.deepStrictEqual(result, [3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not retry defects", () =>
    Effect.gen(function* () {
      const exit = yield* Fx.die("boom").pipe(
        Fx.retry(Schedule.recurs(3)),
        Fx.collectAll,
        Effect.exit,
      );
      assert(Exit.isFailure(exit));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("resets the schedule after an attempt emits", () =>
    Effect.gen(function* () {
      const result = yield* Fx.concat(Fx.succeed(1), Fx.fail("boom")).pipe(
        Fx.retry(Schedule.recurs(1)),
        Fx.take(3),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [1, 1, 1]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("repeats a successful stream according to the schedule", () =>
    Effect.gen(function* () {
      const result = yield* Fx.succeed(1).pipe(Fx.repeat(Schedule.recurs(4)), Fx.collectAll);
      assert.deepStrictEqual(result, [1, 1, 1, 1, 1]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not repeat after a failure", () =>
    Effect.gen(function* () {
      const exit = yield* Fx.concat(Fx.succeed(1), Fx.fail("boom")).pipe(
        Fx.repeat(Schedule.recurs(3)),
        Fx.collectAll,
        Effect.exit,
      );
      assert(Exit.isFailure(exit));
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.timeout / timeoutTo", () => {
  it("completes when the source goes idle longer than the duration", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.concat(Fx.succeed(1), Fx.never).pipe(
        Fx.timeout(50),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(50);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("timeoutTo switches to the fallback on idle timeout", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.concat(Fx.succeed(1), Fx.never).pipe(
        Fx.timeoutTo(50, Fx.succeed(99)),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(50);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 99]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("zero duration completes immediately", () =>
    Effect.gen(function* () {
      const result = yield* Fx.succeed(1).pipe(Fx.timeout(0), Fx.collectAll);
      assert.deepStrictEqual(result, []);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.grouped / groupedWithin", () => {
  it("groups values into arrays of n, with a leftover tail", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]).pipe(
        Fx.grouped(3),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8],
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("groupedWithin emits when size is reached or the window ends", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 10), Fx.at(3, 80)).pipe(
        Fx.groupedWithin(10, 50),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(100);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [[1, 2], [3]]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

});

describe("Fx.sample", () => {
  it("emits the latest source value when the sampler ticks", () =>
    Effect.gen(function* () {
      const source = Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 20), Fx.at(3, 40));
      const sampler = Fx.mergeAll(Fx.at(null, 15), Fx.at(null, 35));
      const fiber = yield* source.pipe(Fx.sample(sampler), Fx.collectAll, Effect.forkScoped);
      yield* TestClock.adjust(50);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 2]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("emits nothing if the sampler ticks before any source value", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.at(1, 20).pipe(
        Fx.sample(Fx.at(null, 0)),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(30);
      assert.deepStrictEqual(yield* Fiber.join(fiber), []);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx.pairwise", () => {
  it("emits consecutive pairs", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3, 4]).pipe(Fx.pairwise, Fx.collectAll);
      assert.deepStrictEqual(result, [
        [1, 2],
        [2, 3],
        [3, 4],
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits nothing for a single-element stream", () =>
    Effect.gen(function* () {
      const result = yield* Fx.succeed(1).pipe(Fx.pairwise, Fx.collectAll);
      assert.deepStrictEqual(result, []);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.suspend / withSpan", () => {
  it("suspend delays constructing the inner Fx", () =>
    Effect.gen(function* () {
      let constructed = 0;
      const fx = Fx.suspend(() => {
        constructed += 1;
        return Fx.succeed(1);
      });
      assert.strictEqual(constructed, 0);
      assert.deepStrictEqual(yield* fx.pipe(Fx.collectAll), [1]);
      assert.strictEqual(constructed, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("withSpan is pipeable and preserves values", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2]).pipe(Fx.withSpan("collect"), Fx.collectAll);
      assert.deepStrictEqual(result, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
