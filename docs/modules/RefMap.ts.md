---
title: RefMap.ts
nav_order: 43
parent: Modules
---

## RefMap overview

RefMap is an abstraction over [Ref](./Ref.ts.md) to provide additional functionality for working
with ReadonlyMap

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
  - [toReferenceMap](#toreferencemap)
- [Instance](#instance)
  - [Provide](#provide)
  - [ProvideAll](#provideall)
  - [ProvideSome](#providesome)
  - [UseAll](#useall)
  - [UseSome](#usesome)
- [Model](#model)
  - [RefMap (interface)](#refmap-interface)
  - [ReferenceMap (interface)](#referencemap-interface)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## deleteAt

**Signature**

```ts
export declare const deleteAt: <E1, K, V>(
  M: RefMap<E1, K, V>,
) => (
  k: K,
) => E.Env<
  E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
  ReadonlyMap<K, V>
>
```

Added in v0.9.2

## elem

**Signature**

```ts
export declare const elem: <E1, K, V>(
  M: RefMap<E1, K, V>,
) => (
  v: V,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, boolean>
```

Added in v0.9.2

## filter

**Signature**

```ts
export declare const filter: <E1, K, V>(
  M: RefMap<E1, K, V>,
) => {
  <V2 extends V>(r: Refinement<V, V2>): E.Env<
    E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
    ReadonlyMap<K, V>
  >
  (r: Predicate<V>): E.Env<
    E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
    ReadonlyMap<K, V>
  >
}
```

Added in v0.9.2

## getOrCreate

**Signature**

```ts
export declare const getOrCreate: <E1, K, V>(
  M: RefMap<E1, K, V>,
) => <E2>(
  k: K,
  orCreate: E.Env<E2, V>,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs & E2, V>
```

Added in v0.9.2

## insertAt

**Signature**

```ts
export declare const insertAt: <E1, K, V>(
  M: RefMap<E1, K, V>,
) => (
  k: K,
  v: V,
) => E.Env<
  E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
  ReadonlyMap<K, V>
>
```

Added in v0.9.2

## keys

**Signature**

```ts
export declare const keys: <K>(
  O: Ord<K>,
) => <E, V>(
  M: RefMap<E, K, V>,
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, readonly K[]>
```

Added in v0.9.2

## lookup

**Signature**

```ts
export declare const lookup: <E1, K, V>(
  M: RefMap<E1, K, V>,
) => (
  k: K,
) => E.Env<E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, O.Option<V>>
```

Added in v0.9.2

## modifyAt

**Signature**

```ts
export declare const modifyAt: <E1, K, V>(
  M: RefMap<E1, K, V>,
) => (
  k: K,
  v: Endomorphism<V>,
) => E.Env<
  E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
  ReadonlyMap<K, V>
>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <E>(
  provided: E,
) => <K, V>(ref: ReferenceMap<E, K, V>) => ReferenceMap<unknown, K, V>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <E1>(
  provided: E1,
) => <E2, K, V>(ref: ReferenceMap<E1 & E2, K, V>) => ReferenceMap<E2, K, V>
```

Added in v0.9.2

## size

**Signature**

```ts
export declare const size: <E, K, V>(
  M: RefMap<E, K, V>,
) => E.Env<E & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs, number>
```

Added in v0.9.2

## toReadonlyArray

**Signature**

```ts
export declare const toReadonlyArray: <K>(
  O: Ord<K>,
) => <E, V>(
  M: RefMap<E, K, V>,
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
  M: RefMap<E1, K, V>,
) => (
  k: K,
  v: V,
) => E.Env<
  E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
  ReadonlyMap<K, V>
>
```

Added in v0.9.2

## upsertAt

**Signature**

```ts
export declare const upsertAt: <E1, K, V>(
  M: RefMap<E1, K, V>,
) => (
  k: K,
  v: V,
) => E.Env<
  E1 & Ref.Get & Ref.Has & Ref.Set & Ref.Remove & Ref.Events & Ref.ParentRefs,
  ReadonlyMap<K, V>
>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <E>(
  provided: E,
) => <K, V>(ref: ReferenceMap<E, K, V>) => ReferenceMap<unknown, K, V>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <E1>(
  provided: E1,
) => <E2, K, V>(ref: ReferenceMap<E1 & E2, K, V>) => ReferenceMap<E2, K, V>
```

Added in v0.9.2

## values

**Signature**

```ts
export declare const values: <V>(
  O: Ord<V>,
) => <E, K>(
  M: RefMap<E, K, V>,
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
) => <E>(ref: Ref.Reference<E, ReadonlyMap<K, V>>) => ReferenceMap<E, K, V>
```

Added in v0.9.2

## lift

Helps to lift a Reference value into a RefMap

**Signature**

```ts
export declare const lift: <K, V>(
  keyEq: Eq<K>,
  valueEq: Eq<V>,
) => <E>(ref: Ref.Reference<E, ReadonlyMap<K, V>>) => RefMap<E, K, V>
```

Added in v0.9.2

## toReferenceMap

**Signature**

```ts
export declare function toReferenceMap<E, K, V>(M: RefMap<E, K, V>): ReferenceMap<E, K, V>
```

Added in v0.9.2

# Instance

## Provide

**Signature**

```ts
export declare const Provide: P.Provide3<'@typed/fp/ReferenceMap'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll3<'@typed/fp/ReferenceMap'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome3<'@typed/fp/ReferenceMap'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll3<'@typed/fp/ReferenceMap'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome3<'@typed/fp/ReferenceMap'>
```

Added in v0.9.2

# Model

## RefMap (interface)

**Signature**

```ts
export interface RefMap<E, K, V> extends Ref.Reference<E, ReadonlyMap<K, V>> {
  readonly keyEq: Eq<K>
  readonly valueEq: Eq<V>
}
```

Added in v0.9.2

## ReferenceMap (interface)

**Signature**

```ts
export interface ReferenceMap<E, K, V> extends RefMap<E, K, V> {
  readonly getOrCreate: <E2>(k: K, orCreate: E.Env<E2, V>) => E.Env<E & E2 & Ref.Refs, V>
  readonly upsertAt: (k: K, v: V) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  readonly lookup: (k: K) => E.Env<E & Ref.Refs, O.Option<V>>
  readonly elem: (v: V) => E.Env<E & Ref.Refs, boolean>
  readonly filter: {
    <V2 extends V>(r: Refinement<V, V2>): E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
    (r: Predicate<V>): E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  }
  readonly insertAt: (k: K, v: V) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  readonly updateAt: (k: K, v: V) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  readonly modifyAt: (k: K, v: Endomorphism<V>) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  readonly deleteAt: (k: K) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
}
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/ReferenceMap'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
