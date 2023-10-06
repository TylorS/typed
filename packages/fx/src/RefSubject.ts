/**
 * A RefSubject is the core abstraction for keeping state and subscribing to its
 * changes over time.
 *
 * @since 1.18.0
 */

import * as C from "@typed/context"
import { Computed } from "@typed/fx/Computed"
import { Filtered } from "@typed/fx/Filtered"
import type * as Fx from "@typed/fx/Fx"
import { provide } from "@typed/fx/internal/core"
import * as coreRefSubject from "@typed/fx/internal/core-ref-subject"
import { makeHoldSubject } from "@typed/fx/internal/core-subject"
import { exit, fromFxEffect } from "@typed/fx/internal/fx"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import type * as Sink from "@typed/fx/Sink"
import type * as Subject from "@typed/fx/Subject"
import { RefSubjectTypeId } from "@typed/fx/TypeId"
import * as Versioned from "@typed/fx/Versioned"
import { Cause, Either, Exit, identity } from "effect"
import * as Effect from "effect/Effect"
import type { Equivalence } from "effect/Equivalence"
import type * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import type * as Scope from "effect/Scope"

/**
 * A RefSubject is a Subject that has a current value that can be read and updated.
 * @since 1.18.0
 * @category models
 */
export interface RefSubject<R, in out E, in out A>
  extends Versioned.Versioned<R, R, E, A, R, E, A>, Sink.WithContext<R, E, A>
{
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  /**
   * Get the current value of this RefSubject. If the RefSubject has not been initialized
   * then the initial value will be computed and returned. Concurrent calls to `get` will
   * only compute the initial value once.
   * @since 1.18.0
   */
  readonly get: Effect.Effect<R, E, A>

  /**
   * Set the current value of this RefSubject.
   * @since 1.18.0
   */
  readonly set: (a: A) => Effect.Effect<R, never, A>

  /**
   * Modify the current value of this RefSubject using the provided function.
   * @since 1.18.0
   */
  readonly update: (f: (a: A) => A) => Effect.Effect<R, E, A>

  /**
   * Modify the current value of this RefSubject and compute a new value.
   * @since 1.18.0
   */
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<R, E, B>

  /**
   * Delete the current value of this RefSubject. If it was not initialized the Option.none will be returned.
   * Otherwise the current value will be returned as an Option.some and the RefSubject will be uninitialized.
   * If there are existing subscribers to this RefSubject then the RefSubject will be re-initialized.
   * @since 1.18.0
   */
  readonly delete: Effect.Effect<R, never, Option.Option<A>>

  /**
   * Modify the current value of this RefSubject and compute a new value using the provided effectful function.
   * @since 1.18.0
   */
  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<R | R2, E | E2, B>

  /**
   * Modify the current value of this RefSubject using the provided effectful function.
   * @since 1.18.0
   */
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R | R2, E | E2, A>

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R | R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Computed<R, E, B>

  /**
   * Map the current value of this Filtered to a new value using an Effect
   * @since 1.18.0
   */
  readonly filterMapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<R | R2, E | E2, B>

  /**
   * Map the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<R, E, B>

  /**
   * Filter the current value of this Filtered to a new value using an Effect
   */
  readonly filterEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ) => Filtered<R | R2, E | E2, A>

  /**
   * Filter the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filter: (f: (a: A) => boolean) => Filtered<R, E, A>

  /**
   * A monotonic version number that is incremented every time the value of this RefSubject changes.
   * It is reset to 0 when the RefSubject is deleted.
   * @since 1.18.0
   */
  readonly version: Effect.Effect<R, never, number>

  /**
   * Interrupt the current Fibers.
   */
  readonly interrupt: Effect.Effect<R, never, void>
}

export namespace RefSubject {
  /**
   * A Contextual wrapper around a RefSubject
   * @since 1.18.0
   * @category models
   */
  export interface Tagged<I, E, A> extends RefSubject<I, E, A> {
    readonly tag: C.Tagged<I, RefSubject<never, E, A>>

    /**
     * Make a layer initializing a RefSubject
     * @since 1.18.0
     */
    readonly make: <R>(fx: Fx.Fx<R, E, A>, eq?: Equivalence<A>) => Layer.Layer<R, never, I>

    /**
     * Provide an implementation of this RefSubject
     * @since 1.18.0
     */
    readonly provide: <R2>(fx: Fx.Fx<R2, E, A>, eq?: Equivalence<A>) => <R3, E3, C>(
      effect: Effect.Effect<R3, E3, C>
    ) => Effect.Effect<R2 | Exclude<R3, I>, E | E3, C>

    /**
     * Provide an implementation of this RefSubject
     * @since 1.18.0
     */
    readonly provideFx: <R2>(fx: Fx.Fx<R2, E, A>, eq?: Equivalence<A>) => <R3, E3, C>(
      effect: Fx.Fx<R3, E3, C>
    ) => Fx.Fx<R2 | Exclude<R3, I>, E | E3, C>
  }

  /**
   * Extract the Identifier from a RefSubject
   * @since 1.18.0
   */
  export type Identifier<T> = T extends RefSubject<infer I, infer _, infer __> ? I : never

  /**
   * Extract the Error from a RefSubject
   * @since 1.18.0
   */
  export type Error<T> = T extends RefSubject<infer _, infer E, infer __> ? E : never

  /**
   * Extract the State from a RefSubject
   * @since 1.18.0
   */
  export type State<T> = T extends RefSubject<infer _, infer __, infer S> ? S : never
}

/**
 * Construct a RefSubject with a lazily initialized value.
 * @since 1.18.0
 * @category constructors
 */
export function fromEffect<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<never, E, A>> {
  return Effect.contextWith((ctx) => unsafeMake(Effect.provide(initial, ctx), makeHoldSubject<E, A>(), eq))
}

/**
 * Construct a RefSubject from a synchronous value.
 * @since 1.18.0
 * @category constructors
 */
export function of<A, E = never>(
  initial: A,
  eq?: Equivalence<A>
): Effect.Effect<never, never, RefSubject<never, E, A>> {
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
): Effect.Effect<R, never, RefSubject<never, E, A>>
export function make<R, E, A>(
  fx: Fx.Fx<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>

export function make<R, E, A>(
  fx: Fx.Fx<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>> {
  return coreRefSubject.make(fx, eq)
}

/**
 * Create a contextual wrapper around a RefSubject while maintaing the full API of
 * a Ref Subject.
 * @since 1.18.0
 * @category constructors
 */
export function tagged<E, A>(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
} {
  function makeTagged<const I extends C.IdentifierFactory<any>>(
    identifier: I
  ): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
  function makeTagged<const I>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
  function makeTagged<const I>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, E, A> {
    return new ContextImpl(C.Tagged<I, RefSubject<never, E, A>>(identifier)) as any
  }

  return makeTagged
}

class ContextImpl<I, E, A> extends FxEffectProto<I, E, A, I, E, A>
  implements Omit<RefSubject<I, E, A>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  constructor(readonly tag: C.Tagged<I, RefSubject<never, E, A>>) {
    super()
  }

  protected toFx(): Fx.Fx<I, E, A> {
    return fromFxEffect(this.tag)
  }

  protected toEffect(): Effect.Effect<I, E, A> {
    return Effect.flatten(this.tag)
  }

  version = this.tag.withEffect((ref) => ref.version)

  modifyEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>) => Effect.Effect<I | R2, E | E2, B> = (
    f
  ) => this.tag.withEffect((ref) => ref.modifyEffect(f))

  modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<I, E, B> = (f) =>
    this.tag.withEffect((ref) => ref.modify(f))

  updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<I | R2, E | E2, A> = (f) =>
    this.tag.withEffect((ref) => ref.updateEffect(f))

  update: (f: (a: A) => A) => Effect.Effect<I, E, A> = (f) => this.tag.withEffect((ref) => ref.update(f))

  get: Effect.Effect<I, E, A> = this.tag.withEffect((ref) => ref.get)

  set: (a: A) => Effect.Effect<I, never, A> = (a) => this.tag.withEffect((ref) => ref.set(a))

  delete: Effect.Effect<I, never, Option.Option<A>> = this.tag.withEffect((ref) => ref.delete)

  mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R2, E | E2, B> = (f) =>
    Computed(this as any, f)

  map: <B>(f: (a: A) => B) => Computed<I, E, B> = (f) => Computed(this as any, (a: A) => Effect.sync(() => f(a)))

  filterMapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<R2, E | E2, B> = (f) => Filtered(this as any, f)

  filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<never, E, B> = (f) =>
    Filtered(this as any, (a: A) => Effect.sync(() => f(a)))

  filter: (f: (a: A) => boolean) => Filtered<I, E, A> = (f) =>
    this.filterMap((a) => f(a) ? Option.some(a) : Option.none())

  filterEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>) => Filtered<I | R2, E | E2, A> = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => b ? Option.some(a) : Option.none()))

  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<I, never, unknown> = (cause) =>
    this.tag.withEffect((ref) => ref.onFailure(cause))

  onSuccess: (value: A) => Effect.Effect<I, never, unknown> = (a) => this.tag.withEffect((ref) => ref.onSuccess(a))

  interrupt: Effect.Effect<I, never, void> = this.tag.withEffect((r) => r.interrupt)

  make = <R>(fx: Fx.Fx<R, E, A>, eq?: Equivalence<A>): Layer.Layer<R, never, I> => this.tag.scoped(make(fx, eq))

  provide = <R2>(fx: Fx.Fx<R2, E, A>, eq?: Equivalence<A>) => Effect.provide(this.make(fx, eq))

  provideFx = <R2>(fx: Fx.Fx<R2, E, A>, eq?: Equivalence<A>) => provide(this.make(fx, eq))
}

/**
 * Construct a RefSubject from any Fx value.
 *
 * @since 1.18.0
 * @category constructors
 */
export function makeWithExtension<R, E, A, B>(
  fx: Effect.Effect<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<never, E, A> & B>
export function makeWithExtension<R, E, A, B>(
  fx: Fx.Fx<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A> & B>

export function makeWithExtension<R, E, A, B>(
  fx: Fx.Fx<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A> & B> {
  return coreRefSubject.makeWithExtension(fx, f, eq)
}

/**
 * Construct a RefSubject with an initial value and the specified subject.
 * @since 1.18.0
 * @category constructors
 */
export const unsafeMake: <R, E, A>(
  initial: Effect.Effect<R, E, A>,
  subject: Subject.Subject<R, E, A>,
  eq?: Equivalence<A>
) => RefSubject<R, E, A> = coreRefSubject.unsafeMake

/**
 * Flatten an RefSubject of an Option into a Filtered.
 * @since 1.18.0
 * @category combinators
 */
export const compact = <R, E, A>(refSubject: RefSubject<R, E, Option.Option<A>>): Filtered<R, E, A> =>
  refSubject.filterMap(identity)

/**
 * Split a RefSubject's into 2 Filtered values that track its errors and
 * success values separately.
 * @since 1.18.0
 * @category combinators
 */
export const split = <R, E, A>(
  refSubject: RefSubject<R, E, A>
): readonly [Filtered<R, never, E>, Filtered<R, never, A>] => {
  const versioned = Versioned.transform(refSubject, exit, Effect.exit)
  const left = Filtered(versioned, getLeft)
  const right = Filtered(versioned, getRight)

  return [left, right] as const
}

const getLeft = <E, A>(exit: Exit.Exit<E, A>) =>
  Effect.sync(() =>
    Exit.match(exit, {
      onFailure: (cause) => Either.getLeft(Cause.failureOrCause(cause)),
      onSuccess: () => Option.none()
    })
  )

const getRight = <E, A>(exit: Exit.Exit<E, A>) =>
  Effect.sync(() =>
    Exit.match(exit, {
      onFailure: () => Option.none(),
      onSuccess: (a) => Option.some(a)
    })
  )
