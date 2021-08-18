---
title: FromResume.ts
nav_order: 23
parent: Modules
---

## FromResume overview

FromEnv is a Typeclass which represents the Natural Transformation from a Resume into another
effect.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainResumeK](#chainresumek)
- [Constructor](#constructor)
  - [fromResumeK](#fromresumek)
- [Typeclass](#typeclass)
  - [FromResume (type alias)](#fromresume-type-alias)
  - [FromResume1 (type alias)](#fromresume1-type-alias)
  - [FromResume2 (type alias)](#fromresume2-type-alias)
  - [FromResume2C (type alias)](#fromresume2c-type-alias)
  - [FromResume3 (type alias)](#fromresume3-type-alias)
  - [FromResume3C (type alias)](#fromresume3c-type-alias)
  - [FromResume4 (type alias)](#fromresume4-type-alias)

---

# Combinator

## chainFirstResumeK

**Signature**

```ts
export declare function chainFirstResumeK<F extends URIS>(
  F: FromResume1<F>,
  C: Chain1<F>,
): <A, B>(f: (value: A) => R.Resume<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [A]>
export declare function chainFirstResumeK<F extends URIS2>(
  F: FromResume2<F>,
  C: Chain2<F>,
): <A, B>(f: (value: A) => R.Resume<B>) => <E>(hkt: Hkt<F, [E, A]>) => Hkt<F, [E, A]>
export declare function chainFirstResumeK<F extends URIS3>(
  F: FromResume3<F>,
  C: Chain3<F>,
): <A, B>(f: (value: A) => R.Resume<B>) => <R, E>(hkt: Hkt<F, [R, E, A]>) => Hkt<F, [R, E, A]>
export declare function chainFirstResumeK<F extends URIS4>(
  F: FromResume4<F>,
  C: Chain4<F>,
): <A, B>(
  f: (value: A) => R.Resume<B>,
) => <S, R, E>(hkt: Hkt<F, [S, R, E, A]>) => Hkt<F, [S, R, E, A]>
export declare function chainFirstResumeK<F>(
  F: FromResume<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => R.Resume<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [A]>
```

Added in v0.9.2

## chainResumeK

**Signature**

```ts
export declare function chainResumeK<F extends URIS>(
  F: FromResume1<F>,
  C: Chain1<F>,
): <A, B>(f: (value: A) => R.Resume<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [B]>
export declare function chainResumeK<F extends URIS2>(
  F: FromResume2<F>,
  C: Chain2<F>,
): <A, B>(f: (value: A) => R.Resume<B>) => <E>(hkt: Hkt<F, [E, A]>) => Hkt<F, [E, B]>
export declare function chainResumeK<F extends URIS3>(
  F: FromResume3<F>,
  C: Chain3<F>,
): <A, B>(f: (value: A) => R.Resume<B>) => <R, E>(hkt: Hkt<F, [R, E, A]>) => Hkt<F, [R, E, B]>
export declare function chainResumeK<F extends URIS4>(
  F: FromResume4<F>,
  C: Chain4<F>,
): <A, B>(
  f: (value: A) => R.Resume<B>,
) => <S, R, E>(hkt: Hkt<F, [S, R, E, A]>) => Hkt<F, [S, R, E, B]>
export declare function chainResumeK<F>(
  F: FromResume<F>,
  C: Chain<F>,
): <A, B>(f: (value: A) => R.Resume<B>) => (hkt: Hkt<F, [A]>) => Hkt<F, [B]>
```

Added in v0.9.2

# Constructor

## fromResumeK

**Signature**

```ts
export declare function fromResumeK<F extends URIS>(
  F: FromResume1<F>,
): <A extends readonly any[], B>(f: (...args: A) => R.Resume<B>) => (...args: A) => Hkt<F, [B]>
export declare function fromResumeK<F extends URIS2>(
  F: FromResume2<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => R.Resume<B>,
) => <E>(...args: A) => Hkt<F, [E, B]>
export declare function fromResumeK<F extends URIS3>(
  F: FromResume3<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => R.Resume<B>,
) => <R, E>(...args: A) => Hkt<F, [R, E, B]>
export declare function fromResumeK<F extends URIS4>(
  F: FromResume4<F>,
): <A extends readonly any[], B>(
  f: (...args: A) => R.Resume<B>,
) => <S, R, E>(...args: A) => Hkt<F, [S, R, E, B]>
export declare function fromResumeK<F>(
  F: FromResume<F>,
): <A extends readonly any[], B>(f: (...args: A) => R.Resume<B>) => (...args: A) => Hkt<F, [B]>
```

Added in v0.9.2

# Typeclass

## FromResume (type alias)

**Signature**

```ts
export type FromResume<F> = {
  readonly URI?: F
  readonly fromResume: <A>(resume: R.Resume<A>) => HKT<F, A>
}
```

Added in v0.9.2

## FromResume1 (type alias)

**Signature**

```ts
export type FromResume1<F extends URIS> = {
  readonly URI?: F
  readonly fromResume: NaturalTransformation11<R.URI, F>
}
```

Added in v0.9.2

## FromResume2 (type alias)

**Signature**

```ts
export type FromResume2<F extends URIS2> = {
  readonly URI?: F
  readonly fromResume: NaturalTransformation12<R.URI, F>
}
```

Added in v0.9.2

## FromResume2C (type alias)

**Signature**

```ts
export type FromResume2C<F extends URIS2, E> = {
  readonly URI?: F
  readonly fromResume: NaturalTransformation12C<R.URI, F, E>
}
```

Added in v0.9.2

## FromResume3 (type alias)

**Signature**

```ts
export type FromResume3<F extends URIS3> = {
  readonly URI?: F
  readonly fromResume: NaturalTransformation13<R.URI, F>
}
```

Added in v0.9.2

## FromResume3C (type alias)

**Signature**

```ts
export type FromResume3C<F extends URIS3, E> = {
  readonly URI?: F
  readonly fromResume: NaturalTransformation13C<R.URI, F, E>
}
```

Added in v0.9.2

## FromResume4 (type alias)

**Signature**

```ts
export type FromResume4<F extends URIS4> = {
  readonly URI?: F
  readonly fromResume: NaturalTransformation14<R.URI, F>
}
```

Added in v0.9.2
