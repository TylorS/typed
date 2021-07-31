---
title: StateReaderStreamEither.ts
nav_order: 46
parent: Modules
---

## StateReaderStreamEither overview

StateEnvEither is a StateT of ReaderStreamEither. A Stream-based altenative to
StateReaderTaskEither that support cancelation and multiple values over time.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [ap](#ap)
  - [chain](#chain)
  - [chainEitherK](#chaineitherk)
  - [chainEnvK](#chainenvk)
  - [chainFirstEnvK](#chainfirstenvk)
  - [chainFirstIOK](#chainfirstiok)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainFirstTaskK](#chainfirsttaskk)
  - [chainIOK](#chainiok)
  - [chainOptionK](#chainoptionk)
  - [chainReaderK](#chainreaderk)
  - [chainRec](#chainrec)
  - [chainResumeK](#chainresumek)
  - [chainStateK](#chainstatek)
  - [chainTaskK](#chaintaskk)
  - [evaluate](#evaluate)
  - [execute](#execute)
  - [filterOrElse](#filterorelse)
  - [map](#map)
  - [modify](#modify)
  - [provideAll](#provideall)
  - [provideSome](#providesome)
  - [put](#put)
  - [useAll](#useall)
  - [useSome](#usesome)
- [Constructor](#constructor)
  - [ask](#ask)
  - [asks](#asks)
  - [fromEither](#fromeither)
  - [fromEitherK](#fromeitherk)
  - [fromEnv](#fromenv)
  - [fromEnvEither](#fromenveither)
  - [fromEnvK](#fromenvk)
  - [fromIO](#fromio)
  - [fromIOK](#fromiok)
  - [fromOption](#fromoption)
  - [fromOptionK](#fromoptionk)
  - [fromPredicate](#frompredicate)
  - [fromReader](#fromreader)
  - [fromReaderK](#fromreaderk)
  - [fromResume](#fromresume)
  - [fromResumeK](#fromresumek)
  - [fromState](#fromstate)
  - [fromStateK](#fromstatek)
  - [fromTask](#fromtask)
  - [fromTaskK](#fromtaskk)
  - [get](#get)
  - [gets](#gets)
  - [of](#of)
- [INstance](#instance)
  - [FromTask](#fromtask)
- [Instance](#instance)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [FromEither](#fromeither)
  - [FromEnv](#fromenv)
  - [FromIO](#fromio)
  - [FromReader](#fromreader)
  - [FromResume](#fromresume)
  - [FromState](#fromstate)
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
  - [StateReaderStreamEither (interface)](#statereaderstreameither-interface)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## ap

**Signature**

```ts
export declare const ap: <S, R, E, A>(
  fa: ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, A>
) => <B>(
  fab: ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, (a: A) => B>
) => ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, B>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, S, R, E, B>(
  f: (a: A) => ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, B>
) => (
  ma: ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, A>
) => ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, B>
```

Added in v0.9.2

## chainEitherK

**Signature**

```ts
export declare const chainEitherK: <A, E, B>(
  f: (a: A) => E.Either<E, B>
) => <S, R>(ma: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## chainEnvK

**Signature**

```ts
export declare const chainEnvK: <A, R1, B>(
  f: (value: A) => Env<R1, B>
) => <S, R2, E>(hkt: StateReaderStreamEither<S, R2, E, A>) => StateReaderStreamEither<S, R1, E, B>
```

Added in v0.9.2

## chainFirstEnvK

**Signature**

```ts
export declare const chainFirstEnvK: <A, R1, B>(
  f: (value: A) => Env<R1, B>
) => <S, R2, E>(hkt: StateReaderStreamEither<S, R2, E, A>) => StateReaderStreamEither<S, R1, E, A>
```

Added in v0.9.2

## chainFirstIOK

**Signature**

```ts
export declare const chainFirstIOK: <A, B>(
  f: (a: A) => IO<B>
) => <S, R, E>(first: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## chainFirstResumeK

**Signature**

```ts
export declare const chainFirstResumeK: <A, B>(
  f: (value: A) => R.Resume<B>
) => <S, R, E>(hkt: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## chainFirstTaskK

**Signature**

```ts
export declare const chainFirstTaskK: <A, B>(
  f: (a: A) => Task<B>
) => <S, R, E>(first: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## chainIOK

**Signature**

```ts
export declare const chainIOK: <A, B>(
  f: (a: A) => IO<B>
) => <S, R, E>(first: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <E>(
  onNone: Lazy<E>
) => <A, B>(
  f: (a: A) => Option<B>
) => <S, R>(ma: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## chainReaderK

**Signature**

```ts
export declare const chainReaderK: <A, R, B>(
  f: (a: A) => Reader<R, B>
) => <S, E>(ma: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, S, R, E, B>(
  f: (a: A) => StateReaderStreamEither<S, R, E, E.Either<A, B>>
) => (value: A) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## chainResumeK

**Signature**

```ts
export declare const chainResumeK: <A, B>(
  f: (value: A) => R.Resume<B>
) => <S, R, E>(hkt: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## chainStateK

**Signature**

```ts
export declare const chainStateK: <A, S, B>(
  f: (a: A) => State<S, B>
) => <R, E>(ma: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## chainTaskK

**Signature**

```ts
export declare const chainTaskK: <A, B>(
  f: (a: A) => Task<B>
) => <S, R, E>(first: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## evaluate

**Signature**

```ts
export declare const evaluate: <S>(
  s: S
) => <R, E, A>(ma: ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, A>) => RSE.ReaderStreamEither<R, E, A>
```

Added in v0.9.2

## execute

**Signature**

```ts
export declare const execute: <S>(
  s: S
) => <R, E, A>(ma: ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, A>) => RSE.ReaderStreamEither<R, E, S>
```

Added in v0.9.2

## filterOrElse

**Signature**

```ts
export declare const filterOrElse: {
  <A, B, E>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <S, R>(
    ma: StateReaderStreamEither<S, R, E, A>
  ) => StateReaderStreamEither<S, R, E, B>
  <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E): <S, R, B>(
    mb: StateReaderStreamEither<S, R, E, B>
  ) => StateReaderStreamEither<S, R, E, B>
}
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B
) => <S, R, E>(
  fa: ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, A>
) => ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, B>
```

Added in v0.9.2

## modify

**Signature**

```ts
export declare const modify: <S, R, E>(f: Endomorphism<S>) => StateReaderStreamEither<S, R, E, void>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <R>(
  provided: R
) => <S, E, A>(srte: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, unknown, E, A>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <R1>(
  provided: R1
) => <S, R2, E, A>(srte: StateReaderStreamEither<S, R1 & R2, E, A>) => StateReaderStreamEither<S, R2, E, A>
```

Added in v0.9.2

## put

**Signature**

```ts
export declare const put: <S, R, E>(s: S) => StateReaderStreamEither<S, R, E, void>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <R>(
  provided: R
) => <S, E, A>(srte: StateReaderStreamEither<S, R, E, A>) => StateReaderStreamEither<S, unknown, E, A>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <R1>(
  provided: R1
) => <S, R2, E, A>(srte: StateReaderStreamEither<S, R1 & R2, E, A>) => StateReaderStreamEither<S, R2, E, A>
```

Added in v0.9.2

# Constructor

## ask

**Signature**

```ts
export declare const ask: <S, R, E>() => StateReaderStreamEither<S, R, E, R>
```

Added in v0.9.2

## asks

**Signature**

```ts
export declare const asks: <R, A, S, E>(f: (r: R) => A) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## fromEither

**Signature**

```ts
export declare const fromEither: <E, A, S = unknown, R = unknown>(
  either: E.Either<E, A>
) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## fromEitherK

**Signature**

```ts
export declare const fromEitherK: <A, E, B>(
  f: (...a: A) => E.Either<E, B>
) => <S, R>(...a: A) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## fromEnv

**Signature**

```ts
export declare const fromEnv: <R, A, S = unknown, E = never>(env: Env<R, A>) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## fromEnvEither

**Signature**

```ts
export declare const fromEnvEither: <R, E, A, S>(
  ma: RSE.ReaderStreamEither<R, E, A>
) => ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, A>
```

Added in v0.9.2

## fromEnvK

**Signature**

```ts
export declare const fromEnvK: <A, R, B>(
  f: (...args: A) => Env<R, B>
) => <S, E>(...args: A) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: <A, S = unknown, R = unknown, E = never>(io: IO<A>) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## fromIOK

**Signature**

```ts
export declare const fromIOK: <A, B>(f: (...a: A) => IO<B>) => <S, R, E>(...a: A) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## fromOption

**Signature**

```ts
export declare const fromOption: <E>(
  onNone: Lazy<E>
) => NaturalTransformation14C<'Option', '@typed/fp/StateReaderStreamEither', E>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <E>(
  onNone: Lazy<E>
) => <A, B>(f: (...a: A) => Option<B>) => <S, R>(...a: A) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): <S, R>(a: A) => StateReaderStreamEither<S, R, A, B>
  <A>(predicate: Predicate<A>): <S, R, B>(b: B) => StateReaderStreamEither<S, R, B, B>
}
```

Added in v0.9.2

## fromReader

**Signature**

```ts
export declare const fromReader: <R, A, S = unknown, E = never>(
  reader: Reader<R, A>
) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## fromReaderK

**Signature**

```ts
export declare const fromReaderK: <A, R, B>(
  f: (...a: A) => Reader<R, B>
) => <S, E>(...a: A) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## fromResume

**Signature**

```ts
export declare const fromResume: <A, S = unknown, R = unknown, E = never>(
  resume: R.Resume<A>
) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## fromResumeK

**Signature**

```ts
export declare const fromResumeK: <A, B>(
  f: (...args: A) => R.Resume<B>
) => <S, R, E>(...args: A) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## fromState

**Signature**

```ts
export declare const fromState: <S, A, R, E>(sa: State<S, A>) => ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, A>
```

Added in v0.9.2

## fromStateK

**Signature**

```ts
export declare const fromStateK: <A, S, B>(
  f: (...a: A) => State<S, B>
) => <R, E>(...a: A) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## fromTask

**Signature**

```ts
export declare const fromTask: <A, S = unknown, R = unknown, E = never>(
  io: Task<A>
) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## fromTaskK

**Signature**

```ts
export declare const fromTaskK: <A, B>(
  f: (...a: A) => Task<B>
) => <S, R, E>(...a: A) => StateReaderStreamEither<S, R, E, B>
```

Added in v0.9.2

## get

**Signature**

```ts
export declare const get: <S, R, E>() => StateReaderStreamEither<S, R, E, S>
```

Added in v0.9.2

## gets

**Signature**

```ts
export declare const gets: <S, R, E, A>(f: (s: S) => A) => StateReaderStreamEither<S, R, E, A>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A, S, R, E>(a: A) => ST.StateT3<'@typed/fp/ReaderStreamEither', S, R, E, A>
```

Added in v0.9.2

# INstance

## FromTask

**Signature**

```ts
export declare const FromTask: FromTask4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

# Instance

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## FromEither

**Signature**

```ts
export declare const FromEither: FromEither4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## FromEnv

**Signature**

```ts
export declare const FromEnv: FromEnv4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FromIO4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## FromReader

**Signature**

```ts
export declare const FromReader: FromReader4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## FromResume

**Signature**

```ts
export declare const FromResume: FromResume4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## FromState

**Signature**

```ts
export declare const FromState: FromState4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: Provide4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: ProvideAll4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: ProvideSome4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: UseAll4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: UseSome4<'@typed/fp/StateReaderStreamEither'>
```

Added in v0.9.2

# Model

## StateReaderStreamEither (interface)

**Signature**

```ts
export interface StateReaderStreamEither<S, R, E, A> {
  (state: S): RSE.ReaderStreamEither<R, E, readonly [value: A, nextState: S]>
}
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/StateReaderStreamEither'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
