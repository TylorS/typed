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
export declare function KeyedPool<K, E, A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): KeyedPool<IdentifierOf<I>, K, E, A>
  <const I>(identifier: I): KeyedPool<IdentifierOf<I>, K, E, A>
}
```

Added in v1.0.0

# models

## KeyedPool (interface)

Contextual wrappers around @effect/io/KeyedPool

**Signature**

```ts
export interface KeyedPool<I, K, E, A> extends Tag<I, KP.KeyedPool<K, E, A>> {
  /**
   * Invalidates the specified item. This will cause the pool to eventually
   * reallocate the item, although this reallocation may occur lazily rather
   * than eagerly.
   */
  readonly invalidate: (a: A) => Effect.Effect<I | Scope, never, void>

  /**
   * Retrieves an item from the pool belonging to the given key in a scoped
   * effect. Note that if acquisition fails, then the returned effect will fail
   * for that same reason. Retrying a failed acquisition attempt will repeat the
   * acquisition attempt.
   */
  readonly get: (key: K) => Effect.Effect<I | Scope, E, A>

  /**
   * Makes a new pool with the specified options.
   */
  readonly make: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly size: number
  }) => Layer.Layer<R, never, I>

  /**
   * Makes a new pool with the specified options allowing for the size to be
   * dynamically determined by the key.
   */
  readonly makeWith: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly size: (key: K) => number
  }) => Layer.Layer<R, never, I>

  /**
   * Makes a new pool with the specified options allowing for the time to live.
   */
  readonly makeWithTTL: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly min: (key: K) => number
    readonly max: (key: K) => number
    readonly timeToLive: DurationInput
  }) => Layer.Layer<R, never, I>

  /**
   * Makes a new pool with the specified options allowing for the time to live
   * to be dynamically determined by the key.
   */
  readonly makeWithTTLBy: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly min: (key: K) => number
    readonly max: (key: K) => number
    readonly timeToLive: (key: K) => DurationInput
  }) => Layer.Layer<R, never, I>
}
```

Added in v1.0.0
