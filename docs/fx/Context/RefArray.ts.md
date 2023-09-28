---
title: Context/RefArray.ts
nav_order: 4
parent: "@typed/fx"
---

## RefArray overview

A Contextual wrapper around a RefArray

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
  - [RefArray](#refarray)
  - [make](#make)
- [filtered](#filtered)
  - [getIndex](#getindex)
- [models](#models)
  - [RefArray (interface)](#refarray-interface)

---

# combinators

## append

Append a value to the current state of a RefArray.

**Signature**

```ts
export declare const append: {
  <A>(value: A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, value: A): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## appendAll

Append an iterable of values to the current state of a RefArray.

**Signature**

```ts
export declare const appendAll: {
  <A>(value: Iterable<A>): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, value: Iterable<A>): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## dedupeWith

Remove any duplicate values from a RefArray.

**Signature**

```ts
export declare const dedupeWith: <A>(
  eq: Equivalence<A>
) => <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
```

Added in v1.18.0

## drop

Drop the first `n` values from a RefArray.

**Signature**

```ts
export declare const drop: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## dropRight

Drop the last `n` values from a RefArray.

**Signature**

```ts
export declare const dropRight: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## dropWhile

Drop values from a RefArray while a predicate is true.

**Signature**

```ts
export declare const dropWhile: {
  <A>(predicate: (value: A) => boolean): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## insertAt

Insert a value at a particular index of a RefArray.

**Signature**

```ts
export declare const insertAt: {
  <A>(index: number, value: A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, index: number, value: A): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## map

Map (Endomorphic) the values and their indexes of a RefArray.

**Signature**

```ts
export declare const map: {
  <A, B>(f: (value: A, index: number) => A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly B[]>
  <I, E, A>(ref: RefArray<I, E, A>, f: (value: A, index: number) => A): Effect.Effect<I, E, readonly A[]>
}
```

Added in v1.18.0

## modifyAt

Modify the value at a particular index of a RefArray.

**Signature**

```ts
export declare const modifyAt: {
  <A>(index: number, f: (value: A) => A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, index: number, f: (value: A) => A): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## prepend

Prepend a value to the current state of a RefArray.

**Signature**

```ts
export declare const prepend: {
  <A>(value: A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, value: A): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## prependAll

Prepend an iterable of values to the current state of a RefArray.

**Signature**

```ts
export declare const prependAll: {
  <A>(value: Iterable<A>): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, value: Iterable<A>): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## replaceAt

Replace a value at a particular index of a RefArray.

**Signature**

```ts
export declare const replaceAt: {
  <A>(index: number, value: A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, index: number, value: A): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## rotate

Rotate the values of a RefArray by `n` places. Helpful for things like carousels.

**Signature**

```ts
export declare const rotate: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## sortBy

Sort the values of a RefArray using a provided Order.

**Signature**

```ts
export declare const sortBy: {
  <A>(orders: Iterable<Order.Order<A>>): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, orders: Iterable<Order.Order<A>>): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## take

Take the first `n` values from a RefArray.

**Signature**

```ts
export declare const take: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## takeRight

Take the last `n` values from a RefArray.

**Signature**

```ts
export declare const takeRight: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## takeWhile

Take values from a RefArray while a predicate is true.

**Signature**

```ts
export declare const takeWhile: {
  <A>(predicate: (value: A) => boolean): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, readonly A[]>
  <I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

# computed

## filterValues

Filter the values of a RefArray using a predicate creating a Computed value.

**Signature**

```ts
export declare const filterValues: {
  <A>(predicate: (value: A) => boolean): <I, E>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, A>
  <I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean): Computed.Computed<I, E, A>
}
```

Added in v1.18.0

## groupBy

Group the values of a RefArray by a key into a record.

**Signature**

```ts
export declare const groupBy: {
  <A>(f: (value: A) => string): <I, E>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, Record<string, readonly A[]>>
  <I, E, A>(ref: RefArray<I, E, A>, f: (value: A) => string): Computed.Computed<I, E, Record<string, readonly A[]>>
}
```

Added in v1.18.0

## isEmpty

Check to see if a RefArray is empty.

**Signature**

```ts
export declare const isEmpty: <I, E, A>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, boolean>
```

Added in v1.18.0

## isNonEmpty

Check to see if a RefArray is not empty.

**Signature**

```ts
export declare const isNonEmpty: <I, E, A>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, boolean>
```

Added in v1.18.0

## length

Get the current length of a RefArray.

**Signature**

```ts
export declare const length: <I, E, A>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, number>
```

Added in v1.18.0

## mapValues

Map the values with their indexes of a RefArray.

**Signature**

```ts
export declare const mapValues: {
  <A, B>(f: (value: A, index: number) => B): <I, E>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, readonly B[]>
  <I, E, A, B>(ref: RefArray<I, E, A>, f: (value: A, index: number) => B): Computed.Computed<I, E, readonly B[]>
}
```

Added in v1.18.0

## partition

Partition the values of a RefArray using a predicate.

**Signature**

```ts
export declare const partition: {
  <A>(predicate: (value: A) => boolean): <I, E>(
    ref: RefArray<I, E, A>
  ) => Computed.Computed<I, E, readonly [readonly A[], readonly A[]]>
  <I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean): Computed.Computed<
    I,
    E,
    readonly [readonly A[], readonly A[]]
  >
}
```

Added in v1.18.0

## reduce

Reduce the values of a RefArray to a single value.

**Signature**

```ts
export declare const reduce: {
  <A, B>(initial: B, f: (accumulator: B, value: A, index: number) => B): <I, E>(
    ref: RefArray<I, E, A>
  ) => Computed.Computed<I, E, B>
  <I, E, A, B>(
    ref: RefArray<I, E, A>,
    initial: B,
    f: (accumulator: B, value: A, index: number) => B
  ): Computed.Computed<I, E, B>
}
```

Added in v1.18.0

## reduceRight

Reduce the values of a RefArray to a single value in reverse order.

**Signature**

```ts
export declare const reduceRight: {
  <A, B>(initial: B, f: (accumulator: B, value: A, index: number) => B): <I, E>(
    ref: RefArray<I, E, A>
  ) => Computed.Computed<I, E, B>
  <I, E, A, B>(
    ref: RefArray<I, E, A>,
    initial: B,
    f: (accumulator: B, value: A, index: number) => B
  ): Computed.Computed<I, E, B>
}
```

Added in v1.18.0

# constructors

## RefArray

**Signature**

```ts
export declare function RefArray<E, A>(): {
  <const I extends Context.IdentifierConstructor<any>>(identifier: (id: typeof Context.id) => I): RefSubject.RefSubject<
    Context.IdentifierOf<I>,
    E,
    ReadonlyArray<A>
  >

  <const I>(identifier: I): RefSubject.RefSubject<Context.IdentifierOf<I>, E, ReadonlyArray<A>>
}
```

Added in v1.18.0

## make

**Signature**

```ts
export declare const make: <E, A>() => {
  <const I extends Context.IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => Context.IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject<Context.IdentifierOf<I>, E, readonly A[]>
  <const I>(identifier: I): RefSubject.RefSubject<Context.IdentifierOf<I>, E, readonly A[]>
}
```

Added in v1.18.0

# filtered

## getIndex

Get a value contained a particular index of a RefArray.

**Signature**

```ts
export declare const getIndex: {
  (index: number): <I, E, A>(ref: RefArray<I, E, A>) => Filtered.Filtered<I, E, A>
  <I, E, A>(ref: RefArray<I, E, A>, index: number): Filtered.Filtered<I, E, A>
}
```

Added in v1.18.0

# models

## RefArray (interface)

A Contextual wrapper around a RefArray

**Signature**

```ts
export interface RefArray<I, E, A> extends RefSubject.RefSubject<I, E, ReadonlyArray<A>> {}
```

Added in v1.18.0
