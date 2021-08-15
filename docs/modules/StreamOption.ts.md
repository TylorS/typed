---
title: StreamOption.ts
nav_order: 62
parent: Modules
---

## StreamOption overview

StreamOption is a OptionT of Stream

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [ap](#ap)
  - [chain](#chain)
  - [chainNullableK](#chainnullablek)
  - [chainOptionK](#chainoptionk)
  - [chainRec](#chainrec)
  - [getOrElse](#getorelse)
  - [getOrElseE](#getorelsee)
  - [map](#map)
  - [match](#match)
  - [matchE](#matche)
- [Constructor](#constructor)
  - [fromEither](#fromeither)
  - [fromNullable](#fromnullable)
  - [fromNullableK](#fromnullablek)
  - [fromOptionK](#fromoptionk)
  - [fromPredicate](#frompredicate)
  - [fromStream](#fromstream)
  - [some](#some)
  - [zero](#zero)
- [Instance](#instance)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [Functor](#functor)
  - [Monad](#monad)
  - [MonadRec](#monadrec)
  - [Pointed](#pointed)
- [Model](#model)
  - [StreamOption (interface)](#streamoption-interface)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <A>(
  second: Lazy<Stream<O.Option<A>>>,
) => (first: Stream<O.Option<A>>) => Stream<O.Option<A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <A>(
  fa: Stream<O.Option<A>>,
) => <B>(fab: Stream<O.Option<(a: A) => B>>) => Stream<O.Option<B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, B>(
  f: (a: A) => Stream<O.Option<B>>,
) => (ma: Stream<O.Option<A>>) => Stream<O.Option<B>>
```

Added in v0.9.2

## chainNullableK

**Signature**

```ts
export declare const chainNullableK: <A, B>(
  f: (a: A) => B | null | undefined,
) => (ma: Stream<O.Option<A>>) => Stream<O.Option<NonNullable<B>>>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <A, B>(
  f: (a: A) => O.Option<B>,
) => (ma: Stream<O.Option<A>>) => Stream<O.Option<B>>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, B>(
  f: (value: A) => StreamOption<Ei.Either<A, B>>,
) => (value: A) => StreamOption<B>
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare const getOrElse: <A>(onNone: Lazy<A>) => (fa: Stream<O.Option<A>>) => Stream<A>
```

Added in v0.9.2

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <A>(
  onNone: Lazy<Stream<A>>,
) => (fa: Stream<O.Option<A>>) => Stream<A>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(f: (a: A) => B) => (fa: Stream<O.Option<A>>) => Stream<O.Option<B>>
```

Added in v0.9.2

## match

**Signature**

```ts
export declare const match: <B, A>(
  onNone: () => B,
  onSome: (a: A) => B,
) => (ma: Stream<O.Option<A>>) => Stream<B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <B, A>(
  onNone: () => Stream<B>,
  onSome: (a: A) => Stream<B>,
) => (ma: Stream<O.Option<A>>) => Stream<B>
```

Added in v0.9.2

# Constructor

## fromEither

**Signature**

```ts
export declare const fromEither: <A>(e: Ei.Either<unknown, A>) => Stream<O.Option<A>>
```

Added in v0.9.2

## fromNullable

**Signature**

```ts
export declare const fromNullable: <A>(a: A) => Stream<O.Option<NonNullable<A>>>
```

Added in v0.9.2

## fromNullableK

**Signature**

```ts
export declare const fromNullableK: <A, B>(
  f: (...a: A) => B | null | undefined,
) => (...a: A) => Stream<O.Option<NonNullable<B>>>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <A, B>(
  f: (...a: A) => O.Option<B>,
) => (...a: A) => Stream<O.Option<B>>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): (a: A) => Stream<O.Option<B>>
  <A>(predicate: Predicate<A>): <B>(b: B) => Stream<O.Option<B>>
}
```

Added in v0.9.2

## fromStream

**Signature**

```ts
export declare const fromStream: <A>(ma: Stream<A>) => Stream<O.Option<A>>
```

Added in v0.9.2

## some

**Signature**

```ts
export declare const some: <A>(a: A) => Stream<O.Option<A>>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: <A>() => Stream<O.Option<A>>
```

Added in v0.9.2

# Instance

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative1<'@typed/fp/StreamOption'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply1<'@typed/fp/StreamOption'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain1<'@typed/fp/StreamOption'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec1<'@typed/fp/StreamOption'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor1<'@typed/fp/StreamOption'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad1<'@typed/fp/StreamOption'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec1<'@typed/fp/StreamOption'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed1<'@typed/fp/StreamOption'>
```

Added in v0.9.2

# Model

## StreamOption (interface)

**Signature**

```ts
export interface StreamOption<A> extends S.Stream<O.Option<A>> {}
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/StreamOption'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
