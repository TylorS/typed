---
title: Adapter.ts
nav_order: 1
parent: Modules
---

## Adapter overview

Adapter is based on [@most/adapter](https://github.com/mostjs/adapter), and adds some fp-ts
instances.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [adapt](#adapt)
  - [filter](#filter)
  - [local](#local)
  - [map](#map)
  - [promap](#promap)
- [Constructor](#constructor)
  - [create](#create)
- [Instance](#instance)
  - [Functor](#functor)
  - [Profunctor](#profunctor)
- [Model](#model)
  - [Adapter (type alias)](#adapter-type-alias)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## adapt

Apply a stream transformation to an Adapter

**Signature**

```ts
export declare const adapt: <A, B>(
  f: (stream: Stream<A>) => Stream<B>,
) => <C>([send, stream]: readonly [(event: C) => void, Stream<A>]) => readonly [
  (event: C) => void,
  Stream<B>,
]
```

Added in v0.9.2

## filter

**Signature**

```ts
export declare function filter<A, B extends A>(
  f: Refinement<A, B>,
): <C>(adapter: Adapter<C, A>) => Adapter<C, B>
export declare function filter<A>(f: Predicate<A>): <C>(adapter: Adapter<C, A>) => Adapter<C, A>
```

Added in v0.9.2

## local

**Signature**

```ts
export declare function local<A, B>(f: (value: A) => B)
```

Added in v0.9.2

## map

**Signature**

```ts
export declare function map<A, B>(f: (value: A) => B): <C>(adapter: Adapter<C, A>) => Adapter<C, B>
```

Added in v0.9.2

## promap

**Signature**

```ts
export declare const promap: <B, A, C, D>(
  f: (value: B) => A,
  g: (value: C) => D,
) => (adapter: readonly [(event: A) => void, Stream<C>]) => readonly [(event: B) => void, Stream<D>]
```

Added in v0.9.2

# Constructor

## create

**Signature**

```ts
export declare function create<A>(): Adapter<A>
export declare function create<A, B>(f: (stream: Stream<A>) => Stream<B>): Adapter<A, B>
```

Added in v0.9.2

# Instance

## Functor

**Signature**

```ts
export declare const Functor: Functor2<'@most/adapter'>
```

Added in v0.9.2

## Profunctor

**Signature**

```ts
export declare const Profunctor: Profunctor2<'@most/adapter'>
```

Added in v0.9.2

# Model

## Adapter (type alias)

**Signature**

```ts
export type Adapter<A, B = A> = readonly [...MA.Adapter<A, B>]
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@most/adapter'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
