---
title: Hub.ts
nav_order: 8
parent: "@typed/context"
---

## Hub overview

Contextual wrappers around @effect/io/Hub

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Hub](#hub)
  - [Hub (interface)](#hub-interface)

---

# utils

## Hub

Construct a Hub implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Hub<A>(): <const I extends IdentifierFactory<any>>(identifier: I) => Hub<IdentifierOf<I>, A>
export declare function Hub<A>(): <const I>(identifier: I) => Hub<IdentifierOf<I>, A>
```

Added in v1.0.0

## Hub (interface)

Contextual wrappers around @effect/io/Hub

**Signature**

```ts
export interface Hub<I, A> extends Tag<I, H.Hub<A>> {
  // Common
  readonly capacity: Effect.Effect<I, never, number>
  readonly isActive: Effect.Effect<I, never, boolean>
  readonly size: Effect.Effect<I, never, number>
  readonly isFull: Effect.Effect<I, never, boolean>
  readonly isEmpty: Effect.Effect<I, never, boolean>
  readonly shutdown: Effect.Effect<I, never, void>
  readonly isShutdown: Effect.Effect<I, never, boolean>
  readonly awaitShutdown: Effect.Effect<I, never, void>

  // Hub
  readonly publish: (a: A) => Effect.Effect<I, never, boolean>
  readonly publishAll: (as: Iterable<A>) => Effect.Effect<I, never, boolean>
  readonly subscribe: Effect.Effect<I | Scope, never, Q.Dequeue<A>>

  // Constructors
  readonly bounded: (capacity: number) => Layer.Layer<never, never, I>
  readonly dropping: (capacity: number) => Layer.Layer<never, never, I>
  readonly sliding: (capacity: number) => Layer.Layer<never, never, I>
  readonly unbounded: Layer.Layer<never, never, I>
}
```

Added in v1.0.0
