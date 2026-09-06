import * as Effect from "effect/Effect";
import { identity } from "effect/Function";
import { pipeArguments } from "effect/Pipeable";
import type { Sink } from "../../Sink/Sink.js";
import type * as Fx from "../Fx.js";
import { FxTypeId } from "../TypeId.js";
import { EffectableWithOverride } from "./effectableWithOverride.js";

const VARIANCE = {
  _A: identity,
  _E: identity,
  _R: identity,
};

/** Base class for values that are both an Fx push source and an Effect-compatible sample.
 *
 * @remarks
 * ## Why
 *
 * RefSubject and Versioned values need one object that composes through Fx operators when observed
 * and through Effect operators when a current value is requested. This class supplies the shared
 * brands, pipeability, and Effect evaluator bridge without forcing the two channels to have the
 * same value, error, or service types.
 *
 * ## Ownership and lifetime
 *
 * The base class acquires no resources. `run` defines the push subscription lifetime and `toEffect`
 * defines sampling. The first Effect evaluation memoizes the Effect object returned by `toEffect`,
 * not its result: each execution still follows that Effect's own acquisition, error, interruption,
 * and cleanup behavior.
 *
 * This is a published advanced extension point coupled to Typed's Fx brand and Effect evaluator
 * protocol. Its shape may change between prereleases.
 *
 * @example
 * ```ts
 * import { YieldableFx } from "@typed/fx/Fx/internal/yieldable"
 * import type { Sink } from "@typed/fx/Sink/Sink"
 * import * as Effect from "effect/Effect"
 *
 * class One extends YieldableFx<number, never, never, number, never, never> {
 *   run<R>(sink: Sink<number, never, R>): Effect.Effect<unknown, never, R> {
 *     return sink.onSuccess(1)
 *   }
 *   toEffect() {
 *     return Effect.succeed(1)
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export abstract class YieldableFx<A, E, R, B, E2, R2>
  extends EffectableWithOverride<B, E2, R2>
  implements Fx.Fx<A, E, R>
{
  /** Fx variance marker that makes subclasses valid `Fx<A, E, R>` values.
   *
   * @remarks
   * ## Why
   *
   * The marker carries Fx's value, error, and service variance through subclass types.
   *
   * ## Ownership and lifetime
   *
   * Immutable protocol metadata shared through the instance; it acquires no resources.
   *
   * @since 1.0.0
   * @category symbols
   */
  readonly [FxTypeId] = VARIANCE;

  /** Subscribes a Sink to the pushed channel.
   *
   * @remarks
   * ## Why
   *
   * Implementations determine cardinality, ordering, and subscription cleanup. The contract exposes
   * no typed failure because failures are delivered to the Sink; required services combine `R` with
   * the sink's `RSink`.
   *
   * ## Ownership and lifetime
   *
   * The implementation owns the subscription and must bind cleanup to the lifetime visible in its
   * service requirements.
   *
   * @since 1.0.0
   * @category effects
   */
  abstract run<RSink>(sink: Sink<A, E, RSink>): Effect.Effect<unknown, never, R | RSink>;

  /** Builds the Effect used when the value is sampled or yielded.
   *
   * @remarks
   * ## Why
   *
   * The returned Effect object is memoized by `override`; its result is not automatically cached.
   *
   * ## Ownership and lifetime
   *
   * Implementations define acquisition and finalization; the base class retains the returned Effect.
   *
   * @since 1.0.0
   * @category effects
   */
  abstract toEffect(): Effect.Effect<B, E2, R2>;

  /** Pipes this dual Fx/Effect value through Effect or Typed combinators.
   *
   * @remarks
   * ## Why
   *
   * Delegates to Effect's `pipeArguments` and acquires no resources.
   *
   * ## Ownership and lifetime
   *
   * Returns the combinator result and retains no state beyond whatever that result captures.
   *
   * @since 1.0.0
   * @category combinators
   */
  pipe() {
    return pipeArguments(this, arguments);
  }

  // Memoize the effect
  protected _effect: Effect.Effect<B, E2, R2> | null = null;
  /** Memoized Effect view used by Effect's evaluator protocol.
   *
   * @remarks
   * ## Why
   *
   * The getter calls `toEffect` at most once per instance. It does not run the Effect and therefore
   * does not memoize successes or failures.
   *
   * ## Ownership and lifetime
   *
   * The instance retains the Effect description for its lifetime; each execution owns its own work.
   *
   * @since 1.0.0
   * @category effects
   */
  get override(): Effect.Effect<B, E2, R2> {
    return (this._effect ??= this.toEffect());
  }
}
