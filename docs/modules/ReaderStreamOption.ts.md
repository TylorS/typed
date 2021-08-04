---
title: ReaderStreamOption.ts
nav_order: 38
parent: Modules
---

## ReaderStreamOption overview

ReaderStreamEither is an Option of ReaderStream, allowing for you to represent your application over
time with Stream, with support for Optionality through Option, and dependency injection from Reader.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [ap](#ap)
  - [askAndProvide](#askandprovide)
  - [askAndUse](#askanduse)
  - [chain](#chain)
  - [chainEnvK](#chainenvk)
  - [chainFirstEnvK](#chainfirstenvk)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainFirstStreamK](#chainfirststreamk)
  - [chainNullableK](#chainnullablek)
  - [chainOptionK](#chainoptionk)
  - [chainReaderK](#chainreaderk)
  - [chainRec](#chainrec)
  - [chainResumeK](#chainresumek)
  - [chainStreamK](#chainstreamk)
  - [map](#map)
  - [provideAll](#provideall)
  - [provideAllWith](#provideallwith)
  - [provideSome](#providesome)
  - [provideSomeWith](#providesomewith)
  - [useAll](#useall)
  - [useAllWith](#useallwith)
  - [useSome](#usesome)
  - [useSomeWith](#usesomewith)
- [Constructor](#constructor)
  - [ask](#ask)
  - [asks](#asks)
  - [fromEither](#fromeither)
  - [fromEnv](#fromenv)
  - [fromEnvK](#fromenvk)
  - [fromIO](#fromio)
  - [fromNullable](#fromnullable)
  - [fromNullableK](#fromnullablek)
  - [fromOptionK](#fromoptionk)
  - [fromPredicate](#frompredicate)
  - [fromReader](#fromreader)
  - [fromReaderK](#fromreaderk)
  - [fromReaderStream](#fromreaderstream)
  - [fromResume](#fromresume)
  - [fromResumeK](#fromresumek)
  - [fromStream](#fromstream)
  - [fromStreamK](#fromstreamk)
  - [fromTask](#fromtask)
  - [some](#some)
  - [zero](#zero)
- [Deconstructor](#deconstructor)
  - [getOrElse](#getorelse)
  - [getOrElseE](#getorelsee)
  - [getOrElseEW](#getorelseew)
  - [getOrElseW](#getorelsew)
  - [match](#match)
  - [matchE](#matche)
- [Instance](#instance)
  - [Alt](#alt)
  - [Alternative](#alternative)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
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
  - [Provide](#provide)
  - [ProvideAll](#provideall)
  - [ProvideSome](#providesome)
  - [UseAll](#useall)
  - [UseSome](#usesome)
- [Model](#model)
  - [ReaderStreamOption (interface)](#readerstreamoption-interface)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <E, A>(
  second: Lazy<RS.ReaderStream<E, O.Option<A>>>,
) => (first: RS.ReaderStream<E, O.Option<A>>) => RS.ReaderStream<E, O.Option<A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <E, A>(
  fa: RS.ReaderStream<E, O.Option<A>>,
) => <B>(fab: RS.ReaderStream<E, O.Option<(a: A) => B>>) => RS.ReaderStream<E, O.Option<B>>
```

Added in v0.9.2

## askAndProvide

**Signature**

```ts
export declare const askAndProvide: <E, B>(
  hkt: ReaderStreamOption<E, B>,
) => ReaderStreamOption<E, ReaderStreamOption<unknown, B>>
```

Added in v0.9.2

## askAndUse

**Signature**

```ts
export declare const askAndUse: <E, B>(
  hkt: ReaderStreamOption<E, B>,
) => ReaderStreamOption<E, ReaderStreamOption<unknown, B>>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, E, B>(
  f: (a: A) => RS.ReaderStream<E, O.Option<B>>,
) => (ma: RS.ReaderStream<E, O.Option<A>>) => RS.ReaderStream<E, O.Option<B>>
```

Added in v0.9.2

## chainEnvK

**Signature**

```ts
export declare const chainEnvK: <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2>(hkt: ReaderStreamOption<R2, A>) => ReaderStreamOption<R1 & R2, B>
```

Added in v0.9.2

## chainFirstEnvK

**Signature**

```ts
export declare const chainFirstEnvK: <A, R1, B>(
  f: (value: A) => Env<R1, B>,
) => <R2>(hkt: ReaderStreamOption<R2, A>) => ReaderStreamOption<R1 & R2, A>
```

Added in v0.9.2

## chainFirstResumeK

**Signature**

```ts
export declare const chainFirstResumeK: <A, B>(
  f: (value: A) => Resume<B>,
) => <E>(hkt: ReaderStreamOption<E, A>) => ReaderStreamOption<E, A>
```

Added in v0.9.2

## chainFirstStreamK

**Signature**

```ts
export declare const chainFirstStreamK: <A, B>(
  f: (value: A) => Stream<B>,
) => <E>(hkt: ReaderStreamOption<E, A>) => ReaderStreamOption<E, A>
```

Added in v0.9.2

## chainNullableK

**Signature**

```ts
export declare const chainNullableK: <A, B>(
  f: (a: A) => B | null | undefined,
) => <E>(ma: RS.ReaderStream<E, O.Option<A>>) => RS.ReaderStream<E, O.Option<NonNullable<B>>>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <A, B>(
  f: (a: A) => O.Option<B>,
) => <E>(ma: RS.ReaderStream<E, O.Option<A>>) => RS.ReaderStream<E, O.Option<B>>
```

Added in v0.9.2

## chainReaderK

**Signature**

```ts
export declare const chainReaderK: <A, R, B>(
  f: (a: A) => Reader<R, B>,
) => (ma: ReaderStreamOption<R, A>) => ReaderStreamOption<R, B>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, E, B>(
  f: (value: A) => ReaderStreamOption<E, Ei.Either<A, B>>,
) => (value: A) => ReaderStreamOption<E, B>
```

Added in v0.9.2

## chainResumeK

**Signature**

```ts
export declare const chainResumeK: <A, B>(
  f: (value: A) => Resume<B>,
) => <E>(hkt: ReaderStreamOption<E, A>) => ReaderStreamOption<E, B>
```

Added in v0.9.2

## chainStreamK

**Signature**

```ts
export declare const chainStreamK: <A, B>(
  f: (value: A) => Stream<B>,
) => <E>(hkt: ReaderStreamOption<E, A>) => ReaderStreamOption<E, B>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: RS.ReaderStream<E, O.Option<A>>) => RS.ReaderStream<E, O.Option<B>>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <A>(
  provided: A,
) => <B>(hkt: ReaderStreamOption<Partial<A>, B>) => ReaderStreamOption<unknown, B>
```

Added in v0.9.2

## provideAllWith

**Signature**

```ts
export declare const provideAllWith: <R, A>(
  provider: ReaderStreamOption<R, A>,
) => <B>(hkt: ReaderStreamOption<A, B>) => ReaderStreamOption<R, B>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <A>(
  provided: A,
) => <B, C>(hkt: ReaderStreamOption<A & B, C>) => ReaderStreamOption<B, C>
```

Added in v0.9.2

## provideSomeWith

**Signature**

```ts
export declare const provideSomeWith: <E1, A>(
  provider: ReaderStreamOption<E1, A>,
) => P.Provider2<'@typed/fp/ReaderStreamOption', A, E1>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <A>(
  provided: A,
) => <B>(hkt: ReaderStreamOption<Partial<A>, B>) => ReaderStreamOption<unknown, B>
```

Added in v0.9.2

## useAllWith

**Signature**

```ts
export declare const useAllWith: <R, A>(
  provider: ReaderStreamOption<R, A>,
) => <B>(hkt: ReaderStreamOption<A, B>) => ReaderStreamOption<R, B>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <A>(
  provided: A,
) => <B, C>(hkt: ReaderStreamOption<A & B, C>) => ReaderStreamOption<B, C>
```

Added in v0.9.2

## useSomeWith

**Signature**

```ts
export declare const useSomeWith: <E1, A>(
  provider: ReaderStreamOption<E1, A>,
) => P.Provider2<'@typed/fp/ReaderStreamOption', A, E1>
```

Added in v0.9.2

# Constructor

## ask

**Signature**

```ts
export declare const ask: <R>() => ReaderStreamOption<R, R>
```

Added in v0.9.2

## asks

**Signature**

```ts
export declare const asks: <R, A>(f: (r: R) => A) => ReaderStreamOption<R, A>
```

Added in v0.9.2

## fromEither

**Signature**

```ts
export declare const fromEither: <A, E>(e: Ei.Either<unknown, A>) => RS.ReaderStream<E, O.Option<A>>
```

Added in v0.9.2

## fromEnv

**Signature**

```ts
export declare const fromEnv: NaturalTransformation22<
  '@typed/fp/Env',
  '@typed/fp/ReaderStreamOption'
>
```

Added in v0.9.2

## fromEnvK

**Signature**

```ts
export declare const fromEnvK: <A, R, B>(
  f: (...args: A) => Env<R, B>,
) => (...args: A) => ReaderStreamOption<R, B>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: NaturalTransformation12<'IO', '@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## fromNullable

**Signature**

```ts
export declare const fromNullable: <A, E>(a: A) => RS.ReaderStream<E, O.Option<NonNullable<A>>>
```

Added in v0.9.2

## fromNullableK

**Signature**

```ts
export declare const fromNullableK: <A, B>(
  f: (...a: A) => B | null | undefined,
) => <E>(...a: A) => RS.ReaderStream<E, O.Option<NonNullable<B>>>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <A, B>(
  f: (...a: A) => O.Option<B>,
) => <E>(...a: A) => RS.ReaderStream<E, O.Option<B>>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): <E>(a: A) => RS.ReaderStream<E, O.Option<B>>
  <A>(predicate: Predicate<A>): <E, B>(b: B) => RS.ReaderStream<E, O.Option<B>>
}
```

Added in v0.9.2

## fromReader

**Signature**

```ts
export declare const fromReader: NaturalTransformation22<'Reader', '@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## fromReaderK

**Signature**

```ts
export declare const fromReaderK: <A, R, B>(
  f: (...a: A) => Reader<R, B>,
) => (...a: A) => ReaderStreamOption<R, B>
```

Added in v0.9.2

## fromReaderStream

**Signature**

```ts
export declare const fromReaderStream: <E, A>(
  ma: RS.ReaderStream<E, A>,
) => RS.ReaderStream<E, O.Option<A>>
```

Added in v0.9.2

## fromResume

**Signature**

```ts
export declare const fromResume: NaturalTransformation12<
  '@typed/fp/Resume',
  '@typed/fp/ReaderStreamOption'
>
```

Added in v0.9.2

## fromResumeK

**Signature**

```ts
export declare const fromResumeK: <A, B>(
  f: (...args: A) => Resume<B>,
) => <E>(...args: A) => ReaderStreamOption<E, B>
```

Added in v0.9.2

## fromStream

**Signature**

```ts
export declare const fromStream: NaturalTransformation12<
  '@most/core/Stream',
  '@typed/fp/ReaderStreamOption'
>
```

Added in v0.9.2

## fromStreamK

**Signature**

```ts
export declare const fromStreamK: <A, B>(
  f: (...args: A) => Stream<B>,
) => <E>(...args: A) => ReaderStreamOption<E, B>
```

Added in v0.9.2

## fromTask

**Signature**

```ts
export declare const fromTask: NaturalTransformation12<'Task', '@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## some

**Signature**

```ts
export declare const some: <A, E>(a: A) => RS.ReaderStream<E, O.Option<A>>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: <E, A>() => RS.ReaderStream<E, O.Option<A>>
```

Added in v0.9.2

# Deconstructor

## getOrElse

**Signature**

```ts
export declare const getOrElse: <A>(
  onNone: Lazy<A>,
) => <E>(fa: RS.ReaderStream<E, O.Option<A>>) => RS.ReaderStream<E, A>
```

Added in v0.9.2

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <E, A>(
  onNone: Lazy<RS.ReaderStream<E, A>>,
) => (fa: RS.ReaderStream<E, O.Option<A>>) => RS.ReaderStream<E, A>
```

Added in v0.9.2

## getOrElseEW

**Signature**

```ts
export declare const getOrElseEW: <E1, A>(
  onNone: Lazy<RS.ReaderStream<E1, A>>,
) => <E2>(fa: RS.ReaderStream<E2, O.Option<A>>) => RS.ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## getOrElseW

**Signature**

```ts
export declare const getOrElseW: <A>(
  onNone: Lazy<A>,
) => <E, B>(fa: RS.ReaderStream<E, O.Option<B>>) => RS.ReaderStream<E, A | B>
```

Added in v0.9.2

## match

**Signature**

```ts
export declare const match: <B, A>(
  onNone: () => B,
  onSome: (a: A) => B,
) => <E>(ma: RS.ReaderStream<E, O.Option<A>>) => RS.ReaderStream<E, B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <E, B, A>(
  onNone: () => RS.ReaderStream<E, B>,
  onSome: (a: A) => RS.ReaderStream<E, B>,
) => (ma: RS.ReaderStream<E, O.Option<A>>) => RS.ReaderStream<E, B>
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## Alternative

**Signature**

```ts
export declare const Alternative: Alternative2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Apply2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## FromEnv

**Signature**

```ts
export declare const FromEnv: FE.FromEnv2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FromIO2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## FromReader

**Signature**

```ts
export declare const FromReader: FR.FromReader2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## FromResume

**Signature**

```ts
export declare const FromResume: FRe.FromResume2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## FromStream

**Signature**

```ts
export declare const FromStream: FS.FromStream2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## FromTask

**Signature**

```ts
export declare const FromTask: FromTask2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: P.Provide2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome2<'@typed/fp/ReaderStreamOption'>
```

Added in v0.9.2

# Model

## ReaderStreamOption (interface)

**Signature**

```ts
export interface ReaderStreamOption<E, A> extends RS.ReaderStream<E, O.Option<A>> {}
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/ReaderStreamOption'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
