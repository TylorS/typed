---
title: RefAdapter.ts
nav_order: 40
parent: Modules
---

## RefAdapter overview

RefAdapter is an abstraction over [Ref](./Ref.ts.md) and [Adapter](./Adapter.ts.md)

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [getSendEvent](#getsendevent)
  - [listenToEvents](#listentoevents)
  - [sendEvent](#sendevent)
- [Constructor](#constructor)
  - [toReferenceAdapter](#toreferenceadapter)
- [Model](#model)
  - [RefAdapter (interface)](#refadapter-interface)
  - [ReferenceAdapter (interface)](#referenceadapter-interface)

---

# Combinator

## getSendEvent

**Signature**

```ts
export declare function getSendEvent<E, A, B = A>(ra: RefAdapter<E, A, B>)
```

Added in v0.9.2

## listenToEvents

**Signature**

```ts
export declare function listenToEvents<E1, A, B = A>(ra: RefAdapter<E1, A, B>)
```

Added in v0.9.2

## sendEvent

**Signature**

```ts
export declare function sendEvent<E, A, B = A>(ra: RefAdapter<E, A, B>)
```

Added in v0.9.2

# Constructor

## toReferenceAdapter

**Signature**

```ts
export declare function toReferenceAdapter<E, A, B>(
  ra: RefAdapter<E, A, B>,
): ReferenceAdapter<E, A, B>
```

Added in v0.9.2

# Model

## RefAdapter (interface)

**Signature**

```ts
export interface RefAdapter<E, A, B = A> extends Ref.Reference<E, A.Adapter<A, B>> {}
```

Added in v0.9.2

## ReferenceAdapter (interface)

**Signature**

```ts
export interface ReferenceAdapter<E, A, B = A> extends RefAdapter<E, A, B> {
  readonly send: (event: A) => E.Env<E & Ref.Get, void>
  readonly getSend: E.Env<E & Ref.Get, (event: A) => void>
  readonly onEvent: <E2, C>(f: (value: B) => E.Env<E2, C>) => RS.ReaderStream<E & E2 & Ref.Get, C>
}
```

Added in v0.9.2
