---
title: RefArray.ts
nav_order: 52
parent: Modules
---

## RefArray overview

RefArray is a collection of helpers for working with Refs that manage an array.

Added in v0.11.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [append](#append)
  - [concat](#concat)
  - [deleteAt](#deleteat)
  - [endoMap](#endomap)
  - [filter](#filter)
  - [insertAt](#insertat)
  - [modifyAt](#modifyat)
  - [prepend](#prepend)
  - [reverse](#reverse)
  - [rotate](#rotate)
  - [sort](#sort)
  - [sortBy](#sortby)
  - [uniq](#uniq)
  - [updateAt](#updateat)
- [Model](#model)
  - [RefArray (interface)](#refarray-interface)

---

# Combinator

## append

**Signature**

```ts
export declare const append: <A>(value: A) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## concat

**Signature**

```ts
export declare const concat: <A>(
  end: readonly A[],
) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.12.0

## deleteAt

**Signature**

```ts
export declare const deleteAt: (
  index: number,
) => <E, A>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.14.0

## endoMap

**Signature**

```ts
export declare const endoMap: <A>(
  f: Endomorphism<A>,
) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## filter

**Signature**

```ts
export declare const filter: <A>(
  p: Predicate<A>,
) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## insertAt

**Signature**

```ts
export declare const insertAt: <A>(
  index: number,
  value: A,
) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## modifyAt

**Signature**

```ts
export declare const modifyAt: <A>(
  index: number,
  f: Endomorphism<A>,
) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## prepend

**Signature**

```ts
export declare const prepend: <A>(value: A) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## reverse

**Signature**

```ts
export declare const reverse: <E, A>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## rotate

**Signature**

```ts
export declare const rotate: (n: number) => <E, A>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## sort

**Signature**

```ts
export declare const sort: <A>(O: Ord<A>) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## sortBy

**Signature**

```ts
export declare const sortBy: <A>(
  O: readonly Ord<A>[],
) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## uniq

**Signature**

```ts
export declare const uniq: <A>(Eq: Eq<A>) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

## updateAt

**Signature**

```ts
export declare const updateAt: <A>(
  index: number,
  a: A,
) => <E>(ra: RefArray<E, A>) => E.Env<E, readonly A[]>
```

Added in v0.11.0

# Model

## RefArray (interface)

RefArray is an abstraction of Refs that will track an array of values.

**Signature**

```ts
export interface RefArray<E, A> extends Ref.Ref<E, readonly A[]> {}
```

Added in v0.11.0
