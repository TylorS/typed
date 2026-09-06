import { expect, it } from "vitest";
import { Deferred, Effect, Fiber, Scheduler } from "effect";
import { Fx, RefSubject } from "../index.js";

it("isolates concurrent computed subscriptions provided with different service Layers", () =>
  Effect.gen(function* () {
    class Value extends RefSubject.Service<Value, string>()("test/ComputedOwnership") {}
    const computed = RefSubject.map(Value, (value) => value.toUpperCase());
    const firstReady = yield* Deferred.make<void>();
    const secondReady = yield* Deferred.make<void>();
    const first: string[] = [];
    const second: string[] = [];

    yield* Effect.forkScoped(
      Fx.observe(computed, (value) =>
        Effect.sync(() => first.push(value)).pipe(Effect.andThen(Deferred.succeed(firstReady, undefined))),
      ).pipe(Effect.provide(Value.make("first"))),
    );
    yield* Deferred.await(firstReady);
    yield* Effect.forkScoped(
      Fx.observe(computed, (value) =>
        Effect.sync(() => second.push(value)).pipe(Effect.andThen(Deferred.succeed(secondReady, undefined))),
      ).pipe(Effect.provide(Value.make("second"))),
    );
    yield* Deferred.await(secondReady);

    expect(first).toEqual(["FIRST"]);
    expect(second).toEqual(["SECOND"]);
  }).pipe(Effect.scoped, Effect.runPromise));

it.each([4, 2048])(
  "does not deadlock when a cold current read races its first update (%i operations)",
  (maxOps) =>
    Effect.gen(function* () {
      const value = yield* RefSubject.make(0);
      const reading = yield* Effect.forkScoped(value, { startImmediately: true });
      const result = yield* Effect.race(
        RefSubject.update(value, (n) => n + 1).pipe(Effect.as("updated")),
        Effect.sleep("100 millis").pipe(Effect.as("timed out")),
      );
      expect(result).toBe("updated");
      yield* Fiber.join(reading);
      expect(yield* value).toBe(1);
    }).pipe(
      Effect.provideService(Scheduler.MaxOpsBeforeYield, maxOps),
      Effect.scoped,
      Effect.runPromise,
    ),
);

it("reinitializes after resetting a synchronously completed initializer", () =>
  Effect.gen(function* () {
    let initialized = 0;
    const value = yield* RefSubject.make(Effect.sync(() => ++initialized));
    expect(yield* value).toBe(1);
    yield* RefSubject.reset(value);
    const current = yield* Effect.race(
      value,
      Effect.sleep("100 millis").pipe(Effect.as("timed out")),
    );
    expect(current).toBe(2);
    expect(initialized).toBe(2);
  }).pipe(Effect.scoped, Effect.runPromise));

it("shares an asynchronous initializer while concurrent reads and updates wait", () =>
  Effect.gen(function* () {
    let initialized = 0;
    const started = yield* Deferred.make<void>();
    const release = yield* Deferred.make<void>();
    const value = yield* RefSubject.make(
      Effect.sync(() => initialized++).pipe(
        Effect.andThen(Deferred.succeed(started, undefined)),
        Effect.andThen(Deferred.await(release)),
        Effect.as(0),
      ),
    );
    const firstRead = yield* Effect.forkScoped(value, { startImmediately: true });
    yield* Deferred.await(started);
    const secondRead = yield* Effect.forkScoped(value, { startImmediately: true });
    const update = yield* Effect.forkScoped(RefSubject.update(value, (n) => n + 1), {
      startImmediately: true,
    });
    expect(initialized).toBe(1);
    expect(firstRead.pollUnsafe()).toBeUndefined();
    expect(secondRead.pollUnsafe()).toBeUndefined();
    expect(update.pollUnsafe()).toBeUndefined();
    yield* Deferred.succeed(release, undefined);
    expect(yield* Fiber.join(update)).toBe(1);
    yield* Fiber.join(firstRead);
    yield* Fiber.join(secondRead);
    expect(yield* value).toBe(1);
    expect(initialized).toBe(1);
  }).pipe(Effect.scoped, Effect.runPromise));
