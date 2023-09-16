/**
 * Contextual wrappers around @effect/io/SynchronizedRef
 * @since 1.0.0
 */

import type { Option } from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as SyncRef from "@effect/io/SynchronizedRef"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { withActions } from "@typed/context/Interface"
import { Tag } from "@typed/context/Tag"

/**
 * Contextual wrappers around @effect/io/SynchronizedRef
 * @since 1.0.0
 */
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
  readonly layer: <R2, E2>(
    effect: Effect.Effect<R2, E2, A>
  ) => Layer.Layer<R2, E2, I>
}

/**
 * Construct a SynchronizedRef implementation to be utilized from the Effect Context.
 * @since 1.0.0
 */
export function SynchronizedRef<A>() {
  function makeSynchronizedRef<const I extends IdentifierFactory<any>>(id: I): SynchronizedRef<IdentifierOf<I>, A>
  function makeSynchronizedRef<const I>(id: IdentifierInput<I>): SynchronizedRef<IdentifierOf<I>, A>
  function makeSynchronizedRef<const I>(id: I): SynchronizedRef<IdentifierOf<I>, A> {
    const tag = withActions(Tag<I, SyncRef.SynchronizedRef<A>>(id))

    const actions: Omit<SynchronizedRef<IdentifierOf<I>, A>, keyof typeof tag> = {
      [SyncRef.SynchronizedRefTypeId]: SyncRef.SynchronizedRefTypeId,
      get: tag.withEffect(SyncRef.get),
      getAndSet: (a) => tag.withEffect(SyncRef.getAndSet(a)),
      getAndUpdate: (f) => tag.withEffect(SyncRef.getAndUpdate(f)),
      getAndUpdateSome: (f) => tag.withEffect(SyncRef.getAndUpdateSome(f)),
      modify: (f) => tag.withEffect(SyncRef.modify(f)),
      modifySome: (fallback, f) => tag.withEffect(SyncRef.modifySome(fallback, f)),
      set: (a) => tag.withEffect(SyncRef.set(a)),
      setAndGet: (a) => tag.withEffect(SyncRef.setAndGet(a)),
      update: (f) => tag.withEffect(SyncRef.update(f)),
      updateAndGet: (f) => tag.withEffect(SyncRef.updateAndGet(f)),
      updateSome: (f) => tag.withEffect(SyncRef.updateSome(f)),
      updateSomeAndGet: (f) => tag.withEffect(SyncRef.updateSomeAndGet(f)),
      modifyEffect: (f) => tag.withEffect(SyncRef.modifyEffect(f)),
      modifySomeEffect: (fallback, f) => tag.withEffect(SyncRef.modifySomeEffect(fallback, f)),
      updateEffect: (f) => tag.withEffect(SyncRef.updateEffect(f)),
      updateSomeEffect: (f) => tag.withEffect(SyncRef.updateSomeEffect(f)),
      updateSomeAndGetEffect: (f) => tag.withEffect(SyncRef.updateSomeAndGetEffect(f)),
      getAndUpdateEffect: (f) => tag.withEffect(SyncRef.getAndUpdateEffect(f)),
      getAndUpdateSomeEffect: (f) => tag.withEffect(SyncRef.getAndUpdateSomeEffect(f)),
      updateAndGetEffect: (f) => tag.withEffect(SyncRef.updateAndGetEffect(f)),
      provide: (a) => Effect.provideServiceEffect(tag, SyncRef.make(a)),
      layer: (effect) => Layer.effect(tag, Effect.flatMap(effect, SyncRef.make))
    }

    return Object.assign(tag, actions) satisfies SynchronizedRef<IdentifierOf<I>, A>
  }

  return makeSynchronizedRef
}
