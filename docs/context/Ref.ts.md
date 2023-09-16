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
  readonly get: Effect.Effect<I, never, A>
  readonly getAndSet: (a: A) => Effect.Effect<I, never, A>
  readonly getAndUpdate: (f: (a: A) => A) => Effect.Effect<I, never, A>
  readonly getAndUpdateSome: (f: (a: A) => Option<A>) => Effect.Effect<I, never, A>
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<I, never, B>
  readonly modifySome: <B>(fallback: B, f: (a: A) => Option<readonly [B, A]>) => Effect.Effect<I, never, B>
  readonly set: (a: A) => Effect.Effect<I, never, void>
  readonly setAndGet: (a: A) => Effect.Effect<I, never, A>
  readonly update: (f: (a: A) => A) => Effect.Effect<I, never, void>
  readonly updateAndGet: (f: (a: A) => A) => Effect.Effect<I, never, A>
  readonly updateSome: (f: (a: A) => Option<A>) => Effect.Effect<I, never, void>
  readonly updateSomeAndGet: (f: (a: A) => Option<A>) => Effect.Effect<I, never, A>

  // Provision

  readonly provide: (a: A) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I>, E, B>

  readonly layer: <R2, E2>(effect: Effect.Effect<R2, E2, A>) => Layer.Layer<R2, E2, I>
}
```

Added in v1.0.0
