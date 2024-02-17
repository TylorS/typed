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
  readonly capacity: Effect.Effect<number, never, I>

  /**
   * Is the PubSub active?
   */
  readonly isActive: Effect.Effect<boolean, never, I>

  /**
   * The current size of the PubSub
   */
  readonly size: Effect.Effect<number, never, I>

  /**
   * Is the PubSub full?
   */
  readonly isFull: Effect.Effect<boolean, never, I>

  /**
   * Is the PubSub empty?
   */
  readonly isEmpty: Effect.Effect<boolean, never, I>

  /**
   * Shutdown the PubSub
   */
  readonly shutdown: Effect.Effect<void, never, I>

  /**
   * Is the PubSub shutdown?
   */
  readonly isShutdown: Effect.Effect<boolean, never, I>

  /**
   * Wait for the PubSub to shutdown
   */
  readonly awaitShutdown: Effect.Effect<void, never, I>

  // PubSub

  /**
   * Publish a value to the PubSub
   */
  readonly publish: (a: A) => Effect.Effect<boolean, never, I>

  /**
   * Publish multiple values to the PubSub
   */
  readonly publishAll: (as: Iterable<A>) => Effect.Effect<boolean, never, I>

  /**
   * Subscribe to the PubSub
   */
  readonly subscribe: Effect.Effect<Q.Dequeue<A>, never, I | Scope>

  // Constructors

  /**
   * Create a bounded PubSub
   */
  readonly bounded: (capacity: number) => Layer.Layer<I>

  /**
   * Create a dropping PubSub
   */
  readonly dropping: (capacity: number) => Layer.Layer<I>

  /**
   * Create a sliding PubSub
   */
  readonly sliding: (capacity: number) => Layer.Layer<I>

  /**
   * Create an unbounded PubSub
   */
  readonly unbounded: Layer.Layer<I>
}
```

Added in v1.0.0
