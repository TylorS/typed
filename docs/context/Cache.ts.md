---
title: Cache.ts
nav_order: 2
parent: "@typed/context"
---

## Cache overview

A Contextual wrapper around @effect/io/Cache

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Cache](#cache)
  - [Cache (interface)](#cache-interface)

---

# utils

## Cache

Construct a Cache implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Cache<K, E, A>()
```

Added in v1.0.0

## Cache (interface)

A Contextual wrapper around @effect/io/Cache

**Signature**

```ts
export interface Cache<I, K, E, A> extends Tag<I, C.Cache<K, E, A>> {
  readonly get: (key: K) => Effect<I, E, A>

  readonly getEither: (key: K) => Effect<I, E, Either<A, A>>

  readonly refresh: (key: K) => Effect<I, E, void>

  readonly set: (key: K, value: A) => Effect<I, never, void>

  readonly make: <R>(options: {
    readonly capacity: number
    readonly timeToLive: DurationInput
    readonly lookup: C.Lookup<K, R, E, A>
  }) => Layer.Layer<R, never, I>

  readonly makeWith: <R>(options: {
    readonly capacity: number
    readonly lookup: C.Lookup<K, R, E, A>
    readonly timeToLive: (exit: Exit<E, A>) => DurationInput
  }) => Layer.Layer<R, never, I>
}
```

Added in v1.0.0
