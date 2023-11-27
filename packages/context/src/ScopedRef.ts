/**
 * Contextual wrappers around @effect/io/ScopedRef
 * @since 1.0.0
 */

import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier"
import { Tag } from "./Tag"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Scope } from "effect/Scope"
import * as S from "effect/ScopedRef"

/**
 * Contextual wrappers around @effect/io/ScopedRef
 * @since 1.0.0
 * @category models
 */
export interface ScopedRef<I, A> extends Tag<I, S.ScopedRef<A>> {
  readonly [S.ScopedRefTypeId]: S.ScopedRefTypeId

  // ScopedRef Operators
  readonly get: Effect.Effect<I, never, A>
  readonly set: <R, E>(acquire: Effect.Effect<R, E, A>) => Effect.Effect<R | I, E, void>

  // Provision
  readonly provide: (a: A) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I> | Scope, E, B>
  readonly layer: <R2, E2>(
    effect: Effect.Effect<R2, E2, A>
  ) => Layer.Layer<Exclude<R2, Scope>, E2, I>
}

/**
 * Construct a ScopedRef implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function ScopedRef<A>(): {
  <const I extends IdentifierFactory<any>>(id: I): ScopedRef<IdentifierOf<I>, A>
  <const I>(id: IdentifierInput<I>): ScopedRef<IdentifierOf<I>, A>
} {
  function makeScopedRef<const I extends IdentifierFactory<any>>(id: I): ScopedRef<IdentifierOf<I>, A>
  function makeScopedRef<const I>(id: IdentifierInput<I>): ScopedRef<IdentifierOf<I>, A>
  function makeScopedRef<const I>(id: I): ScopedRef<IdentifierOf<I>, A> {
    const tag = Tag<I, S.ScopedRef<A>>(id)

    const withRef = <R2, E2, B>(
      f: (ref: S.ScopedRef<A>) => Effect.Effect<R2, E2, B>
    ) => Effect.flatMap(tag, f)

    const get = withRef(S.get)
    const set = <R, E>(a: Effect.Effect<R, E, A>) => withRef(S.set(a))

    const actions: Omit<ScopedRef<IdentifierOf<I>, A>, keyof typeof tag> = {
      [S.ScopedRefTypeId]: S.ScopedRefTypeId,
      get,
      set,
      provide: (a) => Effect.provideServiceEffect(tag, S.make(() => a)),
      layer: (effect) => Layer.scoped(tag, S.fromAcquire(effect))
    }

    return Object.assign(tag, actions) satisfies ScopedRef<IdentifierOf<I>, A>
  }

  return makeScopedRef
}
