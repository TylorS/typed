import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import type * as Equivalence from "effect/Equivalence";
import * as Exit from "effect/Exit";
import * as MutableRef from "effect/MutableRef";
import * as Option from "effect/Option";
import { EffectableWithOverride } from "./effectableWithOverride.js";

/**
 * A mutable, Effect-compatible cell that waits for its first `Exit` and samples the latest one
 * thereafter.
 *
 * @remarks
 * ## Why
 *
 * RefSubject needs one object that can be yielded as an Effect before initialization and read
 * synchronously from retained state after initialization. `DeferredRef` combines those two phases
 * without starting a polling fiber or allocating a new Deferred for every update.
 *
 * ## Ownership and lifetime
 *
 * An instance owns its current Deferred and mutates the supplied `MutableRef`. It acquires no
 * Scope. Callers must ensure that mutation is serialized when updates can race. `reset` interrupts
 * waiters on the previous Deferred and replaces it; dropping the instance releases the retained
 * `Exit` for garbage collection.
 *
 * ## Errors and interruption
 *
 * Executing the instance waits while `current` is `None`, then succeeds or fails exactly as the
 * stored `Exit`. `reset` completes the old Deferred with interruption attributed to `fiberId`.
 * The equality function controls version changes and the boolean returned by `done`; it does not
 * erase or transform typed failures.
 *
 * This import path is published for advanced state implementations, but its shape follows
 * RefSubject and Effect runtime details and may change between prereleases.
 *
 * @example
 * ```ts
 * import { DeferredRef } from "@typed/fx/Fx/internal/DeferredRef"
 * import { getExitEquivalence } from "@typed/fx/Fx/internal/equivalence"
 * import * as Effect from "effect/Effect"
 * import * as Equivalence from "effect/Equivalence"
 * import * as Exit from "effect/Exit"
 * import * as MutableRef from "effect/MutableRef"
 * import * as Option from "effect/Option"
 *
 * const current = MutableRef.make<Option.Option<Exit.Exit<number, never>>>(Option.none())
 * const ref = new DeferredRef(undefined, getExitEquivalence(Equivalence.Number), current)
 * ref.done(Exit.succeed(1))
 * const value = Effect.runSync(ref) // 1
 * ```
 *
 * @since 1.0.0
 * @category advanced
 * @stability internal-but-published
 */
export class DeferredRef<E, A> extends EffectableWithOverride<A, E, never> {
  /** The zero-based version of the latest distinct `Exit` since the last reset.
   *
   * @remarks
   * ## Why
   *
   * `reset` sets this to `-1`; the first distinct `done` call changes it to `0`, the next to `1`,
   * and so on. It is an ordinal, not a count.
   *
   * ## Ownership and lifetime
   *
   * The instance mutates this counter; reading it acquires no resources.
   *
   * @since 1.0.0
   * @category state
   */
  public version!: number;

  /** The one-shot gate used by Effects waiting for the first value after a reset.
   *
   * @remarks
   * ## Why
   *
   * This field is replaced by `reset`. Mutating or completing it externally can violate the
   * `current`/Deferred invariant.
   *
   * ## Ownership and lifetime
   *
   * The instance owns the gate until reset or collection; waiters borrow it through `override`.
   *
   * @since 1.0.0
   * @category state
   */
  public deferred!: Deferred.Deferred<A, E>;

  /** Fiber identifier used to attribute interruption when `reset` closes the old gate.
   *
   * @remarks
   * ## Why
   *
   * Retaining the creator's identifier makes reset interruption attributable in an Effect Cause.
   *
   * ## Ownership and lifetime
   *
   * Immutable scalar metadata retained for the instance lifetime.
   *
   * @since 1.0.0
   * @category state
   */
  readonly fiberId: number | undefined;

  /** Equivalence used to suppress version changes for repeated Exits.
   *
   * @remarks
   * ## Why
   *
   * State implementations can define semantic equality independently from object identity.
   *
   * ## Ownership and lifetime
   *
   * The instance retains and invokes the pure function; it acquires no services.
   *
   * @since 1.0.0
   * @category state
   */
  readonly eq: Equivalence.Equivalence<Exit.Exit<A, E>>;

  /** Shared mutable storage containing the latest success or failure, if initialized.
   *
   * @remarks
   * ## Why
   *
   * Sharing one cell lets RefSubject publication and Effect sampling observe the same latest Exit.
   *
   * ## Ownership and lifetime
   *
   * The constructor borrows this cell and clears it; external owners must coordinate mutation.
   *
   * @since 1.0.0
   * @category state
   */
  readonly current: MutableRef.MutableRef<Option.Option<Exit.Exit<A, E>>>;

  /** Constructs a cell over caller-supplied storage and immediately starts an empty version.
   *
   * @remarks
   * ## Why
   *
   * Advanced state implementations can share their existing current-Exit cell with the yieldable
   * Effect view while choosing the equality and interruption identity used by publication.
   *
   * ## Ownership and lifetime
   *
   * The constructor borrows and clears `current`, sets `version` to `-1`, and owns the newly created
   * one-shot Deferred until reset or collection. It does not clone storage, acquire a Scope, or
   * synchronize external mutation.
   *
   * @example
   * ```ts
   * import { DeferredRef } from "@typed/fx/Fx/internal/DeferredRef"
   * import { getExitEquivalence } from "@typed/fx/Fx/internal/equivalence"
   * import * as Equivalence from "effect/Equivalence"
   * import type * as Exit from "effect/Exit"
   * import * as MutableRef from "effect/MutableRef"
   * import * as Option from "effect/Option"
   *
   * const current = MutableRef.make<Option.Option<Exit.Exit<number, never>>>(Option.none())
   * const ref = new DeferredRef(undefined, getExitEquivalence(Equivalence.Number), current)
   * ref.version // -1 until the first distinct Exit is published
   * ```
   *
   * @since 1.0.0
   * @category constructors
   */
  constructor(
    fiberId: number | undefined,
    eq: Equivalence.Equivalence<Exit.Exit<A, E>>,
    current: MutableRef.MutableRef<Option.Option<Exit.Exit<A, E>>>,
  ) {
    super();
    this.fiberId = fiberId;
    this.eq = eq;
    this.current = current;
    this.reset();

    this.override = Effect.suspend(() => {
      const current = MutableRef.get(this.current);
      if (Option.isNone(current)) {
        return Deferred.await(this.deferred);
      } else {
        return current.value;
      }
    });
  }

  /** Effect view that awaits initialization or evaluates the latest stored `Exit`.
   *
   * @remarks
   * ## Why
   *
   * Each execution reads `current`. Once initialized, reads are O(1) and do not wait on the
   * Deferred.
   *
   * ## Ownership and lifetime
   *
   * The Effect borrows instance state and retains no per-execution resource after it completes.
   *
   * @since 1.0.0
   * @category effects
   */
  readonly override: Effect.Effect<A, E, never>;

  /** Stores an `Exit` and reports whether it differs from the previously stored value.
   *
   * @remarks
   * ## Why
   *
   * The current cell is updated even when `eq` reports equality. The first distinct value after a
   * reset completes the one-shot Deferred, changes `version` from `-1` to `0`, and releases waiters.
   * Later distinct values replace `current` and advance the zero-based version, but the already
   * completed Deferred is not re-completed and existing executions sample `current` directly.
   * An equivalent value leaves the version unchanged and returns `false`. The operation is O(1)
   * plus the cost of `eq`.
   *
   * ## Ownership and lifetime
   *
   * Mutates only this cell's current value, Deferred, and version; it starts no fiber or Scope.
   *
   * @since 1.0.0
   * @category mutations
   */
  done(exit: Exit.Exit<A, E>): boolean {
    const current = MutableRef.get(this.current);

    MutableRef.set(this.current, Option.some(exit));

    if (Option.isSome(current) && this.eq(current.value, exit)) {
      return false;
    }

    Deferred.doneUnsafe(this.deferred, exit);
    this.version += 1;

    return true;
  }

  /** Clears the sampled value and starts a fresh initialization phase.
   *
   * @remarks
   * ## Why
   *
   * Existing waiters are interrupted before the replacement Deferred is installed. The method is
   * synchronous and acquires no Scope.
   *
   * ## Ownership and lifetime
   *
   * Releases the old current Exit and gate from this instance after interrupting its waiters.
   *
   * @since 1.0.0
   * @category mutations
   */
  reset() {
    MutableRef.set(this.current, Option.none());
    this.version = -1;

    if (this.deferred) {
      Deferred.doneUnsafe(this.deferred, Exit.interrupt(this.fiberId));
    }

    this.deferred = Deferred.makeUnsafe();
  }
}

/** Creates a fresh `DeferredRef` and records the creating fiber for reset interruption.
 *
 * @remarks
 * ## Why
 *
 * Capturing the current fiber gives interruption of pre-reset waiters an attributable origin while
 * keeping ordinary construction inside Effect.
 *
 * ## Ownership and lifetime
 *
 * The returned instance owns its Deferred and mutable cell but acquires no Scope. Its state remains
 * reachable for exactly as long as callers retain the instance.
 *
 * @example
 * ```ts
 * import { make } from "@typed/fx/Fx/internal/DeferredRef"
 * import { getExitEquivalence } from "@typed/fx/Fx/internal/equivalence"
 * import * as Effect from "effect/Effect"
 * import * as Equivalence from "effect/Equivalence"
 *
 * const program = Effect.gen(function* () {
 *   const ref = yield* make(getExitEquivalence<never, number>(Equivalence.Number))
 *   return ref
 * })
 * ```
 *
 * @since 1.0.0
 * @category constructors
 * @stability internal-but-published
 */
export function make<E, A>(eq: Equivalence.Equivalence<Exit.Exit<A, E>>) {
  return Effect.withFiber((fiber) =>
    Effect.succeed(new DeferredRef(fiber.id, eq, MutableRef.make(Option.none()))),
  );
}

/** Constructs a `DeferredRef` over existing mutable storage without entering Effect.
 *
 * @remarks
 * ## Why
 *
 * State implementations that already own an `Exit` cell can share it with the Effect view instead
 * of copying or synchronizing two stores.
 *
 * ## Ownership and lifetime
 *
 * The returned instance borrows `current` and immediately resets it to `None`. Callers own all
 * synchronization and must not assume that the previous cell value survives construction.
 *
 * @example
 * ```ts
 * import { unsafeMake } from "@typed/fx/Fx/internal/DeferredRef"
 * import { getExitEquivalence } from "@typed/fx/Fx/internal/equivalence"
 * import * as Equivalence from "effect/Equivalence"
 * import * as Exit from "effect/Exit"
 * import * as MutableRef from "effect/MutableRef"
 * import * as Option from "effect/Option"
 *
 * const current = MutableRef.make<Option.Option<Exit.Exit<number, never>>>(Option.none())
 * const ref = unsafeMake(undefined, getExitEquivalence(Equivalence.Number), current)
 * ```
 *
 * @since 1.0.0
 * @category constructors
 * @stability internal-but-published
 */
export function unsafeMake<E, A>(
  id: number | undefined,
  eq: Equivalence.Equivalence<Exit.Exit<A, E>>,
  current: MutableRef.MutableRef<Option.Option<Exit.Exit<A, E>>>,
) {
  return new DeferredRef(id, eq, current);
}
