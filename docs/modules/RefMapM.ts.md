---
title: RefMapM.ts
nav_order: 56
parent: Modules
---

## RefMapM overview

RefMapM is a collection of helpers for working with Refs that manage a mutable Map. It utilizes
standard JS reference-based keys.

Added in v0.13.4

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [deleteAt](#deleteat)
  - [filter](#filter)
  - [filterWithIndex](#filterwithindex)
  - [getOrCreate](#getorcreate)
  - [insertAt](#insertat)
  - [modifyAt](#modifyat)
  - [updateAt](#updateat)
  - [upsertAt](#upsertat)
- [Model](#model)
  - [RefMapM (interface)](#refmapm-interface)

---

# Combinator

## deleteAt

**Signature**

```ts
export declare const deleteAt: <K>(key: K) => <E, V>(rm: RefMapM<E, K, V>) => E.Env<E, Map<K, V>>
```

Added in v0.13.4

## filter

**Signature**

```ts
export declare function filter<A>(predicate: Predicate<A>)
```

Added in v0.13.4

## filterWithIndex

**Signature**

```ts
export declare function filterWithIndex<K, V>(predicate: (k: K, v: V) => boolean)
```

Added in v0.13.4

## getOrCreate

**Signature**

```ts
export declare const getOrCreate: <K, E1, V>(
  key: K,
  create: E.Env<E1, V>,
) => <E2>(rm: RefMapM<E2, K, V>) => E.Env<E2 & E1, V | NonNullable<V>>
```

Added in v0.13.4

## insertAt

**Signature**

```ts
export declare const insertAt: <K, V>(
  key: K,
  value: V,
) => <E>(rm: RefMapM<E, K, V>) => EO.EnvOption<E, Map<K, V>>
```

Added in v0.13.4

## modifyAt

**Signature**

```ts
export declare const modifyAt: <K, V>(
  key: K,
  f: Endomorphism<V>,
) => <E>(rm: RefMapM<E, K, V>) => EO.EnvOption<E, Map<K, V>>
```

Added in v0.13.4

## updateAt

**Signature**

```ts
export declare const updateAt: <K, V>(
  key: K,
  value: V,
) => <E>(rm: RefMapM<E, K, V>) => EO.EnvOption<E, Map<K, V>>
```

Added in v0.13.4

## upsertAt

**Signature**

```ts
export declare const upsertAt: <K, V>(
  key: K,
  value: V,
) => <E>(rm: RefMapM<E, K, V>) => E.Env<E, Map<K, V>>
```

Added in v0.13.4

# Model

## RefMapM (interface)

**Signature**

```ts
export interface RefMapM<E, K, V> extends Ref.Ref<E, Map<K, V>> {}
```

Added in v0.13.4
