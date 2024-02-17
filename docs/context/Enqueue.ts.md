---
title: Enqueue.ts
nav_order: 6
parent: "@typed/context"
---

## Enqueue overview

A Contextual wrapper around @effect/io/Queue.Enqueue

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Enqueue](#enqueue)
- [models](#models)
  - [Enqueue (interface)](#enqueue-interface)

---

# constructors

## Enqueue

Construct a Enqueue implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Enqueue<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Enqueue<IdentifierOf<I>, A>
  <const I>(identifier: I): Enqueue<IdentifierOf<I>, A>
}
```

Added in v1.0.0

# models

## Enqueue (interface)

A Contextual wrapper around @effect/io/Queue.Enqueue

**Signature**

```ts
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
```

Added in v1.0.0
