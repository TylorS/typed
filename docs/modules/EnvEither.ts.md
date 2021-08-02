---
title: EnvEither.ts
nav_order: 14
parent: Modules
---

## EnvEither overview

EnvEither is an EitherT of [Env](./Env.ts.md)

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [ap](#ap)
  - [apFirst](#apfirst)
  - [apFirstW](#apfirstw)
  - [apS](#aps)
  - [apSW](#apsw)
  - [apSecond](#apsecond)
  - [apSecondW](#apsecondw)
  - [apT](#apt)
  - [apTW](#aptw)
  - [askAndProvide](#askandprovide)
  - [askAndUse](#askanduse)
  - [bimap](#bimap)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [bracket](#bracket)
  - [chain](#chain)
  - [chainEitherK](#chaineitherk)
  - [chainEnvK](#chainenvk)
  - [chainFirst](#chainfirst)
  - [chainFirstEnvK](#chainfirstenvk)
  - [chainFirstIOK](#chainfirstiok)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainFirstTaskK](#chainfirsttaskk)
  - [chainFirstW](#chainfirstw)
  - [chainIOK](#chainiok)
  - [chainOptionK](#chainoptionk)
  - [chainReaderK](#chainreaderk)
  - [chainRec](#chainrec)
  - [chainResumeK](#chainresumek)
  - [chainTaskK](#chaintaskk)
  - [chainW](#chainw)
  - [filterOrElse](#filterorelse)
  - [flap](#flap)
  - [getOrElse](#getorelse)
  - [getOrElseE](#getorelsee)
  - [map](#map)
  - [mapLeft](#mapleft)
  - [orElseFirst](#orelsefirst)
  - [orLeft](#orleft)
  - [provideAllWith](#provideallwith)
  - [provideSomeWith](#providesomewith)
  - [swap](#swap)
  - [tupled](#tupled)
  - [useAllWith](#useallwith)
  - [useSomeWith](#usesomewith)
- [Constructor](#constructor)
  - [ask](#ask)
  - [asks](#asks)
  - [fromEither](#fromeither)
  - [fromEitherK](#fromeitherk)
  - [fromEnv](#fromenv)
  - [fromEnvK](#fromenvk)
  - [fromEnvL](#fromenvl)
  - [fromIO](#fromio)
  - [fromIOK](#fromiok)
  - [fromOption](#fromoption)
  - [fromOptionK](#fromoptionk)
  - [fromPredicate](#frompredicate)
  - [fromReader](#fromreader)
  - [fromReaderK](#fromreaderk)
  - [fromResume](#fromresume)
  - [fromResumeK](#fromresumek)
  - [fromTask](#fromtask)
  - [fromTaskK](#fromtaskk)
  - [left](#left)
  - [of](#of)
  - [right](#right)
- [Deconstructor](#deconstructor)
  - [match](#match)
  - [matchE](#matche)
  - [orElse](#orelse)
  - [toUnion](#tounion)
- [Instance](#instance)
  - [Alt](#alt)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Bifunctor](#bifunctor)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [FromEither](#fromeither)
  - [FromEnv](#fromenv)
  - [FromIO](#fromio)
  - [FromReader](#fromreader)
  - [FromResume](#fromresume)
  - [FromTask](#fromtask)
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
  - [EnvEither (interface)](#enveither-interface)
- [Typeclass Constructor](#typeclass-constructor)
  - [altValidation](#altvalidation)
  - [getSemigroup](#getsemigroup)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <ME, E, A>(
  second: Lazy<Env.Env<ME, E.Either<E, A>>>,
) => (first: Env.Env<ME, E.Either<E, A>>) => Env.Env<ME, E.Either<E, A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <FE, E, A>(
  fa: Env.Env<FE, E.Either<E, A>>,
) => <B>(fab: Env.Env<FE, E.Either<E, (a: A) => B>>) => Env.Env<FE, E.Either<E, B>>
```

Added in v0.9.2

## apFirst

**Signature**

```ts
export declare const apFirst: <R, E, B>(
  second: EnvEither<R, E, B>,
) => <A>(first: EnvEither<R, E, A>) => EnvEither<R, E, A>
```

Added in v0.9.2

## apFirstW

**Signature**

```ts
export declare const apFirstW: <R1, E, B>(
  second: EnvEither<R1, E, B>,
) => <R2, A>(first: EnvEither<R2, E, A>) => EnvEither<R1 & R2, E, A>
```

Added in v0.9.10

## apS

**Signature**

```ts
export declare const apS: <N, A, R, E, B>(
  name: Exclude<N, keyof A>,
  fb: EnvEither<R, E, B>,
) => (
  fa: EnvEither<R, E, A>,
) => EnvEither<R, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSW

**Signature**

```ts
export declare const apSW: <N extends string, A, R1, E, B>(
  name: Exclude<N, keyof A>,
  fb: EnvEither<R1, E, B>,
) => <R2>(
  fa: EnvEither<R2, E, A>,
) => EnvEither<R1 & R2, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.10

## apSecond

**Signature**

```ts
export declare const apSecond: <R, E, B>(
  second: EnvEither<R, E, B>,
) => <A>(first: EnvEither<R, E, A>) => EnvEither<R, E, B>
```

Added in v0.9.2

## apSecondW

**Signature**

```ts
export declare const apSecondW: <R1, E, B>(
  second: EnvEither<R1, E, B>,
) => <R2, A>(first: EnvEither<R2, E, A>) => EnvEither<R1 & R2, E, B>
```

Added in v0.9.10

## apT

**Signature**

```ts
export declare const apT: <R, E, B>(
  fb: EnvEither<R, E, B>,
) => <A>(fas: EnvEither<R, E, A>) => EnvEither<R, E, readonly [...A, B]>
```

Added in v0.9.2

## apTW

**Signature**

```ts
export declare const apTW: <R1, E, B>(
  fb: EnvEither<R1, E, B>,
) => <R2, A extends readonly unknown[]>(
  fas: EnvEither<R2, E, A>,
) => EnvEither<R1 & R2, E, readonly [...A, B]>
```

Added in v0.9.10

## askAndProvide

**Signature**

```ts
export declare const askAndProvide: <R, E, B>(
  hkt: EnvEither<R, E, B>,
) => EnvEither<R, E, EnvEither<unknown, E, B>>
```

Added in v0.9.2

## askAndUse

**Signature**

```ts
export declare const askAndUse: <R, E, B>(
  hkt: EnvEither<R, E, B>,
) => EnvEither<R, E, EnvEither<unknown, E, B>>
```

Added in v0.9.2

## bimap

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => <FE>(fea: Env.Env<FE, E.Either<E, A>>) => Env.Env<FE, E.Either<G, B>>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, R, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => EnvEither<R, E, B>,
) => (
  ma: EnvEither<R, E, A>,
) => EnvEither<R, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(
  name: N,
) => <R, E, A>(fa: EnvEither<R, E, A>) => EnvEither<R, E, { readonly [K in N]: A }>
```

Added in v0.9.2

## bracket

**Signature**

```ts
export declare const bracket: <ME, E, A, B>(
  acquire: Env.Env<ME, E.Either<E, A>>,
  use: (a: A) => Env.Env<ME, E.Either<E, B>>,
  release: (a: A, e: E.Either<E, B>) => Env.Env<ME, E.Either<E, void>>,
) => Env.Env<ME, E.Either<E, B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, ME, E, B>(
  f: (a: A) => Env.Env<ME, E.Either<E, B>>,
) => (ma: Env.Env<ME, E.Either<E, A>>) => Env.Env<ME, E.Either<E, B>>
```

Added in v0.9.2

## chainEitherK

**Signature**

```ts
export declare const chainEitherK: <A, E, B>(
  f: (a: A) => E.Either<E, B>,
) => <R>(ma: EnvEither<R, E, A>) => EnvEither<R, E, B>
```

Added in v0.9.2

## chainEnvK

**Signature**

```ts
export declare const chainEnvK: <A, R1, B>(
  f: (value: A) => Env.Env<R1, B>,
) => <R2, E>(hkt: EnvEither<R2, E, A>) => EnvEither<R1 & R2, E, B>
```

Added in v0.9.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, R, E, B>(
  f: (a: A) => EnvEither<R, E, B>,
) => (first: EnvEither<R, E, A>) => EnvEither<R, E, A>
```

Added in v0.9.2

## chainFirstEnvK

**Signature**

```ts
export declare const chainFirstEnvK: <A, R1, B>(
  f: (value: A) => Env.Env<R1, B>,
) => <R2, E>(hkt: EnvEither<R2, E, A>) => EnvEither<R1 & R2, E, A>
```

Added in v0.9.2

## chainFirstIOK

**Signature**

```ts
export declare const chainFirstIOK: <A, B>(
  f: (a: A) => IO.IO<B>,
) => <R, E>(first: EnvEither<R, E, A>) => EnvEither<R, E, A>
```

Added in v0.9.2

## chainFirstResumeK

**Signature**

```ts
export declare const chainFirstResumeK: <A, B>(
  f: (value: A) => Resume<B>,
) => <R, E>(hkt: EnvEither<R, E, A>) => EnvEither<R, E, A>
```

Added in v0.9.2

## chainFirstTaskK

**Signature**

```ts
export declare const chainFirstTaskK: <A, B>(
  f: (a: A) => T.Task<B>,
) => <R, E>(first: EnvEither<R, E, A>) => EnvEither<R, E, A>
```

Added in v0.9.2

## chainFirstW

**Signature**

```ts
export declare const chainFirstW: <A, R1, E1, B>(
  f: (a: A) => EnvEither<R1, E1, B>,
) => <R2, E2>(first: EnvEither<R2, E2, A>) => EnvEither<R1 & R2, E1 | E2, A>
```

Added in v0.9.11

## chainIOK

**Signature**

```ts
export declare const chainIOK: <A, B>(
  f: (a: A) => IO.IO<B>,
) => <R, E>(first: EnvEither<R, E, A>) => EnvEither<R, E, B>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <E>(
  onNone: Lazy<E>,
) => <A, B>(f: (a: A) => Option<B>) => <R>(ma: EnvEither<R, E, A>) => EnvEither<R, E, B>
```

Added in v0.9.2

## chainReaderK

**Signature**

```ts
export declare const chainReaderK: <A, R, B>(
  f: (a: A) => Reader<R, B>,
) => <E>(ma: EnvEither<R, E, A>) => EnvEither<R, E, B>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, R, E, B>(
  f: (value: A) => EnvEither<R, E, E.Either<A, B>>,
) => (a: A) => EnvEither<R, E, B>
```

Added in v0.9.2

## chainResumeK

**Signature**

```ts
export declare const chainResumeK: <A, B>(
  f: (value: A) => Resume<B>,
) => <R, E>(hkt: EnvEither<R, E, A>) => EnvEither<R, E, B>
```

Added in v0.9.2

## chainTaskK

**Signature**

```ts
export declare const chainTaskK: <A, B>(
  f: (a: A) => T.Task<B>,
) => <R, E>(first: EnvEither<R, E, A>) => EnvEither<R, E, B>
```

Added in v0.9.2

## chainW

**Signature**

```ts
export declare const chainW: <A, ME1, E, B>(
  f: (a: A) => Env.Env<ME1, E.Either<E, B>>,
) => <ME2>(ma: Env.Env<ME2, E.Either<E, A>>) => Env.Env<ME1 & ME2, E.Either<E, B>>
```

Added in v0.9.2

## filterOrElse

**Signature**

```ts
export declare const filterOrElse: {
  <A, B, E>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <R>(
    ma: EnvEither<R, E, A>,
  ) => EnvEither<R, E, B>
  <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E): <R, B>(
    mb: EnvEither<R, E, B>,
  ) => EnvEither<R, E, B>
}
```

Added in v0.9.2

## flap

**Signature**

```ts
export declare const flap: <A>(
  a: A,
) => <R, E, B>(fab: EnvEither<R, E, (a: A) => B>) => EnvEither<R, E, B>
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare const getOrElse: <E, A>(
  onLeft: (e: E) => A,
) => <FE>(ma: Env.Env<FE, E.Either<E, A>>) => Env.Env<FE, A>
```

Added in v0.9.2

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <E, ME, A>(
  onLeft: (e: E) => Env.Env<ME, A>,
) => (ma: Env.Env<ME, E.Either<E, A>>) => Env.Env<ME, A>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <FE, E>(fa: Env.Env<FE, E.Either<E, A>>) => Env.Env<FE, E.Either<E, B>>
```

Added in v0.9.2

## mapLeft

**Signature**

```ts
export declare const mapLeft: <E, G>(
  f: (e: E) => G,
) => <FE, A>(fea: Env.Env<FE, E.Either<E, A>>) => Env.Env<FE, E.Either<G, A>>
```

Added in v0.9.2

## orElseFirst

**Signature**

```ts
export declare const orElseFirst: <E, ME, B>(
  onLeft: (e: E) => Env.Env<ME, E.Either<E, B>>,
) => <A>(ma: Env.Env<ME, E.Either<E, A>>) => Env.Env<ME, E.Either<E, A>>
```

Added in v0.9.2

## orLeft

**Signature**

```ts
export declare const orLeft: <E1, ME, E2>(
  onLeft: (e: E1) => Env.Env<ME, E2>,
) => <A>(fa: Env.Env<ME, E.Either<E1, A>>) => Env.Env<ME, E.Either<E2, A>>
```

Added in v0.9.2

## provideAllWith

**Signature**

```ts
export declare const provideAllWith: <R, E1, A>(
  provider: EnvEither<R, E1, A>,
) => <E2, B>(hkt: EnvEither<A, E2, B>) => EnvEither<R, E1, B>
```

Added in v0.9.2

## provideSomeWith

**Signature**

```ts
export declare const provideSomeWith: <R1, E1, A>(
  provider: EnvEither<R1, E1, A>,
) => P.Provider3<'@typed/fp/EnvEither', A, R1, E1>
```

Added in v0.9.2

## swap

**Signature**

```ts
export declare const swap: <FE, E, A>(
  ma: Env.Env<FE, E.Either<E, A>>,
) => Env.Env<FE, E.Either<A, E>>
```

Added in v0.9.2

## tupled

**Signature**

```ts
export declare const tupled: <R, E, A>(fa: EnvEither<R, E, A>) => EnvEither<R, E, readonly [A]>
```

Added in v0.9.2

## useAllWith

**Signature**

```ts
export declare const useAllWith: <R, E1, A>(
  provider: EnvEither<R, E1, A>,
) => <E2, B>(hkt: EnvEither<A, E2, B>) => EnvEither<R, E1, B>
```

Added in v0.9.2

## useSomeWith

**Signature**

```ts
export declare const useSomeWith: <R1, E1, A>(
  provider: EnvEither<R1, E1, A>,
) => P.Provider3<'@typed/fp/EnvEither', A, R1, E1>
```

Added in v0.9.2

# Constructor

## ask

**Signature**

```ts
export declare const ask: <R, E>() => EnvEither<R, E, R>
```

Added in v0.9.2

## asks

**Signature**

```ts
export declare const asks: <R, A, E>(f: (r: R) => A) => EnvEither<R, E, A>
```

Added in v0.9.2

## fromEither

**Signature**

```ts
export declare const fromEither: <E, A, R = unknown>(e: E.Either<E, A>) => EnvEither<R, E, A>
```

Added in v0.9.2

## fromEitherK

**Signature**

```ts
export declare const fromEitherK: <A, E, B>(
  f: (...a: A) => E.Either<E, B>,
) => <R>(...a: A) => EnvEither<R, E, B>
```

Added in v0.9.2

## fromEnv

**Signature**

```ts
export declare const fromEnv: <FE, A, E>(fa: Env.Env<FE, A>) => Env.Env<FE, E.Either<E, A>>
```

Added in v0.9.2

## fromEnvK

**Signature**

```ts
export declare const fromEnvK: <A, R, B>(
  f: (...args: A) => Env.Env<R, B>,
) => <E>(...args: A) => EnvEither<R, E, B>
```

Added in v0.9.2

## fromEnvL

**Signature**

```ts
export declare const fromEnvL: <FE, E, A>(fe: Env.Env<FE, E>) => Env.Env<FE, E.Either<E, A>>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: <A, R = unknown, E = never>(fa: IO.IO<A>) => EnvEither<R, E, A>
```

Added in v0.9.2

## fromIOK

**Signature**

```ts
export declare const fromIOK: <A, B>(
  f: (...a: A) => IO.IO<B>,
) => <R, E>(...a: A) => EnvEither<R, E, B>
```

Added in v0.9.2

## fromOption

**Signature**

```ts
export declare const fromOption: <E>(
  onNone: Lazy<E>,
) => NaturalTransformation13C<'Option', '@typed/fp/EnvEither', E>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <E>(
  onNone: Lazy<E>,
) => <A, B>(f: (...a: A) => Option<B>) => <R>(...a: A) => EnvEither<R, E, B>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): <R>(a: A) => EnvEither<R, A, B>
  <A>(predicate: Predicate<A>): <R, B>(b: B) => EnvEither<R, B, B>
}
```

Added in v0.9.2

## fromReader

**Signature**

```ts
export declare const fromReader: <R, A, E = never>(fa: Reader<R, A>) => EnvEither<R, E, A>
```

Added in v0.9.2

## fromReaderK

**Signature**

```ts
export declare const fromReaderK: <A, R, B>(
  f: (...a: A) => Reader<R, B>,
) => <E>(...a: A) => EnvEither<R, E, B>
```

Added in v0.9.2

## fromResume

**Signature**

```ts
export declare const fromResume: NaturalTransformation13<'@typed/fp/Resume', '@typed/fp/EnvEither'>
```

Added in v0.9.2

## fromResumeK

**Signature**

```ts
export declare const fromResumeK: <A, B>(
  f: (...args: A) => Resume<B>,
) => <R, E>(...args: A) => EnvEither<R, E, B>
```

Added in v0.9.2

## fromTask

**Signature**

```ts
export declare const fromTask: <A, R = unknown, E = never>(fa: T.Task<A>) => EnvEither<R, E, A>
```

Added in v0.9.2

## fromTaskK

**Signature**

```ts
export declare const fromTaskK: <A, B>(
  f: (...a: A) => T.Task<B>,
) => <R, E>(...a: A) => EnvEither<R, E, B>
```

Added in v0.9.2

## left

**Signature**

```ts
export declare const left: <E, FE, A>(e: E) => Env.Env<FE, E.Either<E, A>>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A, E = never>(a: A) => Env.Of<E.Either<E, A>>
```

Added in v0.9.2

## right

**Signature**

```ts
export declare const right: <A, FE, E>(a: A) => Env.Env<FE, E.Either<E, A>>
```

Added in v0.9.2

# Deconstructor

## match

**Signature**

```ts
export declare const match: <E, B, A>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => <FE>(ma: Env.Env<FE, E.Either<E, A>>) => Env.Env<FE, B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <E, ME, B, A>(
  onLeft: (e: E) => Env.Env<ME, B>,
  onRight: (a: A) => Env.Env<ME, B>,
) => (ma: Env.Env<ME, E.Either<E, A>>) => Env.Env<ME, B>
```

Added in v0.9.2

## orElse

**Signature**

```ts
export declare const orElse: <E1, ME, E2, A>(
  onLeft: (e: E1) => Env.Env<ME, E.Either<E2, A>>,
) => (ma: Env.Env<ME, E.Either<E1, A>>) => Env.Env<ME, E.Either<E2, A>>
```

Added in v0.9.2

## toUnion

**Signature**

```ts
export declare const toUnion: <FE, E, A>(fa: Env.Env<FE, E.Either<E, A>>) => Env.Env<FE, E | A>
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt_.Alt3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative_.Applicative3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply_.Apply3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## Bifunctor

**Signature**

```ts
export declare const Bifunctor: Bifunctor_.Bifunctor3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain_.Chain3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec_.ChainRec3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## FromEither

**Signature**

```ts
export declare const FromEither: FEi.FromEither3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## FromEnv

**Signature**

```ts
export declare const FromEnv: FE.FromEnv3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FIO.FromIO3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## FromReader

**Signature**

```ts
export declare const FromReader: FR.FromReader3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## FromResume

**Signature**

```ts
export declare const FromResume: FRe.FromResume3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## FromTask

**Signature**

```ts
export declare const FromTask: FT.FromTask3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor_.Functor3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad_.Monad3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed_.Pointed3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: P.Provide3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome3<'@typed/fp/EnvEither'>
```

Added in v0.9.2

# Model

## EnvEither (interface)

**Signature**

```ts
export interface EnvEither<R, E, A> extends Env.Env<R, E.Either<E, A>> {}
```

Added in v0.9.2

# Typeclass Constructor

## altValidation

**Signature**

```ts
export declare const altValidation: <A>(
  semigroup: Semigroup_.Semigroup<A>,
) => <ME, A>(
  second: Lazy<Env.Env<ME, E.Either<A, A>>>,
) => (first: Env.Env<ME, E.Either<A, A>>) => Env.Env<ME, E.Either<A, A>>
```

Added in v0.9.2

## getSemigroup

**Signature**

```ts
export declare const getSemigroup: <A, R, E>(
  S: Semigroup_.Semigroup<A>,
) => Semigroup_.Semigroup<EnvEither<R, E, A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/EnvEither'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
