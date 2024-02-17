---
title: Dequeue.ts
nav_order: 4
parent: "@typed/context"
---

## Dequeue overview

A Contextual wrapper around @effect/io/Queue.Dequeue

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Dequeue](#dequeue)
- [models](#models)
  - [Dequeue (interface)](#dequeue-interface)

---

# constructors

## Dequeue

Construct a Dequeue implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Dequeue<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Dequeue<IdentifierOf<I>, A>
  <const I>(identifier: I): Dequeue<IdentifierOf<I>, A>
}
```

Added in v1.0.0

# models

## Dequeue (interface)

A Contextual wrapper around @effect/io/Queue.Dequeue

**Signature**

```ts
export interface Dequeue<I, A> extends Tag<I, Q.Dequeue<A>> {
  readonly take: Effect.Effect<A, never, I>
  readonly takeAll: Effect.Effect<Chunk.Chunk<A>, never, I>
  readonly takeUpTo: (max: number) => Effect.Effect<Chunk.Chunk<A>, never, I>
  readonly takeBetween: (min: number, max: number) => Effect.Effect<Chunk.Chunk<A>, never, I>
  readonly takeN: (n: number) => Effect.Effect<Chunk.Chunk<A>, never, I>
  readonly poll: Effect.Effect<Option<A>, never, I>

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
```

Added in v1.0.0
