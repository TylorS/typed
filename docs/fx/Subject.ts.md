---
title: Subject.ts
nav_order: 4
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
- [models](#models)
  - [Subject (interface)](#subject-interface)

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

# models

## Subject (interface)

A Subject is an Fx which is also a Sink, and can be used to
broadcast events to many consumers.

**Signature**

```ts
export interface Subject<R, E, A> extends Fx<R, E, A>, Sink<E, A> {}
```

Added in v1.18.0
