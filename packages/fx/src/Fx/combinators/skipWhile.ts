import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Ref from "effect/Ref";
import { make as makeFx } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { make as makeSink } from "../../Sink/Sink.js";

/**
 * Skips elements from an Fx while a predicate returns true.
 * Emits from the first element for which the predicate returns false (including that element) and all following elements.
 *
 * @remarks
 * ## Why
 * `skipWhile` discards only the longest matching prefix. The first false value opens the gate and is
 * emitted; later values are forwarded without re-running the predicate.
 *
 * ## Ownership and lifetime
 * One boolean gate is owned by each run and then discarded. No resource is acquired and source
 * errors, services, and interruption are preserved.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const values = Fx.fromIterable([1, 2, 1]).pipe(Fx.skipWhile((n) => n < 2))
 * ```
 *
 * @param predicate - The predicate function.
 * @returns An `Fx` that emits once the predicate first fails.
 * @since 1.0.0
 * @category Selecting values
 */
export const skipWhile: {
  <A>(predicate: (a: A) => boolean): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R> =>
  makeFx<A, E, R>((sink) =>
    Effect.gen(function* () {
      const skippingRef = yield* Ref.make(true);
      const skipSink = makeSink(sink.onFailure, (a: A) =>
        Effect.gen(function* () {
          const skipping = yield* Ref.get(skippingRef);
          if (skipping) {
            if (predicate(a)) return;
            yield* Ref.set(skippingRef, false);
          }
          return yield* sink.onSuccess(a);
        }),
      );
      return yield* fx.run(skipSink);
    }),
  ),
);

/**
 * Skips elements from an Fx while an effectful predicate returns true.
 * Emits from the first element for which the predicate effect succeeds with false (including that element) and all following elements.
 *
 * @remarks
 * ## Why
 * `skipWhileEffect` performs Effectful prefix decisions. The gate opens at the first false result,
 * but the implementation eagerly constructs and runs `predicate(a)` before reading that gate, so
 * the predicate still runs for every later input even though those values are always forwarded.
 *
 * ## Ownership and lifetime
 * The gate belongs to one run, while predicate invocation inherits the producer's ordering and
 * concurrency. Predicate failure is delivered even after the gate opened; services remain required
 * and interruption cancels whichever callback Effects the producer attached to the run.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import { Fx } from "@typed/fx"
 * const program = Effect.gen(function* () {
 *   const checks = yield* Ref.make(0)
 *   const values = yield* Fx.collectAll(
 *     Fx.fromIterable([2, 3]).pipe(
 *       Fx.skipWhileEffect((n) => Ref.update(checks, (count) => count + 1).pipe(Effect.as(n < 2)))
 *     )
 *   )
 *   return { values, checks: yield* Ref.get(checks) } // { values: [2, 3], checks: 2 }
 * })
 * ```
 *
 * @param predicate - Effectful predicate function.
 * @returns An `Fx` that emits once the predicate first fails.
 * @since 1.0.0
 * @category Selecting values
 */
export const skipWhileEffect: {
  <A, E2, R2>(
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(
    fx: Fx<A, E, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(
    fx: Fx<A, E, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2> =>
    makeFx<A, E | E2, R | R2>((sink) =>
      Effect.gen(function* () {
        const skippingRef = yield* Ref.make(true);
        const skipSink = makeSink(sink.onFailure, (a: A) =>
          Effect.matchCauseEffect(predicate(a), {
            onFailure: sink.onFailure,
            onSuccess: (ok) =>
              Effect.gen(function* () {
                const skipping = yield* Ref.get(skippingRef);
                if (skipping) {
                  if (ok) return;
                  yield* Ref.set(skippingRef, false);
                }
                return yield* sink.onSuccess(a);
              }),
          }),
        );
        return yield* fx.run(skipSink);
      }),
    ),
);

/**
 * Alias of `skipWhile` for Effect parity (`dropWhile` naming).
 *
 * @remarks
 * ## Why
 * `dropWhile` provides Effect Stream naming for the same prefix-dropping behavior as `skipWhile`.
 *
 * ## Ownership and lifetime
 * This alias has exactly `skipWhile`'s per-run gate and acquires no additional resource.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const values = Fx.fromIterable([0, 1]).pipe(Fx.dropWhile((n) => n === 0))
 * ```
 *
 * @since 1.0.0
 * @category Selecting values
 */
export const dropWhile = skipWhile;

/**
 * Alias of `skipWhileEffect` for Effect parity (`dropWhileEffect` naming).
 *
 * @remarks
 * ## Why
 * `dropWhileEffect` provides Effect Stream naming for Effectful prefix dropping.
 *
 * ## Ownership and lifetime
 * This alias retains `skipWhileEffect`'s failure, service, state, and interruption semantics.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 * const values = Fx.fromIterable([0, 1]).pipe(Fx.dropWhileEffect((n) => Effect.succeed(n === 0)))
 * ```
 *
 * @since 1.0.0
 * @category Selecting values
 */
export const dropWhileEffect = skipWhileEffect;
