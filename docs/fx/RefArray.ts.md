---
title: RefArray.ts
nav_order: 10
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
  - [contains](#contains)
  - [dedupe](#dedupe)
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
  - [makeRefArray](#makerefarray)
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
  <A>(value: A): <E>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, value: A): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## appendAll

Append an iterable of values to the current state of a RefArray.

**Signature**

```ts
export declare const appendAll: {
  <A>(value: Iterable<A>): <E>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, value: Iterable<A>): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## contains

Check to see if a RefArray contains a value.

**Signature**

```ts
export declare const contains: {
  <A>(value: A): <E>(ref: RefArray<E, A>) => Computed.Computed<never, E, boolean>
  <E, A>(ref: RefArray<E, A>, value: A): Computed.Computed<never, E, boolean>
}
```

Added in v1.18.0

## dedupe

Remove any duplicate values from a RefArray.

**Signature**

```ts
export declare const dedupe: <E, A>(ref: RefArray<E, A>) => Effect.Effect<never, E, readonly A[]>
```

Added in v1.18.0

## drop

Drop the first `n` values from a RefArray.

**Signature**

```ts
export declare const drop: {
  (n: number): <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## dropRight

Drop the last `n` values from a RefArray.

**Signature**

```ts
export declare const dropRight: {
  (n: number): <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## dropWhile

Drop values from a RefArray while a predicate is true.

**Signature**

```ts
export declare const dropWhile: {
  (predicate: (a: unknown) => boolean): <E, A>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, predicate: (a: unknown) => boolean): Effect.Effect<
    never,
    E,
    readonly A[]
  >
}
```

Added in v1.18.0

## insertAt

Insert a value at a particular index of a RefArray.

**Signature**

```ts
export declare const insertAt: {
  <A>(index: number, a: A): <E>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, index: number, a: A): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## map

Map (Endomorphic) the values of a RefArray.

**Signature**

```ts
export declare const map: {
  <A>(f: (a: A, index: number) => A): <E>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Computed.Computed<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, f: (a: A, index: number) => A): Computed.Computed<
    never,
    E,
    readonly A[]
  >
}
```

Added in v1.18.0

## modifyAt

Modify the value at a particular index of a RefArray.

**Signature**

```ts
export declare const modifyAt: {
  <A>(index: number, f: (a: A) => A): <E>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, index: number, f: (a: A) => A): Effect.Effect<
    never,
    E,
    readonly A[]
  >
}
```

Added in v1.18.0

## prepend

Prepend a value to the current state of a RefArray.

**Signature**

```ts
export declare const prepend: {
  <A>(value: A): <E>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, value: A): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## prependAll

Prepend an iterable of values to the current state of a RefArray.

**Signature**

```ts
export declare const prependAll: <E, A>(
  ref: RefSubject.RefSubject<E, readonly A[]>,
  value: Iterable<A>
) => Effect.Effect<never, E, readonly A[]>
```

Added in v1.18.0

## replaceAt

Replace a value at a particular index of a RefArray.

**Signature**

```ts
export declare const replaceAt: {
  <A>(index: number, a: A): <E>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, index: number, a: A): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## rotate

Rotate the values of a RefArray by `n` places. Helpful for things like carousels.

**Signature**

```ts
export declare const rotate: {
  (n: number): <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## sortBy

Sort the values of a RefArray using a provided Order.

**Signature**

```ts
export declare const sortBy: {
  <A>(orders: Iterable<Order.Order<A>>): <E>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, orders: Iterable<Order.Order<A>>): Effect.Effect<
    never,
    E,
    readonly A[]
  >
}
```

Added in v1.18.0

## take

Take the first `n` values from a RefArray.

**Signature**

```ts
export declare const take: {
  (n: number): <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## takeRight

Take the last `n` values from a RefArray.

**Signature**

```ts
export declare const takeRight: {
  (n: number): <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, n: number): Effect.Effect<never, E, readonly A[]>
}
```

Added in v1.18.0

## takeWhile

Take values from a RefArray while a predicate is true.

**Signature**

```ts
export declare const takeWhile: {
  (predicate: (a: unknown) => boolean): <E, A>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Effect.Effect<never, E, readonly A[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, predicate: (a: unknown) => boolean): Effect.Effect<
    never,
    E,
    readonly A[]
  >
}
```

Added in v1.18.0

# computed

## filterValues

Filter the values of a RefArray using a predicate creating a Computed value.

**Signature**

```ts
export declare const filterValues: {
  <A, B extends A>(predicate: (a: A) => a is B): <E>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Computed.Computed<never, E, readonly B[]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, predicate: (a: A) => boolean): Computed.Computed<
    never,
    E,
    readonly A[]
  >
}
```

Added in v1.18.0

## groupBy

Group the values of a RefArray by a key.

**Signature**

```ts
export declare const groupBy: {
  <A>(f: (a: A) => string): <E>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Computed.Computed<never, E, Record<string, readonly A[]>>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, f: (a: A) => string): Computed.Computed<
    never,
    E,
    Record<string, readonly A[]>
  >
}
```

Added in v1.18.0

## isEmpty

Check to see if a RefArray is empty.

**Signature**

```ts
export declare const isEmpty: <E, A>(
  ref: RefSubject.RefSubject<E, readonly A[]>
) => Computed.Computed<never, E, boolean>
```

Added in v1.18.0

## isNonEmpty

Check to see if a RefArray is non-empty.

**Signature**

```ts
export declare const isNonEmpty: <E, A>(
  ref: RefSubject.RefSubject<E, readonly A[]>
) => Computed.Computed<never, E, boolean>
```

Added in v1.18.0

## length

Get the current length of a RefArray.

**Signature**

```ts
export declare const length: <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>) => Computed.Computed<never, E, number>
```

Added in v1.18.0

## mapValues

Map the values of a RefArray.

**Signature**

```ts
export declare const mapValues: {
  <A, B>(f: (a: A, index: number) => B): <E>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Computed.Computed<never, E, readonly B[]>
  <E, A, B>(ref: RefSubject.RefSubject<E, readonly A[]>, f: (a: A, index: number) => B): Computed.Computed<
    never,
    E,
    readonly B[]
  >
}
```

Added in v1.18.0

## partition

Partition the values of a RefArray using a predicate.

**Signature**

```ts
export declare const partition: {
  <A, B extends A>(predicate: (a: A) => a is B): <E>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Computed.Computed<never, E, readonly [readonly B[], readonly A[]]>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, predicate: (a: A) => boolean): Computed.Computed<
    never,
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
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <E>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Computed.Computed<never, E, B>
  <E, A, B>(ref: RefSubject.RefSubject<E, readonly A[]>, b: B, f: (b: B, a: A, index: number) => B): Computed.Computed<
    never,
    E,
    B
  >
}
```

Added in v1.18.0

## reduceRight

Reduce the values of a RefArray to a single value in reverse order.

**Signature**

```ts
export declare const reduceRight: {
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <E>(
    ref: RefSubject.RefSubject<E, readonly A[]>
  ) => Computed.Computed<never, E, B>
  <E, A, B>(ref: RefSubject.RefSubject<E, readonly A[]>, b: B, f: (b: B, a: A, index: number) => B): Computed.Computed<
    never,
    E,
    B
  >
}
```

Added in v1.18.0

# constructors

## makeRefArray

Construct a new RefArray with the given initial value.

**Signature**

```ts
export declare function makeRefArray<R, E, A>(
  initial: Effect.Effect<R, E, ReadonlyArray<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefArray<E, A>>
export declare function makeRefArray<R, E, A>(
  initial: Fx.Fx<R, E, ReadonlyArray<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefArray<E, A>>
```

Added in v1.18.0

# filtered

## getIndex

Get a value contained a particular index of a RefArray.

**Signature**

```ts
export declare const getIndex: {
  (index: number): <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>) => Filtered.Filtered<never, E, A>
  <E, A>(ref: RefSubject.RefSubject<E, readonly A[]>, index: number): Filtered.Filtered<never, E, A>
}
```

Added in v1.18.0

# models

## RefArray (interface)

A RefArray is a RefSubject that is specialized over an array of values.

**Signature**

```ts
export interface RefArray<E, A> extends RefSubject.RefSubject<E, ReadonlyArray<A>> {
  /**
   * The eqivalence used for individual values.
   * @since 1.18.0
   */
  readonly valueEq: Equivalence<A>
}
```

Added in v1.18.0
