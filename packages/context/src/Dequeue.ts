import type * as Chunk from "@effect/data/Chunk"
import type { Option } from "@effect/data/Option"
import type * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Q from "@effect/io/Queue"
import type { Hub } from "@typed/context/Hub"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import type { Queue } from "@typed/context/Queue"
import { Tag } from "@typed/context/Tag"

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
  readonly fromHub: <I2>(hub: Hub<I2, A>) => Layer.Layer<I2, never, I>
}

export function Dequeue<A>(): <const I extends IdentifierFactory<any>>(identifier: I) => Dequeue<IdentifierOf<I>, A>
export function Dequeue<A>(): <const I>(identifier: I) => Dequeue<IdentifierOf<I>, A>
export function Dequeue<A>() {
  return <const I extends IdentifierInput<any>>(identifier: I): Dequeue<IdentifierOf<I>, A> => {
    const tag = Tag<I, Q.Dequeue<A>>(identifier)

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
      takeN: (n: number) => tag.withEffect(Q.takeN(n)),
      poll: tag.withEffect(Q.poll),
      takeUpTo: (max: number) => tag.withEffect(Q.takeUpTo(max)),
      takeBetween: (min: number, max: number) => tag.withEffect(Q.takeBetween(min, max)),
      fromQueue: <I2>(queue: Queue<I2, A>) => Layer.effect(tag, queue),
      fromHub: <I2>(hub: Hub<I2, A>) => Layer.scoped(tag, hub.subscribe)
    })
  }
}
