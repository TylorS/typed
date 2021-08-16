---
title: EnvThese.ts
nav_order: 17
parent: Modules
---

## EnvThese overview

EnvThese is a TheseT of Env.

Added in v0.9.7

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [bimap](#bimap)
  - [getChain](#getchain)
  - [map](#map)
  - [mapLeft](#mapleft)
  - [match](#match)
  - [matchE](#matche)
  - [matchEW](#matchew)
  - [matchW](#matchw)
  - [swap](#swap)
  - [toTuple2](#totuple2)
- [Constructor](#constructor)
  - [both](#both)
  - [getAp](#getap)
  - [left](#left)
  - [leftF](#leftf)
  - [right](#right)
  - [rightF](#rightf)
- [Model](#model)
  - [EnvThese (interface)](#envthese-interface)

---

# Combinator

## bimap

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => <R>(fea: E.Env<R, TH.These<E, A>>) => E.Env<R, TH.These<G, B>>
```

Added in v0.9.7

## getChain

**Signature**

```ts
export declare const getChain: <E>(
  S: Semigroup<E>,
) => <A, R, B>(
  f: (a: A) => E.Env<R, TH.These<E, B>>,
) => (ma: E.Env<R, TH.These<E, A>>) => E.Env<R, TH.These<E, B>>
```

Added in v0.9.7

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <R, E>(fa: E.Env<R, TH.These<E, A>>) => E.Env<R, TH.These<E, B>>
```

Added in v0.9.7

## mapLeft

**Signature**

```ts
export declare const mapLeft: <E, G>(
  f: (e: E) => G,
) => <R, A>(fea: E.Env<R, TH.These<E, A>>) => E.Env<R, TH.These<G, A>>
```

Added in v0.9.7

## match

**Signature**

```ts
export declare const match: <E, B, A>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
  onBoth: (e: E, a: A) => B,
) => <R>(ma: E.Env<R, TH.These<E, A>>) => E.Env<R, B>
```

Added in v0.9.7

## matchE

**Signature**

```ts
export declare const matchE: <E, R, B, A>(
  onLeft: (e: E) => E.Env<R, B>,
  onRight: (a: A) => E.Env<R, B>,
  onBoth: (e: E, a: A) => E.Env<R, B>,
) => (ma: E.Env<R, TH.These<E, A>>) => E.Env<R, B>
```

Added in v0.9.7

## matchEW

**Signature**

```ts
export declare const matchEW: <E, R, B, A, C, D>(
  onLeft: (e: E) => E.Env<R, B>,
  onRight: (a: A) => E.Env<R, C>,
  onBoth: (e: E, a: A) => E.Env<R, D>,
) => (ma: E.Env<R, TH.These<E, A>>) => E.Env<R, B | C | D>
```

Added in v0.9.7

## matchW

**Signature**

```ts
export declare const matchW: <E, B, A, C, D>(
  onLeft: (e: E) => B,
  onRight: (a: A) => C,
  onBoth: (e: E, a: A) => D,
) => <R>(ma: E.Env<R, TH.These<E, A>>) => E.Env<R, B | C | D>
```

Added in v0.9.7

## swap

**Signature**

```ts
export declare const swap: <R, E, A>(ma: E.Env<R, TH.These<E, A>>) => E.Env<R, TH.These<A, E>>
```

Added in v0.9.7

## toTuple2

**Signature**

```ts
export declare const toTuple2: <E, A>(
  e: Lazy<E>,
  a: Lazy<A>,
) => <R>(fa: E.Env<R, TH.These<E, A>>) => E.Env<R, readonly [E, A]>
```

Added in v0.9.7

# Constructor

## both

**Signature**

```ts
export declare const both: <E, A, R>(e: E, a: A) => E.Env<R, TH.These<E, A>>
```

Added in v0.9.7

## getAp

**Signature**

```ts
export declare const getAp: <E>(
  S: Semigroup<E>,
) => <R, A>(
  fa: E.Env<R, TH.These<E, A>>,
) => <B>(fab: E.Env<R, TH.These<E, (a: A) => B>>) => E.Env<R, TH.These<E, B>>
```

Added in v0.9.7

## left

**Signature**

```ts
export declare const left: <E, R, A>(e: E) => E.Env<R, TH.These<E, A>>
```

Added in v0.9.7

## leftF

**Signature**

```ts
export declare const leftF: <R, E, A>(fe: E.Env<R, E>) => E.Env<R, TH.These<E, A>>
```

Added in v0.9.7

## right

**Signature**

```ts
export declare const right: <A, R, E>(a: A) => E.Env<R, TH.These<E, A>>
```

Added in v0.9.7

## rightF

**Signature**

```ts
export declare const rightF: <R, A, E>(fa: E.Env<R, A>) => E.Env<R, TH.These<E, A>>
```

Added in v0.9.7

# Model

## EnvThese (interface)

**Signature**

```ts
export interface EnvThese<R, E, A> extends E.Env<R, TH.These<E, A>> {}
```

Added in v0.9.7
