/**
 * A RefSubject is the core abstraction for keeping state and subscribing to its
 * changes over time.
 *
 * @since 1.18.0
 */

import type { Equivalence } from "@effect/data/Equivalence"
import type * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import type * as Scope from "@effect/io/Scope"
import type { Computed } from "@typed/fx/Computed"
import type { Filtered } from "@typed/fx/Filtered"
import type { Fx } from "@typed/fx/Fx"
import * as coreRefSubject from "@typed/fx/internal/core-ref-subject"
import { makeHoldSubject } from "@typed/fx/internal/core-subject"
import type * as Subject from "@typed/fx/Subject"
import type { RefSubjectTypeId } from "@typed/fx/TypeId"

/**
 * A RefSubject is a Subject that has a current value that can be read and updated.
 * @since 1.18.0
 * @category models
 */
export interface RefSubject<in out E, in out A> extends Subject.Subject<never, E, A>, Effect.Effect<never, E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  /**
   * The Equivalence used to determine if a value has changed. Defaults to `Equal.equals`.
   * @since 1.18.0
   */
  readonly eq: Equivalence<A>

  /**
   * Get the current value of this RefSubject. If the RefSubject has not been initialized
   * then the initial value will be computed and returned. Concurrent calls to `get` will
   * only compute the initial value once.
   * @since 1.18.0
   */
  readonly get: Effect.Effect<never, E, A>

  /**
   * Set the current value of this RefSubject.
   * @since 1.18.0
   */
  readonly set: (a: A) => Effect.Effect<never, never, A>

  /**
   * Modify the current value of this RefSubject using the provided function.
   * @since 1.18.0
   */
  readonly update: (f: (a: A) => A) => Effect.Effect<never, E, A>

  /**
   * Modify the current value of this RefSubject and compute a new value.
   * @since 1.18.0
   */
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<never, E, B>

  /**
   * Delete the current value of this RefSubject. If it was not initialized the Option.none will be returned.
   * Otherwise the current value will be returned as an Option.some and the RefSubject will be uninitialized.
   * If there are existing subscribers to this RefSubject then the RefSubject will be re-initialized.
   * @since 1.18.0
   */
  readonly delete: Effect.Effect<never, never, Option.Option<A>>

  /**
   * Modify the current value of this RefSubject and compute a new value using the provided effectful function.
   * @since 1.18.0
   */
  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<R2, E | E2, B>

  /**
   * Modify the current value of this RefSubject using the provided effectful function.
   * @since 1.18.0
   */
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R2, E | E2, A>

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Computed<never, E, B>

  /**
   * Map the current value of this Filtered to a new value using an Effect
   * @since 1.18.0
   */
  readonly filterMapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<R2, E | E2, B>

  /**
   * Map the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<never, E, B>

  /**
   * Filter the current value of this Filtered to a new value using an Effect
   */
  readonly filterEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ) => Filtered<R2, E | E2, A>

  /**
   * Filter the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filter: (f: (a: A) => boolean) => Filtered<never, E, A>

  /**
   * A monotonic version number that is incremented every time the value of this RefSubject changes.
   * It is reset to 0 when the RefSubject is deleted.
   * @since 1.18.0
   */
  readonly version: Effect.Effect<never, never, number>
}

/**
 * Construct a RefSubject with a lazily initialized value.
 * @since 1.18.0
 * @category constructors
 */
export function fromEffect<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A>> {
  return Effect.contextWith((ctx) => unsafeMake(Effect.provideContext(initial, ctx), makeHoldSubject<E, A>(), eq))
}

/**
 * Construct a RefSubject from a synchronous value.
 * @since 1.18.0
 * @category constructors
 */
export function of<A, E = never>(initial: A, eq?: Equivalence<A>): Effect.Effect<never, never, RefSubject<E, A>> {
  return fromEffect<never, E, A>(Effect.succeed(initial), eq)
}

/**
 * Construct a RefSubject from any Fx value.
 *
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E, A>(
  fx: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A>>
export function make<R, E, A>(
  fx: Fx<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>>

export function make<R, E, A>(
  fx: Fx<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>> {
  return coreRefSubject.make(fx, eq)
}

/**
 * Construct a RefSubject from any Fx value.
 *
 * @since 1.18.0
 * @category constructors
 */
export function makeWithExtension<R, E, A, B>(
  fx: Effect.Effect<R, E, A>,
  f: (ref: RefSubject<E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A> & B>
export function makeWithExtension<R, E, A, B>(
  fx: Fx<R, E, A>,
  f: (ref: RefSubject<E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A> & B>

export function makeWithExtension<R, E, A, B>(
  fx: Fx<R, E, A>,
  f: (ref: RefSubject<E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A> & B> {
  return coreRefSubject.makeWithExtension(fx, f, eq)
}

/**
 * Construct a RefSubject with an initial value and the specified subject.
 * @since 1.18.0
 * @category constructors
 */
export const unsafeMake: <E, A>(
  initial: Effect.Effect<never, E, A>,
  subject: Subject.Subject<never, E, A>,
  eq?: Equivalence<A>
) => RefSubject<E, A> = coreRefSubject.unsafeMake
