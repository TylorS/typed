/**
 * Contextual wrappers around @effect/data/Queue
 * @since 1.0.0
 */

import type * as Chunk from "@effect/data/Chunk"
import type { Option } from "@effect/data/Option"
import type * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Q from "@effect/io/Queue"
import { withActions } from "@typed/context/Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

/**
 * Contextual wrappers around @effect/data/Queue
 * @since 1.0.0
 * @category models
 */
export interface Queue<I, A> extends Tag<I, Q.Queue<A>> {
  // Common
  readonly capacity: Effect.Effect<I, never, number>
  readonly isActive: Effect.Effect<I, never, boolean>
  readonly size: Effect.Effect<I, never, number>
  readonly isFull: Effect.Effect<I, never, boolean>
  readonly isEmpty: Effect.Effect<I, never, boolean>
  readonly shutdown: Effect.Effect<I, never, void>
  readonly isShutdown: Effect.Effect<I, never, boolean>
  readonly awaitShutdown: Effect.Effect<I, never, void>

  // Dequeue
  readonly take: Effect.Effect<I, never, A>
  readonly takeAll: Effect.Effect<I, never, Chunk.Chunk<A>>
  readonly takeUpTo: (max: number) => Effect.Effect<I, never, Chunk.Chunk<A>>
  readonly takeBetween: (min: number, max: number) => Effect.Effect<I, never, Chunk.Chunk<A>>
  readonly takeN: (n: number) => Effect.Effect<I, never, Chunk.Chunk<A>>
  readonly poll: Effect.Effect<I, never, Option<A>>

  // Enqueue
  readonly offer: (a: A) => Effect.Effect<I, never, boolean>
  readonly unsafeOffer: (a: A) => Effect.Effect<I, never, boolean>
  readonly offerAll: (as: Iterable<A>) => Effect.Effect<I, never, boolean>

  // Queue
  readonly bounded: (capacity: number) => Layer.Layer<never, never, I>
  readonly dropping: (capacity: number) => Layer.Layer<never, never, I>
  readonly make: (queue: Q.BackingQueue<A>, strategy: Q.Strategy<A>) => Layer.Layer<never, never, I>
  readonly sliding: (capacity: number) => Layer.Layer<never, never, I>
  readonly unbounded: Layer.Layer<never, never, I>
}

/**
 * Construct a Queue implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function Queue<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Queue<IdentifierOf<I>, A>
  <const I>(identifier: I): Queue<IdentifierOf<I>, A>
} {
  return <const I extends IdentifierInput<any>>(identifier: I): Queue<IdentifierOf<I>, A> => {
    const tag = withActions(Tag<I, Q.Queue<A>>(identifier))

    return Object.assign(tag, {
      capacity: tag.with((d) => d.capacity()),
      isActive: tag.with((d) => d.isActive()),
      size: tag.withEffect((d) => d.size()),
      isFull: tag.withEffect((d) => d.isFull()),
      isEmpty: tag.withEffect((d) => d.isEmpty()),
      shutdown: tag.withEffect((d) => d.shutdown()),
      isShutdown: tag.withEffect((d) => d.isShutdown()),
      awaitShutdown: tag.withEffect((d) => d.awaitShutdown()),
      take: tag.withEffect(Q.take),
      takeAll: tag.withEffect(Q.takeAll),
      takeUpTo: (max: number) => tag.withEffect(Q.takeUpTo(max)),
      takeBetween: (min: number, max: number) => tag.withEffect(Q.takeBetween(min, max)),
      takeN: (n: number) => tag.withEffect(Q.takeN(n)),
      poll: tag.withEffect(Q.poll),
      offer: (a: A) => tag.withEffect(Q.offer(a)),
      unsafeOffer: (a: A) => tag.with(Q.unsafeOffer(a)),
      offerAll: (as: Iterable<A>): Effect.Effect<IdentifierOf<I>, never, boolean> =>
        tag.withEffect((enqueue) => Q.offerAll<A>(enqueue, as)),
      bounded: (capacity: number) => Layer.effect(tag, Q.bounded(capacity)),
      dropping: (capacity: number) => Layer.effect(tag, Q.dropping(capacity)),
      make: (queue: Q.BackingQueue<A>, strategy: Q.Strategy<A>) => Layer.effect(tag, Q.make(queue, strategy)),
      sliding: (capacity: number) => Layer.effect(tag, Q.sliding(capacity)),
      unbounded: Layer.effect(tag, Q.unbounded<A>())
    })
  }
}