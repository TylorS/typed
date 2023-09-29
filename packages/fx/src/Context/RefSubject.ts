/**
 * A Contextual wrapper around a RefSubject
 * @since 1.18.0
 */

import * as Context from "@typed/context"
import { Computed } from "@typed/fx/Computed"
import { Filtered } from "@typed/fx/Filtered"
import type { Fx } from "@typed/fx/Fx"
import { fromFxEffect, provideSomeLayer } from "@typed/fx/Fx"
import type { VersionedFxEffect } from "@typed/fx/FxEffect"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import * as Ref from "@typed/fx/RefSubject"
import * as Effect from "effect/Effect"
import type { Equivalence } from "effect/Equivalence"
import type * as Layer from "effect/Layer"
import type * as Option from "effect/Option"

/**
 * A Contextual wrapper around a RefSubject
 * @since 1.18.0
 * @category models
 */
export interface RefSubject<I, E, A> extends VersionedFxEffect<I, I, E, A, I, E, A> {
  readonly tag: Context.Tagged<I, Ref.RefSubject<E, A>>

  readonly get: Effect.Effect<I, E, A>

  readonly set: (a: A) => Effect.Effect<I, never, A>

  readonly update: (f: (a: A) => A) => Effect.Effect<I, E, A>

  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<I, E, B>

  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<I | R2, E | E2, B>

  readonly updateEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, A>
  ) => Effect.Effect<I | R2, E | E2, A>

  readonly delete: Effect.Effect<I, never, Option.Option<A>>

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Computed<I, E, B>

  /**
   * Filter and map the current value of this Filtered to a new value using an Effect
   * @since 1.18.0
   */
  readonly filterMapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<R2, E | E2, B>

  /**
   * Filter ad map the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<never, E, B>

  /**
   * Make a layer initializing a RefSubject
   * @since 1.18.0
   */
  readonly make: <R>(fx: Fx<R, E, A>, eq?: Equivalence<A>) => Layer.Layer<R, never, I>

  /**
   * Provide an implementation of this RefSubject
   * @since 1.18.0
   */
  readonly provide: <R2>(fx: Fx<R2, E, A>, eq?: Equivalence<A>) => <R3, E3, C>(
    effect: Effect.Effect<R3, E3, C>
  ) => Effect.Effect<R2 | Exclude<R3, I>, E | E3, C>

  /**
   * Provide an implementation of this RefSubject
   * @since 1.18.0
   */
  readonly provideFx: <R2>(fx: Fx<R2, E, A>, eq?: Equivalence<A>) => <R3, E3, C>(
    effect: Fx<R3, E3, C>
  ) => Fx<R2 | Exclude<R3, I>, E | E3, C>
}

/**
 * Create a contextual wrapper around a RefSubject while maintaing the full API of
 * a Ref Subject.
 * @since 1.18.0
 * @category constructors
 */
export function RefSubject<E, A>(): {
  <const I extends Context.IdentifierConstructor<any>>(
    identifier: (id: typeof Context.id) => I
  ): RefSubject<Context.IdentifierOf<I>, E, A>
  <const I>(identifier: I): RefSubject<Context.IdentifierOf<I>, E, A>
} {
  function makeRefSubject<const I extends Context.IdentifierFactory<any>>(
    identifier: I
  ): RefSubject<Context.IdentifierOf<I>, E, A>
  function makeRefSubject<const I>(identifier: I): RefSubject<Context.IdentifierOf<I>, E, A>
  function makeRefSubject<const I>(identifier: I): RefSubject<Context.IdentifierOf<I>, E, A> {
    return new RefSubjectImpl(Context.Tagged<I, Ref.RefSubject<E, A>>(identifier)) as any
  }

  return makeRefSubject
}

class RefSubjectImpl<I, E, A> extends FxEffectProto<I, E, A, I, E, A>
  implements Omit<RefSubject<I, E, A>, ModuleAgumentedEffectKeysToOmit>
{
  constructor(readonly tag: Context.Tagged<I, Ref.RefSubject<E, A>>) {
    super()
  }

  protected toFx(): Fx<I, E, A> {
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

  make = <R>(fx: Fx<R, E, A>, eq?: Equivalence<A>): Layer.Layer<R, never, I> => this.tag.scoped(Ref.make(fx, eq))

  provide = <R2>(fx: Fx<R2, E, A>, eq?: Equivalence<A>) => Effect.provide(this.make(fx, eq))

  provideFx = <R2>(fx: Fx<R2, E, A>, eq?: Equivalence<A>) => provideSomeLayer(this.make(fx, eq))
}

/**
 * @since 1.18.0
 */
export namespace RefSubject {
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
