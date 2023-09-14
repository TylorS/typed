import type * as Effect from "@effect/io/Effect"
import * as H from "@effect/io/Hub"
import * as Layer from "@effect/io/Layer"
import type * as Q from "@effect/io/Queue"
import type { Scope } from "@effect/io/Scope"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

export interface Hub<I, A> extends Tag<I, H.Hub<A>> {
  // Common
  readonly capacity: Effect.Effect<I, never, number>
  readonly isActive: Effect.Effect<I, never, boolean>
  readonly size: Effect.Effect<I, never, number>
  readonly isFull: Effect.Effect<I, never, boolean>
  readonly isEmpty: Effect.Effect<I, never, boolean>
  readonly shutdown: Effect.Effect<I, never, void>
  readonly isShutdown: Effect.Effect<I, never, boolean>
  readonly awaitShutdown: Effect.Effect<I, never, void>

  // Hub
  readonly publish: (a: A) => Effect.Effect<I, never, boolean>
  readonly publishAll: (as: Iterable<A>) => Effect.Effect<I, never, boolean>
  readonly subscribe: Effect.Effect<I | Scope, never, Q.Dequeue<A>>

  // Constructors
  readonly bounded: (capacity: number) => Layer.Layer<never, never, I>
  readonly dropping: (capacity: number) => Layer.Layer<never, never, I>
  readonly sliding: (capacity: number) => Layer.Layer<never, never, I>
  readonly unbounded: Layer.Layer<never, never, I>
}

export function Hub<A>(): <const I extends IdentifierFactory<any>>(identifier: I) => Hub<IdentifierOf<I>, A>
export function Hub<A>(): <const I>(identifier: I) => Hub<IdentifierOf<I>, A>
export function Hub<A>() {
  return <const I extends IdentifierInput<any>>(identifier: I): Hub<IdentifierOf<I>, A> => {
    const tag = Tag<I, H.Hub<A>>(identifier)

    return Object.assign(tag, {
      capacity: tag.with((d) => d.capacity()),
      isActive: tag.with((d) => d.isActive()),
      size: tag.withEffect((d) => d.size()),
      isFull: tag.withEffect((d) => d.isFull()),
      isEmpty: tag.withEffect((d) => d.isEmpty()),
      shutdown: tag.withEffect((d) => d.shutdown()),
      isShutdown: tag.withEffect((d) => d.isShutdown()),
      awaitShutdown: tag.withEffect((d) => d.awaitShutdown()),
      publish: (a: A) => tag.withEffect(H.publish(a)),
      publishAll: (a: Iterable<A>) => tag.withEffect(H.publishAll(a)),
      subscribe: tag.withEffect(H.subscribe),
      bounded: (capacity: number) => Layer.effect(tag, H.bounded(capacity)),
      dropping: (capacity: number) => Layer.effect(tag, H.dropping(capacity)),
      sliding: (capacity: number) => Layer.effect(tag, H.sliding(capacity)),
      unbounded: Layer.effect(tag, H.unbounded<A>())
    })
  }
}
