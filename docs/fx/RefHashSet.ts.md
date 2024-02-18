---
title: RefHashSet.ts
nav_order: 15
parent: "@typed/fx"
---

## RefHashSet overview

Extensions to RefSubject for working with arrays of values

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [add](#add)
  - [appendAll](#appendall)
  - [map](#map)
- [computed](#computed)
  - [filterValues](#filtervalues)
  - [mapValues](#mapvalues)
  - [partition](#partition)
  - [reduce](#reduce)
  - [size](#size)
- [constructors](#constructors)
  - [tagged](#tagged)
- [models](#models)
  - [RefHashSet (interface)](#refhashset-interface)
- [utils](#utils)
  - [make](#make)

---

# combinators

## add

Add a value to the current state of a RefHashSet.

**Signature**

```ts
export declare const add: {
  <A>(value: A): <E, R>(ref: RefHashSet<A, E, R>) => Effect.Effect<HashSet.HashSet<A>, E, R>
  <A, E, R>(ref: RefHashSet<A, E, R>, value: A): Effect.Effect<HashSet.HashSet<A>, E, R>
}
```

Added in v1.18.0

## appendAll

Append an iterable of values to the current state of a RefHashSet.

**Signature**

```ts
export declare const appendAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefHashSet<A, E, R>) => Effect.Effect<HashSet.HashSet<A>, E, R>
  <A, E, R>(ref: RefHashSet<A, E, R>, value: Iterable<A>): Effect.Effect<HashSet.HashSet<A>, E, R>
}
```

Added in v1.18.0

## map

Map (Endomorphic) the values of a RefHashSet.

**Signature**

```ts
export declare const map: {
  <A>(f: (a: A) => A): <E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<HashSet.HashSet<A>, E, R>
  <A, E, R>(ref: RefHashSet<A, E, R>, f: (a: A) => A): RefSubject.Computed<HashSet.HashSet<A>, E, R>
}
```

Added in v1.18.0

# computed

## filterValues

Filter the values of a RefHashSet using a predicate creating a Computed value.

**Signature**

```ts
export declare const filterValues: {
  <A>(predicate: (a: A) => boolean): <E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<HashSet.HashSet<A>, E, R>
  <A, E, R>(ref: RefHashSet<A, E, R>, predicate: (a: A) => boolean): RefSubject.Computed<HashSet.HashSet<A>, E, R>
}
```

Added in v1.18.0

## mapValues

Map the values with their indexes of a RefHashSet.

**Signature**

```ts
export declare const mapValues: {
  <A, B>(f: (a: A) => B): <E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<readonly B[], E, R>
  <A, E, R, B>(ref: RefHashSet<A, E, R>, f: (a: A) => B): RefSubject.Computed<readonly B[], E, R>
}
```

Added in v1.18.0

## partition

Partition the values of a RefHashSet using a predicate.

**Signature**

```ts
export declare const partition: {
  <A, B extends A>(
    predicate: (a: A) => a is B
  ): <E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<readonly [readonly B[], HashSet.HashSet<A>], E, R>
  <A, E, R>(
    ref: RefHashSet<A, E, R>,
    predicate: (a: A) => boolean
  ): RefSubject.Computed<readonly [readonly A[], HashSet.HashSet<A>], E, never>
}
```

Added in v1.18.0

## reduce

Reduce the values of a RefHashSet to a single value.

**Signature**

```ts
export declare const reduce: {
  <A, B>(b: B, f: (b: B, a: A) => B): <E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(ref: RefHashSet<A, E, R>, b: B, f: (b: B, a: A) => B): RefSubject.Computed<B, E, R>
}
```

Added in v1.18.0

## size

Get the current length of a RefHashSet.

**Signature**

```ts
export declare const size: <A, E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<number, E, R>
```

Added in v1.18.0

# constructors

## tagged

Create a Tagged RefHashSet

**Signature**

```ts
export declare const tagged: <A>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, HashSet.HashSet<A>>
  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, HashSet.HashSet<A>>
}
```

Added in v1.18.0

# models

## RefHashSet (interface)

A RefHashSet is a RefSubject that is specialized over an HashSet of values.

**Signature**

```ts
export interface RefHashSet<in out A, in out E = never, out R = never>
  extends RefSubject.RefSubject<HashSet.HashSet<A>, E, R> {}
```

Added in v1.18.0

# utils

## make

**Signature**

```ts
export declare function make<A, E, R>(
  initial: Effect.Effect<HashSet.HashSet<A>, E, R> | Fx.Fx<HashSet.HashSet<A>, E, R>
): Effect.Effect<RefHashSet<A, E>, never, R | Scope.Scope>
```

Added in v1.18.0
