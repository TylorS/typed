import type * as Option from "effect/Option";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Compacts an Fx of Options, discarding `None` values and unwrapping `Some` values.
 *
 * @remarks
 * ## Why
 * `compact` turns optional pushed values into ordinary pushed values without inventing a sentinel.
 * It emits once for each `Some`, never for `None`, and preserves the order of retained values.
 *
 * ## Ownership and lifetime
 * This is a stateless sink transformation. It acquires no resources and forwards source failures,
 * services, completion, and interruption unchanged.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const present = Fx.fromIterable([Option.some(1), Option.none(), Option.some(2)]).pipe(Fx.compact)
 * ```
 *
 * @param self - An `Fx` emitting `Option<A>`.
 * @returns An `Fx` emitting `A`.
 * @since 1.0.0
 * @category Selecting values
 */
export const compact = <A, E, R>(self: Fx<Option.Option<A>, E, R>): Fx<A, E, R> =>
  make<A, E, R>((sink) => self.run(sinkCore.compact(sink)));
