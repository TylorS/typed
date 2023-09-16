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

- [models](#models)
  - [Enqueue (interface)](#enqueue-interface)
- [utils](#utils)
  - [Enqueue](#enqueue)

---

# models

## Enqueue (interface)

A Contextual wrapper around @effect/io/Queue.Enqueue

**Signature**

```ts
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
```

Added in v1.0.0

# utils

## Enqueue

Construct a Enqueue implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Enqueue<A>(): <const I extends IdentifierFactory<any>>(
  identifier: I
) => Enqueue<IdentifierOf<I>, A>
export declare function Enqueue<A>(): <const I>(identifier: I) => Enqueue<IdentifierOf<I>, A>
```

Added in v1.0.0
