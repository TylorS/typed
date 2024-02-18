---
title: RefHashMap.ts
nav_order: 14
parent: "@typed/fx"
---

## RefHashMap overview

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [combinators](#combinators)
  - [map](#map)
  - [modify](#modify)
  - [modifyAt](#modifyat)
  - [modifyHash](#modifyhash)
  - [remove](#remove)
  - [removeMany](#removemany)
  - [set](#set)
- [computed](#computed)
  - [compact](#compact)
  - [has](#has)
  - [hasHash](#hashash)
  - [isEmpty](#isempty)
  - [keySet](#keyset)
  - [keys](#keys)
  - [reduce](#reduce)
  - [size](#size)
  - [values](#values)
  - [valuesSet](#valuesset)
- [constructors](#constructors)
  - [make](#make)
  - [of](#of)
  - [tagged](#tagged)
- [filtered](#filtered)
  - [get](#get)
  - [getHash](#gethash)
- [models](#models)
  - [RefHashMap (interface)](#refhashmap-interface)

---

# combinators

## map

Map the values within the HashMap

**Signature**

```ts
export declare const map: {
  <K, V>(f: (v: V, k: K) => V): <E, R>(refHashMap: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>, f: (v: V, k: K) => V): Effect.Effect<HashMap.HashMap<K, V>, E, R>
}
```

Added in v1.18.0

## modify

Map the values within the HashMap

**Signature**

```ts
export declare const modify: {
  <K, V>(
    key: K,
    f: (v: V) => V
  ): <E, R>(refHashMap: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>, key: K, f: (v: V) => V): Effect.Effect<HashMap.HashMap<K, V>, E, R>
}
```

Added in v1.18.0

## modifyAt

Map the values within the HashMap

**Signature**

```ts
export declare const modifyAt: {
  <K, V>(
    key: K,
    f: HashMap.HashMap.UpdateFn<V>
  ): <E, R>(self: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <K, V, E, R>(
    self: RefHashMap<K, V, E, R>,
    key: K,
    f: HashMap.HashMap.UpdateFn<V>
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>
}
```

Added in v1.18.0

## modifyHash

Map the values within the HashMap

**Signature**

```ts
export declare const modifyHash: {
  <K, V>(
    key: K,
    hash: number,
    f: HashMap.HashMap.UpdateFn<V>
  ): <E, R>(self: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <K, V, E, R>(
    self: RefHashMap<K, V, E, R>,
    key: K,
    hash: number,
    f: HashMap.HashMap.UpdateFn<V>
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>
}
```

Added in v1.18.0

## remove

Remove a value at key from the HashMap

**Signature**

```ts
export declare const remove: {
  <K>(key: K): <R, E, V>(refHashMap: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>, key: K): Effect.Effect<HashMap.HashMap<K, V>, E, R>
}
```

Added in v1.18.0

## removeMany

Remove a value at key from the HashMap

**Signature**

```ts
export declare const removeMany: {
  <K>(key: Iterable<K>): <R, E, V>(refHashMap: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>, key: Iterable<K>): Effect.Effect<HashMap.HashMap<K, V>, E, R>
}
```

Added in v1.18.0

## set

Set a value at a particular key in the HashMap

**Signature**

```ts
export declare const set: {
  <K, V>(key: K, value: V): <E, R>(refHashMap: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>, key: K, value: V): Effect.Effect<HashMap.HashMap<K, V>, E, R>
}
```

Added in v1.18.0

# computed

## compact

Create a projection of available values

**Signature**

```ts
export declare function compact<K, V, E, R>(
  refHashMap: RefHashMap<K, Option<V>, E, R>
): RefSubject.Computed<HashMap.HashMap<K, V>, E, R>
```

Added in v1.18.0

## has

Check if a key is available withing a HashMap

**Signature**

```ts
export declare const has: {
  <K>(key: K): <R, E, V>(refHashMap: RefHashMap<K, V, E, R>) => RefSubject.Computed<boolean, E, R>
  <K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>, key: K): RefSubject.Computed<boolean, E, R>
}
```

Added in v1.18.0

## hasHash

Check if a key is available withing a HashMap

**Signature**

```ts
export declare const hasHash: {
  <K>(key: K, hash: number): <R, E, V>(refHashMap: RefHashMap<K, V, E, R>) => RefSubject.Computed<boolean, E, R>
  <K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>, key: K, hash: number): RefSubject.Computed<boolean, E, R>
}
```

Added in v1.18.0

## isEmpty

Check if HashMap is empty

**Signature**

```ts
export declare function isEmpty<K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>): RefSubject.Computed<boolean, E, R>
```

Added in v1.18.0

## keySet

Get the keys as a HashSet

**Signature**

```ts
export declare function keySet<K, V, E, R>(
  refHashMap: RefHashMap<K, V, E, R>
): RefSubject.Computed<HashSet.HashSet<K>, E, R>
```

Added in v1.18.0

## keys

Get the keys as an Iterable

**Signature**

```ts
export declare function keys<K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>): RefSubject.Computed<Iterable<K>, E, R>
```

Added in v1.18.0

## reduce

Get the keys as an Iterable

**Signature**

```ts
export declare const reduce: {
  <K, V, B>(
    seed: B,
    f: (acc: B, a: V, k: K) => B
  ): <E, R>(refHashMap: RefHashMap<K, V, E, R>) => RefSubject.Computed<B, E, R>
  <K, V, E, R, B>(
    refHashMap: RefHashMap<K, V, E, R>,
    seed: B,
    f: (acc: B, a: V, k: K) => B
  ): RefSubject.Computed<B, E, R>
}
```

Added in v1.18.0

## size

Check the size of the HashMap

**Signature**

```ts
export declare function size<K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>): RefSubject.Computed<number, E, R>
```

Added in v1.18.0

## values

Get the values as an Iterable

**Signature**

```ts
export declare function values<K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>): RefSubject.Computed<Iterable<V>, E, R>
```

Added in v1.18.0

## valuesSet

Get the values as an HashSet

**Signature**

```ts
export declare function valuesSet<K, V, E, R>(
  refHashMap: RefHashMap<K, V, E, R>
): RefSubject.Computed<HashSet.HashSet<V>, E, R>
```

Added in v1.18.0

# constructors

## make

Construct a new RefHashMap with the given initial value.

**Signature**

```ts
export declare function make<K, V, E, R>(
  initial: Effect.Effect<HashMap.HashMap<K, V>, E, R>
): Effect.Effect<RefHashMap<K, V, E>, never, R | Scope.Scope>
export declare function make<K, V, E, R>(
  initial: Fx.Fx<HashMap.HashMap<K, V>, E, R>
): Effect.Effect<RefHashMap<K, V, E>, never, R | Scope.Scope>
```

Added in v1.18.0

## of

This function creates a new RefHashMap from a given HashMap.

**Signature**

```ts
export declare function of<K, V>(map: HashMap.HashMap<K, V>): Effect.Effect<RefHashMap<K, V>, never, Scope.Scope>
```

Added in v1.18.0

## tagged

Create a Tagged RefHashMap

**Signature**

```ts
export declare const tagged: <K, V>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, HashMap.HashMap<K, V>>
  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, HashMap.HashMap<K, V>>
}
```

Added in v1.18.0

# filtered

## get

**Signature**

```ts
export declare const get: {
  <K>(key: K): <R, E, V>(refHashMap: RefHashMap<K, V, E, R>) => RefSubject.Filtered<R, E, V>
  <K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>, key: K): RefSubject.Filtered<R, E, V>
}
```

Added in v1.18.0

## getHash

**Signature**

```ts
export declare const getHash: {
  <K>(key: K, hash: number): <R, E, V>(refHashMap: RefHashMap<K, V, E, R>) => RefSubject.Filtered<R, E, V>
  <K, V, E, R>(refHashMap: RefHashMap<K, V, E, R>, key: K, hash: number): RefSubject.Filtered<R, E, V>
}
```

Added in v1.18.0

# models

## RefHashMap (interface)

A RefHashMap is a RefSubject that is specialized over a HashMap of values.

**Signature**

```ts
export interface RefHashMap<in out K, in out V, in out E = never, out R = never>
  extends RefSubject.RefSubject<HashMap.HashMap<K, V>, E, R> {}
```

Added in v1.18.0
