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
```

Added in v1.0.0
