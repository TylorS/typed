import { Tag } from "@effect/data/Context"
import type { Option } from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as R from "@effect/io/Ref"
import { makeIdentifier } from "@typed/context/Identifier"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"

export interface Ref<I, A> extends Tag<I, R.Ref<A>> {
  readonly [R.RefTypeId]: R.RefTypeId

  // Ref Operators
  readonly get: Effect.Effect<I, never, A>
  readonly getAndSet: (a: A) => Effect.Effect<I, never, A>
  readonly getAndUpdate: (f: (a: A) => A) => Effect.Effect<I, never, A>
  readonly getAndUpdateSome: (f: (a: A) => Option<A>) => Effect.Effect<I, never, A>
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<I, never, B>
  readonly modifySome: <B>(fallback: B, f: (a: A) => Option<readonly [B, A]>) => Effect.Effect<I, never, B>
  readonly set: (a: A) => Effect.Effect<I, never, void>
  readonly setAndGet: (a: A) => Effect.Effect<I, never, A>
  readonly update: (f: (a: A) => A) => Effect.Effect<I, never, void>
  readonly updateAndGet: (f: (a: A) => A) => Effect.Effect<I, never, A>
  readonly updateSome: (f: (a: A) => Option<A>) => Effect.Effect<I, never, void>
  readonly updateSomeAndGet: (f: (a: A) => Option<A>) => Effect.Effect<I, never, A>

  // Provision
  readonly provide: (a: A) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I>, E, B>

  readonly provideLayer: <R2, E2>(
    effect: Effect.Effect<R2, E2, A>
  ) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I> | R2, E | E2, B>

  readonly layer: <R2, E2>(
    effect: Effect.Effect<R2, E2, A>
  ) => Layer.Layer<R2, E2, I>
}

export function Ref<A>() {
  function makeRef<const I extends IdentifierFactory<any>>(id: I): Ref<IdentifierOf<I>, A>
  function makeRef<const I>(id: IdentifierInput<I>): Ref<IdentifierOf<I>, A>
  function makeRef<const I>(id: IdentifierInput<I>): Ref<IdentifierOf<I>, A> {
    const tag = Tag<IdentifierOf<I>, R.Ref<A>>(makeIdentifier(id))

    const withRef = <R2, E2, B>(
      f: (ref: R.Ref<A>) => Effect.Effect<R2, E2, B>
    ) => Effect.flatMap(tag, f)

    const actions: Omit<Ref<IdentifierOf<I>, A>, keyof typeof tag> = {
      [R.RefTypeId]: R.RefTypeId,
      get: withRef(R.get),
      getAndSet: (a) => withRef(R.getAndSet(a)),
      getAndUpdate: (f) => withRef(R.getAndUpdate(f)),
      getAndUpdateSome: (f) => withRef(R.getAndUpdateSome(f)),
      modify: (f) => withRef(R.modify(f)),
      modifySome: (fallback, f) => withRef(R.modifySome(fallback, f)),
      set: (a) => withRef(R.set(a)),
      setAndGet: (a) => withRef(R.setAndGet(a)),
      update: (f) => withRef(R.update(f)),
      updateAndGet: (f) => withRef(R.updateAndGet(f)),
      updateSome: (f) => withRef(R.updateSome(f)),
      updateSomeAndGet: (f) => withRef(R.updateSomeAndGet(f)),
      provide: (a) => Effect.provideServiceEffect(tag, R.make(a)),
      provideLayer: (effect) => Effect.provideSomeLayer(actions.layer(effect)),
      layer: (effect) => Layer.effect(tag, Effect.flatMap(effect, R.make))
    }

    return Object.assign(tag, actions) satisfies Ref<IdentifierOf<I>, A>
  }

  return makeRef
}
