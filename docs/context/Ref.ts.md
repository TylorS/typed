---
title: Ref.ts
nav_order: 17
parent: "@typed/context"
---

## Ref overview

Contextual wrappers around @effect/io/Ref

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Ref](#ref)
- [models](#models)
  - [Ref (interface)](#ref-interface)

---

# constructors

## Ref

Construct a Ref implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Ref<A>(): {
  <const I extends IdentifierFactory<any>>(id: I): Ref<IdentifierOf<I>, A>
  <const I>(id: IdentifierInput<I>): Ref<IdentifierOf<I>, A>
}
```

Added in v1.0.0

# models

## Ref (interface)

Contextual wrappers around @effect/io/Ref

**Signature**

```ts
export interface Ref<I, A> extends Tag<I, R.Ref<A>> {
  readonly [R.RefTypeId]: R.RefTypeId

  // Ref Operators
  readonly get: Effect.Effect<A, never, I>
  readonly getAndSet: (a: A) => Effect.Effect<A, never, I>
  readonly getAndUpdate: (f: (a: A) => A) => Effect.Effect<A, never, I>
  readonly getAndUpdateSome: (f: (a: A) => Option<A>) => Effect.Effect<A, never, I>
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<B, never, I>
  readonly modifySome: <B>(fallback: B, f: (a: A) => Option<readonly [B, A]>) => Effect.Effect<B, never, I>
  readonly set: (a: A) => Effect.Effect<void, never, I>
  readonly setAndGet: (a: A) => Effect.Effect<A, never, I>
  readonly update: (f: (a: A) => A) => Effect.Effect<void, never, I>
  readonly updateAndGet: (f: (a: A) => A) => Effect.Effect<A, never, I>
  readonly updateSome: (f: (a: A) => Option<A>) => Effect.Effect<void, never, I>
  readonly updateSomeAndGet: (f: (a: A) => Option<A>) => Effect.Effect<A, never, I>

  // Provision

  readonly provide: (a: A) => <B, E, R>(effect: Effect.Effect<B, E, R>) => Effect.Effect<B, E, Exclude<R, I>>

  readonly layer: <E2, R2>(effect: Effect.Effect<A, E2, R2>) => Layer.Layer<I, E2, R2>
}
```

Added in v1.0.0
