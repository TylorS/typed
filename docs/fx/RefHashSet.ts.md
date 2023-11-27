---
title: RefHashSet.ts
nav_order: 19
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
  - [make](#make)
  - [tagged](#tagged)
- [models](#models)
  - [RefHashSet (interface)](#refhashset-interface)

---

# combinators

## add

Add a value to the current state of a RefHashSet.

**Signature**

```ts
export declare const add: {
  <A>(value: A): <R, E>(ref: RefHashSet<R, E, A>) => Effect.Effect<R, E, HashSet.HashSet<A>>
  <R, E, A>(ref: RefHashSet<R, E, A>, value: A): Effect.Effect<R, E, HashSet.HashSet<A>>
}
```

Added in v1.18.0

## appendAll

Append an iterable of values to the current state of a RefHashSet.

**Signature**

```ts
export declare const appendAll: {
  <A>(value: Iterable<A>): <R, E>(ref: RefHashSet<R, E, A>) => Effect.Effect<R, E, HashSet.HashSet<A>>
  <R, E, A>(ref: RefHashSet<R, E, A>, value: Iterable<A>): Effect.Effect<R, E, HashSet.HashSet<A>>
}
```

Added in v1.18.0

## map

Map (Endomorphic) the values of a RefHashSet.

**Signature**

```ts
export declare const map: {
  <A>(f: (a: A) => A): <R, E>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, HashSet.HashSet<A>>
  <R, E, A>(ref: RefHashSet<R, E, A>, f: (a: A) => A): Computed.Computed<R, E, HashSet.HashSet<A>>
}
```

Added in v1.18.0

# computed

## filterValues

Filter the values of a RefHashSet using a predicate creating a Computed value.

**Signature**

```ts
export declare const filterValues: {
  <A>(predicate: (a: A) => boolean): <R, E>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, HashSet.HashSet<A>>
  <R, E, A>(ref: RefHashSet<R, E, A>, predicate: (a: A) => boolean): Computed.Computed<R, E, HashSet.HashSet<A>>
}
```

Added in v1.18.0

## mapValues

Map the values with their indexes of a RefHashSet.

**Signature**

```ts
export declare const mapValues: {
  <A, B>(f: (a: A) => B): <R, E>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, readonly B[]>
  <R, E, A, B>(ref: RefHashSet<R, E, A>, f: (a: A) => B): Computed.Computed<R, E, readonly B[]>
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
  ): <R, E>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, readonly [readonly B[], HashSet.HashSet<A>]>
  <R, E, A>(
    ref: RefHashSet<R, E, A>,
    predicate: (a: A) => boolean
  ): Computed.Computed<never, E, readonly [HashSet.HashSet<A>, HashSet.HashSet<A>]>
}
```

Added in v1.18.0

## reduce

Reduce the values of a RefHashSet to a single value.

**Signature**

```ts
export declare const reduce: {
  <A, B>(b: B, f: (b: B, a: A) => B): <R, E>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, B>
  <R, E, A, B>(ref: RefHashSet<R, E, A>, b: B, f: (b: B, a: A) => B): Computed.Computed<R, E, B>
}
```

Added in v1.18.0

## size

Get the current length of a RefHashSet.

**Signature**

```ts
export declare const size: <R, E, A>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, number>
```

Added in v1.18.0

# constructors

## make

Construct a new RefHashSet with the given initial value.

**Signature**

```ts
export declare function make<R, E, A>(
  initial: Effect.Effect<R, E, HashSet.HashSet<A>>
): Effect.Effect<R | Scope.Scope, never, RefHashSet<never, E, A>>
export declare function make<R, E, A>(
  initial: Fx.Fx<R, E, HashSet.HashSet<A>>
): Effect.Effect<R | Scope.Scope, never, RefHashSet<never, E, A>>
```

Added in v1.18.0

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
export interface RefHashSet<R, E, A> extends RefSubject.RefSubject<R, E, HashSet.HashSet<A>> {}
```

Added in v1.18.0
