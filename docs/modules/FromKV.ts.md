---
title: FromKV.ts
nav_order: 20
parent: Modules
---

## FromKV overview

FromKV is a Typeclass which represents the Natural Transformation from an KV into another effect.

Added in v0.11.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [FromKV2 (type alias)](#fromkv2-type-alias)
  - [chainFirstKVK](#chainfirstkvk)
  - [chainKVK](#chainkvk)
  - [provideAllWithKV](#provideallwithkv)
  - [provideSomeWithKV](#providesomewithkv)
  - [useAllWithKV](#useallwithkv)
  - [useSomeWithKV](#usesomewithkv)
- [Constructor](#constructor)
  - [fromKVK](#fromkvk)
- [Typeclass](#typeclass)
  - [FromKV (type alias)](#fromkv-type-alias)
  - [FromKV3 (type alias)](#fromkv3-type-alias)
  - [FromKV3C (type alias)](#fromkv3c-type-alias)
  - [FromKV4 (type alias)](#fromkv4-type-alias)

---

# Combinator

## FromKV2 (type alias)

**Signature**

```ts
export type FromKV2<F extends URIS2, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, E, A>(KV: KV.KV<K, E, A>) => Kind2<F, E & Extra, A>
}
```

Added in v0.11.0

## chainFirstKVK

**Signature**

```ts
export declare function chainFirstKVK<F extends URIS2>(
  F: FromKV2<F>,
  C: Chain2<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>
export declare function chainFirstKVK<F extends URIS3>(
  F: FromKV3<F>,
  C: Chain3<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, A]>
export declare function chainFirstKVK<F extends URIS4>(
  F: FromKV4<F>,
  C: Chain4<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, A]>
export declare function chainFirstKVK<F>(
  F: FromKV<F>,
  C: Chain<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>
```

Added in v0.11.0

## chainKVK

**Signature**

```ts
export declare function chainKVK<F extends URIS2>(
  F: FromKV2<F>,
  C: Chain2<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>
export declare function chainKVK<F extends URIS3>(
  F: FromKV3<F>,
  C: Chain3<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, B]>
export declare function chainKVK<F extends URIS4>(
  F: FromKV4<F>,
  C: Chain4<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, B]>
export declare function chainKVK<F>(
  F: FromKV<F>,
  C: Chain<F>,
): <A, K, R1, B>(
  f: (value: A) => KV.KV<K, R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>
```

Added in v0.11.0

## provideAllWithKV

**Signature**

```ts
export declare function provideAllWithKV<F extends URIS4>(
  F: FromKV4<F> & Provide.ProvideAll4<F> & Chain4<F>,
): <K, R, A>(resume: KV.KV<K, R, A>) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export declare function provideAllWithKV<F extends URIS3>(
  F: FromKV3<F> & Provide.ProvideAll3<F> & Chain3<F>,
): <K, R, A>(resume: KV.KV<K, R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export declare function provideAllWithKV<F extends URIS2>(
  F: FromKV2<F> & Provide.ProvideAll2<F> & Chain2<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export declare function provideAllWithKV<F>(
  F: FromKV<F> & Provide.ProvideAll<F> & Chain<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
```

Added in v0.11.0

## provideSomeWithKV

**Signature**

```ts
export declare function provideSomeWithKV<F extends URIS4>(
  F: FromKV4<F> & Provide.ProvideSome4<F> & Chain4<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export declare function provideSomeWithKV<F extends URIS3>(
  F: FromKV3<F> & Provide.ProvideSome3<F> & Chain3<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export declare function provideSomeWithKV<F extends URIS2>(
  F: FromKV2<F> & Provide.ProvideSome2<F> & Chain2<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider2<F, A, E>
export declare function provideSomeWithKV<F>(
  F: FromKV<F> & Provide.ProvideSome<F> & Chain<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider<F, A, E>
```

Added in v0.11.0

## useAllWithKV

**Signature**

```ts
export declare function useAllWithKV<F extends URIS4>(
  F: FromKV4<F> & Provide.UseAll4<F> & Chain4<F>,
): <K, R, A>(resume: KV.KV<K, R, A>) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export declare function useAllWithKV<F extends URIS3>(
  F: FromKV3<F> & Provide.UseAll3<F> & Chain3<F>,
): <K, R, A>(resume: KV.KV<K, R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export declare function useAllWithKV<F extends URIS2>(
  F: FromKV2<F> & Provide.UseAll2<F> & Chain2<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export declare function useAllWithKV<F>(
  F: FromKV<F> & Provide.UseAll<F> & Chain<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
```

Added in v0.11.0

## useSomeWithKV

**Signature**

```ts
export declare function useSomeWithKV<F extends URIS4>(
  F: FromKV4<F> & Provide.UseSome4<F> & Chain4<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export declare function useSomeWithKV<F extends URIS3>(
  F: FromKV3<F> & Provide.UseSome3<F> & Chain3<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export declare function useSomeWithKV<F extends URIS2>(
  F: FromKV2<F> & Provide.UseSome2<F> & Chain2<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider2<F, A, E>
export declare function useSomeWithKV<F>(
  F: FromKV<F> & Provide.UseSome<F> & Chain<F>,
): <K, E, A>(resume: KV.KV<K, E, A>) => Provide.Provider<F, A, E>
```

Added in v0.11.0

# Constructor

## fromKVK

**Signature**

```ts
export declare function fromKVK<F extends URIS2>(
  F: FromKV2<F>,
): <A extends readonly any[], K, R, B>(
  f: (...args: A) => KV.KV<K, R, B>,
) => (...args: A) => Hkt<F, [R, B]>
export declare function fromKVK<F extends URIS3>(
  F: FromKV3<F>,
): <A extends readonly any[], K, R, B>(
  f: (...args: A) => KV.KV<K, R, B>,
) => <E>(...args: A) => Hkt<F, [R, E, B]>
export declare function fromKVK<F extends URIS4>(
  F: FromKV4<F>,
): <A extends readonly any[], K, R, B>(
  f: (...args: A) => KV.KV<K, R, B>,
) => <S, E>(...args: A) => Hkt<F, [S, R, E, B]>
export declare function fromKVK<F>(
  F: FromKV<F>,
): <A extends readonly any[], K, E, B>(
  f: (...args: A) => KV.KV<K, E, B>,
) => (...args: A) => Hkt<F, [E, B]>
```

Added in v0.11.0

# Typeclass

## FromKV (type alias)

**Signature**

```ts
export type FromKV<F, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, E, A>(KV: KV.KV<K, E, A>) => HKT2<F, E & Extra, A>
}
```

Added in v0.11.0

## FromKV3 (type alias)

**Signature**

```ts
export type FromKV3<F extends URIS3, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, R, A, E = Initial<F, 'E'>>(KV: KV.KV<K, R, A>) => Kind3<F, R & Extra, E, A>
}
```

Added in v0.11.0

## FromKV3C (type alias)

**Signature**

```ts
export type FromKV3C<F extends URIS3, E, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, R, A>(KV: KV.KV<K, R, A>) => Kind3<F, R & Extra, E, A>
}
```

Added in v0.11.0

## FromKV4 (type alias)

**Signature**

```ts
export type FromKV4<F extends URIS4, Extra = unknown> = {
  readonly URI?: F
  readonly fromKV: <K, R, A, S = Initial<F, 'S'>, E = Initial<F, 'E'>>(
    KV: KV.KV<K, R, A>,
  ) => Kind4<F, S, R & Extra, E, A>
}
```

Added in v0.11.0
