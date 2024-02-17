/**
 * Contextual wrappers around @effect/io/ScopedRef
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Scope } from "effect/Scope"
import * as S from "effect/ScopedRef"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier.js"
import { Tag } from "./Tag.js"

/**
 * Contextual wrappers around @effect/io/ScopedRef
 * @since 1.0.0
 * @category models
 */
export interface ScopedRef<I, A> extends Tag<I, S.ScopedRef<A>> {
  readonly [S.ScopedRefTypeId]: S.ScopedRefTypeId

  // ScopedRef Operators
  readonly get: Effect.Effect<A, never, I>
  readonly set: <R, E>(acquire: Effect.Effect<A, E, R>) => Effect.Effect<void, E, R | I>

  // Provision
  readonly provide: (a: A) => <R, E, B>(effect: Effect.Effect<B, E, R>) => Effect.Effect<B, E, Exclude<R, I> | Scope>
  readonly layer: <R2, E2>(
    effect: Effect.Effect<A, E2, R2>
  ) => Layer.Layer<I, E2, Exclude<R2, Scope>>
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
      f: (ref: S.ScopedRef<A>) => Effect.Effect<B, E2, R2>
    ) => Effect.flatMap(tag, f)

    const get = withRef(S.get)
    const set = <R, E>(a: Effect.Effect<A, E, R>) => withRef(S.set(a))

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
