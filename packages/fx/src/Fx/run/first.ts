import { head } from "effect/Array";
import type { Effect } from "effect/Effect";
import { map } from "effect/Effect";
import { pipe } from "effect/Function";
import type { Option } from "effect/Option";
import type { Fx } from "../Fx.js";
import { collectUpTo } from "./collect.js";

/**
 * Returns the first value emitted by the `Fx` wrapped in an `Option`.
 * If the `Fx` is empty, returns `None`.
 *
 * @remarks
 * ## Why
 *
 * `first` safely crosses from a possibly empty push source to one Effect value without
 * inventing an error for the zero-emission case.
 *
 * ## Ownership and lifetime
 *
 * Running the Effect subscribes once and stops upstream after the first value. It
 * returns `None` only when the source completes first; a source failure is still `E`.
 * Interruption cleans up the active source.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import { first, fromIterable } from "@typed/fx/Fx"
 *
 * const program = first(fromIterable([10, 20])).pipe(
 *   Effect.map(Option.getOrElse(() => 0))
 * )
 * ```
 *
 * @param fx - The `Fx` stream.
 * @returns An `Effect` that produces `Some(firstValue)` or `None`.
 * @since 1.0.0
 * @category Collecting values
 */
export function first<A, E, R>(fx: Fx<A, E, R>): Effect<Option<A>, E, R> {
  return pipe(fx, collectUpTo(1), map(head));
}
