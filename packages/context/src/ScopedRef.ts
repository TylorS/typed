import { Tag } from "@effect/data/Context"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import type { Scope } from "@effect/io/Scope"
import * as S from "@effect/io/ScopedRef"
import { makeIdentifier } from "@typed/context/Identifier"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"

export interface ScopedRef<I, A> extends Tag<I, S.ScopedRef<A>> {
  // ScopedRef Operators
  readonly get: Effect.Effect<I, never, A>
  readonly set: <R, E>(acquire: Effect.Effect<R, E, A>) => Effect.Effect<R | I, E, void>

  // Provision
  readonly provide: (a: A) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I> | Scope, E, B>
  readonly provideLayer: <R2, E2>(
    effect: Effect.Effect<R2, E2, A>
  ) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I> | Exclude<R2, Scope>, E | E2, B>
  readonly layer: <R2, E2>(
    effect: Effect.Effect<R2, E2, A>
  ) => Layer.Layer<Exclude<R2, Scope>, E2, I>
}

export function ScopedRef<A>() {
  function makeScopedRef<const I extends IdentifierFactory<any>>(id: I): ScopedRef<IdentifierOf<I>, A>
  function makeScopedRef<const I>(id: IdentifierInput<I>): ScopedRef<IdentifierOf<I>, A>
  function makeScopedRef<const I>(id: IdentifierInput<I>): ScopedRef<IdentifierOf<I>, A> {
    const tag = Tag<IdentifierOf<I>, S.ScopedRef<A>>(makeIdentifier(id))

    const withRef = <R2, E2, B>(
      f: (ref: S.ScopedRef<A>) => Effect.Effect<R2, E2, B>
    ) => Effect.flatMap(tag, f)

    const get = withRef(S.get)
    const set = <R, E>(a: Effect.Effect<R, E, A>) => withRef(S.set(a))

    const actions: Omit<ScopedRef<IdentifierOf<I>, A>, keyof typeof tag> = {
      get,
      set,
      provide: (a) => Effect.provideServiceEffect(tag, S.make(() => a)),
      provideLayer: (effect) => Effect.provideSomeLayer(actions.layer(effect)),
      layer: (effect) => Layer.scoped(tag, S.fromAcquire(effect))
    }

    return Object.assign(tag, actions) satisfies ScopedRef<IdentifierOf<I>, A>
  }

  return makeScopedRef
}
