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

- [constructors](#constructors)
  - [Cache](#cache)
- [models](#models)
  - [Cache (interface)](#cache-interface)

---

# constructors

## Cache

Construct a Cache implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Cache<K, E, A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Cache<IdentifierOf<I>, K, E, A>
  <const I>(identifier: I): Cache<IdentifierOf<I>, K, E, A>
}
```

Added in v1.0.0

# models

## Cache (interface)

A Contextual wrapper around @effect/io/Cache

**Signature**

```ts
export interface Cache<I, K, E, A> extends Tag<I, C.Cache<K, E, A>> {
  readonly get: (key: K) => Effect<A, E, I>

  readonly getEither: (key: K) => Effect<Either<A, A>, E, I>

  readonly refresh: (key: K) => Effect<void, E, I>

  readonly set: (key: K, value: A) => Effect<void, never, I>

  readonly make: <R>(options: {
    readonly capacity: number
    readonly timeToLive: DurationInput
    readonly lookup: C.Lookup<K, R, E, A>
  }) => Layer.Layer<I, never, R>

  readonly makeWith: <R>(options: {
    readonly capacity: number
    readonly lookup: C.Lookup<K, R, E, A>
    readonly timeToLive: (exit: Exit<A, E>) => DurationInput
  }) => Layer.Layer<I, never, R>
}
```

Added in v1.0.0
