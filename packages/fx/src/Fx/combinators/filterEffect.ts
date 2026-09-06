import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Filters elements of an Fx using an effectful predicate function.
 *
 * @remarks
 * ## Why
 * `filterEffect` supports service-backed or failing decisions without flattening a second Fx. Each
 * input runs one predicate Effect; `true` emits once and `false` emits nothing. The adapter does not
 * serialize concurrent producer deliveries, so accepted values may arrive out of input order.
 *
 * ## Ownership and lifetime
 * A predicate Effect belongs to the producer callback that invoked it. Its Cause is sent to the
 * Sink, `R2` stays required, and interruption follows that delivery. No lock or queue is added.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const concurrent = Fx.make<number>((sink) =>
 *   Effect.all([sink.onSuccess(1), sink.onSuccess(2)], { concurrency: "unbounded", discard: true })
 * )
 * const positive = concurrent.pipe(Fx.filterEffect((n) => Effect.succeed(n > 0)))
 * ```
 *
 * @param f - An effectful predicate function.
 * @returns An `Fx` that emits only the elements for which `f` returns `true`.
 * @since 1.0.0
 * @category Selecting values
 */
export const filterEffect: {
  <A, E2, R2>(
    f: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): <E, R>(self: Fx<A, E | E2, R>) => Fx<A, E | E2, R | R2>;

  <A, E, R, E2, R2>(
    self: Fx<A, E | E2, R>,
    f: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2> =>
    make<A, E | E2, R | R2>((sink) => self.run(sinkCore.filterEffect(f)(sink))),
);
