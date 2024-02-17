/**
 * Contextual wrappers around @effect/io/SynchronizedRef
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Option } from "effect/Option"
import * as SyncRef from "effect/SynchronizedRef"
import { withActions } from "./Extensions.js"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier.js"
import { Tag } from "./Tag.js"

/**
 * Contextual wrappers around @effect/io/SynchronizedRef
 * @since 1.0.0
 * @category models
 */
export interface SynchronizedRef<I, A> extends Tag<I, SyncRef.SynchronizedRef<A>> {
  readonly [SyncRef.SynchronizedRefTypeId]: SyncRef.SynchronizedRefTypeId

  // Ref Operators
  readonly get: Effect.Effect<A, never, I>
  readonly getAndSet: (a: A) => Effect.Effect<A, never, I>
  readonly getAndUpdate: (f: (a: A) => A) => Effect.Effect<A, never, I>
  readonly getAndUpdateSome: (f: (a: A) => Option<A>) => Effect.Effect<A, never, I>
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<B, never, I>
  readonly modifySome: <B>(fallback: B, f: (a: A) => Option<readonly [B, A]>) => Effect.Effect<B, never, I>
  readonly set: (a: A) => Effect.Effect<void, never, I>
  readonly setAndGet: (a: A) => Effect.Effect<A, never, I>
  readonly update: (f: (a: A) => A) => Effect.Effect<void, never, I>
  readonly updateAndGet: (f: (a: A) => A) => Effect.Effect<A, never, I>
  readonly updateSome: (f: (a: A) => Option<A>) => Effect.Effect<void, never, I>
  readonly updateSomeAndGet: (f: (a: A) => Option<A>) => Effect.Effect<A, never, I>

  // SynchronizedRef operators
  readonly modifyEffect: <R, E, B>(
    f: (a: A) => Effect.Effect<readonly [B, A], E, R>
  ) => Effect.Effect<B, E, I | R>
  readonly modifySomeEffect: <R, E, B>(
    fallback: B,
    f: (a: A) => Option<Effect.Effect<readonly [B, A], E, R>>
  ) => Effect.Effect<B, E, I | R>
  readonly updateEffect: <R, E>(
    f: (a: A) => Effect.Effect<A, E, R>
  ) => Effect.Effect<void, E, I | R>
  readonly updateSomeEffect: <R, E>(
    f: (a: A) => Option<Effect.Effect<A, E, R>>
  ) => Effect.Effect<void, E, I | R>
  readonly updateSomeAndGetEffect: <R, E>(
    f: (a: A) => Option<Effect.Effect<A, E, R>>
  ) => Effect.Effect<A, E, I | R>
  readonly getAndUpdateEffect: <R, E>(
    f: (a: A) => Effect.Effect<A, E, R>
  ) => Effect.Effect<A, E, I | R>
  readonly getAndUpdateSomeEffect: <R, E>(
    f: (a: A) => Option<Effect.Effect<A, E, R>>
  ) => Effect.Effect<A, E, I | R>
  readonly updateAndGetEffect: <R, E>(
    f: (a: A) => Effect.Effect<A, E, R>
  ) => Effect.Effect<A, E, I | R>

  // Provision
  readonly provide: (a: A) => <R, E, B>(effect: Effect.Effect<B, E, R>) => Effect.Effect<B, E, Exclude<R, I>>
  readonly layer: <R2, E2>(
    effect: Effect.Effect<A, E2, R2>
  ) => Layer.Layer<I, E2, R2>
}

/**
 * Construct a SynchronizedRef implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function SynchronizedRef<A>(): {
  <const I extends IdentifierFactory<any>>(id: I): SynchronizedRef<IdentifierOf<I>, A>
  <const I>(id: IdentifierInput<I>): SynchronizedRef<IdentifierOf<I>, A>
} {
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
