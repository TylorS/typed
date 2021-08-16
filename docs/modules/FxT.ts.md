---
title: FxT.ts
nav_order: 27
parent: Modules
---

## FxT overview

Added in v0.13.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [ap](#ap)
  - [chain](#chain)
  - [chainRec](#chainrec)
  - [map](#map)
  - [provideAll](#provideall)
  - [provideSome](#providesome)
  - [useAll](#useall)
  - [useSome](#usesome)
- [Constructor](#constructor)
  - [ask](#ask)
  - [liftFx](#liftfx)
  - [of](#of)
- [Interpreter](#interpreter)
  - [toMonad](#tomonad)
- [Lift](#lift)
  - [getDo](#getdo)
- [Model](#model)
  - [FxT (type alias)](#fxt-type-alias)
- [Natural Transformation](#natural-transformation)
  - [fromNaturalTransformation](#fromnaturaltransformation)
- [Type-level](#type-level)
  - [ChainRecFxT (type alias)](#chainrecfxt-type-alias)
  - [LiftFx (type alias)](#liftfx-type-alias)
  - [LiftFx1 (type alias)](#liftfx1-type-alias)
  - [LiftFx2 (type alias)](#liftfx2-type-alias)
  - [LiftFx3 (type alias)](#liftfx3-type-alias)
  - [LiftFx4 (type alias)](#liftfx4-type-alias)
  - [LiftFxHKT (type alias)](#liftfxhkt-type-alias)

---

# Combinator

## ap

**Signature**

```ts
export declare function ap<F extends URIS>(
  M: MonadRec1<F> & Apply1<F>,
): <A>(fa: FxT<F, [A]>) => <B>(fab: FxT<F, [Arity1<A, B>]>) => FxT<F, [B]>
export declare function ap<F extends URIS2>(
  M: MonadRec2<F> & Apply2<F>,
): <E1, A>(
  fa: FxT<F, [E1, A]>,
) => <E2, B>(fab: FxT<F, [E2, Arity1<A, B>]>) => FxT<F, [ApplyVariance<F, 'E', [E1, E2]>, B]>
export declare function ap<F extends URIS2, E>(
  M: MonadRec2<F> & Apply2<F>,
): <A>(fa: FxT<F, [E, A]>) => <B>(fab: FxT<F, [E, Arity1<A, B>]>) => FxT<F, [E, B]>
export declare function ap<F extends URIS3>(
  M: MonadRec3<F> & Apply3<F>,
): <R1, E1, A>(
  fa: FxT<F, [R1, E1, A]>,
) => <R2, E2, B>(
  fab: FxT<F, [R2, E2, Arity1<A, B>]>,
) => FxT<F, [ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, B]>
export declare function ap<F extends URIS4>(
  M: MonadRec4<F> & Apply4<F>,
): <S1, R1, E1, A>(
  fa: FxT<F, [S1, R1, E1, A]>,
) => <S2, R2, E2, B>(
  fab: FxT<F, [S2, R2, E2, Arity1<A, B>]>,
) => FxT<
  F,
  [
    ApplyVariance<F, 'S', [S1, S2]>,
    ApplyVariance<F, 'R', [R1, R2]>,
    ApplyVariance<F, 'E', [E1, E2]>,
    B,
  ]
>
export declare function ap<F>(
  M: MonadRec<F> & Apply<F>,
): <A>(fa: FxT<F, [A]>) => <B>(fab: FxT<F, [Arity1<A, B>]>) => FxT<F, [B]>
```

Added in v0.13.0

## chain

**Signature**

```ts
export declare function chain<F extends URIS>(): <A, B>(
  f: (value: A) => FxT<F, [B]>,
) => (fx: FxT<F, [A]>) => FxT<F, [ApplyVariance<F, 'A', [B, A]>]>
export declare function chain<F extends URIS2>(): <A, E1, B>(
  f: (value: A) => FxT<F, [E1, B]>,
) => <E2>(fx: FxT<F, [E2, A]>) => FxT<F, [ApplyVariance<F, 'E', [E1, E2]>, B]>
export declare function chain<F extends URIS3>(): <A, R1, E1, B>(
  f: (value: A) => FxT<F, [R1, E1, B]>,
) => <R2, E2>(
  fx: FxT<F, [R2, E2, A]>,
) => FxT<
  F,
  [ApplyVariance<F, 'R', [R1, R2]>, ApplyVariance<F, 'E', [E1, E2]>, ApplyVariance<F, 'A', [B, A]>]
>
export declare function chain<F extends URIS4>(): <A, S1, R1, E1, B>(
  f: (value: A) => FxT<F, [S1, R1, E1, B]>,
) => <S2, R2, E2>(
  fx: FxT<F, [S2, R2, E2, A]>,
) => FxT<
  F,
  [
    ApplyVariance<F, 'S', [S1, S2]>,
    ApplyVariance<F, 'R', [R1, R2]>,
    ApplyVariance<F, 'E', [E1, E2]>,
    ApplyVariance<F, 'A', [B, A]>,
  ]
>
export declare function chain<F>(): <A, B>(
  f: (value: A) => FxT<F, [B]>,
) => (fx: FxT<F, [A]>) => FxT<F, [B]>
```

Added in v0.13.0

## chainRec

**Signature**

```ts
export declare function chainRec<F extends URIS>(M: MonadRec1<F>): ChainRecFxT<F>
export declare function chainRec<F extends URIS2>(M: MonadRec2<F>): ChainRecFxT<F>
export declare function chainRec<F extends URIS3>(M: MonadRec3<F>): ChainRecFxT<F>
export declare function chainRec<F extends URIS4>(M: MonadRec4<F>): ChainRecFxT<F>
```

Added in v0.13.0

## map

**Signature**

```ts
export declare function map<F extends URIS>(): <A, B>(
  f: (value: A) => B,
) => (fx: FxT<F, [A]>) => FxT<F, [B]>
export declare function map<F extends URIS2>(): <A, B>(
  f: (value: A) => B,
) => <E>(fx: FxT<F, [E, A]>) => FxT<F, [E, B]>
export declare function map<F extends URIS3>(): <A, B>(
  f: (value: A) => B,
) => <R, E>(fx: FxT<F, [R, E, A]>) => FxT<F, [R, E, B]>
export declare function map<F extends URIS4>(): <A, B>(
  f: (value: A) => B,
) => <S, R, E>(fx: FxT<F, [S, R, E, A]>) => FxT<F, [S, R, E, B]>
export declare function map<F>(): <A, B>(f: (value: A) => B) => (fx: FxT<F, [A]>) => FxT<F, [B]>
```

Added in v0.13.0

## provideAll

**Signature**

```ts
export declare function provideAll<F extends URIS2>(
  M: ProvideAll2<F> & MonadRec2<F>,
): <A>(provided: A) => <T>(fx: Fx<Hkt<F, [A, unknown]>, T>) => Fx<Hkt<F, [unknown, unknown]>, T>
export declare function provideAll<F extends URIS3>(
  M: ProvideAll3<F> & MonadRec3<F>,
): <A>(
  provided: A,
) => <E, T>(fx: Fx<Hkt<F, [A, E, unknown]>, T>) => Fx<Hkt<F, [unknown, E, unknown]>, T>
export declare function provideAll<F extends URIS4>(
  M: ProvideAll4<F> & MonadRec4<F>,
): <A>(
  provided: A,
) => <S, E, T>(fx: Fx<Hkt<F, [S, A, E, unknown]>, T>) => Fx<Hkt<F, [S, unknown, E, unknown]>, T>
export declare function provideAll<F>(
  M: ProvideAll<F> & MonadRec<F>,
): <A>(provided: A) => <T>(fx: Fx<HKT2<F, A, unknown>, T>) => Fx<HKT2<F, unknown, unknown>, T>
```

Added in v0.13.0

## provideSome

**Signature**

```ts
export declare function provideSome<F extends URIS2>(
  M: ProvideSome2<F> & MonadRec2<F>,
): <A>(provided: A) => <B, T>(fx: Fx<Hkt<F, [A & B, unknown]>, T>) => Fx<Hkt<F, [B, unknown]>, T>
export declare function provideSome<F extends URIS3>(
  M: ProvideSome3<F> & MonadRec3<F>,
): <A>(
  provided: A,
) => <B, E, T>(fx: Fx<Hkt<F, [A & B, E, unknown]>, T>) => Fx<Hkt<F, [B, E, unknown]>, T>
export declare function provideSome<F extends URIS4>(
  M: ProvideSome4<F> & MonadRec4<F>,
): <A>(
  provided: A,
) => <B, S, E, T>(fx: Fx<Hkt<F, [S, A & B, E, unknown]>, T>) => Fx<Hkt<F, [S, B, E, unknown]>, T>
export declare function provideSome<F>(
  M: ProvideSome<F> & MonadRec<F>,
): <A>(provided: A) => <B, T>(fx: Fx<HKT2<F, A & B, unknown>, T>) => Fx<HKT2<F, B, unknown>, T>
```

Added in v0.13.0

## useAll

**Signature**

```ts
export declare function useAll<F extends URIS2>(
  M: UseAll2<F> & MonadRec2<F>,
): <A>(provided: A) => <T>(fx: Fx<Hkt<F, [A, unknown]>, T>) => Fx<Hkt<F, [unknown, unknown]>, T>
export declare function useAll<F extends URIS3>(
  M: UseAll3<F> & MonadRec3<F>,
): <A>(
  provided: A,
) => <E, T>(fx: Fx<Hkt<F, [A, E, unknown]>, T>) => Fx<Hkt<F, [unknown, E, unknown]>, T>
export declare function useAll<F extends URIS4>(
  M: UseAll4<F> & MonadRec4<F>,
): <A>(
  provided: A,
) => <S, E, T>(fx: Fx<Hkt<F, [S, A, E, unknown]>, T>) => Fx<Hkt<F, [S, unknown, E, unknown]>, T>
export declare function useAll<F>(
  M: UseAll<F> & MonadRec<F>,
): <A>(provided: A) => <T>(fx: Fx<HKT2<F, A, unknown>, T>) => Fx<HKT2<F, unknown, unknown>, T>
```

Added in v0.13.0

## useSome

**Signature**

```ts
export declare function useSome<F extends URIS2>(
  M: UseSome2<F> & MonadRec2<F>,
): <A>(provided: A) => <B, T>(fx: Fx<Hkt<F, [A & B, unknown]>, T>) => Fx<Hkt<F, [B, unknown]>, T>
export declare function useSome<F extends URIS3>(
  M: UseSome3<F> & MonadRec3<F>,
): <A>(
  provided: A,
) => <B, E, T>(fx: Fx<Hkt<F, [A & B, E, unknown]>, T>) => Fx<Hkt<F, [B, E, unknown]>, T>
export declare function useSome<F extends URIS4>(
  M: UseSome4<F> & MonadRec4<F>,
): <A>(
  provided: A,
) => <B, S, E, T>(fx: Fx<Hkt<F, [S, A & B, E, unknown]>, T>) => Fx<Hkt<F, [S, B, E, unknown]>, T>
export declare function useSome<F>(
  M: UseSome<F> & MonadRec<F>,
): <A>(provided: A) => <B, T>(fx: Fx<HKT2<F, A & B, unknown>, T>) => Fx<HKT2<F, B, unknown>, T>
```

Added in v0.13.0

# Constructor

## ask

**Signature**

```ts
export declare function ask<F extends URIS2>(M: FromReader2<F>): <A>() => Fx<Hkt<F, [A, A]>, A>
export declare function ask<F extends URIS3>(
  M: FromReader3<F>,
): <A>() => Fx<Hkt<F, [A, Initial<F, 'E'>, A]>, A>
export declare function ask<F extends URIS3, E>(
  M: FromReader3C<F, E>,
): <A>() => Fx<Hkt<F, [A, E, A]>, A>
export declare function ask<F extends URIS4>(
  M: FromReader4<F>,
): <A>() => Fx<Hkt<F, [Initial<F, 'S'>, A, Initial<F, 'E'>, A]>, A>
export declare function ask<F>(M: FromReader<F>): <A>() => Fx<HKT2<F, A, A>, A>
```

Added in v0.13.0

## liftFx

Create a lift function that will convert any F<A> into Fx<F<A>, A>

**Signature**

```ts
export declare const liftFx: <F>() => LiftFx<F>
```

Added in v0.13.0

## of

**Signature**

```ts
export declare function of<F extends URIS>(M: Pointed1<F>): <A>(value: A) => Fx<Hkt<F, [A]>, A>
export declare function of<F extends URIS2>(
  M: Pointed2<F>,
): <A, E = Initial<F, 'E'>>(value: A) => Fx<Hkt<F, [E, A]>, A>
export declare function of<F extends URIS3>(
  M: Pointed3<F>,
): <A, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(value: A) => Fx<Hkt<F, [R, E, A]>, A>
export declare function of<F extends URIS4>(
  M: Pointed4<F>,
): <A, S = Initial<F, 'S'>, R = Initial<F, 'R'>, E = Initial<F, 'E'>>(
  value: A,
) => Fx<Hkt<F, [S, R, E, A]>, A>
export declare function of<F>(M: Pointed<F>): <A>(value: A) => Fx<HKT<F, A>, A>
```

Added in v0.13.0

# Interpreter

## toMonad

**Signature**

```ts
export declare function toMonad<F extends URIS>(
  M: MonadRec1<F>,
): <E extends Kind<F, any>, R>(fx: Fx<E, R>) => Kind<F, R>
export declare function toMonad<F extends URIS2>(
  M: MonadRec2<F>,
): <E extends Kind2<F, any, any>, R>(
  fx: Fx<E, R>,
) => Kind2<F, ApplyVariance<F, 'E', U.ListOf<Kind2E<F, E>>>, R>
export declare function toMonad<F extends URIS2, S>(
  M: MonadRec2C<F, S>,
): <E extends Kind2<F, S, any>, R>(fx: Fx<E, R>) => Kind2<F, S, R>
export declare function toMonad<F extends URIS3>(
  M: MonadRec3<F>,
): <E extends Kind3<F, any, any, any>, R>(
  fx: Fx<E, R>,
) => Kind3<
  F,
  ApplyVariance<F, 'R', U.ListOf<Kind3R<F, E>>>,
  ApplyVariance<F, 'E', U.ListOf<Kind3E<F, E>>>,
  R
>
export declare function toMonad<F extends URIS4>(
  M: MonadRec4<F>,
): <E extends Kind4<F, any, any, any, any>, R>(
  fx: Fx<E, R>,
) => Kind4<
  F,
  ApplyVariance<F, 'S', U.ListOf<Kind4S<F, E>>>,
  ApplyVariance<F, 'R', U.ListOf<Kind4R<F, E>>>,
  ApplyVariance<F, 'E', U.ListOf<Kind4E<F, E>>>,
  R
>
export declare function toMonad<F>(M: MonadRec<F>): <E, R>(fx: Fx<E, R>) => HKT<F, R>
```

Added in v0.13.0

# Lift

## getDo

**Signature**

```ts
export declare function getDo<F extends URIS>(): <Y extends Kind<F, any>, R, N = unknown>(
  f: (lift: LiftFx1<F>) => Generator<Y, R, N>,
) => Fx<Y, R, N>
export declare function getDo<F extends URIS2, E = any>(): <
  Y extends Kind2<F, E, any>,
  R,
  N = unknown,
>(
  f: (lift: LiftFx2<F>) => Generator<Y, R, N>,
) => Fx<Y, R, N>
export declare function getDo<F extends URIS3, R = any, E = any>(): <
  Y extends Kind3<F, R, E, any>,
  Z,
  N = unknown,
>(
  f: (lift: LiftFx3<F>) => Generator<Y, Z, N>,
) => Fx<Y, Z, N>
export declare function getDo<F extends URIS4, S = any, R = any, E = any>(): <
  Y extends Kind4<F, S, R, E, any>,
  Z,
  N = unknown,
>(
  f: (lift: LiftFx4<F>) => Generator<Y, Z, N>,
) => Fx<Y, Z, N>
export declare function getDo<F>(): <Y extends HKT<F, any>, R, N = unknown>(
  f: (lift: LiftFxHKT<F>) => Generator<Y, R, N>,
) => Fx<Y, R, N>
```

Added in v0.13.0

# Model

## FxT (type alias)

**Signature**

```ts
export type FxT<F, Params extends readonly any[]> = Params extends readonly [...infer Init, infer R]
  ? Fx<Hkt<F, readonly [...Init, unknown]>, R>
  : never
```

Added in v0.13.0

# Natural Transformation

## fromNaturalTransformation

**Signature**

```ts
export declare function fromNaturalTransformation<F extends URIS, G extends URIS>(
  transformation: NaturalTransformation11<F, G>,
): <A>(fa: Kind<F, A>) => Fx<Kind<G, A>, A>
export declare function fromNaturalTransformation<F extends URIS, G extends URIS2>(
  transformation: NaturalTransformation12<F, G>,
): <A, E = Initial<G, 'E'>>(fa: Kind<F, A>) => Fx<Kind2<G, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS, G extends URIS2, E>(
  transformation: NaturalTransformation12C<F, G, E>,
): <A>(fa: Kind<F, A>) => Fx<Kind2<G, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS, G extends URIS3>(
  transformation: NaturalTransformation13<F, G>,
): <A, R = Initial<G, 'R'>, E = Initial<G, 'E'>>(fa: Kind<F, A>) => Fx<Kind3<G, R, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS, G extends URIS3, E>(
  transformation: NaturalTransformation13C<F, G, E>,
): <A, R = Initial<G, 'R'>>(fa: Kind<F, A>) => Fx<Kind3<G, R, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS, G extends URIS4>(
  transformation: NaturalTransformation14<F, G>,
): <A, S = Initial<G, 'S'>, R = Initial<G, 'R'>, E = Initial<G, 'E'>>(
  fa: Kind<F, A>,
) => Fx<Kind4<G, S, R, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS, G extends URIS4, E>(
  transformation: NaturalTransformation14C<F, G, E>,
): <A, S = Initial<G, 'S'>, R = Initial<G, 'R'>>(fa: Kind<F, A>) => Fx<Kind4<G, S, R, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS2, G extends URIS>(
  transformation: NaturalTransformation21<F, G>,
): <E, A>(fa: Kind2<F, E, A>) => Fx<Kind<G, A>, A>
export declare function fromNaturalTransformation<F extends URIS2, G extends URIS2>(
  transformation: NaturalTransformation22<F, G>,
): <E, A>(fa: Kind2<F, E, A>) => Fx<Kind2<G, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS2, G extends URIS2, E>(
  transformation: NaturalTransformation22C<F, G, E>,
): <A>(fa: Kind2<F, E, A>) => Fx<Kind2<G, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS2, G extends URIS3>(
  transformation: NaturalTransformation23<F, G> | NaturalTransformation23R<F, G>,
): <E, A, R = Initial<G, 'R'>>(fa: Kind2<F, E, A>) => Fx<Kind3<G, R, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS2, G extends URIS3, E>(
  transformation: NaturalTransformation23C<F, G, E>,
): <A, R = Initial<G, 'R'>>(fa: Kind2<F, E, A>) => Fx<Kind3<G, R, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS2, G extends URIS4>(
  transformation:
    | NaturalTransformation24<F, G>
    | NaturalTransformation24R<F, G>
    | NaturalTransformation24S<F, G>,
): <E, A, S = Initial<G, 'S'>, R = Initial<G, 'R'>>(
  fa: Kind2<F, E, A>,
) => Fx<Kind4<G, S, R, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS3, G extends URIS3>(
  transformation: NaturalTransformation33<F, G>,
): <R, E, A>(fa: Kind3<F, R, E, A>) => Fx<Kind3<G, R, E, A>, A>
export declare function fromNaturalTransformation<F extends URIS3, G extends URIS4>(
  transformation: NaturalTransformation34<F, G>,
): <R, E, A, S = Initial<G, 'S'>>(fa: Kind3<F, R, E, A>) => Fx<Kind4<G, S, R, E, A>, A>
export declare function fromNaturalTransformation<F, G>(
  transformation: NaturalTransformation<F, G>,
): <A>(fa: HKT<F, A>) => Fx<HKT<G, A>, A>
```

Added in v0.13.0

# Type-level

## ChainRecFxT (type alias)

**Signature**

```ts
export type ChainRecFxT<F> = F extends URIS2
  ? <A, E, B>(f: Arity1<A, FxT<F, [E, Either<A, B>]>>) => (a: A) => FxT<F, [E, B]>
  : F extends URIS3
  ? <A, R, E, B>(f: Arity1<A, FxT<F, [R, E, Either<A, B>]>>) => (a: A) => FxT<F, [R, E, B]>
  : F extends URIS4
  ? <A, S, R, E, B>(f: Arity1<A, FxT<F, [S, R, E, Either<A, B>]>>) => (a: A) => FxT<F, [S, R, E, B]>
  : <A, B>(f: Arity1<A, FxT<F, [Either<A, B>]>>) => (a: A) => FxT<F, [B]>
```

Added in v0.13.0

## LiftFx (type alias)

**Signature**

```ts
export type LiftFx<F> = F extends URIS
  ? LiftFx1<F>
  : F extends URIS2
  ? LiftFx2<F>
  : F extends URIS3
  ? LiftFx3<F>
  : F extends URIS4
  ? LiftFx4<F>
  : LiftFxHKT<F>
```

Added in v0.13.0

## LiftFx1 (type alias)

**Signature**

```ts
export type LiftFx1<F extends URIS> = <A>(kind: Kind<F, A>) => Fx<Kind<F, A>, A>
```

Added in v0.13.0

## LiftFx2 (type alias)

**Signature**

```ts
export type LiftFx2<F extends URIS2> = <E, A>(
  kind: Kind2<F, OrUnknown<E>, A>,
) => Fx<Kind2<F, OrUnknown<E>, A>, A>
```

Added in v0.13.0

## LiftFx3 (type alias)

**Signature**

```ts
export type LiftFx3<F extends URIS3> = <R, E, A>(
  kind: Kind3<F, OrUnknown<R>, E, A>,
) => Fx<Kind3<F, OrUnknown<R>, E, A>, A>
```

Added in v0.13.0

## LiftFx4 (type alias)

**Signature**

```ts
export type LiftFx4<F extends URIS4> = <S, R, E, A>(
  kind: Kind4<F, S, OrUnknown<R>, E, A>,
) => Fx<Kind4<F, S, OrUnknown<R>, E, A>, A>
```

Added in v0.13.0

## LiftFxHKT (type alias)

**Signature**

```ts
export type LiftFxHKT<F> = <A>(kind: HKT<F, A>) => Fx<HKT<F, A>, A>
```

Added in v0.13.0
