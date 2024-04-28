---
title: ScopedCache.ts
nav_order: 22
parent: "@typed/context"
---

## ScopedCache overview

Contextual wrappers around @effect/io/ScopedCache

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ScopedCache](#scopedcache)
  - [ScopedCache (interface)](#scopedcache-interface)

---

# utils

## ScopedCache

Construct a ScopedCache implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function ScopedCache<K, A, E = never>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): ScopedCache<IdentifierOf<I>, K, A, E>
  <const I>(identifier: I): ScopedCache<IdentifierOf<I>, K, A, E>
}
```

Added in v1.0.0

## ScopedCache (interface)

Contextual wrappers around @effect/io/ScopedCache

**Signature**

```ts
export interface ScopedCache<I, K, A, E> extends Tag<I, SC.ScopedCache<K, A, E>> {
  readonly cacheStats: Effect<C.CacheStats, never, I>
  readonly contains: (key: K) => Effect<boolean, never, I>
  readonly entryStats: (key: K) => Effect<Option<C.EntryStats>, never, I>
  readonly get: (key: K) => Effect<A, E, I | Scope>
  readonly getOption: (key: K) => Effect<Option<A>, E, I | Scope>
  readonly getOptionComplete: (key: K) => Effect<Option<A>, E, I | Scope>
  readonly invalidate: (key: K) => Effect<void, never, I>
  readonly invalidateAll: Effect<void, never, I>
  readonly refresh: (key: K) => Effect<void, E, I>
  readonly size: Effect<number, never, I>

  readonly make: <R>(options: {
    readonly capacity: number
    readonly timeToLive: DurationInput
    readonly lookup: SC.Lookup<K, A, E, R>
  }) => Layer.Layer<I, never, R>

  readonly makeWith: <R>(options: {
    readonly capacity: number
    readonly lookup: SC.Lookup<K, A, E, R>
    readonly timeToLive: (exit: Exit<A, E>) => DurationInput
  }) => Layer.Layer<I, never, R>
}
```

Added in v1.0.0
