---
title: FromEnv.ts
nav_order: 20
parent: Modules
---

## FromEnv overview

FromEnv is a Typeclass which represents the Natural Transformation from an Env into another effect.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [FromEnv2 (type alias)](#fromenv2-type-alias)
  - [chainEnvK](#chainenvk)
  - [chainFirstEnvK](#chainfirstenvk)
  - [provideAllWithEnv](#provideallwithenv)
  - [provideSomeWithEnv](#providesomewithenv)
  - [useAllWithEnv](#useallwithenv)
  - [useSomeWithEnv](#usesomewithenv)
- [Constructor](#constructor)
  - [fromEnvK](#fromenvk)
- [Typeclass](#typeclass)
  - [FromEnv (type alias)](#fromenv-type-alias)
  - [FromEnv3 (type alias)](#fromenv3-type-alias)
  - [FromEnv3C (type alias)](#fromenv3c-type-alias)
  - [FromEnv4 (type alias)](#fromenv4-type-alias)

---

# Combinator

## FromEnv2 (type alias)

**Signature**

```ts
export type FromEnv2<F extends URIS2> = {
  readonly URI?: F
  readonly fromEnv: NaturalTransformation22<E.URI, F>
}
```

Added in v0.9.2

## chainEnvK

**Signature**

```ts
export declare function chainEnvK<F extends URIS2>(
  F: FromEnv2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>
export declare function chainEnvK<F extends URIS3>(
  F: FromEnv3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, B]>
export declare function chainEnvK<F extends URIS4>(
  F: FromEnv4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, B]>
export declare function chainEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>
```

Added in v0.9.2

## chainFirstEnvK

**Signature**

```ts
export declare function chainFirstEnvK<F extends URIS2>(
  F: FromEnv2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>
export declare function chainFirstEnvK<F extends URIS3>(
  F: FromEnv3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, A]>
export declare function chainFirstEnvK<F extends URIS4>(
  F: FromEnv4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, A]>
export declare function chainFirstEnvK<F>(
  F: FromEnv<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>
```

Added in v0.9.2

## provideAllWithEnv

**Signature**

```ts
export declare function provideAllWithEnv<F extends URIS4>(
  F: FromEnv4<F> & Provide.ProvideAll4<F> & Chain4<F>,
): <R, A>(env: E.Env<R, A>) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export declare function provideAllWithEnv<F extends URIS3>(
  F: FromEnv3<F> & Provide.ProvideAll3<F> & Chain3<F>,
): <R, A>(env: E.Env<R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export declare function provideAllWithEnv<F extends URIS2>(
  F: FromEnv2<F> & Provide.ProvideAll2<F> & Chain2<F>,
): <E, A>(env: E.Env<E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export declare function provideAllWithEnv<F>(
  F: FromEnv<F> & Provide.ProvideAll<F> & Chain<F>,
): <E, A>(env: E.Env<E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
```

Added in v0.9.2

## provideSomeWithEnv

**Signature**

```ts
export declare function provideSomeWithEnv<F extends URIS4>(
  F: FromEnv4<F> & Provide.ProvideSome4<F> & Chain4<F>,
): <E, A>(env: E.Env<E, A>) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export declare function provideSomeWithEnv<F extends URIS3>(
  F: FromEnv3<F> & Provide.ProvideSome3<F> & Chain3<F>,
): <E, A>(env: E.Env<E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export declare function provideSomeWithEnv<F extends URIS2>(
  F: FromEnv2<F> & Provide.ProvideSome2<F> & Chain2<F>,
): <E, A>(env: E.Env<E, A>) => Provide.Provider2<F, A, E>
export declare function provideSomeWithEnv<F>(
  F: FromEnv<F> & Provide.ProvideSome<F> & Chain<F>,
): <E, A>(env: E.Env<E, A>) => Provide.Provider<F, A, E>
```

Added in v0.9.2

## useAllWithEnv

**Signature**

```ts
export declare function useAllWithEnv<F extends URIS4>(
  F: FromEnv4<F> & Provide.UseAll4<F> & Chain4<F>,
): <R, A>(env: E.Env<R, A>) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export declare function useAllWithEnv<F extends URIS3>(
  F: FromEnv3<F> & Provide.UseAll3<F> & Chain3<F>,
): <R, A>(env: E.Env<R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export declare function useAllWithEnv<F extends URIS2>(
  F: FromEnv2<F> & Provide.UseAll2<F> & Chain2<F>,
): <E, A>(env: E.Env<E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export declare function useAllWithEnv<F>(
  F: FromEnv<F> & Provide.UseAll<F> & Chain<F>,
): <E, A>(env: E.Env<E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
```

Added in v0.9.2

## useSomeWithEnv

**Signature**

```ts
export declare function useSomeWithEnv<F extends URIS4>(
  F: FromEnv4<F> & Provide.UseSome4<F> & Chain4<F>,
): <E, A>(env: E.Env<E, A>) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export declare function useSomeWithEnv<F extends URIS3>(
  F: FromEnv3<F> & Provide.UseSome3<F> & Chain3<F>,
): <E, A>(env: E.Env<E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export declare function useSomeWithEnv<F extends URIS2>(
  F: FromEnv2<F> & Provide.UseSome2<F> & Chain2<F>,
): <E, A>(env: E.Env<E, A>) => Provide.Provider2<F, A, E>
export declare function useSomeWithEnv<F>(
  F: FromEnv<F> & Provide.UseSome<F> & Chain<F>,
): <E, A>(env: E.Env<E, A>) => Provide.Provider<F, A, E>
```

Added in v0.9.2

# Constructor

## fromEnvK

**Signature**

```ts
export declare function fromEnvK<F extends URIS2>(
  F: FromEnv2<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => E.Env<R, B>,
) => (...args: A) => Hkt<F, [R, B]>
export declare function fromEnvK<F extends URIS3>(
  F: FromEnv3<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => E.Env<R, B>,
) => <E>(...args: A) => Hkt<F, [R, E, B]>
export declare function fromEnvK<F extends URIS4>(
  F: FromEnv4<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => E.Env<R, B>,
) => <S, E>(...args: A) => Hkt<F, [S, R, E, B]>
export declare function fromEnvK<F>(
  F: FromEnv<F>,
): <A extends readonly any[], E, B>(
  f: (...args: A) => E.Env<E, B>,
) => (...args: A) => Hkt<F, [E, B]>
```

Added in v0.9.2

# Typeclass

## FromEnv (type alias)

**Signature**

```ts
export type FromEnv<F> = {
  readonly URI?: F
  readonly fromEnv: <E, A>(env: E.Env<E, A>) => HKT2<F, E, A>
}
```

Added in v0.9.2

## FromEnv3 (type alias)

**Signature**

```ts
export type FromEnv3<F extends URIS3> = {
  readonly URI?: F
  readonly fromEnv: NaturalTransformation23R<E.URI, F>
}
```

Added in v0.9.2

## FromEnv3C (type alias)

**Signature**

```ts
export type FromEnv3C<F extends URIS3, E> = {
  readonly URI?: F
  readonly fromEnv: NaturalTransformation23RC<E.URI, F, E>
}
```

Added in v0.9.2

## FromEnv4 (type alias)

**Signature**

```ts
export type FromEnv4<F extends URIS4> = {
  readonly URI?: F
  readonly fromEnv: NaturalTransformation24R<E.URI, F>
}
```

Added in v0.9.2
