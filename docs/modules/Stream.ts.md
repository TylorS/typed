---
title: Stream.ts
nav_order: 69
parent: Modules
---

## Stream overview

Stream is an extension of @most/core with additional fp-ts instances as well as additional
combinators for interoperation with other data structures in @typed/fp and fp-ts.

A large goal of @typed/fp is to expand the `fp-ts` ecosystem to include
[@most/core](https://github.com/mostjs/core) for a Reactive programming style, including derivatives
such as [ReaderStream](./ReaderStream.ts.md), [ReaderStreamEither](./ReaderStreamEither.ts.md),
[StateReaderStreamEither](./StateReaderStreamEither.ts.md) and a few others. It's the fastest
push-based reactive library in JS period. The performance characteristics are due to it's
architecture of getting out of the way of the computations you need to perform. It's also the first
experience I had with FP. For instance, Most utilizes `Functor` laws to remove unneeded machinery
through function composition improving runtime performance amongst other optimizations.

See the [@most/core Documentation](https://mostcore.readthedocs.io/en/latest/) for the remaining API
exposed by this module. Both @most/core + @most/types are re-exported from this module

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [apFirst](#apfirst)
  - [apS](#aps)
  - [apSecond](#apsecond)
  - [apT](#apt)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [chainFirst](#chainfirst)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainRec](#chainrec)
  - [chainResumeK](#chainresumek)
  - [collectEvents](#collectevents)
  - [combineAll](#combineall)
  - [combineStruct](#combinestruct)
  - [compact](#compact)
  - [exhaustLatest](#exhaustlatest)
  - [exhaustMapLatest](#exhaustmaplatest)
  - [filterMap](#filtermap)
  - [keyed](#keyed)
  - [mergeConcurrentlyRec](#mergeconcurrentlyrec)
  - [mergeFirst](#mergefirst)
  - [mergeMapWhen](#mergemapwhen)
  - [onDispose](#ondispose)
  - [partition](#partition)
  - [partitionMap](#partitionmap)
  - [race](#race)
  - [separate](#separate)
  - [switchFirst](#switchfirst)
  - [switchRec](#switchrec)
  - [tupled](#tupled)
- [Constructor](#constructor)
  - [Do](#do)
  - [createCallbackTask](#createcallbacktask)
  - [createSink](#createsink)
  - [fromIO](#fromio)
  - [fromResume](#fromresume)
  - [fromResumeK](#fromresumek)
  - [fromTask](#fromtask)
  - [of](#of)
  - [zero](#zero)
- [Instance](#instance)
  - [Alt](#alt)
  - [Alternative](#alternative)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [Compactable](#compactable)
  - [Filterable](#filterable)
  - [FromIO](#fromio)
  - [FromResume](#fromresume)
  - [FromTask](#fromtask)
  - [Functor](#functor)
  - [Monad](#monad)
  - [Pointed](#pointed)
  - [SwitchRec](#switchrec)
- [Model](#model)
  - [Stream (type alias)](#stream-type-alias)
- [Type-level](#type-level)
  - [ValueOf (type alias)](#valueof-type-alias)
- [Typeclass Constructor](#typeclass-constructor)
  - [getApplicativeMonoid](#getapplicativemonoid)
  - [getApplySemigroup](#getapplysemigroup)
  - [getConcurrentChainRec](#getconcurrentchainrec)
  - [getMonoid](#getmonoid)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## apFirst

**Signature**

```ts
export declare const apFirst: <B>(
  second: types.Stream<B>,
) => <A>(first: types.Stream<A>) => types.Stream<A>
```

Added in v0.9.2

## apS

**Signature**

```ts
export declare const apS: <N, A, B>(
  name: Exclude<N, keyof A>,
  fb: types.Stream<B>,
) => (
  fa: types.Stream<A>,
) => types.Stream<{ readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSecond

**Signature**

```ts
export declare const apSecond: <B>(
  second: types.Stream<B>,
) => <A>(first: types.Stream<A>) => types.Stream<B>
```

Added in v0.9.2

## apT

**Signature**

```ts
export declare const apT: <B>(
  fb: types.Stream<B>,
) => <A>(fas: types.Stream<A>) => types.Stream<readonly [...A, B]>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => types.Stream<B>,
) => (
  ma: types.Stream<A>,
) => types.Stream<{ readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(
  name: N,
) => <A>(fa: types.Stream<A>) => types.Stream<{ [K in N]: A }>
```

Added in v0.9.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, B>(
  f: (a: A) => types.Stream<B>,
) => (first: types.Stream<A>) => types.Stream<A>
```

Added in v0.9.2

## chainFirstResumeK

**Signature**

```ts
export declare const chainFirstResumeK: <A, B>(
  f: (value: A) => R.Resume<B>,
) => (hkt: types.Stream<A>) => types.Stream<A>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, B>(
  f: (value: A) => types.Stream<Either<A, B>>,
) => (value: A) => types.Stream<B>
```

Added in v0.9.2

## chainResumeK

**Signature**

```ts
export declare const chainResumeK: <A, B>(
  f: (value: A) => R.Resume<B>,
) => (hkt: types.Stream<A>) => types.Stream<B>
```

Added in v0.9.2

## collectEvents

**Signature**

```ts
export declare const collectEvents: (
  scheduler: types.Scheduler,
) => <A>(stream: types.Stream<A>) => Promise<readonly A[]>
```

Added in v0.9.2

## combineAll

**Signature**

```ts
export declare const combineAll: <A extends readonly types.Stream<any>[]>(
  ...streams: A
) => types.Stream<{ readonly [K in keyof A]: ValueOf<A[K]> }>
```

Added in v0.9.2

## combineStruct

**Signature**

```ts
export declare const combineStruct: <A>(
  streams: { readonly [K in keyof A]: types.Stream<A[K]> },
) => types.Stream<A>
```

Added in v0.11.0

## compact

**Signature**

```ts
export declare const compact: <A>(stream: types.Stream<O.Option<A>>) => types.Stream<A>
```

Added in v0.9.2

## exhaustLatest

**Signature**

```ts
export declare const exhaustLatest: <A>(stream: types.Stream<types.Stream<A>>) => types.Stream<A>
```

Added in v0.9.2

## exhaustMapLatest

**Signature**

```ts
export declare const exhaustMapLatest: <A, B>(
  f: (value: A) => types.Stream<B>,
) => (stream: types.Stream<A>) => types.Stream<B>
```

Added in v0.9.2

## filterMap

**Signature**

```ts
export declare const filterMap: <A, B>(
  f: (a: A) => O.Option<B>,
) => (fa: types.Stream<A>) => types.Stream<B>
```

Added in v0.9.2

## keyed

**Signature**

```ts
export declare const keyed: <A>(
  Eq: Eq<A>,
) => (stream: Stream<readonly A[]>) => Stream<readonly Stream<A>[]>
```

Added in v0.9.2

## mergeConcurrentlyRec

**Signature**

```ts
export declare const mergeConcurrentlyRec: (
  concurrency: number,
) => <A, B>(f: (value: A) => types.Stream<Either<A, B>>) => (value: A) => types.Stream<B>
```

Added in v0.9.2

## mergeFirst

**Signature**

```ts
export declare function mergeFirst<A>(a: Stream<A>)
```

Added in v0.9.2

## mergeMapWhen

Using the provided Eq mergeMapWhen conditionally applies a Kliesli arrow to the values within an
Array when they are added and any values removed from the array will be disposed of immediately

**Signature**

```ts
export declare const mergeMapWhen: <V>(
  Eq?: Eq<V>,
) => <A>(f: (value: V) => types.Stream<A>) => (values: Stream<readonly V[]>) => Stream<readonly A[]>
```

Added in v0.9.2

## onDispose

**Signature**

```ts
export declare const onDispose: (
  disposable: types.Disposable,
) => <A>(stream: types.Stream<A>) => types.Stream<A>
```

Added in v0.9.2

## partition

**Signature**

```ts
export declare const partition: <A>(
  predicate: Predicate<A>,
) => (fa: types.Stream<A>) => Separated<types.Stream<A>, types.Stream<A>>
```

Added in v0.9.2

## partitionMap

**Signature**

```ts
export declare const partitionMap: <A, B, C>(
  f: (a: A) => Either<B, C>,
) => (fa: types.Stream<A>) => Separated<types.Stream<B>, types.Stream<C>>
```

Added in v0.9.2

## race

**Signature**

```ts
export declare const race: <A>(
  second: Lazy<types.Stream<A>>,
) => (first: types.Stream<A>) => types.Stream<A>
```

Added in v0.9.2

## separate

**Signature**

```ts
export declare const separate: <A, B>(
  stream: types.Stream<Either<A, B>>,
) => Separated<types.Stream<A>, types.Stream<B>>
```

Added in v0.9.2

## switchFirst

**Signature**

```ts
export declare const switchFirst: <A>(second: Stream<A>) => <B>(first: Stream<B>) => Stream<B>
```

Added in v0.9.2

## switchRec

**Signature**

```ts
export declare const switchRec: <A, B>(
  f: (value: A) => types.Stream<Either<A, B>>,
) => (value: A) => types.Stream<B>
```

Added in v0.9.2

## tupled

**Signature**

```ts
export declare const tupled: <A>(fa: types.Stream<A>) => types.Stream<readonly [A]>
```

Added in v0.9.2

# Constructor

## Do

**Signature**

```ts
export declare const Do: types.Stream<{}>
```

Added in v0.9.2

## createCallbackTask

Convert an IO<Disposable> into a Most.js Task

**Signature**

```ts
export declare function createCallbackTask(
  cb: Arity1<types.Time, types.Disposable>,
  onError?: (error: Error) => void,
): types.Task
```

Added in v0.9.2

## createSink

**Signature**

```ts
export declare const createSink: <A>(sink?: Partial<types.Sink<A>>) => types.Sink<A>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: NaturalTransformation11<'IO', '@most/core/Stream'>
```

Added in v0.9.2

## fromResume

**Signature**

```ts
export declare const fromResume: NaturalTransformation11<'@typed/fp/Resume', '@most/core/Stream'>
```

Added in v0.9.2

## fromResumeK

**Signature**

```ts
export declare const fromResumeK: <A, B>(
  f: (...args: A) => R.Resume<B>,
) => (...args: A) => types.Stream<B>
```

Added in v0.9.2

## fromTask

**Signature**

```ts
export declare const fromTask: NaturalTransformation11<'Task', '@most/core/Stream'>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A>(a: A) => types.Stream<A>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: <A>() => types.Stream<A>
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt_.Alt1<'@most/core/Stream'>
```

Added in v0.9.2

## Alternative

**Signature**

```ts
export declare const Alternative: Alternative1<'@most/core/Stream'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: App.Applicative1<'@most/core/Stream'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply1<'@most/core/Stream'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: CH.Chain1<'@most/core/Stream'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec1<'@most/core/Stream'>
```

Added in v0.9.2

## Compactable

**Signature**

```ts
export declare const Compactable: Compactable1<'@most/core/Stream'>
```

Added in v0.9.2

## Filterable

**Signature**

```ts
export declare const Filterable: Filterable1<'@most/core/Stream'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FromIO1<'@most/core/Stream'>
```

Added in v0.9.2

## FromResume

**Signature**

```ts
export declare const FromResume: FRe.FromResume1<'@most/core/Stream'>
```

Added in v0.9.2

## FromTask

**Signature**

```ts
export declare const FromTask: FromTask1<'@most/core/Stream'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor1<'@most/core/Stream'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad1<'@most/core/Stream'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed1<'@most/core/Stream'>
```

Added in v0.9.2

## SwitchRec

**Signature**

```ts
export declare const SwitchRec: ChainRec1<'@most/core/Stream'>
```

Added in v0.9.2

# Model

## Stream (type alias)

**Signature**

```ts
export type Stream<A> = types.Stream<A>
```

Added in v0.9.2

# Type-level

## ValueOf (type alias)

**Signature**

```ts
export type ValueOf<A> = [A] extends [Stream<infer R>] ? R : never
```

Added in v0.9.2

# Typeclass Constructor

## getApplicativeMonoid

**Signature**

```ts
export declare const getApplicativeMonoid: <A>(M: Monoid<A>) => Monoid<types.Stream<A>>
```

Added in v0.9.2

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A>(S: Semigroup<A>) => Semigroup<types.Stream<A>>
```

Added in v0.9.2

## getConcurrentChainRec

**Signature**

```ts
export declare const getConcurrentChainRec: (concurrency: number) => ChainRec1<URI>
```

Added in v0.9.2

## getMonoid

**Signature**

```ts
export declare const getMonoid: <A>() => Monoid<types.Stream<A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@most/core/Stream'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
