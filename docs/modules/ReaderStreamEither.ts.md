---
title: ReaderStreamEither.ts
nav_order: 44
parent: Modules
---

## ReaderStreamEither overview

ReaderStreamEither is an EitherT of ReaderStream, allowing for you to represent your application
over time with Stream, with support for branching/error-handling through Either, and dependency
injection from Reader.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [altAll](#altall)
  - [altW](#altw)
  - [ap](#ap)
  - [apFirst](#apfirst)
  - [apS](#aps)
  - [apSecond](#apsecond)
  - [apT](#apt)
  - [apW](#apw)
  - [bimap](#bimap)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [bracket](#bracket)
  - [bracketW](#bracketw)
  - [chain](#chain)
  - [chainEitherK](#chaineitherk)
  - [chainEnvK](#chainenvk)
  - [chainFirst](#chainfirst)
  - [chainFirstEnvK](#chainfirstenvk)
  - [chainFirstIOK](#chainfirstiok)
  - [chainFirstReaderK](#chainfirstreaderk)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainFirstStreamK](#chainfirststreamk)
  - [chainFirstTaskK](#chainfirsttaskk)
  - [chainIOK](#chainiok)
  - [chainOptionK](#chainoptionk)
  - [chainReaderK](#chainreaderk)
  - [chainRec](#chainrec)
  - [chainResumeK](#chainresumek)
  - [chainStreamK](#chainstreamk)
  - [chainTaskK](#chaintaskk)
  - [chainW](#chainw)
  - [filterOrElse](#filterorelse)
  - [flap](#flap)
  - [getOrElse](#getorelse)
  - [getOrElseE](#getorelsee)
  - [getOrElseEW](#getorelseew)
  - [map](#map)
  - [mapLeft](#mapleft)
  - [orElse](#orelse)
  - [orElseFirst](#orelsefirst)
  - [orLeft](#orleft)
  - [swap](#swap)
  - [toUnion](#tounion)
  - [tupled](#tupled)
- [Constructor](#constructor)
  - [ask](#ask)
  - [asks](#asks)
  - [fromEither](#fromeither)
  - [fromEitherK](#fromeitherk)
  - [fromEnv](#fromenv)
  - [fromEnvK](#fromenvk)
  - [fromIO](#fromio)
  - [fromIOK](#fromiok)
  - [fromOption](#fromoption)
  - [fromOptionK](#fromoptionk)
  - [fromPredicate](#frompredicate)
  - [fromReader](#fromreader)
  - [fromReaderK](#fromreaderk)
  - [fromReaderStream](#fromreaderstream)
  - [fromReaderStreamL](#fromreaderstreaml)
  - [fromResume](#fromresume)
  - [fromResumeK](#fromresumek)
  - [fromStream](#fromstream)
  - [fromStreamK](#fromstreamk)
  - [fromTask](#fromtask)
  - [fromTaskK](#fromtaskk)
  - [left](#left)
  - [of](#of)
  - [right](#right)
  - [zero](#zero)
- [Deconstructor](#deconstructor)
  - [match](#match)
  - [matchE](#matche)
  - [matchEW](#matchew)
- [Instance](#instance)
  - [Alt](#alt)
  - [Alternative](#alternative)
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
  - [FromStream](#fromstream)
  - [FromTask](#fromtask)
  - [Functor](#functor)
  - [Monad](#monad)
  - [MonadRec](#monadrec)
  - [Pointed](#pointed)
- [Model](#model)
  - [ReaderStreamEither (interface)](#readerstreameither-interface)
- [Type-level](#type-level)
  - [RequirementsOf (type alias)](#requirementsof-type-alias)
- [Type-lvel](#type-lvel)
  - [LeftOf (type alias)](#leftof-type-alias)
  - [RightOf (type alias)](#rightof-type-alias)
- [Typeclass Consructor](#typeclass-consructor)
  - [getApplicativeMonoid](#getapplicativemonoid)
- [Typeclass Constructor](#typeclass-constructor)
  - [altValidation](#altvalidation)
  - [getApplySemigroup](#getapplysemigroup)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <ME, E, A>(
  second: Lazy<RS.ReaderStream<ME, Ei.Either<E, A>>>,
) => (first: RS.ReaderStream<ME, Ei.Either<E, A>>) => RS.ReaderStream<ME, Ei.Either<E, A>>
```

Added in v0.9.2

## altAll

**Signature**

```ts
export declare const altAll: <R, E, A>(
  startWith: ReaderStreamEither<R, E, A>,
) => (as: readonly ReaderStreamEither<R, E, A>[]) => ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## altW

**Signature**

```ts
export declare const altW: <R1, E, A>(
  second: Lazy<RS.ReaderStream<R1, Ei.Either<E, A>>>,
) => <R2>(first: RS.ReaderStream<R2, Ei.Either<E, A>>) => RS.ReaderStream<R1 & R2, Ei.Either<E, A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <R, E, A>(
  fa: Re.Reader<R, SE.StreamEither<E, A>>,
) => <B>(fab: Re.Reader<R, SE.StreamEither<E, (a: A) => B>>) => Re.Reader<R, SE.StreamEither<E, B>>
```

Added in v0.9.2

## apFirst

**Signature**

```ts
export declare const apFirst: <R, E, B>(
  second: ReaderStreamEither<R, E, B>,
) => <A>(first: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## apS

**Signature**

```ts
export declare const apS: <N, A, R, E, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderStreamEither<R, E, B>,
) => (
  fa: ReaderStreamEither<R, E, A>,
) => ReaderStreamEither<R, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSecond

**Signature**

```ts
export declare const apSecond: <R, E, B>(
  second: ReaderStreamEither<R, E, B>,
) => <A>(first: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## apT

**Signature**

```ts
export declare const apT: <R, E, B>(
  fb: ReaderStreamEither<R, E, B>,
) => <A>(fas: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, readonly [...A, B]>
```

Added in v0.9.2

## apW

**Signature**

```ts
export declare const apW: <R1, E, A>(
  fa: Re.Reader<R1, SE.StreamEither<E, A>>,
) => <R2, B>(
  fab: Re.Reader<R2, SE.StreamEither<E, (a: A) => B>>,
) => Re.Reader<R1 & R2, SE.StreamEither<E, B>>
```

Added in v0.9.2

## bimap

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => <FE>(fea: RS.ReaderStream<FE, Ei.Either<E, A>>) => RS.ReaderStream<FE, Ei.Either<G, B>>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, R, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderStreamEither<R, E, B>,
) => (
  ma: ReaderStreamEither<R, E, A>,
) => ReaderStreamEither<R, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(
  name: N,
) => <R, E, A>(
  fa: ReaderStreamEither<R, E, A>,
) => ReaderStreamEither<R, E, { readonly [K in N]: A }>
```

Added in v0.9.2

## bracket

**Signature**

```ts
export declare const bracket: <ME, E, A, B>(
  acquire: RS.ReaderStream<ME, Ei.Either<E, A>>,
  use: (a: A) => RS.ReaderStream<ME, Ei.Either<E, B>>,
  release: (a: A, e: Ei.Either<E, B>) => RS.ReaderStream<ME, Ei.Either<E, void>>,
) => RS.ReaderStream<ME, Ei.Either<E, B>>
```

Added in v0.9.2

## bracketW

**Signature**

```ts
export declare const bracketW: <R1, E, A, R2, B, R3>(
  acquire: RS.ReaderStream<R1, Ei.Either<E, A>>,
  use: (a: A) => RS.ReaderStream<R2, Ei.Either<E, B>>,
  release: (a: A, e: Ei.Either<E, B>) => RS.ReaderStream<R3, Ei.Either<E, void>>,
) => RS.ReaderStream<R1 & R2 & R3, Ei.Either<E, B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, R, E, B>(
  f: (a: A) => Re.Reader<R, SE.StreamEither<E, B>>,
) => (ma: Re.Reader<R, SE.StreamEither<E, A>>) => Re.Reader<R, SE.StreamEither<E, B>>
```

Added in v0.9.2

## chainEitherK

**Signature**

```ts
export declare const chainEitherK: <A, E, B>(
  f: (a: A) => Ei.Either<E, B>,
) => <R>(ma: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## chainEnvK

**Signature**

```ts
export declare const chainEnvK: <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2, E>(hkt: ReaderStreamEither<R2, E, A>) => ReaderStreamEither<R1 & R2, E, B>
```

Added in v0.9.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, R, E, B>(
  f: (a: A) => ReaderStreamEither<R, E, B>,
) => (first: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## chainFirstEnvK

**Signature**

```ts
export declare const chainFirstEnvK: <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2, E>(hkt: ReaderStreamEither<R2, E, A>) => ReaderStreamEither<R1 & R2, E, A>
```

Added in v0.9.2

## chainFirstIOK

**Signature**

```ts
export declare const chainFirstIOK: <A, B>(
  f: (a: A) => IO<B>,
) => <R, E>(first: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## chainFirstReaderK

**Signature**

```ts
export declare const chainFirstReaderK: <A, R, B>(
  f: (a: A) => Re.Reader<R, B>,
) => <E>(ma: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## chainFirstResumeK

**Signature**

```ts
export declare const chainFirstResumeK: <A, B>(
  f: (value: A) => Resume<B>,
) => <R, E>(hkt: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## chainFirstStreamK

**Signature**

```ts
export declare const chainFirstStreamK: <A, B>(
  f: (value: A) => S.Stream<B>,
) => <R, E>(hkt: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## chainFirstTaskK

**Signature**

```ts
export declare const chainFirstTaskK: <A, B>(
  f: (a: A) => Task<B>,
) => <R, E>(first: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## chainIOK

**Signature**

```ts
export declare const chainIOK: <A, B>(
  f: (a: A) => IO<B>,
) => <R, E>(first: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <E>(
  onNone: Lazy<E>,
) => <A, B>(
  f: (a: A) => Option<B>,
) => <R>(ma: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## chainReaderK

**Signature**

```ts
export declare const chainReaderK: <A, R, B>(
  f: (a: A) => Re.Reader<R, B>,
) => <E>(ma: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare function chainRec<A, R, E, B>(
  f: (value: A) => ReaderStreamEither<R, E, Ei.Either<A, B>>,
): (value: A) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## chainResumeK

**Signature**

```ts
export declare const chainResumeK: <A, B>(
  f: (value: A) => Resume<B>,
) => <R, E>(hkt: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## chainStreamK

**Signature**

```ts
export declare const chainStreamK: <A, B>(
  f: (value: A) => S.Stream<B>,
) => <R, E>(hkt: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## chainTaskK

**Signature**

```ts
export declare const chainTaskK: <A, B>(
  f: (a: A) => Task<B>,
) => <R, E>(first: ReaderStreamEither<R, E, A>) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## chainW

**Signature**

```ts
export declare const chainW: <A, R1, E, B>(
  f: (a: A) => Re.Reader<R1, SE.StreamEither<E, B>>,
) => <R2>(ma: Re.Reader<R2, SE.StreamEither<E, A>>) => Re.Reader<R1 & R2, SE.StreamEither<E, B>>
```

Added in v0.9.2

## filterOrElse

**Signature**

```ts
export declare const filterOrElse: {
  <A, B, E>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <R>(
    ma: ReaderStreamEither<R, E, A>,
  ) => ReaderStreamEither<R, E, B>
  <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E): <R, B>(
    mb: ReaderStreamEither<R, E, B>,
  ) => ReaderStreamEither<R, E, B>
}
```

Added in v0.9.2

## flap

**Signature**

```ts
export declare const flap: <A>(
  a: A,
) => <R, E, B>(fab: ReaderStreamEither<R, E, (a: A) => B>) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## getOrElse

**Signature**

```ts
export declare const getOrElse: <E, A>(
  onLeft: (e: E) => A,
) => <FE>(ma: RS.ReaderStream<FE, Ei.Either<E, A>>) => RS.ReaderStream<FE, A>
```

Added in v0.9.2

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <E, ME, A>(
  onLeft: (e: E) => RS.ReaderStream<ME, A>,
) => (ma: RS.ReaderStream<ME, Ei.Either<E, A>>) => RS.ReaderStream<ME, A>
```

Added in v0.9.2

## getOrElseEW

**Signature**

```ts
export declare const getOrElseEW: <E, R1, A>(
  onLeft: (e: E) => RS.ReaderStream<R1, A>,
) => <R2>(ma: RS.ReaderStream<R2, Ei.Either<E, A>>) => RS.ReaderStream<R1 & R2, A>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <R, E>(fa: Re.Reader<R, SE.StreamEither<E, A>>) => Re.Reader<R, SE.StreamEither<E, B>>
```

Added in v0.9.2

## mapLeft

**Signature**

```ts
export declare const mapLeft: <E, G>(
  f: (e: E) => G,
) => <FE, A>(fea: RS.ReaderStream<FE, Ei.Either<E, A>>) => RS.ReaderStream<FE, Ei.Either<G, A>>
```

Added in v0.9.2

## orElse

**Signature**

```ts
export declare const orElse: <E1, ME, E2, A>(
  onLeft: (e: E1) => RS.ReaderStream<ME, Ei.Either<E2, A>>,
) => (ma: RS.ReaderStream<ME, Ei.Either<E1, A>>) => RS.ReaderStream<ME, Ei.Either<E2, A>>
```

Added in v0.9.2

## orElseFirst

**Signature**

```ts
export declare const orElseFirst: <E, ME, B>(
  onLeft: (e: E) => RS.ReaderStream<ME, Ei.Either<E, B>>,
) => <A>(ma: RS.ReaderStream<ME, Ei.Either<E, A>>) => RS.ReaderStream<ME, Ei.Either<E, A>>
```

Added in v0.9.2

## orLeft

**Signature**

```ts
export declare const orLeft: <E1, ME, E2>(
  onLeft: (e: E1) => RS.ReaderStream<ME, E2>,
) => <A>(fa: RS.ReaderStream<ME, Ei.Either<E1, A>>) => RS.ReaderStream<ME, Ei.Either<E2, A>>
```

Added in v0.9.2

## swap

**Signature**

```ts
export declare const swap: <FE, E, A>(
  ma: RS.ReaderStream<FE, Ei.Either<E, A>>,
) => RS.ReaderStream<FE, Ei.Either<A, E>>
```

Added in v0.9.2

## toUnion

**Signature**

```ts
export declare const toUnion: <FE, E, A>(
  fa: RS.ReaderStream<FE, Ei.Either<E, A>>,
) => RS.ReaderStream<FE, E | A>
```

Added in v0.9.2

## tupled

**Signature**

```ts
export declare const tupled: <R, E, A>(
  fa: ReaderStreamEither<R, E, A>,
) => ReaderStreamEither<R, E, readonly [A]>
```

Added in v0.9.2

# Constructor

## ask

**Signature**

```ts
export declare const ask: <R, E>() => ReaderStreamEither<R, E, R>
```

Added in v0.9.2

## asks

**Signature**

```ts
export declare const asks: <R, A, E>(f: (r: R) => A) => ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## fromEither

**Signature**

```ts
export declare const fromEither: NaturalTransformation23<'Either', '@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## fromEitherK

**Signature**

```ts
export declare const fromEitherK: <A, E, B>(
  f: (...a: A) => Ei.Either<E, B>,
) => <R>(...a: A) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## fromEnv

**Signature**

```ts
export declare const fromEnv: NaturalTransformation23R<
  '@typed/fp/Env',
  '@typed/fp/ReaderStreamEither'
>
```

Added in v0.9.2

## fromEnvK

**Signature**

```ts
export declare const fromEnvK: <A, R, B>(
  f: (...args: A) => Env<R, B>,
) => <E>(...args: A) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: NaturalTransformation13<'IO', '@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## fromIOK

**Signature**

```ts
export declare const fromIOK: <A, B>(
  f: (...a: A) => IO<B>,
) => <R, E>(...a: A) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## fromOption

**Signature**

```ts
export declare const fromOption: <E>(
  onNone: Lazy<E>,
) => NaturalTransformation13C<'Option', '@typed/fp/ReaderStreamEither', E>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <E>(
  onNone: Lazy<E>,
) => <A, B>(f: (...a: A) => Option<B>) => <R>(...a: A) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): <R>(a: A) => ReaderStreamEither<R, A, B>
  <A>(predicate: Predicate<A>): <R, B>(b: B) => ReaderStreamEither<R, B, B>
}
```

Added in v0.9.2

## fromReader

**Signature**

```ts
export declare const fromReader: <R, A, E>(
  ma: Re.Reader<R, A>,
) => Re.Reader<R, SE.StreamEither<E, A>>
```

Added in v0.9.2

## fromReaderK

**Signature**

```ts
export declare const fromReaderK: <A, R, B>(
  f: (...a: A) => Re.Reader<R, B>,
) => <E>(...a: A) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## fromReaderStream

**Signature**

```ts
export declare const fromReaderStream: <FE, A, E>(
  fa: RS.ReaderStream<FE, A>,
) => RS.ReaderStream<FE, Ei.Either<E, A>>
```

Added in v0.9.2

## fromReaderStreamL

**Signature**

```ts
export declare const fromReaderStreamL: <FE, E, A>(
  fe: RS.ReaderStream<FE, E>,
) => RS.ReaderStream<FE, Ei.Either<E, A>>
```

Added in v0.9.2

## fromResume

**Signature**

```ts
export declare const fromResume: NaturalTransformation13<
  '@typed/fp/Resume',
  '@typed/fp/ReaderStreamEither'
>
```

Added in v0.9.2

## fromResumeK

**Signature**

```ts
export declare const fromResumeK: <A, B>(
  f: (...args: A) => Resume<B>,
) => <R, E>(...args: A) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## fromStream

**Signature**

```ts
export declare const fromStream: NaturalTransformation13<
  '@most/core/Stream',
  '@typed/fp/ReaderStreamEither'
>
```

Added in v0.9.2

## fromStreamK

**Signature**

```ts
export declare const fromStreamK: <A, B>(
  f: (...args: A) => S.Stream<B>,
) => <R, E>(...args: A) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## fromTask

**Signature**

```ts
export declare const fromTask: NaturalTransformation13<'Task', '@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## fromTaskK

**Signature**

```ts
export declare const fromTaskK: <A, B>(
  f: (...a: A) => Task<B>,
) => <R, E>(...a: A) => ReaderStreamEither<R, E, B>
```

Added in v0.9.2

## left

**Signature**

```ts
export declare const left: <E, FE, A>(e: E) => RS.ReaderStream<FE, Ei.Either<E, A>>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A, R, E>(a: A) => Re.Reader<R, SE.StreamEither<E, A>>
```

Added in v0.9.2

## right

**Signature**

```ts
export declare const right: <A, FE, E>(a: A) => RS.ReaderStream<FE, Ei.Either<E, A>>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: ReaderStreamEither<unknown, never, any>
```

Added in v0.9.2

# Deconstructor

## match

**Signature**

```ts
export declare const match: <E, B, A>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => <FE>(ma: RS.ReaderStream<FE, Ei.Either<E, A>>) => RS.ReaderStream<FE, B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <E, ME, B, A>(
  onLeft: (e: E) => RS.ReaderStream<ME, B>,
  onRight: (a: A) => RS.ReaderStream<ME, B>,
) => (ma: RS.ReaderStream<ME, Ei.Either<E, A>>) => RS.ReaderStream<ME, B>
```

Added in v0.9.2

## matchEW

**Signature**

```ts
export declare const matchEW: <E, R1, B, A, R2>(
  onLeft: (e: E) => RS.ReaderStream<R1, B>,
  onRight: (a: A) => RS.ReaderStream<R2, B>,
) => <R3>(
  ma: RS.ReaderStream<R3, Ei.Either<E, A>>,
) => RS.ReaderStream<R1 & R2 & R3, Ei.Either<E, B>>
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: ALT.Alt3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## Alternative

**Signature**

```ts
export declare const Alternative: ALTERNATIVE.Alternative3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: App.Applicative3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## Bifunctor

**Signature**

```ts
export declare const Bifunctor: Bi.Bifunctor3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Ch.Chain3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## FromEither

**Signature**

```ts
export declare const FromEither: FEi.FromEither3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## FromEnv

**Signature**

```ts
export declare const FromEnv: FE.FromEnv3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FIO.FromIO3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## FromReader

**Signature**

```ts
export declare const FromReader: FR.FromReader3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## FromResume

**Signature**

```ts
export declare const FromResume: FRe.FromResume3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## FromStream

**Signature**

```ts
export declare const FromStream: FS.FromStream3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## FromTask

**Signature**

```ts
export declare const FromTask: FT.FromTask3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: F.Functor3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed3<'@typed/fp/ReaderStreamEither'>
```

Added in v0.9.2

# Model

## ReaderStreamEither (interface)

Env is specialization of Reader<R, Resume<A>>

**Signature**

```ts
export interface ReaderStreamEither<R, E, A> extends Re.Reader<R, SE.StreamEither<E, A>> {}
```

Added in v0.9.2

# Type-level

## RequirementsOf (type alias)

**Signature**

```ts
export type RequirementsOf<A> = A extends ReaderStreamEither<infer R, any, any> ? R : never
```

Added in v0.9.2

# Type-lvel

## LeftOf (type alias)

**Signature**

```ts
export type LeftOf<A> = A extends ReaderStreamEither<any, infer R, any> ? R : never
```

Added in v0.9.2

## RightOf (type alias)

**Signature**

```ts
export type RightOf<A> = A extends ReaderStreamEither<any, any, infer R> ? R : never
```

Added in v0.9.2

# Typeclass Consructor

## getApplicativeMonoid

**Signature**

```ts
export declare const getApplicativeMonoid: <A, R, E>(
  M: Monoid<A>,
) => Monoid<ReaderStreamEither<R, E, A>>
```

Added in v0.9.2

# Typeclass Constructor

## altValidation

**Signature**

```ts
export declare const altValidation: <A>(
  semigroup: Semigroup<A>,
) => <ME, A>(
  second: Lazy<RS.ReaderStream<ME, Ei.Either<A, A>>>,
) => (first: RS.ReaderStream<ME, Ei.Either<A, A>>) => RS.ReaderStream<ME, Ei.Either<A, A>>
```

Added in v0.9.2

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A, R, E>(
  S: Semigroup<A>,
) => Semigroup<ReaderStreamEither<R, E, A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/ReaderStreamEither'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
