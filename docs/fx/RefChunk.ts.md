---
title: RefChunk.ts
nav_order: 12
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
  <A>(value: A): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, value: A): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## appendAll

Append an iterable of values to the current state of a RefChunk.

**Signature**

```ts
export declare const appendAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## dedupe

Remove any duplicate values from a RefChunk.

**Signature**

```ts
export declare const dedupe: <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
```

Added in v1.18.0

## drop

Drop the first `n` values from a RefChunk.

**Signature**

```ts
export declare const drop: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## dropRight

Drop the last `n` values from a RefChunk.

**Signature**

```ts
export declare const dropRight: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## dropWhile

Drop values from a RefChunk while a predicate is true.

**Signature**

```ts
export declare const dropWhile: {
  <A>(predicate: (a: A) => boolean): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## map

Map (Endomorphic) the values of a RefChunk.

**Signature**

```ts
export declare const map: {
  <A>(f: (a: A, index: number) => A): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, f: (a: A, index: number) => A): RefSubject.Computed<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## modifyAt

Modify the value at a particular index of a RefChunk.

**Signature**

```ts
export declare const modifyAt: {
  <A>(index: number, f: (a: A) => A): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, index: number, f: (a: A) => A): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## prepend

Prepend a value to the current state of a RefChunk.

**Signature**

```ts
export declare const prepend: {
  <A>(value: A): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, value: A): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## prependAll

Prepend an iterable of values to the current state of a RefChunk.

**Signature**

```ts
export declare const prependAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## replaceAt

Replace a value at a particular index of a RefChunk.

**Signature**

```ts
export declare const replaceAt: {
  <A>(index: number, a: A): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, index: number, a: A): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## take

Take the first `n` values from a RefChunk.

**Signature**

```ts
export declare const take: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## takeRight

Take the last `n` values from a RefChunk.

**Signature**

```ts
export declare const takeRight: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## takeWhile

Take values from a RefChunk while a predicate is true.

**Signature**

```ts
export declare const takeWhile: {
  <A>(predicate: (a: A) => boolean): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean): Effect.Effect<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

# computed

## filterValues

Filter the values of a RefChunk using a predicate creating a Computed value.

**Signature**

```ts
export declare const filterValues: {
  <A>(predicate: (a: A) => boolean): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean): RefSubject.Computed<Chunk.Chunk<A>, E, R>
}
```

Added in v1.18.0

## isEmpty

Check to see if a RefChunk is empty.

**Signature**

```ts
export declare const isEmpty: <A, E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<boolean, E, R>
```

Added in v1.18.0

## isNonEmpty

Check to see if a RefChunk is non-empty.

**Signature**

```ts
export declare const isNonEmpty: <A, E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<boolean, E, R>
```

Added in v1.18.0

## mapValues

Map the values with their indexes of a RefChunk.

**Signature**

```ts
export declare const mapValues: {
  <A, B>(f: (a: A, index: number) => B): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<ReadonlyArray<B>, E, R>
  <A, E, R, B>(ref: RefChunk<A, E, R>, f: (a: A, index: number) => B): RefSubject.Computed<ReadonlyArray<B>, E, R>
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
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<readonly [ReadonlyArray<B>, Chunk.Chunk<A>], E, R>
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean
  ): RefSubject.Computed<readonly [ReadonlyArray<A>, Chunk.Chunk<A>], E>
}
```

Added in v1.18.0

## reduce

Reduce the values of a RefChunk to a single value.

**Signature**

```ts
export declare const reduce: {
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(ref: RefChunk<A, E, R>, b: B, f: (b: B, a: A, index: number) => B): RefSubject.Computed<B, E, R>
}
```

Added in v1.18.0

## reduceRight

Reduce the values of a RefChunk to a single value in reverse order.

**Signature**

```ts
export declare const reduceRight: {
  <A, B>(b: B, f: (b: B, a: A, index: number) => B): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(ref: RefChunk<A, E, R>, b: B, f: (b: B, a: A, index: number) => B): RefSubject.Computed<B, E, R>
}
```

Added in v1.18.0

## size

Get the current length of a RefChunk.

**Signature**

```ts
export declare const size: <A, E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<number, E, R>
```

Added in v1.18.0

# constructors

## make

Construct a new RefChunk with the given initial value.

**Signature**

```ts
export declare function make<A, E, R>(
  initial: Effect.Effect<Chunk.Chunk<A>, E, R>,
  eq?: Equivalence<A>
): Effect.Effect<RefChunk<A, E>, never, R | Scope.Scope>
export declare function make<A, E, R>(
  initial: Fx.Fx<Chunk.Chunk<A>, E, R>,
  eq?: Equivalence<A>
): Effect.Effect<RefChunk<A, E>, never, R | Scope.Scope>
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
  (index: number): <A, E, R>(ref: RefChunk<A, E, R>) => RefSubject.Filtered<A, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, index: number): RefSubject.Filtered<A, E, R>
}
```

Added in v1.18.0

# models

## RefChunk (interface)

A RefChunk is a RefSubject that is specialized over an Chunk of values.

**Signature**

```ts
export interface RefChunk<in out A, in out E = never, out R = never>
  extends RefSubject.RefSubject<Chunk.Chunk<A>, E, R> {}
```

Added in v1.18.0
