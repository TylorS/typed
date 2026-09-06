import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import { TestClock } from "effect/testing";
import { Fx } from "../index.js";

const testClock = TestClock.layer();

describe("Fx delay", () => {
  it("waits the given duration before each emission", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(Fx.fromIterable([1, 2]).pipe(Fx.delay(50))),
      );
      yield* TestClock.adjust(100);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 2]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("supports dual argument order (fx, duration)", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(Fx.collectAll(Fx.delay(Fx.succeed(7), 10)));
      yield* TestClock.adjust(10);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [7]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx debounce", () => {
  it("emits only the latest value after the quiet window", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 10), Fx.at(3, 30)).pipe(Fx.debounce(20))),
      );
      yield* TestClock.adjust(55);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [3]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx throttle", () => {
  it("emits the leading value and suppresses values until the window ends", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 40), Fx.at(3, 120)).pipe(Fx.throttle(100))),
      );
      yield* TestClock.adjust(250);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 3]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("emits the last value at the end of each window when trailing", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 40), Fx.at(3, 120)).pipe(
        Fx.throttle({ duration: 100, leading: false, trailing: true }),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(250);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [2, 3]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("emits both edges when leading and trailing are enabled", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 40), Fx.at(3, 120)).pipe(
        Fx.throttle({ duration: 100, leading: true, trailing: true }),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(250);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 2, 3]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx since", () => {
  it("forwards emissions that occur after the signal has fired", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(Fx.mergeAll(Fx.at(1, 100), Fx.at(2, 200)).pipe(Fx.since(Fx.at("go", 0)))),
      );
      yield* TestClock.adjust(300);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 2]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("drops emissions that occur before the signal", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 50)).pipe(Fx.since(Fx.at("go", 150)))),
      );
      yield* TestClock.adjust(200);
      assert.deepStrictEqual(yield* Fiber.join(fiber), []);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("forwards emissions that occur after a delayed signal", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(
          Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 50), Fx.at(3, 200)).pipe(Fx.since(Fx.at("go", 100))),
        ),
      );
      yield* TestClock.adjust(250);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [3]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx until", () => {
  it("completes successfully when a synchronous signal wins", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        Fx.collectAll(Fx.until(Fx.fromIterable([1, 2, 3]), Fx.succeed("stop"))),
      );
      assert(Exit.isSuccess(exit));
      assert.deepStrictEqual(exit.value, []);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("forwards values before a delayed signal and stops before later values", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(
          Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 100), Fx.at(3, 300)).pipe(Fx.until(Fx.at("stop", 200))),
        ),
      );
      yield* TestClock.adjust(400);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 2]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("lets a finite event source complete when the signal is empty", () =>
    Effect.gen(function* () {
      const result = yield* Fx.collectAll(Fx.until(Fx.fromIterable([1, 2, 3]), Fx.empty));
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("forwards a synchronous signal failure", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(Fx.collectAll(Fx.until(Fx.never, Fx.fail("signal-error"))));
      assert(Exit.isFailure(exit));
      assert.strictEqual(Option.getOrThrow(Cause.findErrorOption(exit.cause)), "signal-error");
    }).pipe(Effect.scoped, Effect.runPromise));

  it(
    "forwards a source signal interruption with its interruptor identity",
    () =>
      Effect.gen(function* () {
        const sourceInterruptor = 4242;
        const exit = yield* Effect.exit(
          Fx.collectAll(Fx.until(Fx.never, Fx.interrupt(sourceInterruptor))),
        );

        assert(Exit.isFailure(exit));
        assert.deepStrictEqual(Cause.interruptors(exit.cause), new Set([sourceInterruptor]));
      }).pipe(Effect.scoped, Effect.runPromise),
    500,
  );

  it("does not report coordinator cancellation of the signal after events complete", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(Fx.collectAll(Fx.until(Fx.fromIterable([1, 2]), Fx.never)));

      assert(Exit.isSuccess(exit));
      assert.deepStrictEqual(exit.value, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("forwards a synchronous event failure", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(Fx.collectAll(Fx.until(Fx.fail("event-error"), Fx.never)));
      assert(Exit.isFailure(exit));
      assert.strictEqual(Option.getOrThrow(Cause.findErrorOption(exit.cause)), "event-error");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("runs event and signal finalizers exactly once on external interruption", () =>
    Effect.gen(function* () {
      const eventsStarted = yield* Deferred.make<void>();
      const signalStarted = yield* Deferred.make<void>();
      const eventFinalizers = yield* Ref.make(0);
      const signalFinalizers = yield* Ref.make(0);
      const events = Fx.fromEffect(
        Deferred.succeed(eventsStarted, undefined).pipe(Effect.andThen(Effect.never)),
      ).pipe(Fx.ensuring(Ref.update(eventFinalizers, (count) => count + 1)));
      const signal = Fx.fromEffect(
        Deferred.succeed(signalStarted, undefined).pipe(Effect.andThen(Effect.never)),
      ).pipe(Fx.ensuring(Ref.update(signalFinalizers, (count) => count + 1)));
      const fiber = yield* Effect.forkScoped(Fx.collectAll(Fx.until(events, signal)));

      yield* Deferred.await(eventsStarted);
      yield* Deferred.await(signalStarted);
      yield* Fiber.interrupt(fiber);

      assert.strictEqual(yield* Ref.get(eventFinalizers), 1);
      assert.strictEqual(yield* Ref.get(signalFinalizers), 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("has identical runtime behavior in curried and uncurried forms", () =>
    Effect.gen(function* () {
      const events = Fx.fromIterable([1, 2, 3]);
      const signal = Fx.succeed("stop");
      const [uncurried, curried] = yield* Effect.all([
        Fx.collectAll(Fx.until(events, signal)),
        Fx.collectAll(events.pipe(Fx.until(signal))),
      ]);

      assert.deepStrictEqual(uncurried, []);
      assert.deepStrictEqual(curried, uncurried);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx during", () => {
  it("forwards events only between the first signal and the first inner emission", () =>
    Effect.gen(function* () {
      const signals = Fx.succeed(Fx.at(0, 100));
      const events = Fx.mergeAll(Fx.at("a", 10), Fx.at("b", 20), Fx.at("c", 500));
      const fiber = yield* Effect.forkScoped(Fx.collectUpTo(Fx.during(events, signals), 2));
      yield* TestClock.adjust(250);
      assert.deepStrictEqual(yield* Fiber.join(fiber), ["a", "b"]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("keeps the original event timeline while waiting for a delayed start", () =>
    Effect.gen(function* () {
      const signals = Fx.at(Fx.at("stop", 100), 100);
      const events = Fx.mergeAll(Fx.at("before", 50), Fx.at("during", 150), Fx.at("after", 250));
      const fiber = yield* Effect.forkScoped(Fx.collectAll(Fx.during(events, signals)));

      yield* TestClock.adjust(300);
      assert.deepStrictEqual(yield* Fiber.join(fiber), ["during"]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("completes successfully when synchronous start and stop signals win", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        Fx.collectAll(Fx.during(Fx.fromIterable([1, 2, 3]), Fx.succeed(Fx.succeed("stop")))),
      );

      assert(Exit.isSuccess(exit));
      assert.deepStrictEqual(exit.value, []);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("drops finite events when the outer signal is empty", () =>
    Effect.gen(function* () {
      const result = yield* Fx.collectAll(Fx.during(Fx.fromIterable([1, 2, 3]), Fx.empty));
      assert.deepStrictEqual(result, []);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses only the first outer signal to select the stop signal", () =>
    Effect.gen(function* () {
      const signals = Fx.fromIterable([Fx.at("first-stop", 100), Fx.succeed("second-stop")]);
      const events = Fx.mergeAll(Fx.at("a", 10), Fx.at("b", 50));
      const fiber = yield* Effect.forkScoped(Fx.collectAll(Fx.during(events, signals)));

      yield* TestClock.adjust(150);
      assert.deepStrictEqual(yield* Fiber.join(fiber), ["a", "b"]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("preserves outer, inner, and event failures", () =>
    Effect.gen(function* () {
      const exits = yield* Effect.all([
        Effect.exit(Fx.collectAll(Fx.during(Fx.never, Fx.fail("outer-error")))),
        Effect.exit(Fx.collectAll(Fx.during(Fx.never, Fx.succeed(Fx.fail("inner-error"))))),
        Effect.exit(Fx.collectAll(Fx.during(Fx.fail("event-error"), Fx.succeed(Fx.never)))),
      ]);

      assert.deepStrictEqual(
        exits.map((exit) =>
          Exit.isFailure(exit) ? Option.getOrThrow(Cause.findErrorOption(exit.cause)) : null,
        ),
        ["outer-error", "inner-error", "event-error"],
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("runs event, outer-signal, and inner-signal finalizers once on interruption", () =>
    Effect.gen(function* () {
      const eventsStarted = yield* Deferred.make<void>();
      const innerStarted = yield* Deferred.make<void>();
      const eventFinalizers = yield* Ref.make(0);
      const outerFinalizers = yield* Ref.make(0);
      const innerFinalizers = yield* Ref.make(0);
      const events = Fx.fromEffect(
        Deferred.succeed(eventsStarted, undefined).pipe(Effect.andThen(Effect.never)),
      ).pipe(Fx.ensuring(Ref.update(eventFinalizers, (count) => count + 1)));
      const inner = Fx.fromEffect(
        Deferred.succeed(innerStarted, undefined).pipe(Effect.andThen(Effect.never)),
      ).pipe(Fx.ensuring(Ref.update(innerFinalizers, (count) => count + 1)));
      const signals = Fx.succeed(inner).pipe(
        Fx.ensuring(Ref.update(outerFinalizers, (count) => count + 1)),
      );
      const fiber = yield* Effect.forkScoped(Fx.collectAll(Fx.during(events, signals)));

      yield* Deferred.await(eventsStarted);
      yield* Deferred.await(innerStarted);
      yield* Fiber.interrupt(fiber);

      assert.strictEqual(yield* Ref.get(eventFinalizers), 1);
      assert.strictEqual(yield* Ref.get(outerFinalizers), 1);
      assert.strictEqual(yield* Ref.get(innerFinalizers), 1);
    }).pipe(Effect.scoped, Effect.runPromise));
});
