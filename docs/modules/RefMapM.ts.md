---
title: RefMapM.ts
nav_order: 39
parent: Modules
---

## RefMapM overview

RefMapM is an abstraction over @see Ref to provide additional functionality for working with a
mutable Map

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [deleteAt](#deleteat)
  - [elem](#elem)
  - [filter](#filter)
  - [getOrCreate](#getorcreate)
  - [insertAt](#insertat)
  - [keys](#keys)
  - [lookup](#lookup)
  - [modifyAt](#modifyat)
  - [provideAll](#provideall)
  - [provideSome](#providesome)
  - [size](#size)
  - [toReadonlyArray](#toreadonlyarray)
  - [updateAt](#updateat)
  - [upsertAt](#upsertat)
  - [useAll](#useall)
  - [useSome](#usesome)
  - [values](#values)
- [Constructor](#constructor)
  - [create](#create)
  - [lift](#lift)
  - [toReferenceMapM](#toreferencemapm)
- [Instance](#instance)
  - [Provide](#provide)
  - [ProvideAll](#provideall)
  - [ProvideSome](#providesome)
  - [UseAll](#useall)
  - [UseSome](#usesome)
- [Model](#model)
  - [RefMapM (interface)](#refmapm-interface)
  - [ReferenceMapM (interface)](#referencemapm-interface)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## deleteAt

**Signature**

```ts
export declare const deleteAt: <E1, K, V>(
  M: RefMapM<E1, K, V>,
) => (
  k: K,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, Map<K, V>>
```

Added in v0.9.2

## elem

**Signature**

```ts
export declare const elem: <E1, K, V>(
  M: RefMapM<E1, K, V>,
) => (
  v: V,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, boolean>
```

Added in v0.9.2

## filter

**Signature**

```ts
export declare const filter: <E1, K, V>(
  M: RefMapM<E1, K, V>,
) => {
  <V2 extends V>(r: Refinement<V, V2>): E.Env<
    E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
    Map<K, V>
  >
  (r: Predicate<V>): E.Env<
    E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
    Map<K, V>
  >
}
```

Added in v0.9.2

## getOrCreate

**Signature**

```ts
export declare const getOrCreate: <E1, K, V>(
  M: RefMapM<E1, K, V>,
) => <E2>(
  k: K,
  orCreate: E.Env<E2, V>,
) => E.Env<E2 & E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, V>
```

Added in v0.9.2

## insertAt

**Signature**

```ts
export declare const insertAt: <E1, K, V>(
  M: RefMapM<E1, K, V>,
) => (
  k: K,
  v: V,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, Map<K, V>>
```

Added in v0.9.2

## keys

**Signature**

```ts
export declare const keys: <K>(
  O: Ord<K>,
) => <E, V>(
  M: RefMapM<E, K, V>,
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly K[]>
```

Added in v0.9.2

## lookup

**Signature**

```ts
export declare const lookup: <E1, K, V>(
  M: RefMapM<E1, K, V>,
) => (
  k: K,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, O.Option<V>>
```

Added in v0.9.2

## modifyAt

**Signature**

```ts
export declare const modifyAt: <E1, K, V>(
  M: RefMapM<E1, K, V>,
) => (
  k: K,
  v: Endomorphism<V>,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, Map<K, V>>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <E>(
  provided: E,
) => <K, V>(ref: ReferenceMapM<E, K, V>) => ReferenceMapM<unknown, K, V>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <E1>(
  provided: E1,
) => <E2, K, V>(ref: ReferenceMapM<E1 & E2, K, V>) => ReferenceMapM<E2, K, V>
```

Added in v0.9.2

## size

**Signature**

```ts
export declare const size: <E, K, V>(
  M: RefMapM<E, K, V>,
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, number>
```

Added in v0.9.2

## toReadonlyArray

**Signature**

```ts
export declare const toReadonlyArray: <K>(
  O: Ord<K>,
) => <E, V>(
  M: RefMapM<E, K, V>,
) => E.Env<
  E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
  readonly (readonly [K, V])[]
>
```

Added in v0.9.2

## updateAt

**Signature**

```ts
export declare const updateAt: <E1, K, V>(
  M: RefMapM<E1, K, V>,
) => (
  k: K,
  v: V,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, Map<K, V>>
```

Added in v0.9.2

## upsertAt

**Signature**

```ts
export declare const upsertAt: <E1, K, V>(
  M: RefMapM<E1, K, V>,
) => (
  k: K,
  v: V,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, Map<K, V>>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <E>(
  provided: E,
) => <K, V>(ref: ReferenceMapM<E, K, V>) => ReferenceMapM<unknown, K, V>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <E1>(
  provided: E1,
) => <E2, K, V>(ref: ReferenceMapM<E1 & E2, K, V>) => ReferenceMapM<E2, K, V>
```

Added in v0.9.2

## values

**Signature**

```ts
export declare const values: <V>(
  O: Ord<V>,
) => <E, K>(
  M: RefMapM<E, K, V>,
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly V[]>
```

Added in v0.9.2

# Constructor

## create

**Signature**

```ts
export declare const create: <K, V>(
  keyEq: Eq<K>,
  valueEq: Eq<V>,
) => <E>(ref: Ref.Reference<E, Map<K, V>>) => ReferenceMapM<E, K, V>
```

Added in v0.9.2

## lift

Helps to lift a Reference value into a RefMapM

**Signature**

```ts
export declare const lift: <K, V>(
  keyEq: Eq<K>,
  valueEq: Eq<V>,
) => <E>(ref: Ref.Reference<E, Map<K, V>>) => RefMapM<E, K, V>
```

Added in v0.9.2

## toReferenceMapM

**Signature**

```ts
export declare function toReferenceMapM<E, K, V>(M: RefMapM<E, K, V>): ReferenceMapM<E, K, V>
```

Added in v0.9.2

# Instance

## Provide

**Signature**

```ts
export declare const Provide: P.Provide3<'@typed/fp/RefMapM'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll3<'@typed/fp/RefMapM'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome3<'@typed/fp/RefMapM'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll3<'@typed/fp/RefMapM'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome3<'@typed/fp/RefMapM'>
```

Added in v0.9.2

# Model

## RefMapM (interface)

**Signature**

```ts
export interface RefMapM<E, K, V> extends Ref.Reference<E, Map<K, V>> {
  readonly keyEq: Eq<K>
  readonly valueEq: Eq<V>
}
```

Added in v0.9.2

## ReferenceMapM (interface)

**Signature**

```ts
export interface ReferenceMapM<E, K, V> extends RefMapM<E, K, V> {
  readonly getOrCreate: <E2>(k: K, orCreate: E.Env<E2, V>) => E.Env<E & E2 & Ref.Refs, V>
  readonly upsertAt: (k: K, v: V) => E.Env<E & Ref.Refs, Map<K, V>>
  readonly lookup: (k: K) => E.Env<E & Ref.Refs, O.Option<V>>
  readonly elem: (v: V) => E.Env<E & Ref.Refs, boolean>
  readonly filter: {
    <V2 extends V>(r: Refinement<V, V2>): E.Env<E & Ref.Refs, Map<K, V>>
    (r: Predicate<V>): E.Env<E & Ref.Refs, Map<K, V>>
  }
  readonly insertAt: (k: K, v: V) => E.Env<E & Ref.Refs, Map<K, V>>
  readonly updateAt: (k: K, v: V) => E.Env<E & Ref.Refs, Map<K, V>>
  readonly modifyAt: (k: K, v: Endomorphism<V>) => E.Env<E & Ref.Refs, Map<K, V>>
  readonly deleteAt: (k: K) => E.Env<E & Ref.Refs, Map<K, V>>
}
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/RefMapM'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
