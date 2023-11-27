---
title: RefHashMap.ts
nav_order: 18
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
  <K, V>(f: (v: V, k: K) => V): <R, E>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<R, E, HashMap.HashMap<K, V>>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, f: (v: V, k: K) => V): Effect.Effect<R, E, HashMap.HashMap<K, V>>
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
  ): <R, E>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<R, E, HashMap.HashMap<K, V>>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K, f: (v: V) => V): Effect.Effect<R, E, HashMap.HashMap<K, V>>
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
  ): <R, E>(self: RefHashMap<R, E, K, V>) => Effect.Effect<R, E, HashMap.HashMap<K, V>>
  <R, E, K, V>(
    self: RefHashMap<R, E, K, V>,
    key: K,
    f: HashMap.HashMap.UpdateFn<V>
  ): Effect.Effect<R, E, HashMap.HashMap<K, V>>
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
  ): <R, E>(self: RefHashMap<R, E, K, V>) => Effect.Effect<R, E, HashMap.HashMap<K, V>>
  <R, E, K, V>(
    self: RefHashMap<R, E, K, V>,
    key: K,
    hash: number,
    f: HashMap.HashMap.UpdateFn<V>
  ): Effect.Effect<R, E, HashMap.HashMap<K, V>>
}
```

Added in v1.18.0

## remove

Remove a value at key from the HashMap

**Signature**

```ts
export declare const remove: {
  <K>(key: K): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<R, E, HashMap.HashMap<K, V>>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K): Effect.Effect<R, E, HashMap.HashMap<K, V>>
}
```

Added in v1.18.0

## removeMany

Remove a value at key from the HashMap

**Signature**

```ts
export declare const removeMany: {
  <K>(key: Iterable<K>): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<R, E, HashMap.HashMap<K, V>>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: Iterable<K>): Effect.Effect<R, E, HashMap.HashMap<K, V>>
}
```

Added in v1.18.0

## set

Set a value at a particular key in the HashMap

**Signature**

```ts
export declare const set: {
  <K, V>(key: K, value: V): <R, E>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<R, E, HashMap.HashMap<K, V>>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K, value: V): Effect.Effect<R, E, HashMap.HashMap<K, V>>
}
```

Added in v1.18.0

# computed

## compact

Create a projection of available values

**Signature**

```ts
export declare function compact<R, E, K, V>(
  refHashMap: RefHashMap<R, E, K, Option<V>>
): Computed<R, E, HashMap.HashMap<K, V>>
```

Added in v1.18.0

## has

Check if a key is available withing a HashMap

**Signature**

```ts
export declare const has: {
  <K>(key: K): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => Computed<R, E, boolean>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K): Computed<R, E, boolean>
}
```

Added in v1.18.0

## hasHash

Check if a key is available withing a HashMap

**Signature**

```ts
export declare const hasHash: {
  <K>(key: K, hash: number): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => Computed<R, E, boolean>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K, hash: number): Computed<R, E, boolean>
}
```

Added in v1.18.0

## isEmpty

Check if HashMap is empty

**Signature**

```ts
export declare function isEmpty<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): Computed<R, E, boolean>
```

Added in v1.18.0

## keySet

Get the keys as a HashSet

**Signature**

```ts
export declare function keySet<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): Computed<R, E, HashSet.HashSet<K>>
```

Added in v1.18.0

## keys

Get the keys as an Iterable

**Signature**

```ts
export declare function keys<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): Computed<R, E, Iterable<K>>
```

Added in v1.18.0

## reduce

Get the keys as an Iterable

**Signature**

```ts
export declare const reduce: {
  <K, V, B>(seed: B, f: (acc: B, a: V, k: K) => B): <R, E>(refHashMap: RefHashMap<R, E, K, V>) => Computed<R, E, B>
  <R, E, K, V, B>(refHashMap: RefHashMap<R, E, K, V>, seed: B, f: (acc: B, a: V, k: K) => B): Computed<R, E, B>
}
```

Added in v1.18.0

## size

Check the size of the HashMap

**Signature**

```ts
export declare function size<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): Computed<R, E, number>
```

Added in v1.18.0

## values

Get the values as an Iterable

**Signature**

```ts
export declare function values<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): Computed<R, E, Iterable<V>>
```

Added in v1.18.0

## valuesSet

Get the values as an HashSet

**Signature**

```ts
export declare function valuesSet<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): Computed<R, E, HashSet.HashSet<V>>
```

Added in v1.18.0

# constructors

## make

Construct a new RefHashMap with the given initial value.

**Signature**

```ts
export declare function make<R, E, K, V>(
  initial: Effect.Effect<R, E, HashMap.HashMap<K, V>>
): Effect.Effect<R | Scope.Scope, never, RefHashMap<never, E, K, V>>
export declare function make<R, E, K, V>(
  initial: Fx.Fx<R, E, HashMap.HashMap<K, V>>
): Effect.Effect<R | Scope.Scope, never, RefHashMap<never, E, K, V>>
```

Added in v1.18.0

## of

This function creates a new RefHashMap from a given HashMap.

**Signature**

```ts
export declare function of<K, V>(
  map: HashMap.HashMap<K, V>
): Effect.Effect<Scope.Scope, never, RefHashMap<never, never, K, V>>
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
  <K>(key: K): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => Filtered<R, E, V>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K): Filtered<R, E, V>
}
```

Added in v1.18.0

## getHash

**Signature**

```ts
export declare const getHash: {
  <K>(key: K, hash: number): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => Filtered<R, E, V>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K, hash: number): Filtered<R, E, V>
}
```

Added in v1.18.0

# models

## RefHashMap (interface)

A RefHashMap is a RefSubject that is specialized over a HashMap of values.

**Signature**

```ts
export interface RefHashMap<R, E, K, V> extends RefSubject.RefSubject<R, E, HashMap.HashMap<K, V>> {}
```

Added in v1.18.0
