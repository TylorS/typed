---
title: RefDataEither.ts
nav_order: 47
parent: Modules
---

## RefDataEither overview

RefDataEither is a collection of helpers for working with Refs that manage DataEither.

Added in v0.12.1

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [loadEnv](#loadenv)
  - [loadEnvEither](#loadenveither)
  - [map](#map)
  - [toLoading](#toloading)
  - [toNoData](#tonodata)
  - [toRefresh](#torefresh)
  - [toReplete](#toreplete)
- [Model](#model)
  - [RefDataEither (interface)](#refdataeither-interface)

---

# Combinator

## loadEnv

**Signature**

```ts
export declare function loadEnv<E1, A>(env: E.Env<E1, A>)
```

Added in v0.12.1

## loadEnvEither

**Signature**

```ts
export declare function loadEnvEither<R1, E, A>(env: EE.EnvEither<R1, E, A>)
```

Added in v0.12.1

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (value: A) => B,
) => <R, E>(ref: RefDataEither<R, E, A>) => Ref.Ref<R, Data<Either<E, A>>, Data<Either<E, B>>>
```

Added in v0.12.1

## toLoading

**Signature**

```ts
export declare function toLoading<R, E, A>(rd: RefDataEither<R, E, A>)
```

Added in v0.12.1

## toNoData

**Signature**

```ts
export declare function toNoData<R, E, A>(rd: RefDataEither<R, E, A>)
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

## RefDataEither (interface)

**Signature**

```ts
export interface RefDataEither<R, E, A> extends Ref.Ref<R, DE.DataEither<E, A>> {}
```

Added in v0.12.1
