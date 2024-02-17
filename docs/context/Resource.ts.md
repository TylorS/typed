---
title: Resource.ts
nav_order: 21
parent: "@typed/context"
---

## Resource overview

Contextual wrappers around @effect/io/Resource

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [models](#models)
  - [Resource (interface)](#resource-interface)
- [utils](#utils)
  - [Resource](#resource)

---

# models

## Resource (interface)

Contextual wrappers around @effect/io/Resource

**Signature**

```ts
export interface Resource<I, A, E> extends Tag<I, R.Resource<A, E>> {
  readonly get: Effect.Effect<A, E, I>

  readonly refresh: Effect.Effect<void, E, I>

  readonly auto: <R, R2, Out>(
    acquire: Effect.Effect<A, E, R>,
    policy: Schedule.Schedule<R2, unknown, Out>
  ) => Layer.Layer<I, never, R | R2>

  readonly manual: <R>(acquire: Effect.Effect<A, E, R>) => Layer.Layer<I, never, R>
}
```

Added in v1.0.0

# utils

## Resource

Construct a Resource implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Resource<A, E>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Resource<IdentifierOf<I>, A, E>
  <const I>(identifier: I): Resource<IdentifierOf<I>, A, E>
}
```

Added in v1.0.0
