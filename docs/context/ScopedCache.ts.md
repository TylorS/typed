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
export declare function ScopedCache<K, E, A>()
```

Added in v1.0.0

## ScopedCache (interface)

Contextual wrappers around @effect/io/ScopedCache

**Signature**

```ts
export interface ScopedCache<I, K, E, A> extends Tag<I, SC.ScopedCache<K, E, A>> {
  readonly cacheStats: Effect<I, never, C.CacheStats>
  readonly contains: (key: K) => Effect<I, never, boolean>
  readonly entryStats: (key: K) => Effect<I, never, Option<C.EntryStats>>
  readonly get: (key: K) => Effect<I | Scope, E, A>
  readonly getOption: (key: K) => Effect<I | Scope, E, Option<A>>
  readonly getOptionComplete: (key: K) => Effect<I | Scope, E, Option<A>>
  readonly invalidate: (key: K) => Effect<I, never, void>
  readonly invalidateAll: Effect<I, never, void>
  readonly refresh: (key: K) => Effect<I, E, void>
  readonly size: Effect<I, never, number>

  readonly make: <R>(options: {
    readonly capacity: number
    readonly timeToLive: DurationInput
    readonly lookup: SC.Lookup<K, R, E, A>
  }) => Layer.Layer<R, never, I>

  readonly makeWith: <R>(options: {
    readonly capacity: number
    readonly lookup: SC.Lookup<K, R, E, A>
    readonly timeToLive: (exit: Exit<E, A>) => DurationInput
  }) => Layer.Layer<R, never, I>
}
```

Added in v1.0.0
