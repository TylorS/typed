import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as combinators from "../../Sink/combinators.js";
import { make as makeSink } from "../../Sink/Sink.js";
import { make as makeFx } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Takes elements from an Fx until a predicate returns true.
 * The element that satisfies the predicate is not included in the output.
 *
 * @remarks
 * ## Why
 * `takeUntil` forwards the ordered prefix before the first match, then completes without emitting
 * the matching value.
 *
 * ## Ownership and lifetime
 * Matching triggers the sink's early-exit path, stopping upstream work. No resources are acquired;
 * earlier failures and consumer interruption remain observable.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const beforeThree = Fx.fromIterable([1, 2, 3]).pipe(Fx.takeUntil((n) => n === 3))
 * ```
 *
 * @param predicate - The predicate function.
 * @returns An `Fx` that completes when the predicate matches.
 * @since 1.0.0
 * @category Selecting values
 */
export const takeUntil: {
  <A>(predicate: (a: A) => boolean): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R> => {
  return makeFx<A, E, R>((sink) =>
    combinators.withEarlyExit(sink, (sink) =>
      fx.run(
        makeSink(sink.onFailure, (a) => {
          if (predicate(a)) {
            return sink.earlyExit;
          }
          return sink.onSuccess(a);
        }),
      ),
    ),
  );
});

/**
 * Takes elements from an Fx until an effectful predicate returns true.
 * The element that satisfies the predicate is not included in the output.
 *
 * @remarks
 * ## Why
 * `takeUntilEffect` makes the stopping decision Effectful and ordered. A successful match completes
 * before that input is emitted; a false result forwards it.
 *
 * ## Ownership and lifetime
 * Predicate effects run in the consumer and expose their failures and services. A match or
 * interruption stops upstream and cancels active work.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 * const values = Fx.fromIterable([1, 2]).pipe(Fx.takeUntilEffect((n) => Effect.succeed(n === 2)))
 * ```
 *
 * @param predicate - Effectful predicate function.
 * @returns An `Fx` that completes when the predicate matches.
 * @since 1.0.0
 * @category Selecting values
 */
export const takeUntilEffect: {
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
      combinators.withEarlyExit(sink, (sink) =>
        fx.run(
          makeSink(sink.onFailure, (a) =>
            Effect.matchCauseEffect(predicate(a), {
              onFailure: sink.onFailure,
              onSuccess: (matches) => (matches ? sink.earlyExit : sink.onSuccess(a)),
            }),
          ),
        ),
      ),
    ),
);

/**
 * Drops elements from an Fx after a predicate returns true.
 * The element that satisfies the predicate is included in the output.
 *
 * @remarks
 * ## Why
 * `dropAfter` includes the first matching value and then completes, giving an inclusive stopping
 * boundary while preserving the preceding source order.
 *
 * ## Ownership and lifetime
 * The match stops upstream through the early-exit sink. The operation acquires no external
 * resource and preserves source failures and services before completion.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const throughTwo = Fx.fromIterable([1, 2, 3]).pipe(Fx.dropAfter((n) => n === 2))
 * ```
 *
 * @param predicate - The predicate function.
 * @returns An `Fx` that stops emitting when the predicate matches.
 * @since 1.0.0
 * @category Selecting values
 */
export const dropAfter: {
  <A>(predicate: (a: A) => boolean): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R> =>
  makeFx<A, E, R>((sink) => combinators.dropAfter(sink, predicate, (sink) => fx.run(sink))),
);
