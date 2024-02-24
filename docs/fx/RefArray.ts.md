---
title: RefArray.ts
nav_order: 11
parent: "@typed/fx"
---

## RefArray overview

Extensions to RefSubject for working with arrays of values

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [append](#append)
  - [appendAll](#appendall)
  - [dedupeWith](#dedupewith)
  - [drop](#drop)
  - [dropRight](#dropright)
  - [dropWhile](#dropwhile)
  - [insertAt](#insertat)
  - [map](#map)
  - [modifyAt](#modifyat)
  - [prepend](#prepend)
  - [prependAll](#prependall)
  - [replaceAt](#replaceat)
  - [rotate](#rotate)
  - [sortBy](#sortby)
  - [take](#take)
  - [takeRight](#takeright)
  - [takeWhile](#takewhile)
- [computed](#computed)
  - [filterValues](#filtervalues)
  - [groupBy](#groupby)
  - [isEmpty](#isempty)
  - [isNonEmpty](#isnonempty)
  - [length](#length)
  - [mapValues](#mapvalues)
  - [partition](#partition)
  - [reduce](#reduce)
  - [reduceRight](#reduceright)
- [constructors](#constructors)
  - [make](#make)
  - [tagged](#tagged)
- [filtered](#filtered)
  - [getIndex](#getindex)
- [models](#models)
  - [RefArray (interface)](#refarray-interface)
- [utils](#utils)
  - [head](#head)
  - [last](#last)

---

# combinators

## append

Append a value to the current state of a RefArray.

**Signature**

```ts
export declare const append: {
  <A>(value: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, value: A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## appendAll

Append an iterable of values to the current state of a RefArray.

**Signature**

```ts
export declare const appendAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## dedupeWith

Remove any duplicate values from a RefArray.

**Signature**

```ts
export declare const dedupeWith: <A>(
  valueEq: Equivalence<A>
) => <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
```

Added in v1.18.0

## drop

Drop the first `n` values from a RefArray.

**Signature**

```ts
export declare const drop: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## dropRight

Drop the last `n` values from a RefArray.

**Signature**

```ts
export declare const dropRight: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## dropWhile

Drop values from a RefArray while a predicate is true.

**Signature**

```ts
export declare const dropWhile: {
  <A>(predicate: (a: A) => boolean): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, predicate: (a: unknown) => boolean): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## insertAt

Insert a value at a particular index of a RefArray.

**Signature**

```ts
export declare const insertAt: {
  <A>(index: number, a: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, index: number, a: A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## map

Map (Endomorphic) the values of a RefArray.

**Signature**

```ts
export declare const map: {
  <A>(f: (a: A, index: number) => A): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, f: (a: A, index: number) => A): RefSubject.Computed<readonly A[], E, R>
}
```

Added in v1.18.0

## modifyAt

Modify the value at a particular index of a RefArray.

**Signature**

```ts
export declare const modifyAt: {
  <A>(index: number, f: (a: A) => A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, index: number, f: (a: A) => A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## prepend

Prepend a value to the current state of a RefArray.

**Signature**

```ts
export declare const prepend: {
  <A>(value: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, value: A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## prependAll

Prepend an iterable of values to the current state of a RefArray.

**Signature**

```ts
export declare const prependAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## replaceAt

Replace a value at a particular index of a RefArray.

**Signature**

```ts
export declare const replaceAt: {
  <A>(index: number, a: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, index: number, a: A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## rotate

Rotate the values of a RefArray by `n` places. Helpful for things like carousels.

**Signature**

```ts
export declare const rotate: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## sortBy

Sort the values of a RefArray using a provided Order.

**Signature**

```ts
export declare const sortBy: {
  <A>(orders: Iterable<Order.Order<A>>): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, orders: Iterable<Order.Order<A>>): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## take

Take the first `n` values from a RefArray.

**Signature**

```ts
export declare const take: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## takeRight

Take the last `n` values from a RefArray.

**Signature**

```ts
export declare const takeRight: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## takeWhile

Take values from a RefArray while a predicate is true.

**Signature**

```ts
export declare const takeWhile: {
  <A>(predicate: (a: A) => boolean): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, predicate: (a: unknown) => boolean): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

# computed

## filterValues

Filter the values of a RefArray using a predicate creating a Computed value.

**Signature**

```ts
export declare const filterValues: {
  <A>(predicate: (a: A) => boolean): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<readonly A[], E, R>
  <A, E, R>(ref: RefArray<A, E, R>, predicate: (a: A) => boolean): RefSubject.Computed<readonly A[], E, R>
}
```

Added in v1.18.0

## groupBy

Group the values of a RefArray by a key.

**Signature**

```ts
export declare const groupBy: {
  <A>(f: (a: A) => string): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<R, E, Record<string, readonly A[]>>
  <A, E, R>(ref: RefArray<A, E, R>, f: (a: A) => string): RefSubject.Computed<R, E, Record<string, readonly A[]>>
}
```

Added in v1.18.0

## isEmpty

Check to see if a RefArray is empty.

**Signature**

```ts
export declare const isEmpty: <A, E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<boolean, E, R>
```

Added in v1.18.0

## isNonEmpty

Check to see if a RefArray is non-empty.

**Signature**

```ts
export declare const isNonEmpty: <A, E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<boolean, E, R>
```

Added in v1.18.0

## length

Get the current length of a RefArray.

**Signature**

```ts
export declare const length: <A, E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<number, E, R>
```

Added in v1.18.0

## mapValues

Map the values with their indexes of a RefArray.

**Signature**

```ts
export declare const mapValues: {
  <A, B>(f: (a: A, index: number) => B): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<readonly B[], E, R>
  <A, E, R, B>(ref: RefArray<A, E, R>, f: (a: A, index: number) => B): RefSubject.Computed<readonly B[], E, R>
}
```

Added in v1.18.0

## partition

Partition the values of a RefArray using a predicate.

**Signature**

```ts
export declare const partition: {
  <A, B extends A>(
    predicate: (a: A) => a is B
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<R, E, readonly [readonly B[], readonly A[]]>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    predicate: (a: A) => boolean
  ): RefSubject.Computed<never, E, readonly [readonly A[], readonly A[]]>
}
```

Added in v1.18.0

## reduce

Reduce the values of a RefArray to a single value.

**Signature**

```ts
export declare const reduce: {
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(ref: RefArray<A, E, R>, b: B, f: (b: B, a: A, index: number) => B): RefSubject.Computed<B, E, R>
}
```

Added in v1.18.0

## reduceRight

Reduce the values of a RefArray to a single value in reverse order.

**Signature**

```ts
export declare const reduceRight: {
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(ref: RefArray<A, E, R>, b: B, f: (b: B, a: A, index: number) => B): RefSubject.Computed<B, E, R>
}
```

Added in v1.18.0

# constructors

## make

Construct a new RefArray with the given initial value.

**Signature**

```ts
export declare function make<A, E, R>(
  initial: Effect.Effect<ReadonlyArray<A>, E, R>,
  eq?: Equivalence<A>
): Effect.Effect<RefArray<A, E>, never, R | Scope.Scope>
export declare function make<A, E, R>(
  initial: Fx.Fx<ReadonlyArray<A>, E, R>,
  eq?: Equivalence<A>
): Effect.Effect<RefArray<A, E>, never, R | Scope.Scope>
```

Added in v1.18.0

## tagged

Construct a Tagged RefArray

**Signature**

```ts
export declare function tagged<A>(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.RefSubject.Tagged<ReadonlyArray<A>, never, C.IdentifierOf<I>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<ReadonlyArray<A>, never, C.IdentifierOf<I>>
}
export declare function tagged<E, A>(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.RefSubject.Tagged<ReadonlyArray<A>, E, C.IdentifierOf<I>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<ReadonlyArray<A>, E, C.IdentifierOf<I>>
}
```

Added in v1.18.0

# filtered

## getIndex

Get a value contained a particular index of a RefArray.

**Signature**

```ts
export declare const getIndex: {
  (index: number): <A, E, R>(ref: RefArray<A, E, R>) => RefSubject.Filtered<A, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, index: number): RefSubject.Filtered<A, E, R>
}
```

Added in v1.18.0

# models

## RefArray (interface)

A RefArray is a RefSubject that is specialized over an array of values.

**Signature**

```ts
export interface RefArray<in out A, in out E = never, out R = never>
  extends RefSubject.RefSubject<ReadonlyArray<A>, E, R> {}
```

Added in v1.18.0

# utils

## head

**Signature**

```ts
export declare const head: <A, E, R>(ref: RefArray<A, E, R>) => RefSubject.Filtered<A, E, R>
```

Added in v1.18.0

## last

**Signature**

```ts
export declare const last: <A, E, R>(ref: RefArray<A, E, R>) => RefSubject.Filtered<A, E, R>
```

Added in v1.18.0
