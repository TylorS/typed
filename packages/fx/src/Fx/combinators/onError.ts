import type * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Runs cleanup after the source reports a failure cause.
 *
 * @remarks
 * ## Why
 *
 * Failure-only observation belongs at the stream boundary when cleanup needs
 * the complete Cause rather than merely the typed error.
 *
 * ## Ownership and lifetime
 *
 * The original cause is delivered downstream first. Cleanup runs only if that
 * downstream `onFailure` Effect succeeds; if the sink itself fails or interrupts,
 * `flatMap` never reaches cleanup. Typed cleanup failure is impossible by
 * signature, but `Effect.ignore` does not suppress defects or interruption:
 * either can fail or interrupt the run after the source Cause was handled. Its
 * services are required for the subscription, and it does not run after success.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { onError } from "@typed/fx/Fx"
 * import { fail } from "@typed/fx/Fx"
 *
 * const logged = onError(fail("offline"), (cause) => Effect.logError(cause))
 * ```
 *
 * @example A cleanup defect is not a typed failure
 * ```ts
 * import { Effect } from "effect"
 * import { onError } from "@typed/fx/Fx"
 * import { fail } from "@typed/fx/Fx"
 *
 * const defectiveCleanup = onError(fail("offline"), () => Effect.die("logger defect"))
 * ```
 *
 * @since 1.0.0
 * @category Observing failures
 */
export const onError: {
  <E, X, R2>(
    cleanup: (cause: Cause.Cause<E>) => Effect.Effect<X, never, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A, E, R | R2>;

  <A, E, R, X, R2>(
    self: Fx<A, E, R>,
    cleanup: (cause: Cause.Cause<E>) => Effect.Effect<X, never, R2>,
  ): Fx<A, E, R | R2>;
} = dual(
  2,
  <A, E, R, X, R2>(
    self: Fx<A, E, R>,
    cleanup: (cause: Cause.Cause<E>) => Effect.Effect<X, never, R2>,
  ): Fx<A, E, R | R2> =>
    make<A, E, R | R2>((sink) =>
      self.run(
        makeSink(
          (cause) => Effect.flatMap(sink.onFailure(cause), () => Effect.ignore(cleanup(cause))),
          sink.onSuccess,
        ),
      ),
    ),
);
