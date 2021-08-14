---
title: ResumeOption.ts
nav_order: 50
parent: Modules
---

## ResumeOption overview

ResumeOption is an OptionT of [Resume](./Resume.ts.md)

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
  - [map](#map)
- [Constructor](#constructor)
  - [fromEither](#fromeither)
  - [fromNullable](#fromnullable)
  - [fromNullableK](#fromnullablek)
  - [fromOptionK](#fromoptionk)
  - [fromPredicate](#frompredicate)
  - [fromResume](#fromresume)
  - [some](#some)
  - [zero](#zero)
- [Deconstructor](#deconstructor)
  - [getOrElse](#getorelse)
  - [getOrElseE](#getorelsee)
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
  - [ResumeOption (type alias)](#resumeoption-type-alias)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <A>(
  second: Lazy<R.Resume<O.Option<A>>>,
) => (first: R.Resume<O.Option<A>>) => R.Resume<O.Option<A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <A>(
  fa: R.Resume<O.Option<A>>,
) => <B>(fab: R.Resume<O.Option<(a: A) => B>>) => R.Resume<O.Option<B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, B>(
  f: (a: A) => R.Resume<O.Option<B>>,
) => (ma: R.Resume<O.Option<A>>) => R.Resume<O.Option<B>>
```

Added in v0.9.2

## chainNullableK

**Signature**

```ts
export declare const chainNullableK: <A, B>(
  f: (a: A) => B | null | undefined,
) => (ma: R.Resume<O.Option<A>>) => R.Resume<O.Option<NonNullable<B>>>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <A, B>(
  f: (a: A) => O.Option<B>,
) => (ma: R.Resume<O.Option<A>>) => R.Resume<O.Option<B>>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, B>(
  f: (value: A) => R.Resume<O.Option<E.Either<A, B>>>,
) => (value: A) => R.Resume<O.Option<B>>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => (fa: R.Resume<O.Option<A>>) => R.Resume<O.Option<B>>
```

Added in v0.9.2

# Constructor

## fromEither

**Signature**

```ts
export declare const fromEither: <A>(e: E.Either<unknown, A>) => R.Resume<O.Option<A>>
```

Added in v0.9.2

## fromNullable

**Signature**

```ts
export declare const fromNullable: <A>(a: A) => R.Resume<O.Option<NonNullable<A>>>
```

Added in v0.9.2

## fromNullableK

**Signature**

```ts
export declare const fromNullableK: <A, B>(
  f: (...a: A) => B | null | undefined,
) => (...a: A) => R.Resume<O.Option<NonNullable<B>>>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <A, B>(
  f: (...a: A) => O.Option<B>,
) => (...a: A) => R.Resume<O.Option<B>>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): (a: A) => R.Resume<O.Option<B>>
  <A>(predicate: Predicate<A>): <B>(b: B) => R.Resume<O.Option<B>>
}
```

Added in v0.9.2

## fromResume

**Signature**

```ts
export declare const fromResume: <A>(ma: R.Resume<A>) => R.Resume<O.Option<A>>
```

Added in v0.9.2

## some

**Signature**

```ts
export declare const some: <A>(a: A) => R.Resume<O.Option<A>>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: <A>() => R.Resume<O.Option<A>>
```

Added in v0.9.2

# Deconstructor

## getOrElse

**Signature**

```ts
export declare const getOrElse: <A>(onNone: Lazy<A>) => (fa: R.Resume<O.Option<A>>) => R.Resume<A>
```

Added in v0.9.2

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <A>(
  onNone: Lazy<R.Resume<A>>,
) => (fa: R.Resume<O.Option<A>>) => R.Resume<A>
```

Added in v0.9.2

## match

**Signature**

```ts
export declare const match: <B, A>(
  onNone: () => B,
  onSome: (a: A) => B,
) => (ma: R.Resume<O.Option<A>>) => R.Resume<B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <B, A>(
  onNone: () => R.Resume<B>,
  onSome: (a: A) => R.Resume<B>,
) => (ma: R.Resume<O.Option<A>>) => R.Resume<B>
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

## Alternative

**Signature**

```ts
export declare const Alternative: Alternative1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed1<'@typed/fp/ResumeOption'>
```

Added in v0.9.2

# Model

## ResumeOption (type alias)

**Signature**

```ts
export type ResumeOption<A> = R.Resume<O.Option<A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/ResumeOption'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
