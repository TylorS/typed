---
title: RefMap.ts
nav_order: 56
parent: Modules
---

## RefMap overview

RefMap is a collection of helpers for working with Refs that manage a ReadonlyMap.

Added in v0.12.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [deleteAt](#deleteat)
  - [filter](#filter)
  - [filterWithIndex](#filterwithindex)
  - [getOrCreate](#getorcreate)
  - [insertAt](#insertat)
  - [modifyAt](#modifyat)
  - [pop](#pop)
  - [updateAt](#updateat)
  - [upsertAt](#upsertat)
- [Model](#model)
  - [RefMap (interface)](#refmap-interface)

---

# Combinator

## deleteAt

**Signature**

```ts
export declare const deleteAt: <K>(
  Eq: Eq<K>,
) => (key: K) => <E, V>(rm: RefMap<E, K, V>) => EO.EnvOption<E, ReadonlyMap<K, V>>
```

Added in v0.12.0

## filter

**Signature**

```ts
export declare function filter<A>(predicate: Predicate<A>)
```

Added in v0.12.0

## filterWithIndex

**Signature**

```ts
export declare function filterWithIndex<K, V>(predicate: (k: K, v: V) => boolean)
```

Added in v0.12.0

## getOrCreate

**Signature**

```ts
export declare const getOrCreate: <K>(
  Eq: Eq<K>,
) => <E1, V>(key: K, create: E.Env<E1, V>) => <E2>(rm: RefMap<E2, K, V>) => E.Env<E2 & E1, V>
```

Added in v0.12.1

## insertAt

**Signature**

```ts
export declare const insertAt: <K>(
  Eq: Eq<K>,
) => <V>(key: K, value: V) => <E>(rm: RefMap<E, K, V>) => EO.EnvOption<E, ReadonlyMap<K, V>>
```

Added in v0.12.0

## modifyAt

**Signature**

```ts
export declare const modifyAt: <K>(
  Eq: Eq<K>,
) => <V>(
  key: K,
  f: Endomorphism<V>,
) => <E>(rm: RefMap<E, K, V>) => EO.EnvOption<E, ReadonlyMap<K, V>>
```

Added in v0.12.0

## pop

**Signature**

```ts
export declare const pop: <K>(
  Eq: Eq<K>,
) => (k: K) => <E, A>(rm: RefMap<E, K, A>) => E.Env<E, O.Option<A>>
```

Added in v0.12.0

## updateAt

**Signature**

```ts
export declare const updateAt: <K>(
  Eq: Eq<K>,
) => <V>(key: K, value: V) => <E>(rm: RefMap<E, K, V>) => EO.EnvOption<E, ReadonlyMap<K, V>>
```

Added in v0.12.0

## upsertAt

**Signature**

```ts
export declare const upsertAt: <K>(
  Eq: Eq<K>,
) => <V>(key: K, value: V) => <E>(rm: RefMap<E, K, V>) => E.Env<E, ReadonlyMap<K, V>>
```

Added in v0.12.0

# Model

## RefMap (interface)

**Signature**

```ts
export interface RefMap<E, K, V> extends Ref.Ref<E, ReadonlyMap<K, V>> {}
```

Added in v0.12.0
