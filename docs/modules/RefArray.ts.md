---
title: RefArray.ts
nav_order: 36
parent: Modules
---

## RefArray overview

RefArray is an abstraction over @see Ref to
provide some additional functionality for working with Arrays.

Added in v0.9.2

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
  - [provideAll](#provideall)
  - [provideSome](#providesome)
  - [reverse](#reverse)
  - [rotate](#rotate)
  - [sort](#sort)
  - [sortBy](#sortby)
  - [uniq](#uniq)
  - [updateAt](#updateat)
  - [useAll](#useall)
  - [useSome](#usesome)
- [Constructor](#constructor)
  - [create](#create)
  - [lift](#lift)
  - [toReferenceArray](#toreferencearray)
- [Instance](#instance)
  - [Provide](#provide)
  - [ProvideAll](#provideall)
  - [ProvideSome](#providesome)
  - [UseAll](#useall)
  - [UseSome](#usesome)
- [Model](#model)
  - [RefArray (interface)](#refarray-interface)
  - [ReferenceArray (interface)](#referencearray-interface)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## append

**Signature**

```ts
export declare const append: <E, A>(
  ra: RefArray<E, A>
) => (value: A) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## concat

**Signature**

```ts
export declare const concat: <E, A>(
  ra: RefArray<E, A>
) => (
  end: readonly A[]
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## deleteAt

**Signature**

```ts
export declare const deleteAt: <E, A>(
  ra: RefArray<E, A>
) => (index: number) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## endoMap

**Signature**

```ts
export declare const endoMap: <E, A>(
  ra: RefArray<E, A>
) => (
  f: Endomorphism<A>
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## filter

**Signature**

```ts
export declare const filter: <E, A>(
  ra: RefArray<E, A>
) => (
  p: Predicate<A>
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## insertAt

**Signature**

```ts
export declare const insertAt: <E, A>(
  ra: RefArray<E, A>
) => (
  index: number,
  value: A
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## modifyAt

**Signature**

```ts
export declare const modifyAt: <E, A>(
  ra: RefArray<E, A>
) => (
  index: number,
  f: Endomorphism<A>
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## prepend

**Signature**

```ts
export declare const prepend: <E, A>(
  ra: RefArray<E, A>
) => (value: A) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <E>(provided: E) => <A>(ref: ReferenceArray<E, A>) => ReferenceArray<unknown, A>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <E1>(
  provided: E1
) => <E2, A>(ref: ReferenceArray<E1 & E2, A>) => ReferenceArray<E2, A>
```

Added in v0.9.2

## reverse

**Signature**

```ts
export declare const reverse: <E, A>(
  ra: RefArray<E, A>
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## rotate

**Signature**

```ts
export declare const rotate: <E, A>(
  ra: RefArray<E, A>
) => (n: number) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## sort

**Signature**

```ts
export declare const sort: <E, A>(
  ra: RefArray<E, A>
) => (O: Ord<A>) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## sortBy

**Signature**

```ts
export declare const sortBy: <E, A>(
  ra: RefArray<E, A>
) => (
  O: readonly Ord<A>[]
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## uniq

**Signature**

```ts
export declare const uniq: <E, A>(
  ra: RefArray<E, A>
) => (Eq: Eq<A>) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## updateAt

**Signature**

```ts
export declare const updateAt: <E, A>(
  ra: RefArray<E, A>
) => (
  index: number,
  a: A
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly A[]>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <E>(provided: E) => <A>(ref: ReferenceArray<E, A>) => ReferenceArray<unknown, A>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <E1>(provided: E1) => <E2, A>(ref: ReferenceArray<E1 & E2, A>) => ReferenceArray<E2, A>
```

Added in v0.9.2

# Constructor

## create

**Signature**

```ts
export declare const create: <A>(memberEq: Eq<A>) => <E>(ref: Ref.Reference<E, readonly A[]>) => ReferenceArray<E, A>
```

Added in v0.9.2

## lift

**Signature**

```ts
export declare const lift: <A>(memberEq: Eq<A>) => <E>(ref: Ref.Reference<E, readonly A[]>) => RefArray<E, A>
```

Added in v0.9.2

## toReferenceArray

**Signature**

```ts
export declare function toReferenceArray<E, A>(M: RefArray<E, A>): ReferenceArray<E, A>
```

Added in v0.9.2

# Instance

## Provide

**Signature**

```ts
export declare const Provide: P.Provide2<'@typed/fp/ReferenceArray'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll2<'@typed/fp/ReferenceArray'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome2<'@typed/fp/ReferenceArray'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll2<'@typed/fp/ReferenceArray'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome2<'@typed/fp/ReferenceArray'>
```

Added in v0.9.2

# Model

## RefArray (interface)

**Signature**

```ts
export interface RefArray<E, A> extends Ref.Reference<E, ReadonlyArray<A>> {
  readonly memberEq: Eq<A>
}
```

Added in v0.9.2

## ReferenceArray (interface)

**Signature**

```ts
export interface ReferenceArray<E, A> extends RefArray<E, A> {
  readonly append: (value: A) => E.Env<E & Ref.Refs, readonly A[]>
  readonly concat: (end: ReadonlyArray<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly deleteAt: (index: number) => E.Env<E & Ref.Refs, readonly A[]>
  readonly endoMap: (f: Endomorphism<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly filter: (p: Predicate<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly insertAt: (index: number, value: A) => E.Env<E & Ref.Refs, readonly A[]>
  readonly modifyAt: (index: number, f: Endomorphism<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly prepend: (value: A) => E.Env<E & Ref.Refs, readonly A[]>
  readonly reverse: E.Env<E & Ref.Refs, readonly A[]>
  readonly rotate: (n: number) => E.Env<E & Ref.Refs, readonly A[]>
  readonly sort: (O: Ord<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly sortBy: (Ors: readonly Ord<A>[]) => E.Env<E & Ref.Refs, readonly A[]>
  readonly uniq: (E: Eq<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly updateAt: (index: number, a: A) => E.Env<E & Ref.Refs, readonly A[]>
}
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/ReferenceArray'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
