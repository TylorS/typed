import type * as Exit from "effect/Exit";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Materializes every success and the terminal failure as infallible `Exit` values.
 *
 * @remarks
 * ## Why
 *
 * Turning both channels into data lets downstream Fx composition inspect
 * complete Effect causes without terminating the pipeline.
 *
 * ## Ownership and lifetime
 *
 * Each source value becomes `Exit.succeed` in arrival order. A source failure,
 * including a defect or interrupt, becomes one `Exit.failCause`, after which
 * the returned Fx completes with error type `never`. It acquires no resource
 * beyond the single source subscription.
 *
 * @example
 * ```ts
 * import { exit } from "@typed/fx/Fx"
 * import { fail } from "@typed/fx/Fx"
 *
 * const outcomes = exit(fail("offline"))
 * ```
 *
 * @param fx - The `Fx` stream.
 * @returns An `Fx` emitting `Exit<A, E>`.
 * @since 1.0.0
 * @category Errors and recovery
 */
export const exit = <A, E, R>(fx: Fx<A, E, R>): Fx<Exit.Exit<A, E>, never, R> =>
  make<Exit.Exit<A, E>, never, R>((sink) => fx.run(sinkCore.exit(sink)));
