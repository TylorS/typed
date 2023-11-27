---
title: PubSub.ts
nav_order: 15
parent: "@typed/context"
---

## PubSub overview

Contextual wrappers around @effect/io/PubSub

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [PubSub](#pubsub)
- [models](#models)
  - [PubSub (interface)](#pubsub-interface)

---

# constructors

## PubSub

Construct a PubSub implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function PubSub<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): PubSub<IdentifierOf<I>, A>
  <const I>(identifier: I): PubSub<IdentifierOf<I>, A>
}
```

Added in v1.0.0

# models

## PubSub (interface)

Contextual wrappers around @effect/io/PubSub

**Signature**

```ts
export interface PubSub<I, A> extends Tag<I, PS.PubSub<A>> {
  /**
   * The capacity of the PubSub
   */
  readonly capacity: Effect.Effect<I, never, number>

  /**
   * Is the PubSub active?
   */
  readonly isActive: Effect.Effect<I, never, boolean>

  /**
   * The current size of the PubSub
   */
  readonly size: Effect.Effect<I, never, number>

  /**
   * Is the PubSub full?
   */
  readonly isFull: Effect.Effect<I, never, boolean>

  /**
   * Is the PubSub empty?
   */
  readonly isEmpty: Effect.Effect<I, never, boolean>

  /**
   * Shutdown the PubSub
   */
  readonly shutdown: Effect.Effect<I, never, void>

  /**
   * Is the PubSub shutdown?
   */
  readonly isShutdown: Effect.Effect<I, never, boolean>

  /**
   * Wait for the PubSub to shutdown
   */
  readonly awaitShutdown: Effect.Effect<I, never, void>

  // PubSub

  /**
   * Publish a value to the PubSub
   */
  readonly publish: (a: A) => Effect.Effect<I, never, boolean>

  /**
   * Publish multiple values to the PubSub
   */
  readonly publishAll: (as: Iterable<A>) => Effect.Effect<I, never, boolean>

  /**
   * Subscribe to the PubSub
   */
  readonly subscribe: Effect.Effect<I | Scope, never, Q.Dequeue<A>>

  // Constructors

  /**
   * Create a bounded PubSub
   */
  readonly bounded: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create a dropping PubSub
   */
  readonly dropping: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create a sliding PubSub
   */
  readonly sliding: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create an unbounded PubSub
   */
  readonly unbounded: Layer.Layer<never, never, I>
}
```

Added in v1.0.0
