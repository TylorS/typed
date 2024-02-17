---
title: RefArray.ts
nav_order: 12
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
  <A>(value: A): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, value: A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## appendAll

Append an iterable of values to the current state of a RefArray.

**Signature**

```ts
export declare const appendAll: {
  <A>(value: Iterable<A>): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, value: Iterable<A>): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## dedupeWith

Remove any duplicate values from a RefArray.

**Signature**

```ts
export declare const dedupeWith: <A>(
  valueEq: Equivalence<A>
) => <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
```

Added in v1.18.0

## drop

Drop the first `n` values from a RefArray.

**Signature**

```ts
export declare const drop: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## dropRight

Drop the last `n` values from a RefArray.

**Signature**

```ts
export declare const dropRight: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## dropWhile

Drop values from a RefArray while a predicate is true.

**Signature**

```ts
export declare const dropWhile: {
  <A>(predicate: (a: A) => boolean): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, predicate: (a: unknown) => boolean): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## insertAt

Insert a value at a particular index of a RefArray.

**Signature**

```ts
export declare const insertAt: {
  <A>(index: number, a: A): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, index: number, a: A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## map

Map (Endomorphic) the values of a RefArray.

**Signature**

```ts
export declare const map: {
  <A>(f: (a: A, index: number) => A): <R, E>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, readonly A[]>
  <R, E, A>(ref: RefArray<R, E, A>, f: (a: A, index: number) => A): RefSubject.Computed<R, E, readonly A[]>
}
```

Added in v1.18.0

## modifyAt

Modify the value at a particular index of a RefArray.

**Signature**

```ts
export declare const modifyAt: {
  <A>(index: number, f: (a: A) => A): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, index: number, f: (a: A) => A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## prepend

Prepend a value to the current state of a RefArray.

**Signature**

```ts
export declare const prepend: {
  <A>(value: A): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, value: A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## prependAll

Prepend an iterable of values to the current state of a RefArray.

**Signature**

```ts
export declare const prependAll: {
  <A>(value: Iterable<A>): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, value: Iterable<A>): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## replaceAt

Replace a value at a particular index of a RefArray.

**Signature**

```ts
export declare const replaceAt: {
  <A>(index: number, a: A): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, index: number, a: A): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## rotate

Rotate the values of a RefArray by `n` places. Helpful for things like carousels.

**Signature**

```ts
export declare const rotate: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## sortBy

Sort the values of a RefArray using a provided Order.

**Signature**

```ts
export declare const sortBy: {
  <A>(orders: Iterable<Order.Order<A>>): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, orders: Iterable<Order.Order<A>>): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## take

Take the first `n` values from a RefArray.

**Signature**

```ts
export declare const take: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## takeRight

Take the last `n` values from a RefArray.

**Signature**

```ts
export declare const takeRight: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

## takeWhile

Take values from a RefArray while a predicate is true.

**Signature**

```ts
export declare const takeWhile: {
  <A>(predicate: (a: A) => boolean): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<readonly A[], E, R>
  <R, E, A>(ref: RefArray<R, E, A>, predicate: (a: unknown) => boolean): Effect.Effect<readonly A[], E, R>
}
```

Added in v1.18.0

# computed

## filterValues

Filter the values of a RefArray using a predicate creating a Computed value.

**Signature**

```ts
export declare const filterValues: {
  <A>(predicate: (a: A) => boolean): <R, E>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, readonly A[]>
  <R, E, A>(ref: RefArray<R, E, A>, predicate: (a: A) => boolean): RefSubject.Computed<R, E, readonly A[]>
}
```

Added in v1.18.0

## groupBy

Group the values of a RefArray by a key.

**Signature**

```ts
export declare const groupBy: {
  <A>(f: (a: A) => string): <R, E>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, Record<string, readonly A[]>>
  <R, E, A>(ref: RefArray<R, E, A>, f: (a: A) => string): RefSubject.Computed<R, E, Record<string, readonly A[]>>
}
```

Added in v1.18.0

## isEmpty

Check to see if a RefArray is empty.

**Signature**

```ts
export declare const isEmpty: <R, E, A>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, boolean>
```

Added in v1.18.0

## isNonEmpty

Check to see if a RefArray is non-empty.

**Signature**

```ts
export declare const isNonEmpty: <R, E, A>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, boolean>
```

Added in v1.18.0

## length

Get the current length of a RefArray.

**Signature**

```ts
export declare const length: <R, E, A>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, number>
```

Added in v1.18.0

## mapValues

Map the values with their indexes of a RefArray.

**Signature**

```ts
export declare const mapValues: {
  <A, B>(f: (a: A, index: number) => B): <R, E>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, readonly B[]>
  <R, E, A, B>(ref: RefArray<R, E, A>, f: (a: A, index: number) => B): RefSubject.Computed<R, E, readonly B[]>
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
  ): <R, E>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, readonly [readonly B[], readonly A[]]>
  <R, E, A>(
    ref: RefArray<R, E, A>,
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
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <R, E>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, B>
  <R, E, A, B>(ref: RefArray<R, E, A>, b: B, f: (b: B, a: A, index: number) => B): RefSubject.Computed<R, E, B>
}
```

Added in v1.18.0

## reduceRight

Reduce the values of a RefArray to a single value in reverse order.

**Signature**

```ts
export declare const reduceRight: {
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <R, E>(ref: RefArray<R, E, A>) => RefSubject.Computed<R, E, B>
  <R, E, A, B>(ref: RefArray<R, E, A>, b: B, f: (b: B, a: A, index: number) => B): RefSubject.Computed<R, E, B>
}
```

Added in v1.18.0

# constructors

## make

Construct a new RefArray with the given initial value.

**Signature**

```ts
export declare function make<R, E, A>(
  initial: Effect.Effect<ReadonlyArray<A>, E, R>,
  eq?: Equivalence<A>
): Effect.Effect<RefArray<never, E, A>, never, R | Scope.Scope>
export declare function make<R, E, A>(
  initial: Fx.Fx<R, E, ReadonlyArray<A>>,
  eq?: Equivalence<A>
): Effect.Effect<RefArray<never, E, A>, never, R | Scope.Scope>
```

Added in v1.18.0

## tagged

Construct a Tagged RefArray

**Signature**

```ts
export declare function tagged<A>(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, never, ReadonlyArray<A>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, never, ReadonlyArray<A>>
}
export declare function tagged<E, A>(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, E, ReadonlyArray<A>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, E, ReadonlyArray<A>>
}
```

Added in v1.18.0

# filtered

## getIndex

Get a value contained a particular index of a RefArray.

**Signature**

```ts
export declare const getIndex: {
  (index: number): <R, E, A>(ref: RefArray<R, E, A>) => RefSubject.Filtered<R, E, A>
  <R, E, A>(ref: RefArray<R, E, A>, index: number): RefSubject.Filtered<R, E, A>
}
```

Added in v1.18.0

# models

## RefArray (interface)

A RefArray is a RefSubject that is specialized over an array of values.

**Signature**

```ts
export interface RefArray<out R, in out E, in out A> extends RefSubject.RefSubject<R, E, ReadonlyArray<A>> {}
```

Added in v1.18.0

# utils

## head

**Signature**

```ts
export declare const head: <R, E, A>(ref: RefArray<R, E, A>) => RefSubject.Filtered<R, E, A>
```

Added in v1.18.0

## last

**Signature**

```ts
export declare const last: <R, E, A>(ref: RefArray<R, E, A>) => RefSubject.Filtered<R, E, A>
```

Added in v1.18.0
