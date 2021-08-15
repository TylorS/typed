---
title: DataEither.ts
nav_order: 6
parent: Modules
---

## DataEither overview

DataEither is an ADT which allows you to represent all the states involved in loading a piece of
data asynchronously which might fail.

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
  - [bimap](#bimap)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [bracket](#bracket)
  - [chain](#chain)
  - [chainEitherK](#chaineitherk)
  - [chainFirst](#chainfirst)
  - [chainOptionK](#chainoptionk)
  - [chainRec](#chainrec)
  - [filterOrElse](#filterorelse)
  - [flap](#flap)
  - [fromEitherK](#fromeitherk)
  - [fromOption](#fromoption)
  - [fromOptionK](#fromoptionk)
  - [fromPredicate](#frompredicate)
  - [getOrElse](#getorelse)
  - [getOrElseE](#getorelsee)
  - [map](#map)
  - [mapLeft](#mapleft)
  - [match](#match)
  - [matchE](#matche)
  - [orElse](#orelse)
  - [orElseFirst](#orelsefirst)
  - [orLeft](#orleft)
  - [right](#right)
  - [swap](#swap)
  - [toLoading](#toloading)
  - [toUnion](#tounion)
  - [tupled](#tupled)
- [Constructor](#constructor)
  - [fromData](#fromdata)
  - [fromDataL](#fromdatal)
  - [fromEither](#fromeither)
  - [fromProgress](#fromprogress)
  - [left](#left)
  - [of](#of)
  - [refresh](#refresh)
  - [replete](#replete)
- [Consturctor](#consturctor)
  - [loading](#loading)
  - [noData](#nodata)
- [Instance](#instance)
  - [Alt](#alt)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Bifunctor](#bifunctor)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [FromEither](#fromeither)
  - [Functor](#functor)
  - [Monad](#monad)
  - [MonadRec](#monadrec)
  - [Pointed](#pointed)
- [Model](#model)
  - [DataEither (type alias)](#dataeither-type-alias)
- [Typeclass Constructor](#typeclass-constructor)
  - [altValidation](#altvalidation)
  - [getSemigroup](#getsemigroup)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <E, A>(
  second: Lazy<D.Data<Ei.Either<E, A>>>,
) => (first: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <E, A>(
  fa: D.Data<Ei.Either<E, A>>,
) => <B>(fab: D.Data<Ei.Either<E, (a: A) => B>>) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## apFirst

**Signature**

```ts
export declare const apFirst: <E, B>(
  second: D.Data<Ei.Either<E, B>>,
) => <A>(first: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## apS

**Signature**

```ts
export declare const apS: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: D.Data<Ei.Either<E, B>>,
) => (
  fa: D.Data<Ei.Either<E, A>>,
) => D.Data<Ei.Either<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>>
```

Added in v0.9.2

## apSecond

**Signature**

```ts
export declare const apSecond: <E, B>(
  second: D.Data<Ei.Either<E, B>>,
) => <A>(first: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## apT

**Signature**

```ts
export declare const apT: <E, B>(
  fb: D.Data<Ei.Either<E, B>>,
) => <A>(fas: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, readonly [...A, B]>>
```

Added in v0.9.2

## bimap

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => (fea: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<G, B>>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => D.Data<Ei.Either<E, B>>,
) => (
  ma: D.Data<Ei.Either<E, A>>,
) => D.Data<Ei.Either<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>>
```

Added in v0.9.2

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(
  name: N,
) => <E, A>(fa: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, { readonly [K in N]: A }>>
```

Added in v0.9.2

## bracket

**Signature**

```ts
export declare const bracket: <E, A, B>(
  acquire: D.Data<Ei.Either<E, A>>,
  use: (a: A) => D.Data<Ei.Either<E, B>>,
  release: (a: A, e: Ei.Either<E, B>) => D.Data<Ei.Either<E, void>>,
) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, E, B>(
  f: (a: A) => D.Data<Ei.Either<E, B>>,
) => (ma: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## chainEitherK

**Signature**

```ts
export declare const chainEitherK: <A, E, B>(
  f: (a: A) => Ei.Either<E, B>,
) => (ma: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, E, B>(
  f: (a: A) => D.Data<Ei.Either<E, B>>,
) => (first: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <E>(
  onNone: Lazy<E>,
) => <A, B>(f: (a: A) => Option<B>) => (ma: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, E, B>(
  f: (value: A) => D.Data<Ei.Either<E, Ei.Either<A, B>>>,
) => (a: A) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## filterOrElse

**Signature**

```ts
export declare const filterOrElse: {
  <A, B, E>(refinement: Refinement<A, B>, onFalse: (a: A) => E): (
    ma: D.Data<Ei.Either<E, A>>,
  ) => D.Data<Ei.Either<E, B>>
  <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E): <B>(
    mb: D.Data<Ei.Either<E, B>>,
  ) => D.Data<Ei.Either<E, B>>
}
```

Added in v0.9.2

## flap

**Signature**

```ts
export declare const flap: <A>(
  a: A,
) => <E, B>(fab: D.Data<Ei.Either<E, (a: A) => B>>) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## fromEitherK

**Signature**

```ts
export declare const fromEitherK: <A, E, B>(
  f: (...a: A) => Ei.Either<E, B>,
) => (...a: A) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## fromOption

**Signature**

```ts
export declare const fromOption: <E>(
  onNone: Lazy<E>,
) => NaturalTransformation12C<'Option', '@typed/fp/DataEither', E>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <E>(
  onNone: Lazy<E>,
) => <A, B>(f: (...a: A) => Option<B>) => (...a: A) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): (a: A) => D.Data<Ei.Either<A, B>>
  <A>(predicate: Predicate<A>): <B>(b: B) => D.Data<Ei.Either<B, B>>
}
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare const getOrElse: <E, A>(
  onLeft: (e: E) => A,
) => (ma: D.Data<Ei.Either<E, A>>) => D.Data<A>
```

Added in v0.9.2

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <E, A>(
  onLeft: (e: E) => D.Data<A>,
) => (ma: D.Data<Ei.Either<E, A>>) => D.Data<A>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, B>>
```

Added in v0.9.2

## mapLeft

**Signature**

```ts
export declare const mapLeft: <E, G>(
  f: (e: E) => G,
) => <A>(fea: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<G, A>>
```

Added in v0.9.2

## match

**Signature**

```ts
export declare const match: <E, B, A>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => (ma: D.Data<Ei.Either<E, A>>) => D.Data<B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <E, B, A>(
  onLeft: (e: E) => D.Data<B>,
  onRight: (a: A) => D.Data<B>,
) => (ma: D.Data<Ei.Either<E, A>>) => D.Data<B>
```

Added in v0.9.2

## orElse

**Signature**

```ts
export declare const orElse: <E1, E2, A>(
  onLeft: (e: E1) => D.Data<Ei.Either<E2, A>>,
) => (ma: D.Data<Ei.Either<E1, A>>) => D.Data<Ei.Either<E2, A>>
```

Added in v0.9.2

## orElseFirst

**Signature**

```ts
export declare const orElseFirst: <E, B>(
  onLeft: (e: E) => D.Data<Ei.Either<E, B>>,
) => <A>(ma: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## orLeft

**Signature**

```ts
export declare const orLeft: <E1, E2>(
  onLeft: (e: E1) => D.Data<E2>,
) => <A>(fa: D.Data<Ei.Either<E1, A>>) => D.Data<Ei.Either<E2, A>>
```

Added in v0.9.2

## right

**Signature**

```ts
export declare const right: <A, E>(a: A) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## swap

**Signature**

```ts
export declare const swap: <E, A>(ma: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<A, E>>
```

Added in v0.9.2

## toLoading

**Signature**

```ts
export declare const toLoading: <E, A>(de: D.Data<Ei.Either<E, A>>) => D.Data<Ei.Either<E, A>>
```

Added in v0.12.1

## toUnion

**Signature**

```ts
export declare const toUnion: <E, A>(fa: D.Data<Ei.Either<E, A>>) => D.Data<E | A>
```

Added in v0.9.2

## tupled

**Signature**

```ts
export declare const tupled: <E, A>(
  fa: D.Data<Ei.Either<E, A>>,
) => D.Data<Ei.Either<E, readonly [A]>>
```

Added in v0.9.2

# Constructor

## fromData

**Signature**

```ts
export declare const fromData: <A, E>(fa: D.Data<A>) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## fromDataL

**Signature**

```ts
export declare const fromDataL: <E, A>(fe: D.Data<E>) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## fromEither

**Signature**

```ts
export declare const fromEither: <E, A>(e: Ei.Either<E, A>) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## fromProgress

**Signature**

```ts
export declare const fromProgress: (progress: Progress) => D.Data<Ei.Either<never, unknown>>
```

Added in v0.12.1

## left

**Signature**

```ts
export declare const left: <E, A>(e: E) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A, E = never>(a: A) => D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

## refresh

**Signature**

```ts
export declare const refresh: <A>(
  value: A,
  progress?: None | Some<Progress> | undefined,
) => D.Data<Ei.Either<never, A>>
```

Added in v0.12.1

## replete

**Signature**

```ts
export declare const replete: <A>(value: A) => D.Data<Ei.Either<never, A>>
```

Added in v0.12.1

# Consturctor

## loading

**Signature**

```ts
export declare const loading: D.Data<Ei.Either<never, never>>
```

Added in v0.12.1

## noData

**Signature**

```ts
export declare const noData: D.Data<Ei.Either<never, never>>
```

Added in v0.12.1

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt_.Alt2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative_.Applicative2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply_.Apply2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## Bifunctor

**Signature**

```ts
export declare const Bifunctor: Bifunctor_.Bifunctor2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain_.Chain2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec_.ChainRec2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## FromEither

**Signature**

```ts
export declare const FromEither: FEi.FromEither2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor_.Functor2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad_.Monad2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'@typed/fp/DataEither'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed_.Pointed2<'@typed/fp/DataEither'>
```

Added in v0.9.2

# Model

## DataEither (type alias)

**Signature**

```ts
export type DataEither<E, A> = D.Data<Ei.Either<E, A>>
```

Added in v0.9.2

# Typeclass Constructor

## altValidation

**Signature**

```ts
export declare const altValidation: <A>(
  semigroup: Semigroup_.Semigroup<A>,
) => <A>(
  second: Lazy<D.Data<Ei.Either<A, A>>>,
) => (first: D.Data<Ei.Either<A, A>>) => D.Data<Ei.Either<A, A>>
```

Added in v0.9.2

## getSemigroup

**Signature**

```ts
export declare const getSemigroup: <A, E>(
  S: Semigroup_.Semigroup<A>,
) => Semigroup_.Semigroup<D.Data<Ei.Either<E, A>>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/DataEither'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
