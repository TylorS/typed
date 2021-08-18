---
title: FromReaderStream.ts
nav_order: 22
parent: Modules
---

## FromReaderStream overview

FromReaderStream is a Typeclass which represents the Natural Transformation from an ReaderStream
into another effect.

Added in v0.13.9

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [FromReaderStream2 (type alias)](#fromreaderstream2-type-alias)
  - [chainFirstReaderStreamK](#chainfirstreaderstreamk)
  - [chainReaderStreamK](#chainreaderstreamk)
  - [provideAllWithReaderStream](#provideallwithreaderstream)
  - [provideSomeWithReaderStream](#providesomewithreaderstream)
  - [useAllWithReaderStream](#useallwithreaderstream)
  - [useSomeWithReaderStream](#usesomewithreaderstream)
- [Constructor](#constructor)
  - [fromReaderStreamK](#fromreaderstreamk)
- [Typeclass](#typeclass)
  - [FromReaderStream (type alias)](#fromreaderstream-type-alias)
  - [FromReaderStream3 (type alias)](#fromreaderstream3-type-alias)
  - [FromReaderStream3C (type alias)](#fromreaderstream3c-type-alias)
  - [FromReaderStream4 (type alias)](#fromreaderstream4-type-alias)

---

# Combinator

## FromReaderStream2 (type alias)

**Signature**

```ts
export type FromReaderStream2<F extends URIS2> = {
  readonly URI?: F
  readonly fromReaderStream: NaturalTransformation22<RS.URI, F>
}
```

Added in v0.13.9

## chainFirstReaderStreamK

**Signature**

```ts
export declare function chainFirstReaderStreamK<F extends URIS2>(
  F: FromReaderStream2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>
export declare function chainFirstReaderStreamK<F extends URIS3>(
  F: FromReaderStream3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, A]>
export declare function chainFirstReaderStreamK<F extends URIS4>(
  F: FromReaderStream4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, A]>
export declare function chainFirstReaderStreamK<F>(
  F: FromReaderStream<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, A]>
```

Added in v0.13.9

## chainReaderStreamK

**Signature**

```ts
export declare function chainReaderStreamK<F extends URIS2>(
  F: FromReaderStream2<F>,
  C: Chain2<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>
export declare function chainReaderStreamK<F extends URIS3>(
  F: FromReaderStream3<F>,
  C: Chain3<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2, E>(hkt: Hkt<F, [R2, E, A]>) => Hkt<F, [ApplyVariance<F, 'R', [R1, R2]>, E, B]>
export declare function chainReaderStreamK<F extends URIS4>(
  F: FromReaderStream4<F>,
  C: Chain4<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <S, R2, E>(hkt: Hkt<F, [S, R2, E, A]>) => Hkt<F, [S, ApplyVariance<F, 'R', [R1, R2]>, E, B]>
export declare function chainReaderStreamK<F>(
  F: FromReaderStream<F>,
  C: Chain<F>,
): <A, R1, B>(
  f: (value: A) => RS.ReaderStream<R1, B>,
) => <R2>(hkt: Hkt<F, [R2, A]>) => Hkt<F, [ApplyVariance<F, 'E', [R1, R2]>, B]>
```

Added in v0.13.9

## provideAllWithReaderStream

**Signature**

```ts
export declare function provideAllWithReaderStream<F extends URIS4>(
  F: FromReaderStream4<F> & Provide.ProvideAll4<F> & Chain4<F>,
): <R, A>(
  stream: RS.ReaderStream<R, A>,
) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export declare function provideAllWithReaderStream<F extends URIS3>(
  F: FromReaderStream3<F> & Provide.ProvideAll3<F> & Chain3<F>,
): <R, A>(stream: RS.ReaderStream<R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export declare function provideAllWithReaderStream<F extends URIS2>(
  F: FromReaderStream2<F> & Provide.ProvideAll2<F> & Chain2<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export declare function provideAllWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.ProvideAll<F> & Chain<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
```

Added in v0.13.9

## provideSomeWithReaderStream

**Signature**

```ts
export declare function provideSomeWithReaderStream<F extends URIS4>(
  F: FromReaderStream4<F> & Provide.ProvideSome4<F> & Chain4<F>,
): <E, A>(
  stream: RS.ReaderStream<E, A>,
) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export declare function provideSomeWithReaderStream<F extends URIS3>(
  F: FromReaderStream3<F> & Provide.ProvideSome3<F> & Chain3<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export declare function provideSomeWithReaderStream<F extends URIS2>(
  F: FromReaderStream2<F> & Provide.ProvideSome2<F> & Chain2<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider2<F, A, E>
export declare function provideSomeWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.ProvideSome<F> & Chain<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider<F, A, E>
```

Added in v0.13.9

## useAllWithReaderStream

**Signature**

```ts
export declare function useAllWithReaderStream<F extends URIS4>(
  F: FromReaderStream4<F> & Provide.UseAll4<F> & Chain4<F>,
): <R, A>(
  stream: RS.ReaderStream<R, A>,
) => <S, E, B>(hkt: Kind4<F, S, A, E, B>) => Kind4<F, S, R, E, B>
export declare function useAllWithReaderStream<F extends URIS3>(
  F: FromReaderStream3<F> & Provide.UseAll3<F> & Chain3<F>,
): <R, A>(stream: RS.ReaderStream<R, A>) => <E, B>(hkt: Kind3<F, A, E, B>) => Kind3<F, R, E, B>
export declare function useAllWithReaderStream<F extends URIS2>(
  F: FromReaderStream2<F> & Provide.UseAll2<F> & Chain2<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => <B>(hkt: Kind2<F, A, B>) => Kind2<F, E, B>
export declare function useAllWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.UseAll<F> & Chain<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>
```

Added in v0.13.9

## useSomeWithReaderStream

**Signature**

```ts
export declare function useSomeWithReaderStream<F extends URIS4>(
  F: FromReaderStream4<F> & Provide.UseSome4<F> & Chain4<F>,
): <E, A>(
  stream: RS.ReaderStream<E, A>,
) => Provide.Provider4<F, A, E, Initial<F, 'S'>, Initial<F, 'E'>>
export declare function useSomeWithReaderStream<F extends URIS3>(
  F: FromReaderStream3<F> & Provide.UseSome3<F> & Chain3<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider3<F, A, E, Initial<F, 'E'>>
export declare function useSomeWithReaderStream<F extends URIS2>(
  F: FromReaderStream2<F> & Provide.UseSome2<F> & Chain2<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider2<F, A, E>
export declare function useSomeWithReaderStream<F>(
  F: FromReaderStream<F> & Provide.UseSome<F> & Chain<F>,
): <E, A>(stream: RS.ReaderStream<E, A>) => Provide.Provider<F, A, E>
```

Added in v0.13.9

# Constructor

## fromReaderStreamK

**Signature**

```ts
export declare function fromReaderStreamK<F extends URIS2>(
  F: FromReaderStream2<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => RS.ReaderStream<R, B>,
) => (...args: A) => Hkt<F, [R, B]>
export declare function fromReaderStreamK<F extends URIS3>(
  F: FromReaderStream3<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => RS.ReaderStream<R, B>,
) => <E>(...args: A) => Hkt<F, [R, E, B]>
export declare function fromReaderStreamK<F extends URIS4>(
  F: FromReaderStream4<F>,
): <A extends readonly any[], R, B>(
  f: (...args: A) => RS.ReaderStream<R, B>,
) => <S, E>(...args: A) => Hkt<F, [S, R, E, B]>
export declare function fromReaderStreamK<F>(
  F: FromReaderStream<F>,
): <A extends readonly any[], E, B>(
  f: (...args: A) => RS.ReaderStream<E, B>,
) => (...args: A) => Hkt<F, [E, B]>
```

Added in v0.13.9

# Typeclass

## FromReaderStream (type alias)

**Signature**

```ts
export type FromReaderStream<F> = {
  readonly URI?: F
  readonly fromReaderStream: <E, A>(stream: RS.ReaderStream<E, A>) => HKT2<F, E, A>
}
```

Added in v0.13.9

## FromReaderStream3 (type alias)

**Signature**

```ts
export type FromReaderStream3<F extends URIS3> = {
  readonly URI?: F
  readonly fromReaderStream: NaturalTransformation23R<RS.URI, F>
}
```

Added in v0.13.9

## FromReaderStream3C (type alias)

**Signature**

```ts
export type FromReaderStream3C<F extends URIS3, E> = {
  readonly URI?: F
  readonly fromReaderStream: NaturalTransformation23RC<RS.URI, F, E>
}
```

Added in v0.13.9

## FromReaderStream4 (type alias)

**Signature**

```ts
export type FromReaderStream4<F extends URIS4> = {
  readonly URI?: F
  readonly fromReaderStream: NaturalTransformation24R<RS.URI, F>
}
```

Added in v0.13.9
