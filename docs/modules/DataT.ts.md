---
title: DataT.ts
nav_order: 8
parent: Modules
---

## DataT overview

DataT is a collection of transformers than can lift your effect types to use Data to represent
asynchronous loading.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [ap](#ap)
  - [chain](#chain)
  - [getOrElse](#getorelse)
  - [getOrElseW](#getorelsew)
  - [map](#map)
- [Constructor](#constructor)
  - [fromProgress](#fromprogress)
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

---

# Combinator

## alt

**Signature**

```ts
export declare function alt<M extends URIS4>(
  M: Monad.Monad4<M>,
): <S1, R1, E1, A>(
  second: Lazy<Kind4<M, S1, R1, E1, D.Data<A>>>,
) => <S2, R2, E2>(
  first: Kind4<M, S2, R2, E2, D.Data<A>>,
) => Kind4<
  M,
  ApplyVariance<M, 'S', [S1, S2]>,
  ApplyVariance<M, 'R', [R1, R2]>,
  ApplyVariance<M, 'E', [E1, E2]>,
  D.Data<A>
>
export declare function alt<M extends URIS3>(
  M: Monad.Monad3<M>,
): <R1, E1, A>(
  second: Lazy<Kind3<M, R1, E1, D.Data<A>>>,
) => <R2, E2>(
  first: Kind3<M, R2, E2, D.Data<A>>,
) => Kind3<M, ApplyVariance<M, 'R', [R1, R2]>, ApplyVariance<M, 'E', [E1, E2]>, D.Data<A>>
export declare function alt<M extends URIS2>(
  M: Monad.Monad2<M>,
): <E1, A>(
  second: Lazy<Kind2<M, E1, D.Data<A>>>,
) => <E2>(first: Kind2<M, E2, D.Data<A>>) => Kind2<M, ApplyVariance<M, 'E', [E1, E2]>, D.Data<A>>
export declare function alt<M extends URIS>(
  M: Monad.Monad1<M>,
): <A>(second: Lazy<Kind<M, D.Data<A>>>) => (first: Kind<M, D.Data<A>>) => Kind<M, D.Data<A>>
export declare function alt<M>(
  M: Monad.Monad<M>,
): <A>(second: Lazy<HKT<M, D.Data<A>>>) => (first: HKT<M, D.Data<A>>) => HKT<M, D.Data<A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare function ap<F extends URIS4>(
  F: Apply.Apply4<F>,
): <S1, R1, E1, A>(
  fa: Kind4<F, S1, R1, E1, D.Data<A>>,
) => <S2, R2, E2, B>(
  fab: Kind4<F, S2, R2, E2, D.Data<(a: A) => B>>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', [S1, S2]>,
  ApplyVariance<F, 'R', [R1, R2]>,
  ApplyVariance<F, 'E', [E1, E2]>,
  D.Data<B>
>
export declare function ap<F extends URIS3, E>(
  F: Apply.Apply3C<F, E>,
): <R1, A>(
  fa: Kind3<F, R1, E, D.Data<A>>,
) => <R2, B>(
  fab: Kind3<F, R2, E, D.Data<(a: A) => B>>,
) => Kind3<F, ApplyVariance<F, 'R', [R1, R2]>, E, D.Data<B>>
export declare function ap<F extends URIS3>(
  F: Apply.Apply3<F>,
): <R1, E1, A>(
  fa: Kind3<F, R1, E1, D.Data<A>>,
) => <R2, E2, B>(
  fab: Kind3<F, R2, E2, D.Data<(a: A) => B>>,
) => Kind3<F, ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, D.Data<B>>
export declare function ap<F extends URIS2, E>(
  F: Apply.Apply2C<F, E>,
): <A>(
  fa: Kind2<F, E, D.Data<A>>,
) => <B>(fab: Kind2<F, E, D.Data<(a: A) => B>>) => Kind2<F, E, D.Data<B>>
export declare function ap<F extends URIS2>(
  F: Apply.Apply2<F>,
): <E1, A>(
  fa: Kind2<F, E1, D.Data<A>>,
) => <E2, B>(
  fab: Kind2<F, E2, D.Data<(a: A) => B>>,
) => Kind2<F, ApplyVariance<F, 'E', [E1, E2]>, D.Data<B>>
export declare function ap<F extends URIS>(
  F: Apply.Apply1<F>,
): <A>(fa: Kind<F, D.Data<A>>) => <B>(fab: Kind<F, D.Data<(a: A) => B>>) => Kind<F, D.Data<B>>
export declare function ap<F>(
  F: Apply.Apply<F>,
): <A>(fa: HKT<F, D.Data<A>>) => <B>(fab: HKT<F, D.Data<(a: A) => B>>) => HKT<F, D.Data<B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare function chain<F extends URIS4>(
  M: Monad.Monad4<F>,
): <A, S1, R1, E1, B>(
  f: (value: A) => Kind4<F, S1, R1, E1, D.Data<B>>,
) => <S2, R2, E2>(
  fa: Kind4<F, S2, R2, E2, D.Data<A>>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', [S1, S2]>,
  ApplyVariance<F, 'R', [R1, R2]>,
  ApplyVariance<F, 'E', [E1, E2]>,
  D.Data<B>
>
export declare function chain<F extends URIS3>(
  M: Monad.Monad3<F>,
): <A, R1, E1, B>(
  f: (value: A) => Kind3<F, R1, E1, D.Data<B>>,
) => <R2, E2>(
  fa: Kind3<F, R2, E2, D.Data<A>>,
) => Kind3<F, ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, D.Data<B>>
export declare function chain<F extends URIS2>(
  M: Monad.Monad2<F>,
): <A, E1, B>(
  f: (value: A) => Kind2<F, E1, D.Data<B>>,
) => <E2>(fa: Kind2<F, E2, D.Data<A>>) => Kind2<F, ApplyVariance<F, 'E', [E1, E2]>, D.Data<B>>
export declare function chain<F extends URIS>(
  M: Monad.Monad1<F>,
): <A, B>(f: (value: A) => Kind<F, D.Data<B>>) => (fa: Kind<F, D.Data<A>>) => Kind<F, D.Data<B>>
export declare function chain<F>(
  M: Monad.Monad<F>,
): <A, B>(f: (value: A) => HKT<F, D.Data<B>>) => (fa: HKT<F, D.Data<A>>) => HKT<F, D.Data<B>>
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare function getOrElse<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
) => <S, R, E>(ma: Kind4<F, S, R, E, D.Data<A>>) => Kind4<F, S, R, E, A>
export declare function getOrElse<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
) => <R, E>(ma: Kind3<F, R, E, D.Data<A>>) => Kind3<F, R, E, A>
export declare function getOrElse<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
) => <E>(ma: Kind2<F, E, D.Data<A>>) => Kind2<F, E, A>
export declare function getOrElse<F extends URIS>(
  F: Functor.Functor1<F>,
): <A>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
) => (ma: Kind<F, D.Data<A>>) => Kind<F, A>
export declare function getOrElse<F>(
  F: Functor.Functor<F>,
): <A>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
) => (ma: HKT<F, D.Data<A>>) => HKT<F, A>
```

Added in v0.9.2

## getOrElseW

**Signature**

```ts
export declare function getOrElseW<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
) => <S, R, E, C>(ma: Kind4<F, S, R, E, D.Data<C>>) => Kind4<F, S, R, E, A | B | C>
export declare function getOrElseW<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
) => <R, E, C>(ma: Kind3<F, R, E, D.Data<C>>) => Kind3<F, R, E, A | B | C>
export declare function getOrElseW<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
) => <E, C>(ma: Kind2<F, E, D.Data<C>>) => Kind2<F, E, A | B | C>
export declare function getOrElseW<F extends URIS>(
  F: Functor.Functor1<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
) => <C>(ma: Kind<F, D.Data<C>>) => Kind<F, C>
export declare function getOrElseW<F>(
  F: Functor.Functor<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
) => <C>(ma: HKT<F, D.Data<C>>) => HKT<F, A | B | C>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare function map<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A, B>(
  f: (a: A) => B,
) => <S, R, E>(fa: Kind4<F, S, R, E, D.Data<A>>) => Kind4<F, S, R, E, D.Data<B>>
export declare function map<F extends URIS3, E>(
  F: Functor.Functor3C<F, E>,
): <A, B>(f: (a: A) => B) => <R>(fa: Kind3<F, R, E, D.Data<A>>) => Kind3<F, R, E, D.Data<B>>
export declare function map<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A, B>(f: (a: A) => B) => <R, E>(fa: Kind3<F, R, E, D.Data<A>>) => Kind3<F, R, E, D.Data<B>>
export declare function map<F extends URIS2, E>(
  F: Functor.Functor2C<F, E>,
): <A, B>(f: (a: A) => B) => (fa: Kind2<F, E, D.Data<A>>) => Kind2<F, E, D.Data<B>>
export declare function map<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A, B>(f: (a: A) => B) => <E>(fa: Kind2<F, E, D.Data<A>>) => Kind2<F, E, D.Data<B>>
export declare function map<F extends URIS>(
  F: Functor.Functor1<F>,
): <A, B>(f: (a: A) => B) => (fa: Kind<F, D.Data<A>>) => Kind<F, D.Data<B>>
export declare function map<F>(
  F: Functor.Functor<F>,
): <A, B>(f: (a: A) => B) => (fa: HKT<F, D.Data<A>>) => HKT<F, D.Data<B>>
```

Added in v0.9.2

# Constructor

## fromProgress

**Signature**

```ts
export declare function fromProgress<
  F extends URIS4,
  S = Initial<F, 'S'>,
  R = Initial<F, 'R'>,
  E = Initial<F, 'E'>,
>(P: Pointed4<F>): (progress: Progress) => Kind4<F, S, R, E, D.Loading>
export declare function fromProgress<F extends URIS3, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  P: Pointed3<F>,
): (progress: Progress) => Kind3<F, R, E, D.Loading>
export declare function fromProgress<F extends URIS2, E = Initial<F, 'E'>>(
  P: Pointed2<F>,
): (progress: Progress) => Kind2<F, E, D.Loading>
export declare function fromProgress<F extends URIS>(
  P: Pointed1<F>,
): (progress: Progress) => Kind<F, D.Loading>
export declare function fromProgress<F>(P: Pointed<F>): (progress: Progress) => HKT<F, D.Loading>
```

Added in v0.9.2

## loading

**Signature**

```ts
export declare function loading<
  F extends URIS4,
  S = Initial<F, 'S'>,
  R = Initial<F, 'R'>,
  E = Initial<F, 'E'>,
>(P: Pointed4<F>): Kind4<F, S, R, E, D.Loading>
export declare function loading<F extends URIS3, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  P: Pointed3<F>,
): Kind3<F, R, E, D.Loading>
export declare function loading<F extends URIS2, E = Initial<F, 'E'>>(
  P: Pointed2<F>,
): Kind2<F, E, D.Loading>
export declare function loading<F extends URIS>(P: Pointed1<F>): Kind<F, D.Loading>
export declare function loading<F>(P: Pointed<F>): HKT<F, D.Loading>
```

Added in v0.9.2

## noData

**Signature**

```ts
export declare function noData<
  F extends URIS4,
  S = Initial<F, 'S'>,
  R = Initial<F, 'R'>,
  E = Initial<F, 'E'>,
>(P: Pointed4<F>): Kind4<F, S, R, E, D.NoData>
export declare function noData<F extends URIS3, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  P: Pointed3<F>,
): Kind3<F, R, E, D.NoData>
export declare function noData<F extends URIS2, E = Initial<F, 'E'>>(
  P: Pointed2<F>,
): Kind2<F, E, D.NoData>
export declare function noData<F extends URIS>(P: Pointed1<F>): Kind<F, D.NoData>
export declare function noData<F>(P: Pointed<F>): HKT<F, D.NoData>
```

Added in v0.9.2

## refresh

**Signature**

```ts
export declare function refresh<F extends URIS4>(
  P: Pointed4<F>,
): <A, S = Initial<F, 'S'>, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  value: A,
  progress?: O.Option<Progress>,
) => Kind4<F, S, R, E, D.Refresh<A>>
export declare function refresh<F extends URIS3, E>(
  P: Pointed3C<F, E>,
): <A, R = Initial<F, 'R'>>(value: A, progress?: O.Option<Progress>) => Kind3<F, R, E, D.Refresh<A>>
export declare function refresh<F extends URIS3>(
  P: Pointed3<F>,
): <A, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  value: A,
  progress?: O.Option<Progress>,
) => Kind3<F, R, E, D.Refresh<A>>
export declare function refresh<F extends URIS2, E>(
  P: Pointed2C<F, E>,
): <A>(value: A, progress?: O.Option<Progress>) => Kind2<F, E, D.Refresh<A>>
export declare function refresh<F extends URIS2>(
  P: Pointed2<F>,
): <A, E = Initial<F, 'E'>>(value: A, progress?: O.Option<Progress>) => Kind2<F, E, D.Refresh<A>>
export declare function refresh<F extends URIS>(
  P: Pointed1<F>,
): <A>(value: A, progress?: O.Option<Progress>) => Kind<F, D.Refresh<A>>
export declare function refresh<F>(
  P: Pointed<F>,
): <A>(value: A, progress?: O.Option<Progress>) => HKT<F, D.Refresh<A>>
```

Added in v0.9.2

## replete

**Signature**

```ts
export declare function replete<F extends URIS4>(
  P: Pointed4<F>,
): <A, S = Initial<F, 'S'>, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  value: A,
) => Kind4<F, S, R, E, D.Replete<A>>
export declare function replete<F extends URIS3, E>(
  P: Pointed3C<F, E>,
): <A, R = Initial<F, 'R'>>(value: A) => Kind3<F, R, E, D.Replete<A>>
export declare function replete<F extends URIS3>(
  P: Pointed3<F>,
): <A, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(value: A) => Kind3<F, R, E, D.Replete<A>>
export declare function replete<F extends URIS2, E>(
  P: Pointed2C<F, E>,
): <A>(value: A) => Kind2<F, E, D.Replete<A>>
export declare function replete<F extends URIS2>(
  P: Pointed2<F>,
): <A, E = Initial<F, 'E'>>(value: A) => Kind2<F, E, D.Replete<A>>
export declare function replete<F extends URIS>(
  P: Pointed1<F>,
): <A>(value: A) => Kind<F, D.Replete<A>>
export declare function replete<F>(P: Pointed<F>): <A>(value: A) => HKT<F, D.Replete<A>>
```

Added in v0.9.2

## repleteF

**Signature**

```ts
export declare function repleteF<F extends URIS4>(
  F: Functor.Functor4<F>,
): <S, R, E, A>(fa: Kind4<F, S, R, E, A>) => Kind4<F, S, R, E, D.Replete<A>>
export declare function repleteF<F extends URIS3, E>(
  F: Functor.Functor3C<F, E>,
): <R, A>(fa: Kind3<F, R, E, A>) => Kind3<F, R, E, D.Replete<A>>
export declare function repleteF<F extends URIS3>(
  F: Functor.Functor3<F>,
): <R, E, A>(fa: Kind3<F, R, E, A>) => Kind3<F, R, E, D.Replete<A>>
export declare function repleteF<F extends URIS2, E>(
  F: Functor.Functor2C<F, E>,
): <A>(fa: Kind2<F, E, A>) => Kind2<F, E, D.Replete<A>>
export declare function repleteF<F extends URIS2>(
  F: Functor.Functor2<F>,
): <E, A>(fa: Kind2<F, E, A>) => Kind2<F, E, D.Replete<A>>
export declare function repleteF<F extends URIS>(
  F: Functor.Functor1<F>,
): <A>(fa: Kind<F, A>) => Kind<F, D.Replete<A>>
export declare function repleteF<F>(
  F: Functor.Functor<F>,
): <A>(fa: HKT<F, A>) => HKT<F, D.Replete<A>>
```

Added in v0.9.2

# Deconstructor

## match

**Signature**

```ts
export declare function match<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
  onRefresh: (value: B, progress: O.Option<Progress>) => A,
  onReplete: (value: B) => A,
) => <S, R, E>(fa: Kind4<F, S, R, E, D.Data<B>>) => Kind4<F, S, R, E, A>
export declare function match<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
  onRefresh: (value: B, progress: O.Option<Progress>) => A,
  onReplete: (value: B) => A,
) => <R, E>(fa: Kind3<F, R, E, D.Data<B>>) => Kind3<F, R, E, A>
export declare function match<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
  onRefresh: (value: B, progress: O.Option<Progress>) => A,
  onReplete: (value: B) => A,
) => <E>(fa: Kind2<F, E, D.Data<B>>) => Kind2<F, E, A>
export declare function match<F extends URIS>(
  F: Functor.Functor1<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
  onRefresh: (value: B, progress: O.Option<Progress>) => A,
  onReplete: (value: B) => A,
) => (fa: Kind<F, D.Data<B>>) => Kind<F, A>
export declare function match<F>(
  F: Functor.Functor<F>,
): <A, B>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => A,
  onRefresh: (value: B, progress: O.Option<Progress>) => A,
  onReplete: (value: B) => A,
) => (fa: HKT<F, D.Data<B>>) => HKT<F, A>
```

Added in v0.9.2

## match3W

**Signature**

```ts
export declare function match3W<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onReplete: (value: C) => D,
) => <S, R, E>(fa: Kind4<F, S, R, E, D.Data<C>>) => Kind4<F, S, R, E, A | B | D>
export declare function match3W<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onReplete: (value: C) => D,
) => <R, E>(fa: Kind3<F, R, E, D.Data<C>>) => Kind3<F, R, E, A | B | D>
export declare function match3W<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onReplete: (value: C) => D,
) => <E>(fa: Kind2<F, E, D.Data<C>>) => Kind2<F, E, A | B | D>
export declare function match3W<F extends URIS>(
  F: Functor.Functor1<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onReplete: (value: C) => D,
) => (fa: Kind<F, D.Data<C>>) => Kind<F, A | B | D>
export declare function match3W<F>(
  F: Functor.Functor<F>,
): <A, B, C, D>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onReplete: (value: C) => D,
) => (fa: HKT<F, D.Data<C>>) => HKT<F, A | B | D>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare function matchE<F extends URIS4>(
  C: Chain.Chain4<F>,
): <S1, R1, E1, A, S2, R2, E2, B, S3, R3, E3, S4, R4, E4>(
  onNoData: () => Kind4<F, S1, R1, E1, A>,
  onLoading: (progress: O.Option<Progress>) => Kind4<F, S2, R2, E2, A>,
  onRefresh: (value: B, progress: O.Option<Progress>) => Kind4<F, S3, R3, E3, A>,
  onReplete: (value: B) => Kind4<F, S4, R4, E4, A>,
) => <S5, R5, E5>(
  data: Kind4<F, S5, R5, E5, D.Data<B>>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', [S1, S2, S3, S4, S5]>,
  ApplyVariance<F, 'R', [R1, R2, R3, R4, R5]>,
  ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>,
  A
>
export declare function matchE<F extends URIS3>(
  C: Chain.Chain3<F>,
): <R1, E1, A, R2, E2, B, R3, E3, R4, E4>(
  onNoData: () => Kind3<F, R1, E1, A>,
  onLoading: (progress: O.Option<Progress>) => Kind3<F, R2, E2, A>,
  onRefresh: (value: B, progress: O.Option<Progress>) => Kind3<F, R3, E3, A>,
  onReplete: (value: B) => Kind3<F, R4, E4, A>,
) => <R5, E5>(
  data: Kind3<F, R5, E5, D.Data<B>>,
) => Kind3<
  F,
  ApplyVariance<F, 'R', [R1, R2, R3, R4, R5]>,
  ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>,
  A
>
export declare function matchE<F extends URIS2>(
  C: Chain.Chain2<F>,
): <E1, A, E2, B, E3, E4>(
  onNoData: () => Kind2<F, E1, A>,
  onLoading: (progress: O.Option<Progress>) => Kind2<F, E2, A>,
  onRefresh: (value: B, progress: O.Option<Progress>) => Kind2<F, E3, A>,
  onReplete: (value: B) => Kind2<F, E4, A>,
) => <E5>(data: Kind2<F, E5, D.Data<B>>) => Kind2<F, ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>, A>
export declare function matchE<F extends URIS>(
  C: Chain.Chain1<F>,
): <A, B>(
  onNoData: () => Kind<F, A>,
  onLoading: (progress: O.Option<Progress>) => Kind<F, A>,
  onRefresh: (value: B, progress: O.Option<Progress>) => Kind<F, A>,
  onReplete: (value: B) => Kind<F, A>,
) => (data: Kind<F, D.Data<B>>) => Kind<F, A>
export declare function matchE<F>(
  C: Chain.Chain<F>,
): <A, B>(
  onNoData: () => HKT<F, A>,
  onLoading: (progress: O.Option<Progress>) => HKT<F, A>,
  onRefresh: (value: B, progress: O.Option<Progress>) => HKT<F, A>,
  onReplete: (value: B) => HKT<F, A>,
) => (data: HKT<F, D.Data<B>>) => HKT<F, A>
```

Added in v0.9.2

## matchEW

**Signature**

```ts
export declare function matchEW<F extends URIS4>(
  C: Chain.Chain4<F>,
): <S1, R1, E1, A, S2, R2, E2, B, C, S3, R3, E3, D, S4, R4, E4, E>(
  onNoData: () => Kind4<F, S1, R1, E1, A>,
  onLoading: (progress: O.Option<Progress>) => Kind4<F, S2, R2, E2, B>,
  onRefresh: (value: C, progress: O.Option<Progress>) => Kind4<F, S3, R3, E3, D>,
  onReplete: (value: C) => Kind4<F, S4, R4, E4, E>,
) => <S5, R5, E5>(
  data: Kind4<F, S5, R5, E5, D.Data<C>>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', [S1, S2, S3, S4, S5]>,
  ApplyVariance<F, 'R', [R1, R2, R3, R4, R5]>,
  ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>,
  A | B | D | E
>
export declare function matchEW<F extends URIS3>(
  C: Chain.Chain3<F>,
): <R1, E1, A, R2, E2, B, C, R3, E3, D, R4, E4, E>(
  onNoData: () => Kind3<F, R1, E1, A>,
  onLoading: (progress: O.Option<Progress>) => Kind3<F, R2, E2, B>,
  onRefresh: (value: C, progress: O.Option<Progress>) => Kind3<F, R3, E3, D>,
  onReplete: (value: C) => Kind3<F, R4, E4, E>,
) => <R5, E5>(
  data: Kind3<F, R5, E5, D.Data<C>>,
) => Kind3<
  F,
  ApplyVariance<F, 'R', [R1, R2, R3, R4, R5]>,
  ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>,
  A | B | D | E
>
export declare function matchEW<F extends URIS2>(
  C: Chain.Chain2<F>,
): <E1, A, E2, B, C, E3, D, E4, E>(
  onNoData: () => Kind2<F, E1, A>,
  onLoading: (progress: O.Option<Progress>) => Kind2<F, E2, B>,
  onRefresh: (value: C, progress: O.Option<Progress>) => Kind2<F, E3, D>,
  onReplete: (value: C) => Kind2<F, E4, E>,
) => <E5>(
  data: Kind2<F, E5, D.Data<C>>,
) => Kind2<F, ApplyVariance<F, 'E', [E1, E2, E3, E4, E5]>, A | B | D | E>
export declare function matchEW<F extends URIS>(
  C: Chain.Chain1<F>,
): <A, B, C, D, E>(
  onNoData: () => Kind<F, A>,
  onLoading: (progress: O.Option<Progress>) => Kind<F, B>,
  onRefresh: (value: C, progress: O.Option<Progress>) => Kind<F, D>,
  onReplete: (value: C) => Kind<F, E>,
) => (data: Kind<F, D.Data<C>>) => Kind<F, A | B | D | E>
export declare function matchEW<F>(
  C: Chain.Chain<F>,
): <A, B, C, D, E>(
  onNoData: () => HKT<F, A>,
  onLoading: (progress: O.Option<Progress>) => HKT<F, B>,
  onRefresh: (value: C, progress: O.Option<Progress>) => HKT<F, D>,
  onReplete: (value: C) => HKT<F, E>,
) => (data: HKT<F, D.Data<C>>) => HKT<F, A | B | D | E>
```

Added in v0.9.2

## matchW

**Signature**

```ts
export declare function matchW<F extends URIS4>(
  F: Functor.Functor4<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onRefresh: (value: C, progress: O.Option<Progress>) => D,
  onReplete: (value: C) => E,
) => <S, R, EF>(fa: Kind4<F, S, R, EF, D.Data<C>>) => Kind4<F, S, R, EF, A | B | D | E>
export declare function matchW<F extends URIS3>(
  F: Functor.Functor3<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onRefresh: (value: C, progress: O.Option<Progress>) => D,
  onReplete: (value: C) => E,
) => <R, EF>(fa: Kind3<F, R, EF, D.Data<C>>) => Kind3<F, R, EF, A | B | D | E>
export declare function matchW<F extends URIS2>(
  F: Functor.Functor2<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onRefresh: (value: C, progress: O.Option<Progress>) => D,
  onReplete: (value: C) => E,
) => <EF>(fa: Kind2<F, EF, D.Data<C>>) => Kind2<F, E, A | B | D | E>
export declare function matchW<F extends URIS>(
  F: Functor.Functor1<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onRefresh: (value: C, progress: O.Option<Progress>) => D,
  onReplete: (value: C) => E,
) => (fa: Kind<F, D.Data<C>>) => Kind<F, A | B | D | E>
export declare function matchW<F>(
  F: Functor.Functor<F>,
): <A, B, C, D, E>(
  onNoData: () => A,
  onLoading: (progress: O.Option<Progress>) => B,
  onRefresh: (value: C, progress: O.Option<Progress>) => D,
  onReplete: (value: C) => E,
) => (fa: HKT<F, D.Data<C>>) => HKT<F, A | B | D | E>
```

Added in v0.9.2
