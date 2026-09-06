import { Effectable } from "effect";
import type * as Effect from "effect/Effect";
import { EFFECT_EVALUATE_KEY } from "./effectableEvaluateKey.js";

/** Effectable base class whose generator evaluation delegates to an explicit Effect.
 *
 * @remarks
 * ## Why
 *
 * Effect 4's `Effectable.Class` evaluates to the object itself. Typed's yieldable objects instead
 * need `Effect.gen` to execute their `override` Effect. The prototype protocol installed below
 * returns that Effect and avoids recursively yielding the same object.
 *
 * ## Ownership and lifetime
 *
 * The base class owns no fiber or Scope. Subclasses own the Effect assigned to `override` and all
 * resources that Effect acquires. Execution preserves its value, typed error, service, interruption,
 * and finalization channels.
 *
 * This class is a published extension point, but it is coupled to Effect's evaluator protocol and
 * may change between prereleases.
 *
 * @example
 * ```ts
 * import { EffectableWithOverride } from "@typed/fx/Fx/internal/effectableWithOverride"
 * import * as Effect from "effect/Effect"
 *
 * class Answer extends EffectableWithOverride<number> {
 *   readonly override = Effect.succeed(42)
 * }
 *
 * const value = Effect.runSync(new Answer()) // 42
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export abstract class EffectableWithOverride<A, E = never, R = never> extends Effectable.Class<
  A,
  E,
  R
> {
  /** The real Effect executed when this object is yielded or otherwise evaluated by Effect.
   *
   * @remarks
   * ## Why
   *
   * Subclasses must return stable work for the lifetime semantics they advertise; the base class
   * neither memoizes nor scopes it.
   *
   * ## Ownership and lifetime
   *
   * The subclass owns this Effect and every resource it acquires; the evaluator only delegates.
   *
   * @since 1.0.0
   * @category effects
   */
  abstract override: Effect.Effect<A, E, R>;
}

// @effect-diagnostics-next-line floatingEffect:off
Object.defineProperty(EffectableWithOverride.prototype, EFFECT_EVALUATE_KEY, {
  value: function (this: EffectableWithOverride<unknown, unknown, unknown>) {
    return this.override;
  },
  configurable: true,
  writable: true,
});
