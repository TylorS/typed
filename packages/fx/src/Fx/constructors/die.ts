import * as Cause from "effect/Cause";
import { flow } from "effect/Function";
import type { Fx } from "../Fx.js";
import { failCause } from "./failCause.js";

/**
 * Creates an Fx that immediately terminates with a defect (unexpected error).
 *
 * @remarks
 * ## Why
 *
 * Defects represent unexpected, non-recoverable failures and remain distinct from
 * the typed `E` channel.
 *
 * ## Ownership and lifetime
 *
 * Construction is inert. Each run delivers one defect cause to the sink and emits
 * no values; it acquires no resources.
 *
 * @example
 * ```ts
 * import { Cause, Effect } from "effect"
 * import { die, observe } from "@typed/fx/Fx"
 *
 * const program = observe(die(new Error("broken")), () => Effect.void).pipe(
 *   Effect.catchCause((cause) => Effect.succeed(Cause.hasDies(cause)))
 * )
 * ```
 *
 * @param defect - The defect value.
 * @returns An `Fx` that dies immediately.
 * @since 1.0.0
 * @category Failure sources
 */
export const die: (defect: unknown) => Fx<never, never, never> = /*#__PURE__*/ flow(
  Cause.die,
  failCause,
);
