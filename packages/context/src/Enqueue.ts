/**
 * A Contextual wrapper around @effect/io/Queue.Enqueue
 * @since 1.0.0
 */

import type * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Q from "effect/Queue"
import { withActions } from "./Extensions.js"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier.js"
import type { PubSub } from "./PubSub.js"
import type { Queue } from "./Queue.js"
import { Tag } from "./Tag.js"

/**
 * A Contextual wrapper around @effect/io/Queue.Enqueue
 * @since 1.0.0
 * @category models
 */
export interface Enqueue<I, A> extends Tag<I, Q.Enqueue<A>> {
  readonly offer: (a: A) => Effect.Effect<boolean, never, I>
  readonly offerAll: (as: Iterable<A>) => Effect.Effect<boolean, never, I>

  readonly capacity: Effect.Effect<number, never, I>
  readonly isActive: Effect.Effect<boolean, never, I>
  readonly size: Effect.Effect<number, never, I>
  readonly isFull: Effect.Effect<boolean, never, I>
  readonly isEmpty: Effect.Effect<boolean, never, I>
  readonly shutdown: Effect.Effect<void, never, I>
  readonly isShutdown: Effect.Effect<boolean, never, I>
  readonly awaitShutdown: Effect.Effect<void, never, I>

  // Provide
  readonly fromQueue: <I2>(queue: Queue<I2, A>) => Layer.Layer<I, never, I2>
  readonly fromPubSub: <I2>(PubSub: PubSub<I2, A>) => Layer.Layer<I, never, I2>
}

/**
 * Construct a Enqueue implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function Enqueue<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Enqueue<IdentifierOf<I>, A>
  <const I>(identifier: I): Enqueue<IdentifierOf<I>, A>
} {
  return <const I extends IdentifierInput<any>>(identifier: I): Enqueue<IdentifierOf<I>, A> => {
    const tag = withActions(Tag<I, Q.Enqueue<A>>(identifier))

    return Object.assign(tag, {
      capacity: tag.with((e) => e.capacity()),
      isActive: tag.with((e) => e.isActive()),
      size: tag.withEffect((e) => e.size),
      isFull: tag.withEffect((e) => e.isFull),
      isEmpty: tag.withEffect((e) => e.isEmpty),
      shutdown: tag.withEffect((e) => e.shutdown),
      isShutdown: tag.withEffect((e) => e.isShutdown),
      awaitShutdown: tag.withEffect((e) => e.awaitShutdown),
      offer: (a: A) => tag.withEffect(Q.offer(a)),
      offerAll: (as: Iterable<A>): Effect.Effect<boolean, never, IdentifierOf<I>> =>
        tag.withEffect((enqueue) => Q.offerAll<A>(enqueue, as)),
      fromQueue: <I2>(queue: Queue<I2, A>) => Layer.effect(tag, queue),
      fromPubSub: <I2>(PubSub: PubSub<I2, A>) => Layer.effect(tag, PubSub)
    })
  }
}
