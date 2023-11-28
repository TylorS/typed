/**
 * A Contextual wrapper around @effect/io/Queue.Dequeue
 * @since 1.0.0
 */

import type * as Chunk from "effect/Chunk"
import type * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Option } from "effect/Option"
import * as Q from "effect/Queue"
import { withActions } from "./Extensions.js"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier.js"
import type { PubSub } from "./PubSub.js"
import type { Queue } from "./Queue.js"
import { Tag } from "./Tag.js"

/**
 * A Contextual wrapper around @effect/io/Queue.Dequeue
 * @since 1.0.0
 * @category models
 */
export interface Dequeue<I, A> extends Tag<I, Q.Dequeue<A>> {
  readonly take: Effect.Effect<I, never, A>
  readonly takeAll: Effect.Effect<I, never, Chunk.Chunk<A>>
  readonly takeUpTo: (max: number) => Effect.Effect<I, never, Chunk.Chunk<A>>
  readonly takeBetween: (min: number, max: number) => Effect.Effect<I, never, Chunk.Chunk<A>>
  readonly takeN: (n: number) => Effect.Effect<I, never, Chunk.Chunk<A>>
  readonly poll: Effect.Effect<I, never, Option<A>>

  readonly capacity: Effect.Effect<I, never, number>
  readonly isActive: Effect.Effect<I, never, boolean>
  readonly size: Effect.Effect<I, never, number>
  readonly isFull: Effect.Effect<I, never, boolean>
  readonly isEmpty: Effect.Effect<I, never, boolean>
  readonly shutdown: Effect.Effect<I, never, void>
  readonly isShutdown: Effect.Effect<I, never, boolean>
  readonly awaitShutdown: Effect.Effect<I, never, void>

  // Provide
  readonly fromQueue: <I2>(queue: Queue<I2, A>) => Layer.Layer<I2, never, I>
  readonly fromPubSub: <I2>(PubSub: PubSub<I2, A>) => Layer.Layer<I2, never, I>
}

/**
 * Construct a Dequeue implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */

export function Dequeue<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Dequeue<IdentifierOf<I>, A>
  <const I>(identifier: I): Dequeue<IdentifierOf<I>, A>
} {
  return <const I extends IdentifierInput<any>>(identifier: I): Dequeue<IdentifierOf<I>, A> => {
    const tag = withActions(Tag<I, Q.Dequeue<A>>(identifier))

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
      takeN: (n: number) => tag.withEffect(Q.takeN(n)),
      poll: tag.withEffect(Q.poll),
      takeUpTo: (max: number) => tag.withEffect(Q.takeUpTo(max)),
      takeBetween: (min: number, max: number) => tag.withEffect(Q.takeBetween(min, max)),
      fromQueue: <I2>(queue: Queue<I2, A>) => Layer.effect(tag, queue),
      fromPubSub: <I2>(PubSub: PubSub<I2, A>) => Layer.scoped(tag, PubSub.subscribe)
    })
  }
}
