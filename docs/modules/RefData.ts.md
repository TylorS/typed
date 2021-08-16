---
title: RefData.ts
nav_order: 52
parent: Modules
---

## RefData overview

RefData is a collection of helpers for working with Refs that manage Data.

Added in v0.12.1

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [loadEnv](#loadenv)
  - [map](#map)
  - [toLoading](#toloading)
  - [toNoData](#tonodata)
  - [toRefresh](#torefresh)
  - [toReplete](#toreplete)
- [Model](#model)
  - [RefData (interface)](#refdata-interface)

---

# Combinator

## loadEnv

**Signature**

```ts
export declare function loadEnv<E1, A>(env: E.Env<E1, A>)
```

Added in v0.12.1

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (value: A) => B,
) => <E>(ref: RefData<E, A>) => Ref.Ref<E, D.Data<A>, D.Data<B>>
```

Added in v0.12.1

## toLoading

**Signature**

```ts
export declare function toLoading<E, A>(rd: RefData<E, A>)
```

Added in v0.12.1

## toNoData

**Signature**

```ts
export declare function toNoData<E, A>(rd: RefData<E, A>)
```

Added in v0.12.1

## toRefresh

**Signature**

```ts
export declare function toRefresh<A>(value: A, progress?: O.Option<Progress>)
```

Added in v0.12.1

## toReplete

**Signature**

```ts
export declare function toReplete<A>(value: A)
```

Added in v0.12.1

# Model

## RefData (interface)

**Signature**

```ts
export interface RefData<E, A> extends Ref.Ref<E, D.Data<A>> {}
```

Added in v0.12.1
