---
title: KeyedPool.ts
nav_order: 12
parent: "@typed/context"
---

## KeyedPool overview

Contextual wrappers around @effect/io/KeyedPool

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [KeyedPool](#keyedpool)
  - [KeyedPool (interface)](#keyedpool-interface)

---

# utils

## KeyedPool

Construct a KeyedPool implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function KeyedPool<K, E, A>(): <const I extends IdentifierFactory<any>>(
  identifier: I
) => KeyedPool<IdentifierOf<I>, K, E, A>
export declare function KeyedPool<K, E, A>(): <const I>(identifier: I) => KeyedPool<IdentifierOf<I>, K, E, A>
```

Added in v1.0.0

## KeyedPool (interface)

Contextual wrappers around @effect/io/KeyedPool

**Signature**

```ts
export interface KeyedPool<I, K, E, A> extends Tag<I, KP.KeyedPool<K, E, A>> {
  readonly invalidate: (a: A) => Effect.Effect<I | Scope, never, void>
  readonly get: (key: K) => Effect.Effect<I | Scope, E, A>

  readonly make: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly size: number
  }) => Layer.Layer<R, never, I>

  readonly makeWith: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly size: (key: K) => number
  }) => Layer.Layer<R, never, I>

  readonly makeWithTTL: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly min: (key: K) => number
    readonly max: (key: K) => number
    readonly timeToLive: DurationInput
  }) => Layer.Layer<R, never, I>

  readonly makeWithTTLBy: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly min: (key: K) => number
    readonly max: (key: K) => number
    readonly timeToLive: (key: K) => DurationInput
  }) => Layer.Layer<R, never, I>
}
```

Added in v1.0.0
