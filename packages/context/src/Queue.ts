/**
 * Contextual wrappers around @effect/data/Queue
 * @since 1.0.0
 */

import type * as Chunk from "effect/Chunk"
import type * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Option } from "effect/Option"
import * as Q from "effect/Queue"
import { withActions } from "./Extensions.js"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier.js"
import { Tag } from "./Tag.js"

/**
 * Contextual wrappers around @effect/data/Queue
 * @since 1.0.0
 * @category models
 */
export interface Queue<I, A> extends Tag<I, Q.Queue<A>> {
  // Common
  readonly capacity: Effect.Effect<number, never, I>
  readonly isActive: Effect.Effect<boolean, never, I>
  readonly size: Effect.Effect<number, never, I>
  readonly isFull: Effect.Effect<boolean, never, I>
  readonly isEmpty: Effect.Effect<boolean, never, I>
  readonly shutdown: Effect.Effect<void, never, I>
  readonly isShutdown: Effect.Effect<boolean, never, I>
  readonly awaitShutdown: Effect.Effect<void, never, I>

  // Dequeue
  readonly take: Effect.Effect<A, never, I>
  readonly takeAll: Effect.Effect<Chunk.Chunk<A>, never, I>
  readonly takeUpTo: (max: number) => Effect.Effect<Chunk.Chunk<A>, never, I>
  readonly takeBetween: (min: number, max: number) => Effect.Effect<Chunk.Chunk<A>, never, I>
  readonly takeN: (n: number) => Effect.Effect<Chunk.Chunk<A>, never, I>
  readonly poll: Effect.Effect<Option<A>, never, I>

  // Enqueue
  readonly offer: (a: A) => Effect.Effect<boolean, never, I>
  readonly offerAll: (as: Iterable<A>) => Effect.Effect<boolean, never, I>

  // Queue
  readonly bounded: (capacity: number) => Layer.Layer<I>
  readonly dropping: (capacity: number) => Layer.Layer<I>
  readonly make: (queue: Q.BackingQueue<A>, strategy: Q.Strategy<A>) => Layer.Layer<I>
  readonly sliding: (capacity: number) => Layer.Layer<I>
  readonly unbounded: Layer.Layer<I>
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
      size: tag.withEffect((d) => d.size),
      isFull: tag.withEffect((d) => d.isFull),
      isEmpty: tag.withEffect((d) => d.isEmpty),
      shutdown: tag.withEffect((d) => d.shutdown),
      isShutdown: tag.withEffect((d) => d.isShutdown),
      awaitShutdown: tag.withEffect((d) => d.awaitShutdown),
      take: tag.withEffect(Q.take),
      takeAll: tag.withEffect(Q.takeAll),
      takeUpTo: (max: number) => tag.withEffect(Q.takeUpTo(max)),
      takeBetween: (min: number, max: number) => tag.withEffect(Q.takeBetween(min, max)),
      takeN: (n: number) => tag.withEffect(Q.takeN(n)),
      poll: tag.withEffect(Q.poll),
      offer: (a: A) => tag.withEffect(Q.offer(a)),
      offerAll: (as: Iterable<A>): Effect.Effect<boolean, never, IdentifierOf<I>> =>
        tag.withEffect((enqueue) => Q.offerAll<A>(enqueue, as)),
      bounded: (capacity: number) => Layer.effect(tag, Q.bounded(capacity)),
      dropping: (capacity: number) => Layer.effect(tag, Q.dropping(capacity)),
      make: (queue: Q.BackingQueue<A>, strategy: Q.Strategy<A>) => Layer.effect(tag, Q.make(queue, strategy)),
      sliding: (capacity: number) => Layer.effect(tag, Q.sliding(capacity)),
      unbounded: Layer.effect(tag, Q.unbounded<A>())
    })
  }
}
