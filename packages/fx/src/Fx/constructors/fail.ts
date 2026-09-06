import * as Cause from "effect/Cause";
import { flow } from "effect/Function";
import type { Fx } from "../Fx.js";
import { failCause } from "./failCause.js";

/**
 * Creates an Fx that immediately fails with the specified error.
 *
 * @remarks
 * ## Why
 *
 * `fail` introduces an expected domain error into the typed `E` channel without
 * emitting a value.
 *
 * ## Ownership and lifetime
 *
 * Construction is inert. Each run delivers one typed failure cause to the sink and
 * acquires no resources.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { fail, first } from "@typed/fx/Fx"
 *
 * const program = first(fail("offline")).pipe(
 *   Effect.catch((error) => Effect.succeed(`failed: ${error}`))
 * )
 * ```
 *
 * @param error - The error to fail with.
 * @returns An `Fx` that fails immediately.
 * @since 1.0.0
 * @category Failure sources
 */
export const fail: <E>(error: E) => Fx<never, E, never> = /*#__PURE__*/ flow(Cause.fail, failCause);
