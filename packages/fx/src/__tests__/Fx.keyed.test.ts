import * as Deferred from "effect/Deferred";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Scheduler from "effect/Scheduler";
import { describe, expect, it } from "vitest";
import * as Sink from "../Sink/Sink.js";
import { Fx } from "../index.js";
import type { Fx as FxType } from "../Fx.js";

function acknowledge<A, E, R>(
  fx: FxType<A, E, R>,
  acknowledgements: Array<Deferred.Deferred<void>>,
) {
  return Fx.make<A, E, R>((sink) =>
    fx.run(
      Sink.make(sink.onFailure, (value: A) => {
        const acknowledgement = acknowledgements.shift();
        return sink
          .onSuccess(value)
          .pipe(
            Effect.andThen(
              acknowledgement === undefined
                ? Effect.void
                : Deferred.succeed(acknowledgement, undefined),
            ),
          );
      }),
    ),
  );
}

describe("Fx.keyed", () => {
  it("fails duplicate keys through the typed error channel before starting keyed values", () =>
    Effect.gen(function* () {
      let started = 0;
      const keyed = Fx.keyed(Fx.succeed([{ id: "duplicate" }, { id: "duplicate" }]), {
        getKey: (value) => value.id,
        onValue: (_ref, key) => {
          started += 1;
          return Fx.succeed(key);
        },
      });

      const error = yield* Effect.flip(Fx.collectAll(keyed));

      expect(Cause.isIllegalArgumentError(error)).toBe(true);
      expect(error.message).toBe('Duplicate keyed() key "duplicate"');
      expect(started).toBe(0);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits the parent array when items only move", () =>
    Effect.gen(function* () {
      const first = yield* Deferred.make<void>();
      const second = yield* Deferred.make<void>();
      const acknowledgements = [first, second];
      const values = Fx.make<ReadonlyArray<{ id: string }>>((sink) =>
        Effect.gen(function* () {
          yield* sink.onSuccess([{ id: "a" }, { id: "b" }]);
          yield* Deferred.await(first);
          yield* sink.onSuccess([{ id: "b" }, { id: "a" }]);
        }),
      );

      const keyed = Fx.keyed(values, {
        getKey: (value) => value.id,
        onValue: (_ref, key) => Fx.succeed(key),
      });

      expect(yield* Fx.collectAll(acknowledge(keyed, acknowledgements))).toEqual([
        ["a", "b"],
        ["b", "a"],
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits a later removal and addition after items move", () =>
    Effect.gen(function* () {
      const first = yield* Deferred.make<void>();
      const second = yield* Deferred.make<void>();
      const third = yield* Deferred.make<void>();
      const fourth = yield* Deferred.make<void>();
      const acknowledgements = [first, second, third, fourth];
      const values = Fx.make<ReadonlyArray<{ id: string; label: string }>>((sink) =>
        Effect.gen(function* () {
          yield* sink.onSuccess([
            { id: "a", label: "A" },
            { id: "b", label: "B" },
            { id: "c", label: "C" },
          ]);
          yield* Deferred.await(first);
          yield* sink.onSuccess([
            { id: "c", label: "C" },
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ]);
          yield* Deferred.await(second);
          yield* sink.onSuccess([
            { id: "c", label: "C" },
            { id: "a", label: "A2" },
            { id: "d", label: "D" },
          ]);
          yield* Deferred.await(third);
          yield* sink.onSuccess([]);
        }),
      );

      const keyed = Fx.keyed(values, {
        getKey: (value) => value.id,
        onValue: (ref, key) => Fx.map(ref, (value) => `${key}:${value.label}`),
      });

      expect(yield* Fx.collectAll(acknowledge(keyed, acknowledgements))).toEqual([
        ["a:A", "b:B", "c:C"],
        ["c:C", "a:A", "b:B"],
        ["c:C", "a:A2", "d:D"],
        [],
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("lets an already-runnable fiber run before completing a large reconciliation", () =>
    Effect.gen(function* () {
      const itemCount = 512;
      const items = Array.from({ length: itemCount }, (_, id) => id);
      const sourceReady = yield* Deferred.make<void>();
      const observerReady = yield* Deferred.make<void>();
      const release = yield* Deferred.make<void>();
      let reconciled = 0;
      let observedReconciled = -1;

      const source = Fx.make<ReadonlyArray<number>>((sink) =>
        Deferred.succeed(sourceReady, undefined).pipe(
          Effect.andThen(Deferred.await(release)),
          Effect.andThen(sink.onSuccess(items)),
        ),
      );
      const keyed = Fx.keyed(source, {
        getKey: (value) => value,
        onValue: (_ref, key) => {
          reconciled += 1;
          return Fx.succeed(key);
        },
      });

      const keyedFiber = yield* Fx.collectAll(keyed).pipe(
        Effect.provideService(Scheduler.MaxOpsBeforeYield, 16),
        Effect.forkScoped,
      );
      yield* Deferred.await(sourceReady);

      const observerFiber = yield* Effect.gen(function* () {
        yield* Deferred.succeed(observerReady, undefined);
        yield* Deferred.await(release);
        observedReconciled = reconciled;
      }).pipe(Effect.forkScoped);
      yield* Deferred.await(observerReady);

      yield* Deferred.succeed(release, undefined);
      yield* Fiber.join(observerFiber);

      expect(observedReconciled).toBeLessThan(itemCount);

      const emissions = yield* Fiber.join(keyedFiber);
      expect(emissions.at(-1)).toEqual(items);
    }).pipe(Effect.scoped, Effect.runPromise));
});
