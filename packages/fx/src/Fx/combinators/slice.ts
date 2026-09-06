import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { unwrap } from "./unwrap.js";

/**
 * Defines the bounds for slicing an Fx stream.
 *
 * @remarks
 * ## Why
 * `Bounds` keeps the two independent slice decisions explicit: `skip` counts discarded prefix
 * values and `take` bounds the following output.
 *
 * ## Ownership and lifetime
 * This immutable model acquires no resources. A consumer decides how to normalize unusual numeric
 * values when applying it.
 *
 * @example
 * ```ts
 * import type { Fx } from "@typed/fx"
 *
 * const page: Fx.Bounds = { skip: 20, take: 10 }
 * ```
 * @since 1.0.0
 * @category Operator options
 */
export interface Bounds {
  /**
   * Number of source values discarded before the slice can emit.
   *
   * @remarks
   * ## Why
   * Keeping the prefix count separate from `take` permits windows that begin anywhere in a source.
   *
   * ## Ownership and lifetime
   * This number stores no state and acquires no resources; `slice` copies it into a per-run counter.
   *
   * @example
   * ```ts
   * import type { Fx } from "@typed/fx"
   * const bounds: Fx.Bounds = { skip: 2, take: 1 }
   * ```
   */
  readonly skip: number;
  /**
   * Maximum number of values emitted after the skipped prefix.
   *
   * @remarks
   * ## Why
   * The output bound makes early completion explicit without buffering the selected values.
   *
   * ## Ownership and lifetime
   * This number stores no state and acquires no resources; `slice` owns the corresponding counter
   * only for the duration of one run.
   *
   * @example
   * ```ts
   * import type { Fx } from "@typed/fx"
   * const bounds: Fx.Bounds = { skip: 0, take: 10 }
   * ```
   */
  readonly take: number;
}

/**
 * Slices an Fx by skipping a number of elements and then taking a number of elements.
 *
 * @remarks
 * ## Why
 * `slice` expresses prefix omission and bounded output in one counter. It retains source order,
 * emits at most `take` values after `skip`, and completes early once that bound is reached.
 *
 * ## Ownership and lifetime
 * Counters are local to one run. Early completion stops upstream work; otherwise source failure,
 * services, and consumer interruption are forwarded.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const page = Fx.fromIterable([1, 2, 3, 4]).pipe(Fx.slice({ skip: 1, take: 2 }))
 * ```
 *
 * @param bounds - The `Bounds` specifying how many elements to skip and take.
 * @returns An `Fx` representing the slice.
 * @since 1.0.0
 * @category Selecting values
 */
export const slice: {
  (bounds: Bounds): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;

  <A, E, R>(fx: Fx<A, E, R>, bounds: Bounds): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, bounds: Bounds): Fx<A, E, R> =>
  make<A, E, R>((sink) => sinkCore.slice(sink, bounds, (sink) => fx.run(sink))),
);

/**
 * Slices an Fx with bounds produced by an Effect.
 *
 * @remarks
 * ## Why
 * `sliceEffect` delays selection of the bounds until consumption, allowing configuration to fail or
 * require services before the source is subscribed.
 *
 * ## Ownership and lifetime
 * The bounds Effect runs once per consumer. If it fails or is interrupted the source never starts;
 * after success, ordinary `slice` owns only its per-run counters.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const page = Fx.fromIterable([1, 2, 3]).pipe(Fx.sliceEffect(Effect.succeed({ skip: 1, take: 1 })))
 * ```
 *
 * @param bounds - Effect that produces slice bounds.
 * @returns An `Fx` representing the slice.
 * @since 1.0.0
 * @category Selecting values
 */
export const sliceEffect: {
  <E2, R2>(
    bounds: Effect.Effect<Bounds, E2, R2>,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, bounds: Effect.Effect<Bounds, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(
    fx: Fx<A, E, R>,
    bounds: Effect.Effect<Bounds, E2, R2>,
  ): Fx<A, E | E2, R | R2> => unwrap(Effect.map(bounds, (b) => slice(fx, b))),
);
