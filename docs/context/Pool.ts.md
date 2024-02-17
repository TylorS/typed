---
title: Pool.ts
nav_order: 14
parent: "@typed/context"
---

## Pool overview

Contextual wrapper for @effect/io/Pool

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Pool](#pool)
- [models](#models)
  - [Pool (interface)](#pool-interface)

---

# constructors

## Pool

Construct a Pool implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Pool<A, E>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Pool<IdentifierOf<I>, A, E>
  <const I>(identifier: I): Pool<IdentifierOf<I>, A, E>
}
```

Added in v1.0.0

# models

## Pool (interface)

Contextual wrapper for @effect/io/Pool

**Signature**

```ts
export interface Pool<I, A, E> extends Tag<I, P.Pool<A, E>> {
  readonly invalidate: (a: A) => Effect.Effect<void, never, I | Scope>
  readonly get: Effect.Effect<A, E, I | Scope>

  readonly make: <R>(options: {
    readonly acquire: Effect.Effect<A, E, R>
    readonly size: number
  }) => Layer.Layer<I, never, R>

  readonly makeWithTTL: <R>(options: {
    readonly acquire: Effect.Effect<A, E, R>
    readonly min: number
    readonly max: number
    readonly timeToLive: DurationInput
  }) => Layer.Layer<I, never, R>
}
```

Added in v1.0.0
