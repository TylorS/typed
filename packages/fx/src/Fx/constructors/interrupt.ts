import * as Cause from "effect/Cause";
import { flow } from "effect/Function";
import { failCause } from "./failCause.js";

/**
 * Creates an Fx that immediately interrupts.
 *
 * @remarks
 * ## Why
 *
 * A known Effect interruption cause can be represented as an `Fx` branch without
 * disguising it as a typed failure or defect.
 *
 * ## Ownership and lifetime
 *
 * Construction is inert. Each run forwards one interruption cause carrying `id` to
 * the sink, emits no values, and acquires no resources.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { interrupt, observe } from "@typed/fx/Fx"
 *
 * const source = interrupt(1)
 * const program = observe(source, () => Effect.void)
 * ```
 *
 * @param id - Optional numeric fiber identifier responsible for the interruption.
 * @returns An `Fx` that is interrupted.
 * @since 1.0.0
 * @category Failure sources
 */
export const interrupt = /*#__PURE__*/ flow(Cause.interrupt, failCause);
