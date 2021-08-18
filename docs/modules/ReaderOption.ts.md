---
title: ReaderOption.ts
nav_order: 44
parent: Modules
---

## ReaderOption overview

ReaderOption is an OptionT of fp-ts/Reader

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [altW](#altw)
  - [ap](#ap)
  - [chain](#chain)
  - [chainFirstReaderK](#chainfirstreaderk)
  - [chainNullableK](#chainnullablek)
  - [chainOptionK](#chainoptionk)
  - [chainReaderK](#chainreaderk)
  - [chainRec](#chainrec)
  - [local](#local)
  - [map](#map)
- [Constructor](#constructor)
  - [altAll](#altall)
  - [apFirst](#apfirst)
  - [apFirstW](#apfirstw)
  - [apS](#aps)
  - [apSW](#apsw)
  - [apSecond](#apsecond)
  - [apSecondW](#apsecondw)
  - [apT](#apt)
  - [apTW](#aptw)
  - [ask](#ask)
  - [asks](#asks)
  - [bind](#bind)
  - [chainFirst](#chainfirst)
  - [fromEither](#fromeither)
  - [fromIO](#fromio)
  - [fromNullable](#fromnullable)
  - [fromNullableK](#fromnullablek)
  - [fromOptionK](#fromoptionk)
  - [fromPredicate](#frompredicate)
  - [fromReader](#fromreader)
  - [fromReaderK](#fromreaderk)
  - [some](#some)
  - [zero](#zero)
- [Deconsructor](#deconsructor)
  - [getOrElseE](#getorelsee)
- [Deconstructor](#deconstructor)
  - [getOrElse](#getorelse)
  - [getOrElseEW](#getorelseew)
  - [getOrElseW](#getorelsew)
  - [match](#match)
  - [matchE](#matche)
  - [matchEW](#matchew)
- [Instance](#instance)
  - [Alt](#alt)
  - [Alternative](#alternative)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [FromIO](#fromio)
  - [FromReader](#fromreader)
  - [Functor](#functor)
  - [Monad](#monad)
  - [MonadRec](#monadrec)
  - [Pointed](#pointed)
  - [Provide](#provide)
  - [ProvideAll](#provideall)
  - [ProvideSome](#providesome)
  - [UseAll](#useall)
  - [UseSome](#usesome)
- [Model](#model)
  - [ReaderOption (interface)](#readeroption-interface)
- [Typeclass Instance](#typeclass-instance)
  - [getApplySemigroup](#getapplysemigroup)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <E, A>(
  second: Lazy<R.Reader<E, O.Option<A>>>,
) => (first: R.Reader<E, O.Option<A>>) => R.Reader<E, O.Option<A>>
```

Added in v0.9.2

## altW

**Signature**

```ts
export declare const altW: <E1, A>(
  second: Lazy<ReaderOption<E1, A>>,
) => <E2, B>(first: ReaderOption<E2, B>) => ReaderOption<E1 & E2, A | B>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <E, A>(
  fa: R.Reader<E, O.Option<A>>,
) => <B>(fab: R.Reader<E, O.Option<(a: A) => B>>) => R.Reader<E, O.Option<B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, E, B>(
  f: (a: A) => R.Reader<E, O.Option<B>>,
) => (ma: R.Reader<E, O.Option<A>>) => R.Reader<E, O.Option<B>>
```

Added in v0.9.2

## chainFirstReaderK

**Signature**

```ts
export declare const chainFirstReaderK: <A, R, B>(
  f: (a: A) => R.Reader<R, B>,
) => (ma: ReaderOption<R, A>) => ReaderOption<R, A>
```

Added in v0.9.2

## chainNullableK

**Signature**

```ts
export declare const chainNullableK: <A, B>(
  f: (a: A) => B | null | undefined,
) => <E>(ma: R.Reader<E, O.Option<A>>) => R.Reader<E, O.Option<NonNullable<B>>>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <A, B>(
  f: (a: A) => O.Option<B>,
) => <E>(ma: R.Reader<E, O.Option<A>>) => R.Reader<E, O.Option<B>>
```

Added in v0.9.2

## chainReaderK

**Signature**

```ts
export declare const chainReaderK: <A, R, B>(
  f: (a: A) => R.Reader<R, B>,
) => (ma: ReaderOption<R, A>) => ReaderOption<R, B>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, E, B>(
  f: (value: A) => ReaderOption<E, Ei.Either<A, B>>,
) => (value: A) => ReaderOption<E, B>
```

Added in v0.9.2

## local

**Signature**

```ts
export declare const local: <A, B>(
  f: (a: A) => B,
) => <C>(ro: ReaderOption<B, C>) => ReaderOption<A, C>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: R.Reader<E, O.Option<A>>) => R.Reader<E, O.Option<B>>
```

Added in v0.9.2

# Constructor

## altAll

**Signature**

```ts
export declare const altAll: <E, A>(
  startWith: ReaderOption<E, A>,
) => (as: readonly ReaderOption<E, A>[]) => ReaderOption<E, A>
```

Added in v0.12.2

## apFirst

**Signature**

```ts
export declare const apFirst: <E, B>(
  second: ReaderOption<E, B>,
) => <A>(first: ReaderOption<E, A>) => ReaderOption<E, A>
```

Added in v0.12.2

## apFirstW

**Signature**

```ts
export declare const apFirstW: <E1, B>(
  second: ReaderOption<E1, B>,
) => <E2, A>(first: ReaderOption<E2, A>) => ReaderOption<E1 & E2, A>
```

Added in v0.12.2

## apS

**Signature**

```ts
export declare const apS: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderOption<E, B>,
) => (
  fa: ReaderOption<E, A>,
) => ReaderOption<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.12.2

## apSW

**Signature**

```ts
export declare const apSW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderOption<E1, B>,
) => <E2>(
  fa: ReaderOption<E2, A>,
) => ReaderOption<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.12.2

## apSecond

**Signature**

```ts
export declare const apSecond: <E, B>(
  second: ReaderOption<E, B>,
) => <A>(first: ReaderOption<E, A>) => ReaderOption<E, B>
```

Added in v0.12.2

## apSecondW

**Signature**

```ts
export declare const apSecondW: <E1, B>(
  second: ReaderOption<E1, B>,
) => <E2, A>(first: ReaderOption<E2, A>) => ReaderOption<E1 & E2, B>
```

Added in v0.12.2

## apT

**Signature**

```ts
export declare const apT: <E, B>(
  fb: ReaderOption<E, B>,
) => <A>(fas: ReaderOption<E, A>) => ReaderOption<E, readonly [...A, B]>
```

Added in v0.12.2

## apTW

**Signature**

```ts
export declare const apTW: <E1, B>(
  fb: ReaderOption<E1, B>,
) => <E2, A extends readonly unknown[]>(
  fas: ReaderOption<E2, A>,
) => ReaderOption<E1 & E2, readonly [...A, B]>
```

Added in v0.12.2

## ask

**Signature**

```ts
export declare const ask: <R>() => ReaderOption<R, R>
```

Added in v0.9.2

## asks

**Signature**

```ts
export declare const asks: <R, A>(f: (r: R) => A) => ReaderOption<R, A>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderOption<E, B>,
) => (
  ma: ReaderOption<E, A>,
) => ReaderOption<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.12.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, E, B>(
  f: (a: A) => ReaderOption<E, B>,
) => (first: ReaderOption<E, A>) => ReaderOption<E, A>
```

Added in v0.12.2

## fromEither

**Signature**

```ts
export declare const fromEither: <A, E>(e: Ei.Either<unknown, A>) => R.Reader<E, O.Option<A>>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: NaturalTransformation12<'IO', '@typed/fp/ReaderOption'>
```

Added in v0.9.2

## fromNullable

**Signature**

```ts
export declare const fromNullable: <A, E>(a: A) => R.Reader<E, O.Option<NonNullable<A>>>
```

Added in v0.9.2

## fromNullableK

**Signature**

```ts
export declare const fromNullableK: <A, B>(
  f: (...a: A) => B | null | undefined,
) => <E>(...a: A) => R.Reader<E, O.Option<NonNullable<B>>>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <A, B>(
  f: (...a: A) => O.Option<B>,
) => <E>(...a: A) => R.Reader<E, O.Option<B>>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): <E>(a: A) => R.Reader<E, O.Option<B>>
  <A>(predicate: Predicate<A>): <E, B>(b: B) => R.Reader<E, O.Option<B>>
}
```

Added in v0.9.2

## fromReader

**Signature**

```ts
export declare const fromReader: <E, A>(ma: R.Reader<E, A>) => R.Reader<E, O.Option<A>>
```

Added in v0.9.2

## fromReaderK

**Signature**

```ts
export declare const fromReaderK: <A, R, B>(
  f: (...a: A) => R.Reader<R, B>,
) => (...a: A) => ReaderOption<R, B>
```

Added in v0.9.2

## some

**Signature**

```ts
export declare const some: <A, E>(a: A) => R.Reader<E, O.Option<A>>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: <E, A>() => R.Reader<E, O.Option<A>>
```

Added in v0.9.2

# Deconsructor

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <E, A>(
  onNone: Lazy<R.Reader<E, A>>,
) => (fa: R.Reader<E, O.Option<A>>) => R.Reader<E, A>
```

Added in v0.9.2

# Deconstructor

## getOrElse

**Signature**

```ts
export declare const getOrElse: <A>(
  onNone: Lazy<A>,
) => <E>(fa: R.Reader<E, O.Option<A>>) => R.Reader<E, A>
```

Added in v0.9.2

## getOrElseEW

**Signature**

```ts
export declare const getOrElseEW: <E1, A>(
  onNone: Lazy<R.Reader<E1, A>>,
) => <E2, B>(fa: ReaderOption<E2, B>) => R.Reader<E1 & E2, A | B>
```

Added in v0.9.2

## getOrElseW

**Signature**

```ts
export declare const getOrElseW: <A>(
  onNone: Lazy<A>,
) => <E, B>(fa: R.Reader<E, O.Option<B>>) => R.Reader<E, A | B>
```

Added in v0.13.0

## match

**Signature**

```ts
export declare const match: <B, A>(
  onNone: () => B,
  onSome: (a: A) => B,
) => <E>(ma: R.Reader<E, O.Option<A>>) => R.Reader<E, B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <E, B, A>(
  onNone: () => R.Reader<E, B>,
  onSome: (a: A) => R.Reader<E, B>,
) => (ma: R.Reader<E, O.Option<A>>) => R.Reader<E, B>
```

Added in v0.9.2

## matchEW

**Signature**

```ts
export declare const matchEW: <E1, B, A, E2, C>(
  onNone: () => R.Reader<E1, B>,
  onSome: (a: A) => R.Reader<E2, C>,
) => <E3>(ma: R.Reader<E3, O.Option<A>>) => R.Reader<E1 & E2 & E3, B | C>
```

Added in v0.13.0

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt_.Alt2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## Alternative

**Signature**

```ts
export declare const Alternative: Alternative2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: CH.Chain2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FromIO2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## FromReader

**Signature**

```ts
export declare const FromReader: FR.FromReader2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: Provide2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: ProvideAll2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: ProvideSome2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: UseAll2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: UseSome2<'@typed/fp/ReaderOption'>
```

Added in v0.9.2

# Model

## ReaderOption (interface)

**Signature**

```ts
export interface ReaderOption<E, A> extends R.Reader<E, O.Option<A>> {}
```

Added in v0.9.2

# Typeclass Instance

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A, E>(S: Semigroup<A>) => Semigroup<ReaderOption<E, A>>
```

Added in v0.12.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/ReaderOption'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
