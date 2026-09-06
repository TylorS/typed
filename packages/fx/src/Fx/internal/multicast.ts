import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { EffectableWithOverride } from "./effectableWithOverride.js";

/** An Effect-compatible wrapper that joins the currently recorded detached execution.
 *
 * @remarks
 * ## Why
 *
 * Some sampled state computations are expensive but may be requested concurrently. The wrapper
 * lets later callers join the same in-flight fiber, preserving one result, typed failure, and Cause
 * for that run. After completion the recorded fiber is cleared and a later call starts fresh work.
 *
 * ## Ownership and lifetime
 *
 * The first caller starts `effect` in a detached fiber using that caller's services. Interrupting a
 * joining caller stops only its wait; the detached computation continues until completion or an
 * explicit `interrupt`. A directly constructed instance has no automatic finalizer. Prefer
 * `makeMulticastEffect` when a Scope should interrupt remaining work.
 *
 * ## Concurrency and interruption
 *
 * Calls made after `_fiber` is recorded join that fiber. Recording uses mutable instance state
 * rather than a semaphore, so this is a low-level primitive whose callers must not assume a stronger
 * atomic-start guarantee than the implementation provides. Completion or explicit interruption
 * clears the matching record; all joiners observe the fiber's exact success, typed error, defect,
 * or interruption.
 *
 * This path is published for advanced state implementations and may change between prereleases.
 *
 * @example
 * ```ts
 * import { MulticastEffect } from "@typed/fx/Fx/internal/multicast"
 * import * as Effect from "effect/Effect"
 *
 * const sharedWhileRunning = new MulticastEffect(Effect.succeed("ready"))
 * const value = Effect.runSync(sharedWhileRunning)
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export class MulticastEffect<A, E, R> extends EffectableWithOverride<A, E, R> {
  private _fiber: Fiber.Fiber<A, E> | null = null;

  /** Underlying computation started when no recorded fiber is running.
   *
   * @remarks
   * ## Why
   *
   * Keeping the source Effect visible lets advanced implementations inspect or compose the exact
   * work whose in-flight execution is shared.
   *
   * ## Ownership and lifetime
   *
   * The wrapper retains this immutable Effect description; resources begin only when it is run.
   *
   * @since 1.0.0
   * @category effects
   */
  readonly effect: Effect.Effect<A, E, R>;

  /** Creates a wrapper without attaching its future detached fiber to a Scope.
   *
   * @remarks
   * ## Why
   *
   * Direct construction supports owners such as Versioned that already expose an explicit
   * interruption boundary and do not need acquisition itself to require Scope.
   *
   * ## Ownership and lifetime
   *
   * Construction retains only the Effect description and starts no work. The first evaluation may
   * start a detached fiber, which remains this instance's responsibility until it completes or
   * `interrupt` is run. Use `makeMulticastEffect` when Scope closure should provide that cleanup.
   *
   * @example
   * ```ts
   * import { MulticastEffect } from "@typed/fx/Fx/internal/multicast"
   * import * as Effect from "effect/Effect"
   *
   * const shared = new MulticastEffect(Effect.succeed("ready"))
   * const result = Effect.runSync(shared)
   * ```
   *
   * @since 1.0.0
   * @category constructors
   */
  constructor(effect: Effect.Effect<A, E, R>) {
    super();
    this.effect = effect;

    this.override = Effect.suspend(() => {
      if (this._fiber) {
        return Fiber.join(this._fiber);
      } else {
        return Effect.forkDetach(this.effect).pipe(
          Effect.tap((fiber) => Effect.sync(() => (this._fiber = fiber))),
          Effect.flatMap((fiber) =>
            Effect.ensuring(
              Fiber.join(fiber),
              Effect.sync(() => (this._fiber === fiber ? (this._fiber = null) : null)),
            ),
          ),
        );
      }
    });
  }

  /** Effect view that joins the recorded fiber or starts and records a detached one.
   *
   * @remarks
   * ## Why
   *
   * Effect evaluation is the common entry point through which concurrent callers share work.
   *
   * ## Ownership and lifetime
   *
   * A newly started fiber is detached from the joining caller and remains recorded until completion
   * or explicit interruption.
   *
   * @since 1.0.0
   * @category effects
   */
  readonly override: Effect.Effect<A, E, R>;

  /** Interrupts the currently recorded fiber as the calling fiber and clears the record.
   *
   * @remarks
   * ## Why
   *
   * If no fiber is recorded, the Effect succeeds immediately. Interruption of the child is awaited,
   * and cleanup clears the field even when interruption observation itself is interrupted.
   *
   * ## Ownership and lifetime
   *
   * The Effect owns only this interruption action; it does not prevent a later execution from
   * starting a fresh fiber.
   *
   * @since 1.0.0
   * @category lifecycle
   */
  interrupt() {
    return Effect.withFiber((fiber) => {
      if (this._fiber) {
        const eff = Fiber.interruptAs(this._fiber, fiber.id);
        return Effect.ensuring(
          eff,
          Effect.sync(() => (this._fiber = null)),
        );
      } else {
        return Effect.void;
      }
    });
  }
}

/** Acquires a scoped `MulticastEffect` whose finalizer interrupts recorded work.
 *
 * @remarks
 * ## Why
 *
 * The scoped constructor makes the detached-fiber lifetime explicit and prevents a computation
 * from surviving the application lifetime that requested sharing.
 *
 * ## Ownership and lifetime
 *
 * Acquisition allocates the wrapper but does not start `effect`. The first execution starts work;
 * closing the required Scope calls `interrupt` and waits for the recorded fiber to terminate. The
 * original effect's `E` and `R` channels are preserved when the wrapper is executed.
 *
 * @example
 * ```ts
 * import { makeMulticastEffect } from "@typed/fx/Fx/internal/multicast"
 * import * as Effect from "effect/Effect"
 *
 * const program = Effect.gen(function* () {
 *   const shared = yield* makeMulticastEffect(Effect.succeed("ready"))
 *   return yield* shared
 * })
 *
 * Effect.runSync(Effect.scoped(program))
 * ```
 *
 * @since 1.0.0
 * @category constructors
 * @stability internal-but-published
 */
export const makeMulticastEffect = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  Effect.acquireRelease(
    Effect.sync(() => new MulticastEffect(effect)),
    (multicastEffect) => multicastEffect.interrupt(),
  );
