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
export declare function Dequeue<A>(): <const I extends IdentifierFactory<any>>(
  identifier: I
) => Dequeue<IdentifierOf<I>, A>
export declare function Dequeue<A>(): <const I>(identifier: I) => Dequeue<IdentifierOf<I>, A>
```

Added in v1.0.0

# models

## Dequeue (interface)

A Contextual wrapper around @effect/io/Queue.Dequeue

**Signature**

```ts
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
```

Added in v1.0.0
