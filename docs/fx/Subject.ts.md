---
title: Subject.ts
nav_order: 24
parent: "@typed/fx"
---

## Subject overview

Subjects are the basis for sharing events between multiple consumers in an effecient manner
and for event-bus-like functionality.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
  - [makeHold](#makehold)
  - [makeReplay](#makereplay)
  - [tagged](#tagged)
- [models](#models)
  - [Subject (interface)](#subject-interface)
- [utils](#utils)
  - [Subject (namespace)](#subject-namespace)
    - [Tagged (interface)](#tagged-interface)

---

# constructors

## make

Constructs a Subject that can be used to broadcast events to many consumers.

**Signature**

```ts
export declare const make: <E, A>() => Subject<never, E, A>
```

Added in v1.18.0

## makeHold

Constructs a Subject that can be used to broadcast events to many consumers.
If a previous event has been consumed previously, any "late" subscribers will
receive that previous event.

**Signature**

```ts
export declare const makeHold: <E, A>() => Subject<never, E, A>
```

Added in v1.18.0

## makeReplay

Constructs a Subject that can be used to broadcast events to many consumers.
If a previous event has been consumed previously, any "late" subscribers will
receive _up to_ `capacity` previous events.

**Signature**

```ts
export declare const makeReplay: <E, A>(capacity: number) => Subject<never, E, A>
```

Added in v1.18.0

## tagged

Construct a contextual Subject

**Signature**

```ts
export declare function tagged<E, A>(): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A>
}
```

Added in v1.18.0

# models

## Subject (interface)

A Subject is an Fx which is also a Sink, and can be used to
broadcast events to many consumers.

**Signature**

```ts
export interface Subject<R, E, A> extends Fx<R, E, A>, WithContext<R, E, A> {
  readonly subscriberCount: Effect.Effect<R, never, number>
  readonly interrupt: Effect.Effect<R, never, void>
}
```

Added in v1.18.0

# utils

## Subject (namespace)

Added in v1.18.0

### Tagged (interface)

A Contextual wrapper around a Subject

**Signature**

```ts
export interface Tagged<I, E, A> extends Subject<I, E, A> {
  readonly tag: C.Tagged<I, Subject<never, E, A>>

  readonly interrupt: Effect.Effect<I, never, void>

  readonly provide: (
    replay?: number
  ) => <R2, E2, B>(effect: Effect.Effect<R2, E2, B>) => Effect.Effect<Exclude<R2, I>, E2, B>

  readonly provideFx: (replay?: number) => <R2, E2, B>(fx: Fx<R2, E2, B>) => Fx<Exclude<R2, I>, E2, B>

  readonly make: (replay?: number) => Layer.Layer<never, never, I>
}
```

Added in v1.18.0
