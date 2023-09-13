import type * as Chunk from "@effect/data/Chunk"
import type { Option } from "@effect/data/Option"
import type * as Effect from "@effect/io/Effect"
import type { Layer } from "@effect/io/Layer"
import * as Q from "@effect/io/Queue"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

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
  readonly bounded: (capacity: number) => Layer<never, never, I>
  readonly dropping: (capacity: number) => Layer<never, never, I>
  readonly make: (queue: Q.BackingQueue<A>, strategy: Q.Strategy<A>) => Layer<never, never, I>
  readonly sliding: (capacity: number) => Layer<never, never, I>
  readonly unbounded: Layer<never, never, I>
}

export function Queue<A>(): <const I extends IdentifierFactory<any>>(identifier: I) => Queue<IdentifierOf<I>, A>
export function Queue<A>(): <const I>(identifier: I) => Queue<IdentifierOf<I>, A>
export function Queue<A>() {
  return <const I extends IdentifierInput<any>>(identifier: I): Queue<IdentifierOf<I>, A> => {
    const tag = Tag<I, Q.Queue<A>>(identifier)

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
      bounded: (capacity: number) => tag.layer(Q.bounded(capacity)),
      dropping: (capacity: number) => tag.layer(Q.dropping(capacity)),
      make: (queue: Q.BackingQueue<A>, strategy: Q.Strategy<A>) => tag.layer(Q.make(queue, strategy)),
      sliding: (capacity: number) => tag.layer(Q.sliding(capacity)),
      unbounded: tag.layer(Q.unbounded<A>())
    })
  }
}
