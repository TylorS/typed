---
title: Data.ts
nav_order: 4
parent: Modules
---

## Data overview

Data is an ADT which allows you to represent all the states involved in loading a piece of data
asynchronously.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [altAll](#altall)
  - [ap](#ap)
  - [apFirst](#apfirst)
  - [apS](#aps)
  - [apSecond](#apsecond)
  - [apT](#apt)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [chain](#chain)
  - [chainFirst](#chainfirst)
  - [chainRec](#chainrec)
  - [compact](#compact)
  - [elem](#elem)
  - [exists](#exists)
  - [filter](#filter)
  - [filterMap](#filtermap)
  - [flap](#flap)
  - [foldMap](#foldmap)
  - [getOrElse](#getorelse)
  - [getOrElseW](#getorelsew)
  - [map](#map)
  - [partition](#partition)
  - [partitionMap](#partitionmap)
  - [separate](#separate)
  - [toLoading](#toloading)
  - [traverse](#traverse)
  - [tupled](#tupled)
- [Constructor](#constructor)
  - [fromNullable](#fromnullable)
  - [fromProgress](#fromprogress)
  - [loading](#loading)
  - [noData](#nodata)
  - [of](#of)
  - [refresh](#refresh)
  - [replete](#replete)
  - [zero](#zero)
- [Deconstructor](#deconstructor)
  - [match](#match)
  - [match3W](#match3w)
  - [matchW](#matchw)
  - [reduce](#reduce)
  - [reduceRight](#reduceright)
- [Instance](#instance)
  - [Alt](#alt)
  - [Alternative](#alternative)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [Compactable](#compactable)
  - [Filterable](#filterable)
  - [Foldable](#foldable)
  - [Functor](#functor)
  - [Monad](#monad)
  - [Pointed](#pointed)
  - [Traversable](#traversable)
- [Model](#model)
  - [Data (type alias)](#data-type-alias)
  - [Loading (interface)](#loading-interface)
  - [NoData (interface)](#nodata-interface)
  - [Refresh (interface)](#refresh-interface)
  - [Replete (interface)](#replete-interface)
- [Natural Transformation](#natural-transformation)
  - [fromOption](#fromoption)
  - [toOption](#tooption)
- [Refinement](#refinement)
  - [hasValue](#hasvalue)
  - [isLoading](#isloading)
  - [isNoData](#isnodata)
  - [isRefresh](#isrefresh)
  - [isReplete](#isreplete)
- [Type-level](#type-level)
  - [Value (type alias)](#value-type-alias)
- [Typeclass Constructor](#typeclass-constructor)
  - [getApplicativeMonoid](#getapplicativemonoid)
  - [getApplySemigroup](#getapplysemigroup)
  - [getEq](#geteq)
  - [getMonoid](#getmonoid)
  - [getSemigroup](#getsemigroup)
  - [getShow](#getshow)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <A>(f: Lazy<Data<A>>) => <B>(b: Data<B>) => Data<A | B>
```

Added in v0.9.2

## altAll

**Signature**

```ts
export declare const altAll: <A>(startWith: Data<A>) => (as: readonly Data<A>[]) => Data<A>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <A>(fa: Data<A>) => <B>(fab: Data<(a: A) => B>) => Data<B>
```

Added in v0.9.2

## apFirst

**Signature**

```ts
export declare const apFirst: <B>(second: Data<B>) => <A>(first: Data<A>) => Data<A>
```

Added in v0.9.2

## apS

**Signature**

```ts
export declare const apS: <N, A, B>(
  name: Exclude<N, keyof A>,
  fb: Data<B>,
) => (fa: Data<A>) => Data<{ readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSecond

**Signature**

```ts
export declare const apSecond: <B>(second: Data<B>) => <A>(first: Data<A>) => Data<B>
```

Added in v0.9.2

## apT

**Signature**

```ts
export declare const apT: <B>(fb: Data<B>) => <A>(fas: Data<A>) => Data<readonly [...A, B]>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Data<B>,
) => (ma: Data<A>) => Data<{ readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(name: N) => <A>(fa: Data<A>) => Data<{ [K in N]: A }>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, B>(f: (value: A) => Data<B>) => (data: Data<A>) => Data<B>
```

Added in v0.9.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, B>(f: (a: A) => Data<B>) => (first: Data<A>) => Data<A>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, B>(
  f: (value: A) => Data<Ei.Either<A, B>>,
) => (value: A) => Data<B>
```

Added in v0.9.2

## compact

**Signature**

```ts
export declare const compact: <A>(dataOption: Data<O.Option<A>>) => Data<A>
```

Added in v0.9.2

## elem

**Signature**

```ts
export declare const elem: <A>(E: Eq<A>) => (a: A) => (ma: Data<A>) => boolean
```

Added in v0.9.2

## exists

**Signature**

```ts
export declare const exists: <A>(predicate: Predicate<A>) => (ma: Data<A>) => boolean
```

Added in v0.9.2

## filter

**Signature**

```ts
export declare const filter: Filter1<'@typed/fp/Data'>
```

Added in v0.9.2

## filterMap

**Signature**

```ts
export declare const filterMap: <A, B>(f: (a: A) => O.Option<B>) => (fa: Data<A>) => Data<B>
```

Added in v0.9.2

## flap

**Signature**

```ts
export declare const flap: <A>(a: A) => <B>(fab: Data<(a: A) => B>) => Data<B>
```

Added in v0.9.2

## foldMap

**Signature**

```ts
export declare function foldMap<M>(M: Monoid<M>): <A>(f: (a: A) => M) => (fa: Data<A>) => M
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare const getOrElse: <A>(
  onInitial: () => A,
  onLoading: (progress: O.Option<P.Progress>) => A,
) => (ma: Data<A>) => A
```

Added in v0.9.2

## getOrElseW

**Signature**

```ts
export declare const getOrElseW: <A, B>(
  onInitial: () => A,
  onLoading: (progress: O.Option<P.Progress>) => B,
) => <C>(ma: Data<C>) => A | B | C
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(f: (value: A) => B) => (data: Data<A>) => Data<B>
```

Added in v0.9.2

## partition

**Signature**

```ts
export declare const partition: Partition1<'@typed/fp/Data'>
```

Added in v0.9.2

## partitionMap

**Signature**

```ts
export declare const partitionMap: <A, B, C>(
  f: (a: A) => Ei.Either<B, C>,
) => (fa: Data<A>) => Separated<Data<B>, Data<C>>
```

Added in v0.9.2

## separate

**Signature**

```ts
export declare const separate: <E, A>(
  dataEither: Data<Ei.Either<E, A>>,
) => Separated<Data<E>, Data<A>>
```

Added in v0.9.2

## toLoading

**Signature**

```ts
export declare const toLoading: <A>(data: Data<A>) => Data<A>
```

Added in v0.9.2

## traverse

**Signature**

```ts
export declare function traverse<F>(F: App.Applicative<F>)
```

Added in v0.9.2

## tupled

**Signature**

```ts
export declare const tupled: <A>(fa: Data<A>) => Data<readonly [A]>
```

Added in v0.9.2

# Constructor

## fromNullable

**Signature**

```ts
export declare const fromNullable: <A>(a: A | null | undefined) => Data<A>
```

Added in v0.9.2

## fromProgress

**Signature**

```ts
export declare const fromProgress: (progress: P.Progress) => Loading
```

Added in v0.9.2

## loading

**Signature**

```ts
export declare const loading: Loading
```

Added in v0.9.2

## noData

**Signature**

```ts
export declare const noData: NoData
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A>(value: A) => Data<A>
```

Added in v0.9.2

## refresh

**Signature**

```ts
export declare const refresh: <A>(value: A, progress?: O.Option<P.Progress>) => Refresh<A>
```

Added in v0.9.2

## replete

**Signature**

```ts
export declare const replete: <A>(value: A) => Replete<A>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: <A>() => Data<A>
```

Added in v0.9.2

# Deconstructor

## match

**Signature**

```ts
export declare const match: <A, B>(
  onNoData: () => A,
  onLoading: () => A,
  onRefresh: (value: B) => A,
  onReplete: (value: B) => A,
) => (data: Data<B>) => A
```

Added in v0.9.2

## match3W

**Signature**

```ts
export declare const match3W: <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<P.Progress>) => B,
  onRefreshOrReplete: (value: C) => D,
) => (data: Data<C>) => A | B | D
```

Added in v0.9.2

## matchW

**Signature**

```ts
export declare const matchW: <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<P.Progress>) => B,
  onRefresh: (value: C, progress: O.Option<P.Progress>) => D,
  onReplete: (value: C) => E,
) => (data: Data<C>) => A | B | D | E
```

Added in v0.9.2

## reduce

**Signature**

```ts
export declare const reduce: <A, B>(seed: A, f: (acc: A, value: B) => A) => (data: Data<B>) => A
```

Added in v0.9.2

## reduceRight

**Signature**

```ts
export declare const reduceRight: <A, B>(
  seed: A,
  f: (value: B, acc: A) => A,
) => (data: Data<B>) => A
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: AD.Alt1<'@typed/fp/Data'>
```

Added in v0.9.2

## Alternative

**Signature**

```ts
export declare const Alternative: Alternative_.Alternative1<'@typed/fp/Data'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: App.Applicative1<'@typed/fp/Data'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply1<'@typed/fp/Data'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Ch.Chain1<'@typed/fp/Data'>
```

Added in v0.9.2

## Compactable

**Signature**

```ts
export declare const Compactable: Compactable1<'@typed/fp/Data'>
```

Added in v0.9.2

## Filterable

**Signature**

```ts
export declare const Filterable: Filterable1<'@typed/fp/Data'>
```

Added in v0.9.2

## Foldable

**Signature**

```ts
export declare const Foldable: Foldable1<'@typed/fp/Data'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: F.Functor1<'@typed/fp/Data'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad1<'@typed/fp/Data'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed1<'@typed/fp/Data'>
```

Added in v0.9.2

## Traversable

**Signature**

```ts
export declare const Traversable: Traversable1<'@typed/fp/Data'>
```

Added in v0.9.2

# Model

## Data (type alias)

**Signature**

```ts
export type Data<A> = NoData | Loading | Refresh<A> | Replete<A>
```

Added in v0.9.2

## Loading (interface)

**Signature**

```ts
export interface Loading {
  readonly _tag: 'Loading'
  readonly progress: O.Option<P.Progress>
}
```

Added in v0.9.2

## NoData (interface)

**Signature**

```ts
export interface NoData {
  readonly _tag: 'NoData'
}
```

Added in v0.9.2

## Refresh (interface)

**Signature**

```ts
export interface Refresh<A> {
  readonly _tag: 'Refresh'
  readonly value: A
  readonly progress: O.Option<P.Progress>
}
```

Added in v0.9.2

## Replete (interface)

**Signature**

```ts
export interface Replete<A> {
  readonly _tag: 'Replete'
  readonly value: A
}
```

Added in v0.9.2

# Natural Transformation

## fromOption

**Signature**

```ts
export declare const fromOption: <A>(option: O.Option<A>) => Data<A>
```

Added in v0.9.2

## toOption

**Signature**

```ts
export declare const toOption: <A>(data: Data<A>) => O.Option<A>
```

Added in v0.9.2

# Refinement

## hasValue

**Signature**

```ts
export declare const hasValue: <A>(data: Data<A>) => data is Refresh<A> | Replete<A>
```

Added in v0.9.2

## isLoading

**Signature**

```ts
export declare const isLoading: <A>(data: Data<A>) => data is Loading
```

Added in v0.9.2

## isNoData

**Signature**

```ts
export declare const isNoData: <A>(data: Data<A>) => data is NoData
```

Added in v0.9.2

## isRefresh

**Signature**

```ts
export declare const isRefresh: <A>(data: Data<A>) => data is Refresh<A>
```

Added in v0.9.2

## isReplete

**Signature**

```ts
export declare const isReplete: <A>(data: Data<A>) => data is Replete<A>
```

Added in v0.9.2

# Type-level

## Value (type alias)

**Signature**

```ts
export type Value<A> = [A] extends [Data<infer R>] ? R : never
```

Added in v0.9.2

# Typeclass Constructor

## getApplicativeMonoid

**Signature**

```ts
export declare const getApplicativeMonoid: <A>(M: Monoid<A>) => Monoid<Data<A>>
```

Added in v0.9.2

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A>(S: Semigroup<A>) => Semigroup<Data<A>>
```

Added in v0.9.2

## getEq

**Signature**

```ts
export declare const getEq: <A>(S: Eq<A>) => Eq<Data<A>>
```

Added in v0.9.2

## getMonoid

**Signature**

```ts
export declare const getMonoid: <A>(S: Semigroup<A>) => Monoid<Data<A>>
```

Added in v0.9.2

## getSemigroup

**Signature**

```ts
export declare const getSemigroup: <A>(S: Semigroup<A>) => Semigroup<Data<A>>
```

Added in v0.9.2

## getShow

**Signature**

```ts
export declare const getShow: <A>(S: Show<A>) => Show<Data<A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Data'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
