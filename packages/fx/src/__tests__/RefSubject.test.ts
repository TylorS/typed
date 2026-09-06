import { describe, expect, it } from "vitest";
import { Deferred, Effect, Fiber } from "effect";
import { TestClock } from "effect/testing";
import { Fx, RefSubject } from "../index.js";

function awaitSubscriberCount<R>(
  subject: { readonly subscriberCount: Effect.Effect<number, never, R> },
  expected: number,
) {
  return Effect.race(
    Effect.gen(function* () {
      while ((yield* subject.subscriberCount) !== expected) {
        yield* Effect.yieldNow;
      }

      return true as const;
    }),
    Effect.sleep("250 millis").pipe(Effect.as(false as const)),
  ).pipe(
    Effect.flatMap((ready) =>
      ready
        ? Effect.void
        : Effect.die(new Error(`Timed out waiting for ${expected} RefSubject subscribers`)),
    ),
  );
}

class TransactionService extends RefSubject.Service<TransactionService, number>()(
  "@typed/fx/test/TransactionService",
) {}

class TransactionTrigger extends RefSubject.Service<TransactionTrigger, number>()(
  "@typed/fx/test/TransactionTrigger",
) {}

describe("RefSubject", () => {
  it("samples service values consistently through Effect and computed views", () =>
    Effect.gen(function* () {
      class Items extends RefSubject.Service<Items, ReadonlyArray<string>>()(
        "@typed/fx/test/Items",
      ) {}

      for (const initial of [["first"], Effect.succeed(["first"])] as const) {
        yield* Effect.gen(function* () {
          const count = RefSubject.map(Items, (items) => items.length);
          expect(yield* Items).toEqual(["first"]);
          expect(yield* Effect.map(Items, (items) => items.length)).toBe(1);
          expect(yield* count).toBe(1);
          expect(yield* Fx.collectAll(Fx.take(count, 1))).toEqual([1]);
          yield* RefSubject.set(Items, ["first", "second"]);
          expect(yield* count).toBe(2);
          expect(yield* Effect.map(Items, (items) => items.length)).toBe(2);
        }).pipe(Effect.provide(Items.make(initial)));
      }
    }).pipe(Effect.scoped, Effect.runPromise));

  it("tracks an initial value", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      expect(yield* ref).toEqual(0);

      // Can be updated
      expect(yield* ref.pipe(RefSubject.update((n) => n + 1))).toEqual(1);
      expect(yield* ref).toEqual(1);

      // Can be reset
      yield* RefSubject.reset(ref);
      expect(yield* ref).toEqual(0);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("tracks an initial effect", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(
        Effect.callback<number>((resume) => {
          const id = setTimeout(() => resume(Effect.succeed(1)), 100);
          return Effect.sync(() => clearTimeout(id));
        }),
      );
      const fiber = yield* Effect.forkChild(ref);
      expect(yield* Fiber.join(fiber)).toEqual(1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("allows an observer to update the same RefSubject", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      const seen: number[] = [];
      yield* Effect.forkScoped(
        Fx.observe(ref, (value) =>
          Effect.sync(() => seen.push(value)).pipe(
            Effect.andThen(value === 1 ? RefSubject.set(ref, 2) : Effect.void),
          ),
        ),
      );
      yield* awaitSubscriberCount(ref, 1);

      const outcome = yield* Effect.race(
        RefSubject.set(ref, 1).pipe(Effect.as("done" as const)),
        Effect.sleep("250 millis").pipe(Effect.as("timeout" as const)),
      );
      expect(outcome).toBe("done");
      expect(yield* ref).toBe(2);
      expect(seen.slice(-2)).toEqual([1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("publishes accepted updates after the critical section in commit order", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      const observed: Array<readonly [number, boolean]> = [];
      let inCriticalSection = false;

      yield* Effect.forkScoped(
        Fx.observe(ref, (value) =>
          Effect.sync(() => {
            if (value !== 0) observed.push([value, inCriticalSection]);
          }),
        ),
      );
      yield* awaitSubscriberCount(ref, 1);

      yield* ref.updates((transaction) =>
        Effect.gen(function* () {
          inCriticalSection = true;
          yield* transaction.set(1);
          yield* transaction.set(2);
          inCriticalSection = false;
        }),
      );

      expect(observed).toEqual([
        [1, false],
        [2, false],
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("publishes an accepted set before restoring the original failure", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      const observed: number[] = [];
      const originalFailure = { _tag: "OriginalFailure" } as const;

      yield* Effect.forkScoped(Fx.observe(ref, (value) => Effect.sync(() => observed.push(value))));
      yield* awaitSubscriberCount(ref, 1);

      const failure = yield* Effect.flip(
        ref.updates((transaction) =>
          transaction.set(1).pipe(Effect.andThen(Effect.fail(originalFailure))),
        ),
      );

      expect(failure).toBe(originalFailure);
      expect(yield* ref).toBe(1);
      expect(observed.at(-1)).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("publishes accepted state before restoring external interruption", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      const observed: number[] = [];
      const accepted = yield* Deferred.make<void>();

      yield* Effect.forkScoped(Fx.observe(ref, (value) => Effect.sync(() => observed.push(value))));
      yield* awaitSubscriberCount(ref, 1);

      const fiber = yield* Effect.forkScoped(
        ref.updates((transaction) =>
          Effect.gen(function* () {
            yield* transaction.set(1);
            yield* Deferred.succeed(accepted, undefined);
            return yield* Effect.never;
          }),
        ),
      );
      yield* Deferred.await(accepted);
      yield* Fiber.interrupt(fiber);

      expect(yield* ref).toBe(1);
      expect(observed.at(-1)).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("keeps concurrent ordinary updates serialized", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      const updateCount = 32;

      const results = yield* Effect.all(
        Array.from({ length: updateCount }, () => RefSubject.update(ref, (value) => value + 1)),
        { concurrency: "unbounded" },
      );

      expect([...results].sort((left, right) => left - right)).toEqual(
        Array.from({ length: updateCount }, (_, index) => index + 1),
      );
      expect(yield* ref).toBe(updateCount);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("serializes concurrent tuple transactions", () =>
    Effect.gen(function* () {
      const left = yield* RefSubject.make(0);
      const right = yield* RefSubject.make(0);
      const tuple = RefSubject.tuple([left, right]);
      const overlappingTuple = RefSubject.tuple([left, right]);
      const firstEntered = yield* Deferred.make<void>();
      const releaseFirst = yield* Deferred.make<void>();
      const secondEntered = yield* Deferred.make<void>();

      const first = yield* Effect.forkScoped(
        tuple.updates((transaction) =>
          Effect.gen(function* () {
            yield* Deferred.succeed(firstEntered, undefined);
            yield* Deferred.await(releaseFirst);
            const current = yield* transaction.get;
            yield* transaction.set([current[0] + 1, current[1] + 1]);
          }),
        ),
        { startImmediately: true },
      );
      yield* Deferred.await(firstEntered);

      const second = yield* Effect.forkScoped(
        overlappingTuple.updates((transaction) =>
          Effect.gen(function* () {
            yield* Deferred.succeed(secondEntered, undefined);
            const current = yield* transaction.get;
            yield* transaction.set([current[0] + 1, current[1] + 1]);
          }),
        ),
        { startImmediately: true },
      );

      expect(yield* Deferred.isDone(secondEntered)).toBe(false);
      yield* Deferred.succeed(releaseFirst, undefined);
      yield* Fiber.join(first);
      yield* Fiber.join(second);

      expect(yield* tuple).toEqual([2, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("serializes concurrent struct transactions", () =>
    Effect.gen(function* () {
      const left = yield* RefSubject.make(0);
      const right = yield* RefSubject.make(0);
      const struct = RefSubject.struct({ left, right });
      const overlappingStruct = RefSubject.struct({ left, right });
      const firstEntered = yield* Deferred.make<void>();
      const releaseFirst = yield* Deferred.make<void>();
      const secondEntered = yield* Deferred.make<void>();

      const first = yield* Effect.forkScoped(
        struct.updates((transaction) =>
          Effect.gen(function* () {
            yield* Deferred.succeed(firstEntered, undefined);
            yield* Deferred.await(releaseFirst);
            const current = yield* transaction.get;
            yield* transaction.set({ left: current.left + 1, right: current.right + 1 });
          }),
        ),
        { startImmediately: true },
      );
      yield* Deferred.await(firstEntered);

      const second = yield* Effect.forkScoped(
        overlappingStruct.updates((transaction) =>
          Effect.gen(function* () {
            yield* Deferred.succeed(secondEntered, undefined);
            const current = yield* transaction.get;
            yield* transaction.set({ left: current.left + 1, right: current.right + 1 });
          }),
        ),
        { startImmediately: true },
      );

      expect(yield* Deferred.isDone(secondEntered)).toBe(false);
      yield* Deferred.succeed(releaseFirst, undefined);
      yield* Fiber.join(first);
      yield* Fiber.join(second);

      expect(yield* struct).toEqual({ left: 2, right: 2 });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("serializes package-owned transformed views of the same RefSubject", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      const numericView = RefSubject.tuple([RefSubject.slice(ref, 0, Infinity)]);
      const stringView = RefSubject.tuple([
        RefSubject.transform(
          ref,
          (value) => value.toString(),
          (value) => Number(value),
        ),
      ]);
      const firstEntered = yield* Deferred.make<void>();
      const releaseFirst = yield* Deferred.make<void>();
      const secondEntered = yield* Deferred.make<void>();

      const first = yield* Effect.forkScoped(
        numericView.updates((transaction) =>
          Effect.gen(function* () {
            yield* Deferred.succeed(firstEntered, undefined);
            yield* Deferred.await(releaseFirst);
            const [value] = yield* transaction.get;
            yield* transaction.set([value + 1]);
          }),
        ),
        { startImmediately: true },
      );
      yield* Deferred.await(firstEntered);

      const second = yield* Effect.forkScoped(
        stringView.updates((transaction) =>
          Effect.gen(function* () {
            yield* Deferred.succeed(secondEntered, undefined);
            const [value] = yield* transaction.get;
            yield* transaction.set([(Number(value) + 1).toString()]);
          }),
        ),
        { startImmediately: true },
      );

      expect(yield* Deferred.isDone(secondEntered)).toBe(false);
      yield* Deferred.succeed(releaseFirst, undefined);
      yield* Fiber.join(first);
      yield* Fiber.join(second);

      expect(yield* ref).toBe(2);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves empty tuple and struct values", () =>
    Effect.gen(function* () {
      expect(yield* RefSubject.tuple([])).toEqual([]);
      expect(yield* RefSubject.struct({})).toEqual({});
    }).pipe(Effect.scoped, Effect.runPromise));

  it("publishes tuple and struct transactions as complete snapshots", () =>
    Effect.gen(function* () {
      const left = yield* RefSubject.make(0);
      const right = yield* RefSubject.make(0);
      const tuple = RefSubject.tuple([left, right]);
      const struct = RefSubject.struct({ left, right });
      const tupleValues: ReadonlyArray<number>[] = [];
      const structValues: Array<{ readonly left: number; readonly right: number }> = [];

      yield* Effect.forkScoped(
        Fx.observe(tuple, (value) => Effect.sync(() => tupleValues.push(value))),
      );
      yield* Effect.forkScoped(
        Fx.observe(struct, (value) => Effect.sync(() => structValues.push(value))),
      );
      yield* awaitSubscriberCount(left, 2);
      yield* awaitSubscriberCount(right, 2);
      tupleValues.length = 0;
      structValues.length = 0;

      yield* tuple.updates((transaction) => transaction.set([1, 1]));

      expect(tupleValues).toEqual([[1, 1]]);
      expect(structValues).toEqual([{ left: 1, right: 1 }]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("publishes a duplicate-core tuple as one complete snapshot", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      const tuple = RefSubject.tuple([ref, ref]);
      const values: ReadonlyArray<number>[] = [];

      yield* Effect.forkScoped(Fx.observe(tuple, (value) => Effect.sync(() => values.push(value))));
      yield* awaitSubscriberCount(ref, 2);
      values.length = 0;

      yield* tuple.updates((transaction) => transaction.set([1, 1]));

      expect(values).toEqual([[1, 1]]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not publish a stale composite commit over an observer update", () =>
    Effect.gen(function* () {
      const left = yield* RefSubject.make(0);
      const right = yield* RefSubject.make(0);
      const tuple = RefSubject.tuple([left, right]);
      const rightValues: number[] = [];
      const tupleValues: ReadonlyArray<number>[] = [];

      yield* Effect.forkScoped(
        Fx.observe(left, (value) => (value === 1 ? RefSubject.set(right, 2) : Effect.void)),
      );
      yield* Effect.forkScoped(
        Fx.observe(right, (value) => Effect.sync(() => rightValues.push(value))),
      );
      yield* Effect.forkScoped(
        Fx.observe(tuple, (value) => Effect.sync(() => tupleValues.push(value))),
      );
      yield* awaitSubscriberCount(left, 2);
      yield* awaitSubscriberCount(right, 2);
      rightValues.length = 0;
      tupleValues.length = 0;

      yield* tuple.updates((transaction) => transaction.set([1, 1]));

      expect(yield* right).toBe(2);
      expect(rightValues).toEqual([2]);
      expect(tupleValues).toEqual([[1, 2]]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("serializes overlapping composites built from a RefSubject service", () =>
    Effect.gen(function* () {
      const firstView = RefSubject.tuple([TransactionService]);
      const secondView = RefSubject.tuple([TransactionService]);
      const firstEntered = yield* Deferred.make<void>();
      const releaseFirst = yield* Deferred.make<void>();
      const secondEntered = yield* Deferred.make<void>();

      const first = yield* Effect.forkScoped(
        firstView.updates((transaction) =>
          Effect.gen(function* () {
            yield* Deferred.succeed(firstEntered, undefined);
            yield* Deferred.await(releaseFirst);
            const [value] = yield* transaction.get;
            yield* transaction.set([value + 1]);
          }),
        ),
        { startImmediately: true },
      );
      yield* Deferred.await(firstEntered);

      const second = yield* Effect.forkScoped(
        secondView.updates((transaction) =>
          Effect.gen(function* () {
            yield* Deferred.succeed(secondEntered, undefined);
            const [value] = yield* transaction.get;
            yield* transaction.set([value + 1]);
          }),
        ),
        { startImmediately: true },
      );

      expect(yield* Deferred.isDone(secondEntered)).toBe(false);
      yield* Deferred.succeed(releaseFirst, undefined);
      yield* Fiber.join(first);
      yield* Fiber.join(second);

      expect(yield* TransactionService).toBe(2);
    }).pipe(Effect.provide(TransactionService.make(0)), Effect.scoped, Effect.runPromise));

  it("publishes service-backed composites after releasing ownership", () =>
    Effect.gen(function* () {
      const tuple = RefSubject.tuple([TransactionTrigger, TransactionService]);
      const rightValues: number[] = [];
      const tupleValues: ReadonlyArray<number>[] = [];

      yield* Effect.forkScoped(
        Fx.observe(TransactionTrigger, (value) =>
          value === 1 ? RefSubject.set(TransactionService, 2) : Effect.void,
        ),
      );
      yield* Effect.forkScoped(
        Fx.observe(TransactionService, (value) => Effect.sync(() => rightValues.push(value))),
      );
      yield* Effect.forkScoped(
        Fx.observe(tuple, (value) => Effect.sync(() => tupleValues.push(value))),
      );
      yield* awaitSubscriberCount(TransactionTrigger, 2);
      yield* awaitSubscriberCount(TransactionService, 2);
      rightValues.length = 0;
      tupleValues.length = 0;

      const outcome = yield* Effect.race(
        tuple.updates((transaction) => transaction.set([1, 1])).pipe(Effect.as("done" as const)),
        Effect.sleep("250 millis").pipe(Effect.as("timeout" as const)),
      );

      expect(outcome).toBe("done");
      expect(yield* TransactionService).toBe(2);
      expect(rightValues).toEqual([2]);
      expect(tupleValues).toEqual([[1, 2]]);
    }).pipe(
      Effect.provide([TransactionService.make(0), TransactionTrigger.make(0)]),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("tracks updates to an fx", () =>
    Effect.gen(function* () {
      const fx = Fx.mergeAll(Fx.succeed(1), Fx.at(2, 100), Fx.at(3, 200));

      const ref = yield* RefSubject.make(fx);
      expect(yield* ref).toEqual(1);
      yield* TestClock.adjust(100);
      expect(yield* ref).toEqual(2);
      yield* TestClock.adjust(100);
      expect(yield* ref).toEqual(3);
    }).pipe(Effect.provide(TestClock.layer()), Effect.scoped, Effect.runPromise));

  it("transform invariantly maps RefSubject", () =>
    Effect.gen(function* () {
      const count = yield* RefSubject.make(5);
      const countStr = RefSubject.transform(
        count,
        (n) => n.toString(),
        (s) => parseInt(s, 10),
      );

      expect(yield* countStr).toEqual("5");
      expect(yield* count).toEqual(5);

      yield* RefSubject.set(countStr, "10");
      expect(yield* countStr).toEqual("10");
      expect(yield* count).toEqual(10);

      yield* RefSubject.set(count, 20);
      expect(yield* countStr).toEqual("20");
      expect(yield* count).toEqual(20);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("scan accumulates across samples", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(1);
      const sums = RefSubject.scan(ref, 0, (s, a) => s + a);

      expect(yield* sums).toEqual(1);
      yield* RefSubject.set(ref, 2);
      expect(yield* sums).toEqual(3);
      yield* RefSubject.set(ref, 3);
      expect(yield* sums).toEqual(6);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("scan + map pipeline updates while observed", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(1);
      type State = [number, number];
      const avg = ref.pipe(
        RefSubject.scan([0, 0] as State, ([sum, count], n): State => [sum + n, count + 1]),
        RefSubject.map(([sum, count]) => (count === 0 ? 0 : sum / count)),
      );

      const values: number[] = [];
      yield* Effect.forkChild(
        Fx.observe(avg, (n) => {
          values.push(n);
        }),
      );
      // Attach subscriber before pushing updates
      for (let i = 0; i < 10; i++) yield* Effect.yieldNow;

      yield* RefSubject.set(ref, 3);
      yield* RefSubject.set(ref, 5);
      for (let i = 0; i < 10; i++) yield* Effect.yieldNow;

      expect(values.length).toBeGreaterThan(0);
      expect(values.at(-1)).toEqual(3); // (1+3+5)/3
    }).pipe(Effect.scoped, Effect.runPromise));
});
