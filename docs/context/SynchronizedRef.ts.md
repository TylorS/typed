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

  // SynchronizedRef operators
  readonly modifyEffect: <R, E, B>(f: (a: A) => Effect.Effect<R, E, readonly [B, A]>) => Effect.Effect<I | R, E, B>
  readonly modifySomeEffect: <R, E, B>(
    fallback: B,
    f: (a: A) => Option<Effect.Effect<R, E, readonly [B, A]>>
  ) => Effect.Effect<I | R, E, B>
  readonly updateEffect: <R, E>(f: (a: A) => Effect.Effect<R, E, A>) => Effect.Effect<I | R, E, void>
  readonly updateSomeEffect: <R, E>(f: (a: A) => Option<Effect.Effect<R, E, A>>) => Effect.Effect<I | R, E, void>
  readonly updateSomeAndGetEffect: <R, E>(f: (a: A) => Option<Effect.Effect<R, E, A>>) => Effect.Effect<I | R, E, A>
  readonly getAndUpdateEffect: <R, E>(f: (a: A) => Effect.Effect<R, E, A>) => Effect.Effect<I | R, E, A>
  readonly getAndUpdateSomeEffect: <R, E>(f: (a: A) => Option<Effect.Effect<R, E, A>>) => Effect.Effect<I | R, E, A>
  readonly updateAndGetEffect: <R, E>(f: (a: A) => Effect.Effect<R, E, A>) => Effect.Effect<I | R, E, A>

  // Provision
  readonly provide: (a: A) => <R, E, B>(effect: Effect.Effect<R, E, B>) => Effect.Effect<Exclude<R, I>, E, B>
  readonly layer: <R2, E2>(effect: Effect.Effect<R2, E2, A>) => Layer.Layer<R2, E2, I>
}
```

Added in v1.0.0
