---
title: RefChunk.ts
nav_order: 13
parent: "@typed/fx"
---

## RefChunk overview

Extensions to RefSubject for working with arrays of values

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [append](#append)
  - [appendAll](#appendall)
  - [dedupe](#dedupe)
  - [drop](#drop)
  - [dropRight](#dropright)
  - [dropWhile](#dropwhile)
  - [map](#map)
  - [modifyAt](#modifyat)
  - [prepend](#prepend)
  - [prependAll](#prependall)
  - [replaceAt](#replaceat)
  - [take](#take)
  - [takeRight](#takeright)
  - [takeWhile](#takewhile)
- [computed](#computed)
  - [filterValues](#filtervalues)
  - [isEmpty](#isempty)
  - [isNonEmpty](#isnonempty)
  - [mapValues](#mapvalues)
  - [partition](#partition)
  - [reduce](#reduce)
  - [reduceRight](#reduceright)
  - [size](#size)
- [constructors](#constructors)
  - [make](#make)
  - [tagged](#tagged)
- [filtered](#filtered)
  - [getIndex](#getindex)
- [models](#models)
  - [RefChunk (interface)](#refchunk-interface)

---

# combinators

## append

Append a value to the current state of a RefChunk.

**Signature**

```ts
export declare const append: {
  <A>(value: A): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, value: A): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## appendAll

Append an iterable of values to the current state of a RefChunk.

**Signature**

```ts
export declare const appendAll: {
  <A>(value: Iterable<A>): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, value: Iterable<A>): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## dedupe

Remove any duplicate values from a RefChunk.

**Signature**

```ts
export declare const dedupe: <R, E, A>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
```

Added in v1.18.0

## drop

Drop the first `n` values from a RefChunk.

**Signature**

```ts
export declare const drop: {
  (n: number): <R, E, A>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, n: number): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## dropRight

Drop the last `n` values from a RefChunk.

**Signature**

```ts
export declare const dropRight: {
  (n: number): <R, E, A>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, n: number): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## dropWhile

Drop values from a RefChunk while a predicate is true.

**Signature**

```ts
export declare const dropWhile: {
  <A>(predicate: (a: A) => boolean): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, predicate: (a: A) => boolean): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## map

Map (Endomorphic) the values of a RefChunk.

**Signature**

```ts
export declare const map: {
  <A>(f: (a: A, index: number) => A): <R, E>(ref: RefChunk<R, E, A>) => RefSubject.Computed<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, f: (a: A, index: number) => A): RefSubject.Computed<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## modifyAt

Modify the value at a particular index of a RefChunk.

**Signature**

```ts
export declare const modifyAt: {
  <A>(index: number, f: (a: A) => A): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, index: number, f: (a: A) => A): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## prepend

Prepend a value to the current state of a RefChunk.

**Signature**

```ts
export declare const prepend: {
  <A>(value: A): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, value: A): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## prependAll

Prepend an iterable of values to the current state of a RefChunk.

**Signature**

```ts
export declare const prependAll: {
  <A>(value: Iterable<A>): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, value: Iterable<A>): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## replaceAt

Replace a value at a particular index of a RefChunk.

**Signature**

```ts
export declare const replaceAt: {
  <A>(index: number, a: A): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, index: number, a: A): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## take

Take the first `n` values from a RefChunk.

**Signature**

```ts
export declare const take: {
  (n: number): <R, E, A>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, n: number): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## takeRight

Take the last `n` values from a RefChunk.

**Signature**

```ts
export declare const takeRight: {
  (n: number): <R, E, A>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, n: number): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## takeWhile

Take values from a RefChunk while a predicate is true.

**Signature**

```ts
export declare const takeWhile: {
  <A>(predicate: (a: A) => boolean): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, predicate: (a: A) => boolean): Effect.Effect<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

# computed

## filterValues

Filter the values of a RefChunk using a predicate creating a Computed value.

**Signature**

```ts
export declare const filterValues: {
  <A>(predicate: (a: A) => boolean): <R, E>(ref: RefChunk<R, E, A>) => RefSubject.Computed<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, predicate: (a: A) => boolean): RefSubject.Computed<R, E, Chunk.Chunk<A>>
}
```

Added in v1.18.0

## isEmpty

Check to see if a RefChunk is empty.

**Signature**

```ts
export declare const isEmpty: <R, E, A>(ref: RefChunk<R, E, A>) => RefSubject.Computed<R, E, boolean>
```

Added in v1.18.0

## isNonEmpty

Check to see if a RefChunk is non-empty.

**Signature**

```ts
export declare const isNonEmpty: <R, E, A>(ref: RefChunk<R, E, A>) => RefSubject.Computed<R, E, boolean>
```

Added in v1.18.0

## mapValues

Map the values with their indexes of a RefChunk.

**Signature**

```ts
export declare const mapValues: {
  <A, B>(f: (a: A, index: number) => B): <R, E>(ref: RefChunk<R, E, A>) => RefSubject.Computed<R, E, readonly B[]>
  <R, E, A, B>(ref: RefChunk<R, E, A>, f: (a: A, index: number) => B): RefSubject.Computed<R, E, readonly B[]>
}
```

Added in v1.18.0

## partition

Partition the values of a RefChunk using a predicate.

**Signature**

```ts
export declare const partition: {
  <A, B extends A>(
    predicate: (a: A) => a is B
  ): <R, E>(ref: RefChunk<R, E, A>) => RefSubject.Computed<R, E, readonly [readonly B[], Chunk.Chunk<A>]>
  <R, E, A>(
    ref: RefChunk<R, E, A>,
    predicate: (a: A) => boolean
  ): RefSubject.Computed<never, E, readonly [Chunk.Chunk<A>, Chunk.Chunk<A>]>
}
```

Added in v1.18.0

## reduce

Reduce the values of a RefChunk to a single value.

**Signature**

```ts
export declare const reduce: {
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <R, E>(ref: RefChunk<R, E, A>) => RefSubject.Computed<R, E, B>
  <R, E, A, B>(ref: RefChunk<R, E, A>, b: B, f: (b: B, a: A, index: number) => B): RefSubject.Computed<R, E, B>
}
```

Added in v1.18.0

## reduceRight

Reduce the values of a RefChunk to a single value in reverse order.

**Signature**

```ts
export declare const reduceRight: {
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <R, E>(ref: RefChunk<R, E, A>) => RefSubject.Computed<R, E, B>
  <R, E, A, B>(ref: RefChunk<R, E, A>, b: B, f: (b: B, a: A, index: number) => B): RefSubject.Computed<R, E, B>
}
```

Added in v1.18.0

## size

Get the current length of a RefChunk.

**Signature**

```ts
export declare const size: <R, E, A>(ref: RefChunk<R, E, A>) => RefSubject.Computed<R, E, number>
```

Added in v1.18.0

# constructors

## make

Construct a new RefChunk with the given initial value.

**Signature**

```ts
export declare function make<R, E, A>(
  initial: Effect.Effect<R, E, Chunk.Chunk<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefChunk<never, E, A>>
export declare function make<R, E, A>(
  initial: Fx.Fx<R, E, Chunk.Chunk<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefChunk<never, E, A>>
```

Added in v1.18.0

## tagged

Create a Tagged RefChunk

**Signature**

```ts
export declare const tagged: <A>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, Chunk.Chunk<A>>
  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, Chunk.Chunk<A>>
}
```

Added in v1.18.0

# filtered

## getIndex

Get a value contained a particular index of a RefChunk.

**Signature**

```ts
export declare const getIndex: {
  (index: number): <R, E, A>(ref: RefChunk<R, E, A>) => RefSubject.Filtered<R, E, A>
  <R, E, A>(ref: RefChunk<R, E, A>, index: number): RefSubject.Filtered<R, E, A>
}
```

Added in v1.18.0

# models

## RefChunk (interface)

A RefChunk is a RefSubject that is specialized over an Chunk of values.

**Signature**

```ts
export interface RefChunk<out R, in out E, in out A> extends RefSubject.RefSubject<R, E, Chunk.Chunk<A>> {}
```

Added in v1.18.0
