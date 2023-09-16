---
title: Pool.ts
nav_order: 15
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
export declare function Pool<E, A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Pool<IdentifierOf<I>, E, A>
  <const I>(identifier: I): Pool<IdentifierOf<I>, E, A>
}
```

Added in v1.0.0

# models

## Pool (interface)

Contextual wrapper for @effect/io/Pool

**Signature**

```ts
export interface Pool<I, E, A> extends Tag<I, P.Pool<E, A>> {
  readonly invalidate: (a: A) => Effect.Effect<I | Scope, never, void>
  readonly get: Effect.Effect<I | Scope, E, A>

  readonly make: <R>(options: {
    readonly acquire: Effect.Effect<R, E, A>
    readonly size: number
  }) => Layer.Layer<R, never, I>

  readonly makeWithTTL: <R>(options: {
    readonly acquire: Effect.Effect<R, E, A>
    readonly min: number
    readonly max: number
    readonly timeToLive: DurationInput
  }) => Layer.Layer<R, never, I>
}
```

Added in v1.0.0
