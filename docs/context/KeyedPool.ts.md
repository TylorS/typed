---
title: KeyedPool.ts
nav_order: 11
parent: "@typed/context"
---

## KeyedPool overview

Contextual wrappers around @effect/io/KeyedPool

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [KeyedPool](#keyedpool)
- [models](#models)
  - [KeyedPool (interface)](#keyedpool-interface)

---

# constructors

## KeyedPool

Construct a KeyedPool implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function KeyedPool<K, A, E = never>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): KeyedPool<IdentifierOf<I>, K, A, E>
  <const I>(identifier: I): KeyedPool<IdentifierOf<I>, K, A, E>
}
```

Added in v1.0.0

# models

## KeyedPool (interface)

Contextual wrappers around @effect/io/KeyedPool

**Signature**

```ts
export interface KeyedPool<I, K, A, E = never> extends Tag<I, KP.KeyedPool<K, A, E>> {
  /**
   * Invalidates the specified item. This will cause the pool to eventually
   * reallocate the item, although this reallocation may occur lazily rather
   * than eagerly.
   */
  readonly invalidate: (a: A) => Effect.Effect<void, never, I | Scope>

  /**
   * Retrieves an item from the pool belonging to the given key in a scoped
   * effect. Note that if acquisition fails, then the returned effect will fail
   * for that same reason. Retrying a failed acquisition attempt will repeat the
   * acquisition attempt.
   */
  readonly get: (key: K) => Effect.Effect<A, E, I | Scope>

  /**
   * Makes a new pool with the specified options.
   */
  readonly make: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<A, E, R>
    readonly size: number
  }) => Layer.Layer<I, never, R>

  /**
   * Makes a new pool with the specified options allowing for the size to be
   * dynamically determined by the key.
   */
  readonly makeWith: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<A, E, R>
    readonly size: (key: K) => number
  }) => Layer.Layer<I, never, R>

  /**
   * Makes a new pool with the specified options allowing for the time to live.
   */
  readonly makeWithTTL: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<A, E, R>
    readonly min: (key: K) => number
    readonly max: (key: K) => number
    readonly timeToLive: DurationInput
  }) => Layer.Layer<I, never, R>

  /**
   * Makes a new pool with the specified options allowing for the time to live
   * to be dynamically determined by the key.
   */
  readonly makeWithTTLBy: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<A, E, R>
    readonly min: (key: K) => number
    readonly max: (key: K) => number
    readonly timeToLive: (key: K) => DurationInput
  }) => Layer.Layer<I, never, R>
}
```

Added in v1.0.0
