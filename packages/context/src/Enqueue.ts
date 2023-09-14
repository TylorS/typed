import type * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Q from "@effect/io/Queue"
import type { Hub } from "@typed/context/Hub"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { withActions } from "@typed/context/Interface"
import type { Queue } from "@typed/context/Queue"
import { Tag } from "@typed/context/Tag"

export interface Enqueue<I, A> extends Tag<I, Q.Enqueue<A>> {
  readonly offer: (a: A) => Effect.Effect<I, never, boolean>
  readonly unsafeOffer: (a: A) => Effect.Effect<I, never, boolean>
  readonly offerAll: (as: Iterable<A>) => Effect.Effect<I, never, boolean>

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
  readonly fromHub: <I2>(hub: Hub<I2, A>) => Layer.Layer<I2, never, I>
}

export function Enqueue<A>(): <const I extends IdentifierFactory<any>>(identifier: I) => Enqueue<IdentifierOf<I>, A>
export function Enqueue<A>(): <const I>(identifier: I) => Enqueue<IdentifierOf<I>, A>
export function Enqueue<A>() {
  return <const I extends IdentifierInput<any>>(identifier: I): Enqueue<IdentifierOf<I>, A> => {
    const tag = withActions(Tag<I, Q.Enqueue<A>>(identifier))

    return Object.assign(tag, {
      capacity: tag.with((e) => e.capacity()),
      isActive: tag.with((e) => e.isActive()),
      size: tag.withEffect((e) => e.size()),
      isFull: tag.withEffect((e) => e.isFull()),
      isEmpty: tag.withEffect((e) => e.isEmpty()),
      shutdown: tag.withEffect((e) => e.shutdown()),
      isShutdown: tag.withEffect((e) => e.isShutdown()),
      awaitShutdown: tag.withEffect((e) => e.awaitShutdown()),
      offer: (a: A) => tag.withEffect(Q.offer(a)),
      unsafeOffer: (a: A) => tag.with(Q.unsafeOffer(a)),
      offerAll: (as: Iterable<A>): Effect.Effect<IdentifierOf<I>, never, boolean> =>
        tag.withEffect((enqueue) => Q.offerAll<A>(enqueue, as)),
      fromQueue: <I2>(queue: Queue<I2, A>) => Layer.effect(tag, queue),
      fromHub: <I2>(hub: Hub<I2, A>) => Layer.effect(tag, hub)
    })
  }
}
