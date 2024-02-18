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

- [constructors](#constructors)
  - [ScopedRef](#scopedref)
- [models](#models)
  - [ScopedRef (interface)](#scopedref-interface)

---

# constructors

## ScopedRef

Construct a ScopedRef implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function ScopedRef<A>(): {
  <const I extends IdentifierFactory<any>>(id: I): ScopedRef<IdentifierOf<I>, A>
  <const I>(id: IdentifierInput<I>): ScopedRef<IdentifierOf<I>, A>
}
```

Added in v1.0.0

# models

## ScopedRef (interface)

Contextual wrappers around @effect/io/ScopedRef

**Signature**

```ts
export interface ScopedRef<I, A> extends Tag<I, S.ScopedRef<A>> {
  readonly [S.ScopedRefTypeId]: S.ScopedRefTypeId

  // ScopedRef Operators
  readonly get: Effect.Effect<A, never, I>
  readonly set: <E, R>(acquire: Effect.Effect<A, E, R>) => Effect.Effect<void, E, R | I>

  // Provision
  readonly provide: (a: A) => <B, E, R>(effect: Effect.Effect<B, E, R>) => Effect.Effect<B, E, Exclude<R, I> | Scope>
  readonly layer: <E2, R2>(effect: Effect.Effect<A, E2, R2>) => Layer.Layer<I, E2, Exclude<R2, Scope>>
}
```

Added in v1.0.0
