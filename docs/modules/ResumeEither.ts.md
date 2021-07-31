---
title: ResumeEither.ts
nav_order: 41
parent: Modules
---

## ResumeEither overview

ResumeEither is an Either of @see Resume

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [ap](#ap)
  - [bimap](#bimap)
  - [bracket](#bracket)
  - [chain](#chain)
  - [chainRec](#chainrec)
  - [getOrElse](#getorelse)
  - [getOrElseE](#getorelsee)
  - [map](#map)
  - [mapLeft](#mapleft)
  - [of](#of)
  - [orElse](#orelse)
  - [orElseFirst](#orelsefirst)
  - [orLeft](#orleft)
  - [swap](#swap)
  - [toUnion](#tounion)
- [Constructor](#constructor)
  - [fromResumeL](#fromresumel)
  - [fromResumeR](#fromresumer)
  - [left](#left)
  - [right](#right)
- [Deconstructor](#deconstructor)
  - [match](#match)
  - [matchE](#matche)
- [Instance](#instance)
  - [Alt](#alt)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Bifunctor](#bifunctor)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [Functor](#functor)
  - [Monad](#monad)
  - [MonadRec](#monadrec)
  - [Pointed](#pointed)
- [Model](#model)
  - [ResumeEither (type alias)](#resumeeither-type-alias)
- [Typeclass Constructor](#typeclass-constructor)
  - [altValidation](#altvalidation)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <E, A>(
  second: Lazy<R.Resume<E.Either<E, A>>>,
) => (first: R.Resume<E.Either<E, A>>) => R.Resume<E.Either<E, A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <E, A>(
  fa: R.Resume<E.Either<E, A>>,
) => <B>(fab: R.Resume<E.Either<E, (a: A) => B>>) => R.Resume<E.Either<E, B>>
```

Added in v0.9.2

## bimap

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => (fea: R.Resume<E.Either<E, A>>) => R.Resume<E.Either<G, B>>
```

Added in v0.9.2

## bracket

**Signature**

```ts
export declare const bracket: <E, A, B>(
  acquire: R.Resume<E.Either<E, A>>,
  use: (a: A) => R.Resume<E.Either<E, B>>,
  release: (a: A, e: E.Either<E, B>) => R.Resume<E.Either<E, void>>,
) => R.Resume<E.Either<E, B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, E, B>(
  f: (a: A) => R.Resume<E.Either<E, B>>,
) => (ma: R.Resume<E.Either<E, A>>) => R.Resume<E.Either<E, B>>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, E, B>(
  f: (a: A) => R.Resume<E.Either<E, E.Either<A, B>>>,
) => (a: A) => R.Resume<E.Either<E, B>>
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare const getOrElse: <E, A>(
  onLeft: (e: E) => A,
) => (ma: R.Resume<E.Either<E, A>>) => R.Resume<A>
```

Added in v0.9.2

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <E, A>(
  onLeft: (e: E) => R.Resume<A>,
) => (ma: R.Resume<E.Either<E, A>>) => R.Resume<A>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: R.Resume<E.Either<E, A>>) => R.Resume<E.Either<E, B>>
```

Added in v0.9.2

## mapLeft

**Signature**

```ts
export declare const mapLeft: <E, G>(
  f: (e: E) => G,
) => <A>(fea: R.Resume<E.Either<E, A>>) => R.Resume<E.Either<G, A>>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A, E>(a: A) => R.Resume<E.Either<E, A>>
```

Added in v0.9.2

## orElse

**Signature**

```ts
export declare const orElse: <E1, E2, A>(
  onLeft: (e: E1) => R.Resume<E.Either<E2, A>>,
) => (ma: R.Resume<E.Either<E1, A>>) => R.Resume<E.Either<E2, A>>
```

Added in v0.9.2

## orElseFirst

**Signature**

```ts
export declare const orElseFirst: <E, B>(
  onLeft: (e: E) => R.Resume<E.Either<E, B>>,
) => <A>(ma: R.Resume<E.Either<E, A>>) => R.Resume<E.Either<E, A>>
```

Added in v0.9.2

## orLeft

**Signature**

```ts
export declare const orLeft: <E1, E2>(
  onLeft: (e: E1) => R.Resume<E2>,
) => <A>(fa: R.Resume<E.Either<E1, A>>) => R.Resume<E.Either<E2, A>>
```

Added in v0.9.2

## swap

**Signature**

```ts
export declare const swap: <E, A>(ma: R.Resume<E.Either<E, A>>) => R.Resume<E.Either<A, E>>
```

Added in v0.9.2

## toUnion

**Signature**

```ts
export declare const toUnion: <E, A>(fa: R.Resume<E.Either<E, A>>) => R.Resume<E | A>
```

Added in v0.9.2

# Constructor

## fromResumeL

**Signature**

```ts
export declare const fromResumeL: <E, A>(fe: R.Resume<E>) => R.Resume<E.Either<E, A>>
```

Added in v0.9.2

## fromResumeR

**Signature**

```ts
export declare const fromResumeR: <A, E>(fa: R.Resume<A>) => R.Resume<E.Either<E, A>>
```

Added in v0.9.2

## left

**Signature**

```ts
export declare const left: <E, A>(e: E) => R.Resume<E.Either<E, A>>
```

Added in v0.9.2

## right

**Signature**

```ts
export declare const right: <A, E>(a: A) => R.Resume<E.Either<E, A>>
```

Added in v0.9.2

# Deconstructor

## match

**Signature**

```ts
export declare const match: <E, B, A>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => (ma: R.Resume<E.Either<E, A>>) => R.Resume<B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <E, B, A>(
  onLeft: (e: E) => R.Resume<B>,
  onRight: (a: A) => R.Resume<B>,
) => (ma: R.Resume<E.Either<E, A>>) => R.Resume<B>
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

## Bifunctor

**Signature**

```ts
export declare const Bifunctor: Bifunctor2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/ResumeEither'>
```

Added in v0.9.2

# Model

## ResumeEither (type alias)

**Signature**

```ts
export type ResumeEither<E, A> = R.Resume<E.Either<E, A>>
```

Added in v0.9.2

# Typeclass Constructor

## altValidation

**Signature**

```ts
export declare const altValidation: <A>(
  semigroup: Semigroup<A>,
) => <A>(
  second: Lazy<R.Resume<E.Either<A, A>>>,
) => (first: R.Resume<E.Either<A, A>>) => R.Resume<E.Either<A, A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/ResumeEither'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
