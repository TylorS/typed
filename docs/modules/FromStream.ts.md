---
title: FromStream.ts
nav_order: 23
parent: Modules
---

## FromStream overview

FromStream is a Typeclass which represents the Natural Transformation from a Stream into another
effect.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [chainFirstStreamK](#chainfirststreamk)
  - [chainStreamK](#chainstreamk)
- [Constructor](#constructor)
  - [fromStreamK](#fromstreamk)
- [Typeclass](#typeclass)
  - [FromStream (type alias)](#fromstream-type-alias)
  - [FromStream1 (type alias)](#fromstream1-type-alias)
  - [FromStream2 (type alias)](#fromstream2-type-alias)
  - [FromStream2C (type alias)](#fromstream2c-type-alias)
  - [FromStream3 (type alias)](#fromstream3-type-alias)
  - [FromStream3C (type alias)](#fromstream3c-type-alias)
  - [FromStream4 (type alias)](#fromstream4-type-alias)
  - [FromStream4C (type alias)](#fromstream4c-type-alias)

---

# Combinator

## chainFirstStreamK

**Signature**

```ts
export declare function chainFirstStreamK<F extends URIS>(
  F: FromStream1<F>,
  C: Chain1<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [A]>
export declare function chainFirstStreamK<F extends URIS2>(
  F: FromStream2<F>,
  C: Chain2<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => <E>(hkt: Hkt<F, [E, A]>) => Hkt<F, [E, A]>
export declare function chainFirstStreamK<F extends URIS3>(
  F: FromStream3<F>,
  C: Chain3<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => <R, E>(hkt: Hkt<F, [R, E, A]>) => Hkt<F, [R, E, A]>
export declare function chainFirstStreamK<F extends URIS4>(
  F: FromStream4<F>,
  C: Chain4<F>,
): <A, B>(
  f: (value: A) => S.Stream<B>,
) => <S, R, E>(hkt: Hkt<F, [S, R, E, A]>) => Hkt<F, [S, R, E, A]>
export declare function chainFirstStreamK<F>(
  F: FromStream<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [A]>
```

Added in v0.9.2

## chainStreamK

**Signature**

```ts
export declare function chainStreamK<F extends URIS>(
  F: FromStream1<F>,
  C: Chain1<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [B]>
export declare function chainStreamK<F extends URIS2>(
  F: FromStream2<F>,
  C: Chain2<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => <E>(hkt: Hkt<F, [E, A]>) => Hkt<F, [E, B]>
export declare function chainStreamK<F extends URIS3>(
  F: FromStream3<F>,
  C: Chain3<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => <R, E>(hkt: Hkt<F, [R, E, A]>) => Hkt<F, [R, E, B]>
export declare function chainStreamK<F extends URIS4>(
  F: FromStream4<F>,
  C: Chain4<F>,
): <A, B>(
  f: (value: A) => S.Stream<B>,
) => <S, R, E>(hkt: Hkt<F, [S, R, E, A]>) => Hkt<F, [S, R, E, B]>
export declare function chainStreamK<F>(
  F: FromStream<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => S.Stream<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [B]>
```

Added in v0.9.2

# Constructor

## fromStreamK

**Signature**

```ts
export declare function fromStreamK<F extends URIS>(
  F: FromStream1<F>,
): <A extends readonly any[], B>(f: (...args: A) => S.Stream<B>) => (...args: A) => Hkt<F, [B]>
export declare function fromStreamK<F extends URIS2>(
  F: FromStream2<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => S.Stream<B>,
) => <E>(...args: A) => Hkt<F, [E, B]>
export declare function fromStreamK<F extends URIS3>(
  F: FromStream3<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => S.Stream<B>,
) => <R, E>(...args: A) => Hkt<F, [R, E, B]>
export declare function fromStreamK<F extends URIS4>(
  F: FromStream4<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => S.Stream<B>,
) => <S, R, E>(...args: A) => Hkt<F, [S, R, E, B]>
export declare function fromStreamK<F>(
  F: FromStream<F>,
): <A extends readonly any[], B>(f: (...args: A) => S.Stream<B>) => (...args: A) => Hkt<F, [B]>
```

Added in v0.9.2

# Typeclass

## FromStream (type alias)

**Signature**

```ts
export type FromStream<F> = {
  readonly URI?: F
  readonly fromStream: <A>(Stream: S.Stream<A>) => HKT<F, A>
}
```

Added in v0.9.2

## FromStream1 (type alias)

**Signature**

```ts
export type FromStream1<F extends URIS> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation11<S.URI, F>
}
```

Added in v0.9.2

## FromStream2 (type alias)

**Signature**

```ts
export type FromStream2<F extends URIS2> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation12<S.URI, F>
}
```

Added in v0.9.2

## FromStream2C (type alias)

**Signature**

```ts
export type FromStream2C<F extends URIS2, E> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation12C<S.URI, F, E>
}
```

Added in v0.9.2

## FromStream3 (type alias)

**Signature**

```ts
export type FromStream3<F extends URIS3> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation13<S.URI, F>
}
```

Added in v0.9.2

## FromStream3C (type alias)

**Signature**

```ts
export type FromStream3C<F extends URIS3, E> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation13C<S.URI, F, E>
}
```

Added in v0.9.2

## FromStream4 (type alias)

**Signature**

```ts
export type FromStream4<F extends URIS4> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation14<S.URI, F>
}
```

Added in v0.9.2

## FromStream4C (type alias)

**Signature**

```ts
export type FromStream4C<F extends URIS4, E> = {
  readonly URI?: F
  readonly fromStream: NaturalTransformation14C<S.URI, F, E>
}
```

Added in v0.9.2
