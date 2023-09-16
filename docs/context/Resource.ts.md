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

- [utils](#utils)
  - [Resource](#resource)
  - [Resource (interface)](#resource-interface)

---

# utils

## Resource

Construct a Resource implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Resource<E, A>()
```

Added in v1.0.0

## Resource (interface)

Contextual wrappers around @effect/io/Resource

**Signature**

```ts
export interface Resource<I, E, A> extends Tag<I, R.Resource<E, A>> {
  readonly get: Effect.Effect<I, E, A>
  readonly refresh: Effect.Effect<I, E, void>

  readonly auto: <R, R2, Out>(
    acquire: Effect.Effect<R, E, A>,
    policy: Schedule.Schedule<R2, unknown, Out>
  ) => Layer.Layer<R | R2, never, I>

  readonly manual: <R>(acquire: Effect.Effect<R, E, A>) => Layer.Layer<R, never, I>
}
```

Added in v1.0.0
