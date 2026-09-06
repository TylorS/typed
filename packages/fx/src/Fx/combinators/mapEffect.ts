import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Transforms the elements of an Fx using a provided Effectful function.
 *
 * @remarks
 * ## Why
 * `mapEffect` performs one Effectful transformation for every input and emits once for each
 * successful callback. It does not serialize sink invocations: ordering and concurrency are owned
 * by the producer, so overlapping callbacks may complete and emit out of input order.
 *
 * ## Ownership and lifetime
 * Each callback Effect belongs to the producer delivery that invoked it. Failure is routed to the
 * Sink, services remain required, and interruption is local to that delivery. The combinator adds
 * no queue, semaphore, result retention, or independent fiber.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const concurrent = Fx.make<number>((sink) =>
 *   Effect.all([sink.onSuccess(1), sink.onSuccess(2)], { concurrency: "unbounded", discard: true })
 * )
 * const program = Fx.collectAll(
 *   concurrent.pipe(Fx.mapEffect((n) => Effect.sleep(n === 1 ? "10 millis" : "0 millis").pipe(Effect.as(n))))
 * ) // producer concurrency permits [2, 1]
 * ```
 *
 * @param f - A function that transforms values of type `A` to an Effect of `B`.
 * @returns An `Fx` that emits values of type `B`.
 * @since 1.0.0
 * @category Transforming values
 */
export const mapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): <E, R>(fx: Fx<A, E | E2, R>) => Fx<B, E | E2, R | R2>;

  <A, E, R, B, E2, R2>(
    fx: Fx<A, E | E2, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Fx<B, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> =>
    make<B, E | E2, R | R2 | Scope.Scope>((sink) => self.run(sinkCore.mapEffect(sink, f))),
);
