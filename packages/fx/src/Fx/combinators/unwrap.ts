import * as Effect from "effect/Effect";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Unwraps an Effect that produces an Fx into a single Fx.
 *
 * @remarks
 * ## Why
 *
 * `unwrap` defers choosing or acquiring a producer until observation, while
 * keeping the Effect and the selected Fx in one typed push pipeline.
 *
 * ## Execution and cardinality
 *
 * Each observation runs `effect` once. On success, the produced Fx is observed
 * and all of its values are forwarded in order. The acquisition Effect itself
 * emits no value, and the inner is never started if acquisition fails.
 *
 * ## Ownership and lifetime
 *
 * Acquisition and inner failures are forwarded and both environments remain in
 * the returned type. `unwrap` does not create a Scope or hide one: interruption
 * stops whichever phase is active, and any resourceful Effect or inner Fx must
 * expose and receive its own `Scope` requirement.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const selected = Fx.unwrap(
 *   Effect.succeed(Fx.fromIterable(["ready", "running"]))
 * )
 * ```
 *
 * @param effect - An `Effect` that produces an `Fx`.
 * @returns An `Fx` that runs the effect and then the produced Fx.
 * @since 1.0.0
 * @category Generator composition
 */
export const unwrap = <A = never, E = never, R = never, E2 = never, R2 = never>(
  effect: Effect.Effect<Fx<A, E, R>, E2, R2>,
): Fx<A, E | E2, R | R2> =>
  make<A, E | E2, R | R2>((sink) =>
    Effect.matchCauseEffect(effect, {
      onFailure: (cause) => sink.onFailure(cause),
      onSuccess: (fx) => fx.run(sink),
    }),
  );
