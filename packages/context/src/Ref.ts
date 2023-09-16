/**
 * Contextual wrappers around @effect/io/Ref
 * @since 1.0.0
 */

import type { Option } from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as R from "@effect/io/Ref"
import { withActions } from "@typed/context/Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

/**
 * Contextual wrappers around @effect/io/Ref
 * @since 1.0.0
 * @category models
 */
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

  readonly layer: <R2, E2>(
    effect: Effect.Effect<R2, E2, A>
  ) => Layer.Layer<R2, E2, I>
}

/**
 * Construct a Ref implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function Ref<A>(): {
  <const I extends IdentifierFactory<any>>(id: I): Ref<IdentifierOf<I>, A>
  <const I>(id: IdentifierInput<I>): Ref<IdentifierOf<I>, A>
} {
  function makeRef<const I extends IdentifierFactory<any>>(id: I): Ref<IdentifierOf<I>, A>
  function makeRef<const I>(id: IdentifierInput<I>): Ref<IdentifierOf<I>, A>
  function makeRef<const I>(id: I): Ref<IdentifierOf<I>, A> {
    const tag = withActions(Tag<I, R.Ref<A>>(id))

    const actions: Omit<Ref<IdentifierOf<I>, A>, keyof typeof tag> = {
      [R.RefTypeId]: R.RefTypeId,
      get: tag.withEffect(R.get),
      getAndSet: (a) => tag.withEffect(R.getAndSet(a)),
      getAndUpdate: (f) => tag.withEffect(R.getAndUpdate(f)),
      getAndUpdateSome: (f) => tag.withEffect(R.getAndUpdateSome(f)),
      modify: (f) => tag.withEffect(R.modify(f)),
      modifySome: (fallback, f) => tag.withEffect(R.modifySome(fallback, f)),
      set: (a) => tag.withEffect(R.set(a)),
      setAndGet: (a) => tag.withEffect(R.setAndGet(a)),
      update: (f) => tag.withEffect(R.update(f)),
      updateAndGet: (f) => tag.withEffect(R.updateAndGet(f)),
      updateSome: (f) => tag.withEffect(R.updateSome(f)),
      updateSomeAndGet: (f) => tag.withEffect(R.updateSomeAndGet(f)),
      provide: (a) => Effect.provideServiceEffect(tag, R.make(a)),
      layer: (effect) => Layer.effect(tag, Effect.flatMap(effect, R.make))
    }

    return Object.assign(tag, actions) satisfies Ref<IdentifierOf<I>, A>
  }

  return makeRef
}
