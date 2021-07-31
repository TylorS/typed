---
title: HKT.ts
nav_order: 19
parent: Modules
---

## HKT overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Type-level](#type-level)
  - [A (type alias)](#a-type-alias)
  - [ApplyVariance (type alias)](#applyvariance-type-alias)
  - [Contravariant (type alias)](#contravariant-type-alias)
  - [Covariant (type alias)](#covariant-type-alias)
  - [E (type alias)](#e-type-alias)
  - [Hkt (type alias)](#hkt-type-alias)
  - [Initial (type alias)](#initial-type-alias)
  - [Intersect (type alias)](#intersect-type-alias)
  - [Param (type alias)](#param-type-alias)
  - [R (type alias)](#r-type-alias)
  - [S (type alias)](#s-type-alias)
  - [URItoVariance (interface)](#uritovariance-interface)
  - [UriToLength (type alias)](#uritolength-type-alias)
  - [V (interface)](#v-interface)
  - [Variance (type alias)](#variance-type-alias)
- [URI](#uri)
  - [FpTsUri (type alias)](#fptsuri-type-alias)

---

# Type-level

## A (type alias)

**Signature**

```ts
export type A = 'A'
```

Added in v0.9.2

## ApplyVariance (type alias)

**Signature**

```ts
export type ApplyVariance<
  F,
  P extends Param,
  T extends readonly any[],
> = F extends keyof URItoVariance
  ? URItoVariance[F] extends V<P, infer R>
    ? R extends Covariant
      ? T[number]
      : Intersect<T>
    : T[0]
  : T[0]
```

Added in v0.9.2

## Contravariant (type alias)

**Signature**

```ts
export type Contravariant = '-'
```

Added in v0.9.2

## Covariant (type alias)

**Signature**

```ts
export type Covariant = '+'
```

Added in v0.9.2

## E (type alias)

**Signature**

```ts
export type E = 'E'
```

Added in v0.9.2

## Hkt (type alias)

Universal type for using all of fp-ts' internal kinds. Initially intended for helping to create your
own type-classes

**Signature**

```ts
export type Hkt<F, Params extends readonly any[]> = F extends H.URIS
  ? H.Kind<F, Params[0]>
  : F extends H.URIS2
  ? H.Kind2<F, Params[0], Params[1]>
  : F extends H.URIS3
  ? H.Kind3<F, Params[0], Params[1], Params[2]>
  : F extends H.URIS4
  ? H.Kind4<F, Params[0], Params[1], Params[2], Params[3]>
  : Params['length'] extends 4
  ? H.HKT4<F, Params[0], Params[1], Params[2], Params[3]>
  : Params['length'] extends 3
  ? H.HKT3<F, Params[0], Params[1], Params[2]>
  : Params['length'] extends 2
  ? H.HKT2<F, Params[0], Params[1]>
  : H.HKT<F, Params[0]>
```

Added in v0.9.2

## Initial (type alias)

**Signature**

```ts
export type Initial<F, P extends Param> = F extends keyof URItoVariance
  ? URItoVariance[F] extends V<P, infer R>
    ? R extends Covariant
      ? never
      : unknown
    : any
  : any
```

Added in v0.9.2

## Intersect (type alias)

**Signature**

```ts
export type Intersect<A extends readonly any[], R = unknown> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? Intersect<Tail, R & Head>
  : R
```

Added in v0.9.2

## Param (type alias)

**Signature**

```ts
export type Param = S | R | E | A
```

Added in v0.9.2

## R (type alias)

**Signature**

```ts
export type R = 'R'
```

Added in v0.9.2

## S (type alias)

**Signature**

```ts
export type S = 'S'
```

Added in v0.9.2

## URItoVariance (interface)

A type-level map meant be extended, just like URItoKind\*, to specify the variance that should
apply. If none is specified the default is to be strict.

**Signature**

```ts
export interface URItoVariance {
  readonly Either: V<E, Covariant>
  readonly IOEither: V<E, Covariant>
  readonly Reader: V<E, Contravariant>
  readonly ReaderEither: V<R, Contravariant> & V<E, Covariant>
  readonly ReaderTask: V<E, Contravariant>
  readonly ReaderTaskEither: V<R, Contravariant> & V<E, Covariant>
  readonly StateReaderTaskEither: V<R, Contravariant> & V<E, Covariant>
  readonly TaskEither: V<E, Covariant>
  readonly TaskThese: V<E, Covariant>
  readonly These: V<E, Covariant>
}
```

Added in v0.9.2

## UriToLength (type alias)

**Signature**

```ts
export type UriToLength<F, Params extends readonly any[] = readonly any[]> = F extends H.URIS
  ? 1
  : F extends H.URIS2
  ? 2
  : F extends H.URIS3
  ? 3
  : F extends H.URIS4
  ? 4
  : Params['length']
```

Added in v0.9.2

## V (interface)

**Signature**

```ts
export interface V<P extends Param, V extends Variance> {
  readonly Variance: {
    readonly [K in P]: () => V
  }
}
```

Added in v0.9.2

## Variance (type alias)

**Signature**

```ts
export type Variance = Covariant | Contravariant
```

Added in v0.9.2

# URI

## FpTsUri (type alias)

Union of all the fp-ts URIs

**Signature**

```ts
export type FpTsUri = H.URIS | H.URIS2 | H.URIS3 | H.URIS4
```

Added in v0.9.2
