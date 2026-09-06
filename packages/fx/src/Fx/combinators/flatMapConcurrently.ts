import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as FiberSet from "effect/FiberSet";
import * as Semaphore from "effect/Semaphore";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";

/**
 * Maps each element of an Fx to a new Fx, running them concurrently with a limit.
 *
 * @remarks
 * ## Why
 *
 * This is the admission-controlled form of {@link flatMap}. It bounds active
 * work while retaining every source value, which is appropriate when a remote
 * service or local resource has a known concurrency budget.
 *
 * ## Concurrency, ordering, and buffering
 *
 * Each source value creates one child fiber. A semaphore admits at most
 * `concurrency` inners into execution; excess fibers wait for a permit rather
 * than being dropped. Values from each inner retain local order, but admitted
 * inners may interleave and output is not reordered into source order.
 *
 * ## Ownership and lifetime
 *
 * A non-positive, fractional, infinite, or unsafe-integer limit fails through
 * the Sink with `Cause.IllegalArgumentError`. Source and inner failures and
 * services remain typed. The required `Scope` owns waiting and active fibers;
 * source completion waits for all of them, and interruption cancels both groups
 * and runs active inner finalizers.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const jobs = Fx.fromIterable([
 *   { id: "one", wait: "20 millis" as const },
 *   { id: "two", wait: "20 millis" as const },
 *   { id: "three", wait: "1 millis" as const }
 * ])
 * const bounded = Fx.flatMapConcurrently(
 *   jobs,
 *   ({ id, wait }) => Fx.at(id, wait),
 *   2
 * )
 *
 * Effect.runPromise(Effect.scoped(Fx.collectAll(bounded))).then(console.log)
 * // "three" waits for one of the first two permits despite its shorter delay
 * ```
 *
 * @param f - A function that maps an element `A` to a new `Fx<B>`.
 * @param concurrency - A positive safe-integer limit for concurrent inner streams. Invalid limits fail with `Cause.IllegalArgumentError`.
 * @returns An `Fx` that emits values from the inner streams.
 * @since 1.0.0
 * @category Concurrent work
 */
export const flatMapConcurrently: {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    concurrency: number,
  ): <E, R>(self: Fx<A, E, R>) => Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;

  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    concurrency: number,
  ): Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;
} = dual(
  3,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    concurrency: number,
  ): Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope> =>
    make<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>(
      Effect.fn(function* (sink) {
        if (!Number.isSafeInteger(concurrency) || concurrency <= 0) {
          return yield* sink.onFailure(
            Cause.fail(
              new Cause.IllegalArgumentError(
                `concurrency must be a positive safe integer, received ${concurrency}`,
              ),
            ),
          );
        }
        const semaphore = yield* Semaphore.make(concurrency);
        const lock = semaphore.withPermits(1);
        const set = yield* FiberSet.make<void, never>();
        yield* self.run(
          makeSink(sink.onFailure, (a) => FiberSet.run(set, lock(Effect.asVoid(f(a).run(sink))))),
        );
        yield* FiberSet.awaitEmpty(set);
      }, extendScope),
    ),
);
