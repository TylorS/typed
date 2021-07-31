---
title: StreamEither.ts
nav_order: 49
parent: Modules
---

## StreamEither overview

StreamEither is a EitherT of Stream

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
  - [match](#match)
  - [matchE](#matche)
  - [orElse](#orelse)
  - [orElseFirst](#orelsefirst)
  - [orLeft](#orleft)
  - [swap](#swap)
  - [toUnion](#tounion)
- [Constructor](#constructor)
  - [fromStream](#fromstream)
  - [fromStreamL](#fromstreaml)
  - [left](#left)
  - [of](#of)
  - [right](#right)
- [Instance](#instance)
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
  - [StreamEither (interface)](#streameither-interface)
- [Typecalss Constructor](#typecalss-constructor)
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
  second: Lazy<Stream<E.Either<E, A>>>,
) => (first: Stream<E.Either<E, A>>) => Stream<E.Either<E, A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <E, A>(
  fa: Stream<E.Either<E, A>>,
) => <B>(fab: Stream<E.Either<E, (a: A) => B>>) => Stream<E.Either<E, B>>
```

Added in v0.9.2

## bimap

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => (fea: Stream<E.Either<E, A>>) => Stream<E.Either<G, B>>
```

Added in v0.9.2

## bracket

**Signature**

```ts
export declare const bracket: <E, A, B>(
  acquire: Stream<E.Either<E, A>>,
  use: (a: A) => Stream<E.Either<E, B>>,
  release: (a: A, e: E.Either<E, B>) => Stream<E.Either<E, void>>,
) => Stream<E.Either<E, B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, E, B>(
  f: (a: A) => Stream<E.Either<E, B>>,
) => (ma: Stream<E.Either<E, A>>) => Stream<E.Either<E, B>>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, E, B>(
  f: (value: A) => StreamEither<E, E.Either<A, B>>,
) => (a: A) => StreamEither<E, B>
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare const getOrElse: <E, A>(
  onLeft: (e: E) => A,
) => (ma: Stream<E.Either<E, A>>) => Stream<A>
```

Added in v0.9.2

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <E, A>(
  onLeft: (e: E) => Stream<A>,
) => (ma: Stream<E.Either<E, A>>) => Stream<A>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: Stream<E.Either<E, A>>) => Stream<E.Either<E, B>>
```

Added in v0.9.2

## mapLeft

**Signature**

```ts
export declare const mapLeft: <E, G>(
  f: (e: E) => G,
) => <A>(fea: Stream<E.Either<E, A>>) => Stream<E.Either<G, A>>
```

Added in v0.9.2

## match

**Signature**

```ts
export declare const match: <E, B, A>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => (ma: Stream<E.Either<E, A>>) => Stream<B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <E, B, A>(
  onLeft: (e: E) => Stream<B>,
  onRight: (a: A) => Stream<B>,
) => (ma: Stream<E.Either<E, A>>) => Stream<B>
```

Added in v0.9.2

## orElse

**Signature**

```ts
export declare const orElse: <E1, E2, A>(
  onLeft: (e: E1) => Stream<E.Either<E2, A>>,
) => (ma: Stream<E.Either<E1, A>>) => Stream<E.Either<E2, A>>
```

Added in v0.9.2

## orElseFirst

**Signature**

```ts
export declare const orElseFirst: <E, B>(
  onLeft: (e: E) => Stream<E.Either<E, B>>,
) => <A>(ma: Stream<E.Either<E, A>>) => Stream<E.Either<E, A>>
```

Added in v0.9.2

## orLeft

**Signature**

```ts
export declare const orLeft: <E1, E2>(
  onLeft: (e: E1) => Stream<E2>,
) => <A>(fa: Stream<E.Either<E1, A>>) => Stream<E.Either<E2, A>>
```

Added in v0.9.2

## swap

**Signature**

```ts
export declare const swap: <E, A>(ma: Stream<E.Either<E, A>>) => Stream<E.Either<A, E>>
```

Added in v0.9.2

## toUnion

**Signature**

```ts
export declare const toUnion: <E, A>(fa: Stream<E.Either<E, A>>) => Stream<E | A>
```

Added in v0.9.2

# Constructor

## fromStream

**Signature**

```ts
export declare const fromStream: <A, E>(fa: Stream<A>) => Stream<E.Either<E, A>>
```

Added in v0.9.2

## fromStreamL

**Signature**

```ts
export declare const fromStreamL: <E, A>(fe: Stream<E>) => Stream<E.Either<E, A>>
```

Added in v0.9.2

## left

**Signature**

```ts
export declare const left: <E, A>(e: E) => Stream<E.Either<E, A>>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A, E = never>(a: A) => Stream<E.Either<E, A>>
```

Added in v0.9.2

## right

**Signature**

```ts
export declare const right: <A, E>(a: A) => Stream<E.Either<E, A>>
```

Added in v0.9.2

# Instance

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative2<'@typed/fp/StreamEither'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply2<'@typed/fp/StreamEither'>
```

Added in v0.9.2

## Bifunctor

**Signature**

```ts
export declare const Bifunctor: Bifunctor2<'@typed/fp/StreamEither'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain2<'@typed/fp/StreamEither'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'@typed/fp/StreamEither'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor2<'@typed/fp/StreamEither'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/StreamEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'@typed/fp/StreamEither'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/StreamEither'>
```

Added in v0.9.2

# Model

## StreamEither (interface)

**Signature**

```ts
export interface StreamEither<E, A> extends S.Stream<E.Either<E, A>> {}
```

Added in v0.9.2

# Typecalss Constructor

## altValidation

**Signature**

```ts
export declare const altValidation: <A>(
  semigroup: Semigroup<A>,
) => <A>(
  second: Lazy<Stream<E.Either<A, A>>>,
) => (first: Stream<E.Either<A, A>>) => Stream<E.Either<A, A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/StreamEither'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
