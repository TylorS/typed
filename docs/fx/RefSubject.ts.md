---
title: RefSubject.ts
nav_order: 3
parent: "@typed/fx"
---

## RefSubject overview

A RefSubject is the core abstraction for keeping state and subscribing to its
changes over time.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
  - [makeReplay](#makereplay)
  - [unsafeMake](#unsafemake)
- [models](#models)
  - [RefSubject (interface)](#refsubject-interface)

---

# constructors

## make

Construct a RefSubject with an initial value.

**Signature**

```ts
export declare function make<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A>>
```

Added in v1.18.0

## makeReplay

Construct a RefSubject with an initial value and a capacity for replaying events.

**Signature**

```ts
export declare function makeReplay<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  capacity: number,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A>>
```

Added in v1.18.0

## unsafeMake

Construct a RefSubject with an initial value and the specified subject.

**Signature**

```ts
export declare function unsafeMake<E, A>(
  initial: Effect.Effect<never, E, A>,
  subject: Subject.Subject<never, E, A>,
  eq: Equivalence<A> = Equal.equals
): RefSubject<E, A>
```

Added in v1.18.0

# models

## RefSubject (interface)

A RefSubject is a Subject that has a current value that can be read and updated.

**Signature**

```ts
export interface RefSubject<in out E, in out A> extends Subject.Subject<never, E, A>, Effect.Effect<never, E, A> {
  readonly eq: Equivalence<A>
  readonly get: Effect.Effect<never, E, A>
  readonly set: (a: A) => Effect.Effect<never, never, A>
  readonly update: (f: (a: A) => A) => Effect.Effect<never, E, A>
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<never, E, B>
  readonly delete: Effect.Effect<never, never, Option.Option<A>>
  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<R2, E | E2, B>
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R2, E | E2, A>
}
```

Added in v1.18.0
