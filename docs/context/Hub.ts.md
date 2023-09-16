---
title: Hub.ts
nav_order: 9
parent: "@typed/context"
---

## Hub overview

Contextual wrappers around @effect/io/Hub

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Hub](#hub)
- [models](#models)
  - [Hub (interface)](#hub-interface)

---

# constructors

## Hub

Construct a Hub implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Hub<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Hub<IdentifierOf<I>, A>
  <const I>(identifier: I): Hub<IdentifierOf<I>, A>
}
```

Added in v1.0.0

# models

## Hub (interface)

Contextual wrappers around @effect/io/Hub

**Signature**

```ts
export interface Hub<I, A> extends Tag<I, H.Hub<A>> {
  /**
   * The capacity of the Hub
   */
  readonly capacity: Effect.Effect<I, never, number>

  /**
   * Is the Hub active?
   */
  readonly isActive: Effect.Effect<I, never, boolean>

  /**
   * The current size of the Hub
   */
  readonly size: Effect.Effect<I, never, number>

  /**
   * Is the Hub full?
   */
  readonly isFull: Effect.Effect<I, never, boolean>

  /**
   * Is the Hub empty?
   */
  readonly isEmpty: Effect.Effect<I, never, boolean>

  /**
   * Shutdown the Hub
   */
  readonly shutdown: Effect.Effect<I, never, void>

  /**
   * Is the Hub shutdown?
   */
  readonly isShutdown: Effect.Effect<I, never, boolean>

  /**
   * Wait for the Hub to shutdown
   */
  readonly awaitShutdown: Effect.Effect<I, never, void>

  // Hub

  /**
   * Publish a value to the Hub
   */
  readonly publish: (a: A) => Effect.Effect<I, never, boolean>

  /**
   * Publish multiple values to the Hub
   */
  readonly publishAll: (as: Iterable<A>) => Effect.Effect<I, never, boolean>

  /**
   * Subscribe to the Hub
   */
  readonly subscribe: Effect.Effect<I | Scope, never, Q.Dequeue<A>>

  // Constructors

  /**
   * Create a bounded Hub
   */
  readonly bounded: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create a dropping Hub
   */
  readonly dropping: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create a sliding Hub
   */
  readonly sliding: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create an unbounded Hub
   */
  readonly unbounded: Layer.Layer<never, never, I>
}
```

Added in v1.0.0
