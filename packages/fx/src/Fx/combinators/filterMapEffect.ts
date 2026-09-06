import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type * as Option from "effect/Option";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Maps and filters elements of an Fx using an effectful function.
 *
 * @remarks
 * ## Why
 * `filterMapEffect` combines an Effectful decision and transformation without introducing nested
 * streams. `Some` emits once and `None` emits nothing. Producer callbacks are not serialized, so
 * overlapping Effects can complete and emit in a different order than their inputs.
 *
 * ## Ownership and lifetime
 * Each callback Effect follows its invoking producer delivery. Its failure Cause is sent to the
 * Sink, services remain exposed as `R2`, and no semaphore, queue, or resource is added.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const accepted = Fx.fromIterable([1, 2]).pipe(
 *   Fx.filterMapEffect((n) => Effect.succeed(n > 1 ? Option.some(n * 10) : Option.none()))
 * )
 * ```
 *
 * @param f - An effectful function that returns an `Option` for each element.
 * @returns An `Fx` that emits values for which `f` returns `Some`.
 * @since 1.0.0
 * @category Selecting values
 */
export const filterMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>,
  ): <E, R>(self: Fx<A, E | E2, R>) => Fx<B, E | E2, R | R2>;

  <A, E, R, B, E2, R2>(
    self: Fx<A, E | E2, R>,
    f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>,
  ): Fx<B, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>,
  ): Fx<B, E | E2, R | R2> =>
    make<B, E | E2, R | R2>((sink) => self.run(sinkCore.filterMapEffect(f)(sink))),
);
