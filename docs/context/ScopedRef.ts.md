---
title: ScopedRef.ts
nav_order: 23
parent: "@typed/context"
---

## ScopedRef overview

Contextual wrappers around @effect/io/ScopedRef

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ScopedRef](#scopedref)
  - [ScopedRef (interface)](#scopedref-interface)

---

# utils

## ScopedRef

Construct a ScopedRef implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function ScopedRef<A>()
```

Added in v1.0.0

## ScopedRef (interface)

Contextual wrappers around @effect/io/ScopedRef

**Signature**

```ts
export interface ScopedRef<I, A> extends Tag<I, S.ScopedRef<A>> {
  readonly [S.ScopedRefTypeId]: S.ScopedRefTypeId

  // ScopedRef Operators
  readonly get: Effect.Effect<I, never, A>
  readonly set: <R, E>(acquire: Effect.Effect<R, E, A>) => Effect.Effect<R | I, E, void>

  // Provision
  readonly provide: (a: A) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I> | Scope, E, B>
  readonly layer: <R2, E2>(effect: Effect.Effect<R2, E2, A>) => Layer.Layer<Exclude<R2, Scope>, E2, I>
}
```

Added in v1.0.0
