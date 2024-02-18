/**
 * Contextual wrappers around @effect/io/Ref
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Option } from "effect/Option"
import * as R from "effect/Ref"
import { withActions } from "./Extensions.js"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier.js"
import { Tag } from "./Tag.js"

/**
 * Contextual wrappers around @effect/io/Ref
 * @since 1.0.0
 * @category models
 */
export interface Ref<I, A> extends Tag<I, R.Ref<A>> {
  readonly [R.RefTypeId]: R.RefTypeId

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

  // Provision

  readonly provide: (a: A) => <B, E, R>(effect: Effect.Effect<B, E, R>) => Effect.Effect<B, E, Exclude<R, I>>

  readonly layer: <E2, R2>(
    effect: Effect.Effect<A, E2, R2>
  ) => Layer.Layer<I, E2, R2>
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
