---
title: RefAdapter.ts
nav_order: 44
parent: Modules
---

## RefAdapter overview

RefAdapter is an abstraction over [Ref](./Ref.ts.md) and [Adapter](./Adapter.ts.md)

Added in v0.11.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [getEvents](#getevents)
  - [getSendEvent](#getsendevent)
  - [listenToEvents](#listentoevents)
  - [local](#local)
  - [map](#map)
  - [promap](#promap)
  - [sendEvent](#sendevent)
- [Instance](#instance)
  - [Functor](#functor)
  - [Profunctor](#profunctor)
- [Model](#model)
  - [RefAdapter (interface)](#refadapter-interface)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## getEvents

**Signature**

```ts
export declare function getEvents<E, A, B, C>(ra: RefAdapter<E, A, B, C>): RS.ReaderStream<E, C>
```

Added in v0.11.0

## getSendEvent

**Signature**

```ts
export declare function getSendEvent<E, A, B, C>(
  ra: RefAdapter<E, A, B, C>,
): E.Env<E, (event: B) => void>
```

Added in v0.11.0

## listenToEvents

**Signature**

```ts
export declare function listenToEvents<E1, A, B, C>(ra: RefAdapter<E1, A, B, C>)
```

Added in v0.11.0

## local

**Signature**

```ts
export declare function local<A, B>(f: (value: A) => B)
```

Added in v0.11.0

## map

**Signature**

```ts
export declare function map<A, B>(f: (value: A) => B)
```

Added in v0.11.0

## promap

**Signature**

```ts
export declare const promap: <B, A, C, D>(
  f: (value: B) => A,
  g: (value: C) => D,
) => <E, I>(adapter: RefAdapter<E, I, A, C>) => RefAdapter<E, I, B, D>
```

Added in v0.11.0

## sendEvent

**Signature**

```ts
export declare function sendEvent<E, A, B, C>(ra: RefAdapter<E, A, B, C>)
```

Added in v0.11.0

# Instance

## Functor

**Signature**

```ts
export declare const Functor: Functor4<'@typed/fp/RefAdapter'>
```

Added in v0.11.0

## Profunctor

**Signature**

```ts
export declare const Profunctor: Profunctor4<'@typed/fp/RefAdapter'>
```

Added in v0.11.0

# Model

## RefAdapter (interface)

RefAdapter is an abstraction of Refs that will output an Adapter to send and receive events through.
It utilizes the output of its Ref instead of the input so you will not find any combinators for
updating the Adapter in-place. This allows for creating a Functor + Profunctor instances

**Signature**

```ts
export interface RefAdapter<E, I, A, B = A> extends Ref.Ref<E, I, A.Adapter<A, B>> {}
```

Added in v0.11.0

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/RefAdapter'
```

Added in v0.11.0

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.11.0
