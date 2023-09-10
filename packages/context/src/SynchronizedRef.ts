import { Tag } from "@effect/data/Context"
import type { Option } from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as SyncRef from "@effect/io/SynchronizedRef"
import { makeIdentifier } from "@typed/context/Identifier"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"

export interface SynchronizedRef<I, A> extends Tag<I, SyncRef.SynchronizedRef<A>> {
  readonly [SyncRef.SynchronizedRefTypeId]: SyncRef.SynchronizedRefTypeId

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

  // SynchronizedRef operators
  readonly modifyEffect: <R, E, B>(
    f: (a: A) => Effect.Effect<R, E, readonly [B, A]>
  ) => Effect.Effect<I | R, E, B>
  readonly modifySomeEffect: <R, E, B>(
    fallback: B,
    f: (a: A) => Option<Effect.Effect<R, E, readonly [B, A]>>
  ) => Effect.Effect<I | R, E, B>
  readonly updateEffect: <R, E>(
    f: (a: A) => Effect.Effect<R, E, A>
  ) => Effect.Effect<I | R, E, void>
  readonly updateSomeEffect: <R, E>(
    f: (a: A) => Option<Effect.Effect<R, E, A>>
  ) => Effect.Effect<I | R, E, void>
  readonly updateSomeAndGetEffect: <R, E>(
    f: (a: A) => Option<Effect.Effect<R, E, A>>
  ) => Effect.Effect<I | R, E, A>
  readonly getAndUpdateEffect: <R, E>(
    f: (a: A) => Effect.Effect<R, E, A>
  ) => Effect.Effect<I | R, E, A>
  readonly getAndUpdateSomeEffect: <R, E>(
    f: (a: A) => Option<Effect.Effect<R, E, A>>
  ) => Effect.Effect<I | R, E, A>
  readonly updateAndGetEffect: <R, E>(
    f: (a: A) => Effect.Effect<R, E, A>
  ) => Effect.Effect<I | R, E, A>

  // Provision
  readonly provide: (a: A) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I>, E, B>
  readonly provideLayer: <R2, E2>(
    effect: Effect.Effect<R2, E2, A>
  ) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I> | R2, E | E2, B>
  readonly layer: <R2, E2>(
    effect: Effect.Effect<R2, E2, A>
  ) => Layer.Layer<R2, E2, I>
}

export function SynchronizedRef<A>() {
  function makeSynchronizedRef<const I extends IdentifierFactory<any>>(id: I): SynchronizedRef<IdentifierOf<I>, A>
  function makeSynchronizedRef<const I>(id: IdentifierInput<I>): SynchronizedRef<IdentifierOf<I>, A>
  function makeSynchronizedRef<const I>(id: IdentifierInput<I>): SynchronizedRef<IdentifierOf<I>, A> {
    const tag = Tag<IdentifierOf<I>, SyncRef.SynchronizedRef<A>>(makeIdentifier(id))

    const withRef = <R2, E2, B>(
      f: (ref: SyncRef.SynchronizedRef<A>) => Effect.Effect<R2, E2, B>
    ) => Effect.flatMap(tag, f)

    const actions: Omit<SynchronizedRef<IdentifierOf<I>, A>, keyof typeof tag> = {
      [SyncRef.SynchronizedRefTypeId]: SyncRef.SynchronizedRefTypeId,
      get: withRef(SyncRef.get),
      getAndSet: (a) => withRef(SyncRef.getAndSet(a)),
      getAndUpdate: (f) => withRef(SyncRef.getAndUpdate(f)),
      getAndUpdateSome: (f) => withRef(SyncRef.getAndUpdateSome(f)),
      modify: (f) => withRef(SyncRef.modify(f)),
      modifySome: (fallback, f) => withRef(SyncRef.modifySome(fallback, f)),
      set: (a) => withRef(SyncRef.set(a)),
      setAndGet: (a) => withRef(SyncRef.setAndGet(a)),
      update: (f) => withRef(SyncRef.update(f)),
      updateAndGet: (f) => withRef(SyncRef.updateAndGet(f)),
      updateSome: (f) => withRef(SyncRef.updateSome(f)),
      updateSomeAndGet: (f) => withRef(SyncRef.updateSomeAndGet(f)),
      modifyEffect: (f) => withRef(SyncRef.modifyEffect(f)),
      modifySomeEffect: (fallback, f) => withRef(SyncRef.modifySomeEffect(fallback, f)),
      updateEffect: (f) => withRef(SyncRef.updateEffect(f)),
      updateSomeEffect: (f) => withRef(SyncRef.updateSomeEffect(f)),
      updateSomeAndGetEffect: (f) => withRef(SyncRef.updateSomeAndGetEffect(f)),
      getAndUpdateEffect: (f) => withRef(SyncRef.getAndUpdateEffect(f)),
      getAndUpdateSomeEffect: (f) => withRef(SyncRef.getAndUpdateSomeEffect(f)),
      updateAndGetEffect: (f) => withRef(SyncRef.updateAndGetEffect(f)),
      provide: (a) => Effect.provideServiceEffect(tag, SyncRef.make(a)),
      provideLayer: (effect) => Effect.provideSomeLayer(actions.layer(effect)),
      layer: (effect) => Layer.effect(tag, Effect.flatMap(effect, SyncRef.make))
    }

    return Object.assign(tag, actions) satisfies SynchronizedRef<IdentifierOf<I>, A>
  }

  return makeSynchronizedRef
}
