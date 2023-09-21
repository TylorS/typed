---
title: Queue.ts
nav_order: 16
parent: "@typed/context"
---

## Queue overview

Contextual wrappers around @effect/data/Queue

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Queue](#queue)
- [models](#models)
  - [Queue (interface)](#queue-interface)

---

# constructors

## Queue

Construct a Queue implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Queue<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Queue<IdentifierOf<I>, A>
  <const I>(identifier: I): Queue<IdentifierOf<I>, A>
}
```

Added in v1.0.0

# models

## Queue (interface)

Contextual wrappers around @effect/data/Queue

**Signature**

```ts
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
  readonly offerAll: (as: Iterable<A>) => Effect.Effect<I, never, boolean>

  // Queue
  readonly bounded: (capacity: number) => Layer.Layer<never, never, I>
  readonly dropping: (capacity: number) => Layer.Layer<never, never, I>
  readonly make: (queue: Q.BackingQueue<A>, strategy: Q.Strategy<A>) => Layer.Layer<never, never, I>
  readonly sliding: (capacity: number) => Layer.Layer<never, never, I>
  readonly unbounded: Layer.Layer<never, never, I>
}
```

Added in v1.0.0
