import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Unwraps an Effect that produces an Fx into a single Fx, managing the scope of the effect.
 *
 * The scope of the effect is closed when the Fx completes or is interrupted.
 *
 * @remarks
 * ## Why
 *
 * `unwrapScoped` is the safe boundary for an Effect that acquires resources
 * while choosing an Fx. It discharges the inner `Scope` requirement instead of
 * leaking acquisition lifetime to every consumer.
 *
 * ## Execution and cardinality
 *
 * Each observation opens one Scope, runs `effect` once, then forwards every
 * value from the produced Fx in order. The inner never starts if acquisition
 * fails, and the acquisition Effect adds no output value.
 *
 * ## Ownership and lifetime
 *
 * Acquisition and inner failures are forwarded. Non-Scope services from both
 * phases remain required. The opened Scope owns resources acquired by both the
 * Effect and produced Fx; it closes after normal completion, failure, or
 * interruption, running finalizers exactly at the observation boundary.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const scoped = Fx.unwrapScoped(
 *   Effect.acquireRelease(
 *     Effect.succeed(Fx.succeed("connected")),
 *     () => Effect.void
 *   )
 * )
 * ```
 *
 * @param effect - An `Effect` that produces an `Fx`.
 * @returns An `Fx` that runs the effect and then the produced Fx.
 * @since 1.0.0
 * @category Generator composition
 */
export const unwrapScoped = <A, E, R, E2, R2>(
  effect: Effect.Effect<Fx<A, E, R>, E2, R2 | Scope.Scope>,
): Fx<A, E | E2, Exclude<R | R2, Scope.Scope>> =>
  make<A, E | E2, Exclude<R | R2, Scope.Scope>>((sink) =>
    Effect.scoped(
      Effect.matchCauseEffect(effect, {
        onFailure: (cause) => sink.onFailure(cause),
        onSuccess: (fx) => fx.run(sink),
      }),
    ),
  );
