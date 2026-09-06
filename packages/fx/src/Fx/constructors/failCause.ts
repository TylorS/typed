import type * as Cause from "effect/Cause";
import type { Fx } from "../Fx.js";
import { make } from "./make.js";

/**
 * Creates an Fx that immediately terminates with the specified Cause.
 *
 * @remarks
 * ## Why
 *
 * A complete Effect `Cause` can carry typed failures, defects, and interruption
 * information across an `Fx` boundary without flattening that structure.
 *
 * ## Ownership and lifetime
 *
 * Construction is inert. Each run forwards the cause once to `sink.onFailure`, emits
 * no values, and acquires no resources.
 *
 * @example
 * ```ts
 * import { Cause, Effect } from "effect"
 * import { failCause, observe } from "@typed/fx/Fx"
 *
 * const source = failCause(Cause.fail("offline"))
 * const program = observe(source, () => Effect.void).pipe(
 *   Effect.catch((error) => Effect.succeed(error))
 * )
 * ```
 *
 * @param cause - The cause of failure.
 * @returns An `Fx` that terminates with the given cause.
 * @since 1.0.0
 * @category Failure sources
 */
export const failCause = <E>(cause: Cause.Cause<E>): Fx<never, E, never> =>
  /*#__PURE__*/ make<never, E, never>((sink) => sink.onFailure(cause));
