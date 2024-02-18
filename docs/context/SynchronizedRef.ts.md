---
title: SynchronizedRef.ts
nav_order: 24
parent: "@typed/context"
---

## SynchronizedRef overview

Contextual wrappers around @effect/io/SynchronizedRef

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [SynchronizedRef](#synchronizedref)
- [models](#models)
  - [SynchronizedRef (interface)](#synchronizedref-interface)

---

# constructors

## SynchronizedRef

Construct a SynchronizedRef implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function SynchronizedRef<A>(): {
  <const I extends IdentifierFactory<any>>(id: I): SynchronizedRef<IdentifierOf<I>, A>
  <const I>(id: IdentifierInput<I>): SynchronizedRef<IdentifierOf<I>, A>
}
```

Added in v1.0.0

# models

## SynchronizedRef (interface)

Contextual wrappers around @effect/io/SynchronizedRef

**Signature**

```ts
export interface SynchronizedRef<I, A> extends Tag<I, SyncRef.SynchronizedRef<A>> {
  readonly [SyncRef.SynchronizedRefTypeId]: SyncRef.SynchronizedRefTypeId

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

  // SynchronizedRef operators
  readonly modifyEffect: <B, E, R>(f: (a: A) => Effect.Effect<readonly [B, A], E, R>) => Effect.Effect<B, E, I | R>
  readonly modifySomeEffect: <B, E, R>(
    fallback: B,
    f: (a: A) => Option<Effect.Effect<readonly [B, A], E, R>>
  ) => Effect.Effect<B, E, I | R>
  readonly updateEffect: <E, R>(f: (a: A) => Effect.Effect<A, E, R>) => Effect.Effect<void, E, I | R>
  readonly updateSomeEffect: <E, R>(f: (a: A) => Option<Effect.Effect<A, E, R>>) => Effect.Effect<void, E, I | R>
  readonly updateSomeAndGetEffect: <E, R>(f: (a: A) => Option<Effect.Effect<A, E, R>>) => Effect.Effect<A, E, I | R>
  readonly getAndUpdateEffect: <E, R>(f: (a: A) => Effect.Effect<A, E, R>) => Effect.Effect<A, E, I | R>
  readonly getAndUpdateSomeEffect: <E, R>(f: (a: A) => Option<Effect.Effect<A, E, R>>) => Effect.Effect<A, E, I | R>
  readonly updateAndGetEffect: <E, R>(f: (a: A) => Effect.Effect<A, E, R>) => Effect.Effect<A, E, I | R>

  // Provision
  readonly provide: (a: A) => <B, E, R>(effect: Effect.Effect<B, E, R>) => Effect.Effect<B, E, Exclude<R, I>>
  readonly layer: <E2, R2>(effect: Effect.Effect<A, E2, R2>) => Layer.Layer<I, E2, R2>
}
```

Added in v1.0.0
