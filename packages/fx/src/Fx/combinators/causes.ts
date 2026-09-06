import type * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import * as Option from "effect/Option";
import type { Fx } from "../Fx.js";
import { exit } from "./exit.js";
import { filterMap } from "./filterMap.js";

/**
 * Emits the source's terminal failure cause and discards every successful value.
 *
 * @remarks
 * ## Why
 *
 * Failure telemetry and supervision often need the complete Effect `Cause`
 * without treating that cause as another failure. Materializing only the
 * failure side makes those pipelines ordinary, infallible Fx values.
 *
 * ## Ownership and lifetime
 *
 * The source is subscribed once. Success values are dropped in arrival order;
 * a terminal cause is emitted once and the returned Fx completes without a
 * typed error. Defects and interruption are retained inside the emitted cause.
 * No resource is acquired beyond the source subscription.
 *
 * @example
 * ```ts
 * import { Cause } from "effect"
 * import { causes } from "@typed/fx/Fx"
 * import { failCause } from "@typed/fx/Fx"
 *
 * const failures = causes(failCause(Cause.fail("offline")))
 * ```
 *
 * @param fx - The `Fx` stream.
 * @returns An `Fx` emitting `Cause<E>`.
 * @since 1.0.0
 * @category Errors and recovery
 */
export const causes = <A, E, R>(fx: Fx<A, E, R>): Fx<Cause.Cause<E>, never, R> =>
  filterMap(
    exit(fx),
    Exit.match({
      onFailure: Option.some,
      onSuccess: Option.none,
    }),
  );
