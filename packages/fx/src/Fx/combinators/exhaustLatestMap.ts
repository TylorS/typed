import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import { make as makeSink, type Sink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";
import type { FlatMapLike } from "./flatMap.js";

/**
 * Maps each element to an inner Fx, running one now and retaining only the latest waiting value.
 *
 * @remarks
 * ## Why
 *
 * `exhaustLatestMap` fits work that cannot overlap but must eventually reflect
 * the newest request. Unlike {@link exhaustMap}, it remembers one pending value;
 * unlike {@link concatMap}, it does not let a backlog grow.
 *
 * ## Admission, buffering, and cardinality
 *
 * The first value while idle starts immediately. While that inner runs, each new
 * value replaces the single pending inner Effect; replaced values never run.
 * When the active inner completes, the latest pending inner starts. An admitted
 * inner may emit any number of values, in that inner's order.
 *
 * ## Ownership and lifetime
 *
 * Source and admitted-inner failures are forwarded and both environments remain
 * typed. The required `Scope` owns every active inner fiber. Source completion
 * waits until the active and final pending inner finish; interruption closes the
 * Scope and runs inner finalizers. The one-slot pending buffer retains work, not
 * emitted output.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const refreshes = Fx.mergeAll(
 *   Fx.at("v1", "0 millis"),
 *   Fx.at("v2", "5 millis"),
 *   Fx.at("v3", "10 millis")
 * )
 * const latestEventually = Fx.exhaustLatestMap(refreshes, (version) =>
 *   Fx.at(`indexed:${version}`, "20 millis")
 * )
 *
 * Effect.runPromise(Effect.scoped(Fx.collectAll(latestEventually))).then(console.log)
 * // ["indexed:v1", "indexed:v3"]
 * ```
 *
 * @param f - A function that maps an element `A` to a new `Fx<B>`.
 * @returns An `Fx` that emits values from the inner streams.
 * @since 1.0.0
 * @category Concurrent work
 */
export const exhaustLatestMap: FlatMapLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> => {
    return make<B, E | E2, R | R2 | Scope.Scope>(
      Effect.fn(function* <RSink>(sink: Sink<B, E | E2, RSink>) {
        let runningFiber: Fiber.Fiber<unknown, never> | undefined = undefined;
        let nextEffectToFork: Effect.Effect<unknown, never, R2 | RSink> | undefined = undefined;

        const scope = yield* Effect.scope;

        const fork = (
          effect: Effect.Effect<unknown, never, R2 | RSink>,
        ): Effect.Effect<Fiber.Fiber<unknown, never>, never, RSink | R2> =>
          Effect.forkIn(
            effect.pipe(Effect.ensuring(Effect.zip(resetRunningFiber, runNext))),
            scope,
          );

        const resetRunningFiber: Effect.Effect<void, never, never> = Effect.sync(
          () => (runningFiber = undefined),
        );

        const runNext: Effect.Effect<void, never, R2 | RSink> = Effect.gen(function* () {
          if (nextEffectToFork !== undefined) {
            const eff = nextEffectToFork;
            nextEffectToFork = undefined;
            yield* exhaustLatestFork(eff);
            // Ensure we don't close the scope until the last fiber completes
            if (runningFiber !== undefined) yield* Fiber.join(runningFiber);
          }
        });

        const exhaustLatestFork = Effect.fn(function* (
          eff: Effect.Effect<void, never, R2 | RSink>,
        ) {
          if (runningFiber === undefined) {
            runningFiber = yield* fork(eff);
          } else {
            nextEffectToFork = eff;
          }
        });

        yield* self.run(makeSink(sink.onFailure, (a) => exhaustLatestFork(f(a).run(sink))));

        if (runningFiber !== undefined) yield* Fiber.join(runningFiber as Fiber.Fiber<void, never>);
      }, extendScope),
    );
  },
);
