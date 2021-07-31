---
title: DataOption.ts
nav_order: 6
parent: Modules
---

## DataOption overview

DataOption is an ADT which allows you to represent all the states involved in loading a piece of
data asynchronously which might exist.

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
- [Constructor](#constructor)
  - [fromData](#fromdata)
  - [fromEither](#fromeither)
  - [fromNullable](#fromnullable)
  - [fromNullableK](#fromnullablek)
  - [fromOptionK](#fromoptionk)
  - [fromPredicate](#frompredicate)
  - [some](#some)
  - [zero](#zero)
- [Deconstructor](#deconstructor)
  - [match](#match)
  - [matchE](#matche)
- [Instance](#instance)
  - [Alt](#alt)
  - [Alternative](#alternative)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [Functor](#functor)
  - [Monad](#monad)
  - [MonadRec](#monadrec)
  - [Pointed](#pointed)
- [Model](#model)
  - [DataOption (type alias)](#dataoption-type-alias)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <A>(
  second: Lazy<D.Data<O.Option<A>>>,
) => (first: D.Data<O.Option<A>>) => D.Data<O.Option<A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <A>(
  fa: D.Data<O.Option<A>>,
) => <B>(fab: D.Data<O.Option<(a: A) => B>>) => D.Data<O.Option<B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, B>(
  f: (a: A) => D.Data<O.Option<B>>,
) => (ma: D.Data<O.Option<A>>) => D.Data<O.Option<B>>
```

Added in v0.9.2

## chainNullableK

**Signature**

```ts
export declare const chainNullableK: <A, B>(
  f: (a: A) => B | null | undefined,
) => (ma: D.Data<O.Option<A>>) => D.Data<O.Option<NonNullable<B>>>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <A, B>(
  f: (a: A) => O.Option<B>,
) => (ma: D.Data<O.Option<A>>) => D.Data<O.Option<B>>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, B>(
  f: (value: A) => D.Data<O.Option<E.Either<A, B>>>,
) => (value: A) => D.Data<O.Option<B>>
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare const getOrElse: <A>(onNone: Lazy<A>) => (fa: D.Data<O.Option<A>>) => D.Data<A>
```

Added in v0.9.2

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <A>(
  onNone: Lazy<D.Data<A>>,
) => (fa: D.Data<O.Option<A>>) => D.Data<A>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(f: (a: A) => B) => (fa: D.Data<O.Option<A>>) => D.Data<O.Option<B>>
```

Added in v0.9.2

# Constructor

## fromData

**Signature**

```ts
export declare const fromData: <A>(ma: D.Data<A>) => D.Data<O.Option<A>>
```

Added in v0.9.2

## fromEither

**Signature**

```ts
export declare const fromEither: <A>(e: E.Either<unknown, A>) => D.Data<O.Option<A>>
```

Added in v0.9.2

## fromNullable

**Signature**

```ts
export declare const fromNullable: <A>(a: A) => D.Data<O.Option<NonNullable<A>>>
```

Added in v0.9.2

## fromNullableK

**Signature**

```ts
export declare const fromNullableK: <A, B>(
  f: (...a: A) => B | null | undefined,
) => (...a: A) => D.Data<O.Option<NonNullable<B>>>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <A, B>(
  f: (...a: A) => O.Option<B>,
) => (...a: A) => D.Data<O.Option<B>>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): (a: A) => D.Data<O.Option<B>>
  <A>(predicate: Predicate<A>): <B>(b: B) => D.Data<O.Option<B>>
}
```

Added in v0.9.2

## some

**Signature**

```ts
export declare const some: <A>(a: A) => D.Data<O.Option<A>>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: <A>() => D.Data<O.Option<A>>
```

Added in v0.9.2

# Deconstructor

## match

**Signature**

```ts
export declare const match: <B, A>(
  onNone: () => B,
  onSome: (a: A) => B,
) => (ma: D.Data<O.Option<A>>) => D.Data<B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <B, A>(
  onNone: () => D.Data<B>,
  onSome: (a: A) => D.Data<B>,
) => (ma: D.Data<O.Option<A>>) => D.Data<B>
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt1<'@typed/fp/DataOption'>
```

Added in v0.9.2

## Alternative

**Signature**

```ts
export declare const Alternative: Alternative1<'@typed/fp/DataOption'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative1<'@typed/fp/DataOption'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply1<'@typed/fp/DataOption'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain1<'@typed/fp/DataOption'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec1<'@typed/fp/DataOption'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor1<'@typed/fp/DataOption'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad1<'@typed/fp/DataOption'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec1<'@typed/fp/DataOption'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed1<'@typed/fp/DataOption'>
```

Added in v0.9.2

# Model

## DataOption (type alias)

**Signature**

```ts
export type DataOption<A> = D.Data<O.Option<A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/DataOption'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
