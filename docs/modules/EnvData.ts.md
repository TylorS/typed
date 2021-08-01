---
title: EnvData.ts
nav_order: 13
parent: Modules
---

## EnvData overview

EnvData is DataT of Env.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [ap](#ap)
  - [apFirst](#apfirst)
  - [apS](#aps)
  - [apSecond](#apsecond)
  - [apT](#apt)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [chain](#chain)
  - [chainFirst](#chainfirst)
  - [flap](#flap)
  - [getOrElse](#getorelse)
  - [map](#map)
  - [of](#of)
  - [tupled](#tupled)
- [Constructor](#constructor)
  - [loading](#loading)
  - [noData](#nodata)
  - [refresh](#refresh)
  - [replete](#replete)
  - [repleteF](#repletef)
- [Deconstructor](#deconstructor)
  - [match](#match)
  - [match3W](#match3w)
  - [matchE](#matche)
  - [matchEW](#matchew)
  - [matchW](#matchw)
- [Instance](#instance)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [Functor](#functor)
  - [Monad](#monad)
  - [Pointed](#pointed)
- [Model](#model)
  - [EnvData (interface)](#envdata-interface)
- [Typeclass Constructor](#typeclass-constructor)
  - [getApplicativeMonoid](#getapplicativemonoid)
  - [getApplySemigroup](#getapplysemigroup)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <E1, A>(
  second: Lazy<E.Env<E1, D.Data<A>>>,
) => <E2>(first: E.Env<E2, D.Data<A>>) => E.Env<E1 & E2, D.Data<A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <E1, A>(
  fa: E.Env<E1, D.Data<A>>,
) => <E2, B>(fab: E.Env<E2, D.Data<(a: A) => B>>) => E.Env<E1 & E2, D.Data<B>>
```

Added in v0.9.2

## apFirst

**Signature**

```ts
export declare const apFirst: <E, B>(
  second: EnvData<E, B>,
) => <A>(first: EnvData<E, A>) => EnvData<E, A>
```

Added in v0.9.2

## apS

**Signature**

```ts
export declare const apS: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: EnvData<E, B>,
) => (
  fa: EnvData<E, A>,
) => EnvData<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSecond

**Signature**

```ts
export declare const apSecond: <E, B>(
  second: EnvData<E, B>,
) => <A>(first: EnvData<E, A>) => EnvData<E, B>
```

Added in v0.9.2

## apT

**Signature**

```ts
export declare const apT: <E, B>(
  fb: EnvData<E, B>,
) => <A>(fas: EnvData<E, A>) => EnvData<E, readonly [...A, B]>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => EnvData<E, B>,
) => (
  ma: EnvData<E, A>,
) => EnvData<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(
  name: N,
) => <E, A>(fa: EnvData<E, A>) => EnvData<E, { readonly [K in N]: A }>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, E1, B>(
  f: (value: A) => E.Env<E1, D.Data<B>>,
) => <E2>(fa: E.Env<E2, D.Data<A>>) => E.Env<E1 & E2, D.Data<B>>
```

Added in v0.9.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, E, B>(
  f: (a: A) => EnvData<E, B>,
) => (first: EnvData<E, A>) => EnvData<E, A>
```

Added in v0.9.2

## flap

**Signature**

```ts
export declare const flap: <A>(a: A) => <E, B>(fab: EnvData<E, (a: A) => B>) => EnvData<E, B>
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare const getOrElse: <A>(
  onNoData: () => A,
  onLoading: (progress: Option<Progress>) => A,
) => <E>(ma: E.Env<E, D.Data<A>>) => E.Env<E, A>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: E.Env<E, D.Data<A>>) => E.Env<E, D.Data<B>>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A, E>(value: A) => E.Env<E, D.Replete<A>>
```

Added in v0.9.2

## tupled

**Signature**

```ts
export declare const tupled: <E, A>(fa: EnvData<E, A>) => EnvData<E, readonly [A]>
```

Added in v0.9.2

# Constructor

## loading

**Signature**

```ts
export declare const loading: E.Env<unknown, D.Loading>
```

Added in v0.9.2

## noData

**Signature**

```ts
export declare const noData: E.Env<unknown, D.NoData>
```

Added in v0.9.2

## refresh

**Signature**

```ts
export declare const refresh: <A, E>(
  value: A,
  progress?: None | Some<Progress> | undefined,
) => E.Env<E, D.Refresh<A>>
```

Added in v0.9.2

## replete

**Signature**

```ts
export declare const replete: <A, E>(value: A) => E.Env<E, D.Replete<A>>
```

Added in v0.9.2

## repleteF

**Signature**

```ts
export declare const repleteF: <E, A>(fa: E.Env<E, A>) => E.Env<E, D.Replete<A>>
```

Added in v0.9.2

# Deconstructor

## match

**Signature**

```ts
export declare const match: <A, B>(
  onNoData: () => A,
  onLoading: (progress: Option<Progress>) => A,
  onRefresh: (value: B, progress: Option<Progress>) => A,
  onReplete: (value: B) => A,
) => <E>(fa: E.Env<E, D.Data<B>>) => E.Env<E, A>
```

Added in v0.9.2

## match3W

**Signature**

```ts
export declare const match3W: <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: Option<Progress>) => B,
  onReplete: (value: C) => D,
) => <E>(fa: E.Env<E, D.Data<C>>) => E.Env<E, A | B | D>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <E1, A, E2, B, E3, E4>(
  onNoData: () => E.Env<E1, A>,
  onLoading: (progress: Option<Progress>) => E.Env<E2, A>,
  onRefresh: (value: B, progress: Option<Progress>) => E.Env<E3, A>,
  onReplete: (value: B) => E.Env<E4, A>,
) => <E5>(data: E.Env<E5, D.Data<B>>) => E.Env<E1 & E2 & E3 & E4 & E5, A>
```

Added in v0.9.2

## matchEW

**Signature**

```ts
export declare const matchEW: <E1, A, E2, B, C, E3, D, E4, E>(
  onNoData: () => E.Env<E1, A>,
  onLoading: (progress: Option<Progress>) => E.Env<E2, B>,
  onRefresh: (value: C, progress: Option<Progress>) => E.Env<E3, D>,
  onReplete: (value: C) => E.Env<E4, E>,
) => <E5>(data: E.Env<E5, D.Data<C>>) => E.Env<E1 & E2 & E3 & E4 & E5, A | B | D | E>
```

Added in v0.9.2

## matchW

**Signature**

```ts
export declare const matchW: <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: Option<Progress>) => B,
  onRefresh: (value: C, progress: Option<Progress>) => D,
  onReplete: (value: C) => E,
) => <EF>(fa: E.Env<EF, D.Data<C>>) => E.Env<E, A | B | D | E>
```

Added in v0.9.2

# Instance

## Applicative

**Signature**

```ts
export declare const Applicative: App.Applicative2<'@typed/fp/EnvData'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply2<'@typed/fp/EnvData'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Ch.Chain2<'@typed/fp/EnvData'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: F.Functor2<'@typed/fp/EnvData'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/EnvData'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: P.Pointed2<'@typed/fp/EnvData'>
```

Added in v0.9.2

# Model

## EnvData (interface)

**Signature**

```ts
export interface EnvData<E, A> extends E.Env<E, D.Data<A>> {}
```

Added in v0.9.2

# Typeclass Constructor

## getApplicativeMonoid

**Signature**

```ts
export declare const getApplicativeMonoid: <A, E>(M: Monoid<A>) => Monoid<EnvData<E, A>>
```

Added in v0.9.2

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A, E>(S: Semigroup<A>) => Semigroup<EnvData<E, A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/EnvData'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
