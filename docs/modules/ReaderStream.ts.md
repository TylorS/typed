---
title: ReaderStream.ts
nav_order: 29
parent: Modules
---

## ReaderStream overview

ReaderStream is a ReaderT of Most.js' Stream.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [ap](#ap)
  - [apFirst](#apfirst)
  - [apFirstW](#apfirstw)
  - [apS](#aps)
  - [apSEnv](#apsenv)
  - [apSEnvW](#apsenvw)
  - [apSW](#apsw)
  - [apSecond](#apsecond)
  - [apSecondW](#apsecondw)
  - [apT](#apt)
  - [apTEnv](#aptenv)
  - [apTEnvW](#aptenvw)
  - [apTW](#aptw)
  - [apW](#apw)
  - [askAndProvide](#askandprovide)
  - [askAndUse](#askanduse)
  - [bind](#bind)
  - [bindEnv](#bindenv)
  - [bindEnvW](#bindenvw)
  - [bindTo](#bindto)
  - [bindW](#bindw)
  - [chain](#chain)
  - [chainEnvK](#chainenvk)
  - [chainFirst](#chainfirst)
  - [chainFirstEnvK](#chainfirstenvk)
  - [chainFirstIOK](#chainfirstiok)
  - [chainFirstReaderK](#chainfirstreaderk)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainFirstStreamK](#chainfirststreamk)
  - [chainFirstTaskK](#chainfirsttaskk)
  - [chainFirstW](#chainfirstw)
  - [chainIOK](#chainiok)
  - [chainReaderK](#chainreaderk)
  - [chainRec](#chainrec)
  - [chainResumeK](#chainresumek)
  - [chainStreamK](#chainstreamk)
  - [chainTaskK](#chaintaskk)
  - [chainW](#chainw)
  - [collectEvents](#collectevents)
  - [combine](#combine)
  - [combineAll](#combineall)
  - [compact](#compact)
  - [concatMap](#concatmap)
  - [constant](#constant)
  - [continueWith](#continuewith)
  - [debounce](#debounce)
  - [delay](#delay)
  - [during](#during)
  - [exhaustLatest](#exhaustlatest)
  - [exhaustLatestEnv](#exhaustlatestenv)
  - [exhaustMapLatest](#exhaustmaplatest)
  - [exhaustMapLatestEnv](#exhaustmaplatestenv)
  - [filter](#filter)
  - [filterMap](#filtermap)
  - [flap](#flap)
  - [hold](#hold)
  - [join](#join)
  - [keyed](#keyed)
  - [loop](#loop)
  - [map](#map)
  - [merge](#merge)
  - [mergeArray](#mergearray)
  - [mergeConcurrently](#mergeconcurrently)
  - [mergeFirst](#mergefirst)
  - [mergeMapWhen](#mergemapwhen)
  - [multicast](#multicast)
  - [onDispose](#ondispose)
  - [partition](#partition)
  - [partitionMap](#partitionmap)
  - [provideAll](#provideall)
  - [provideAllWith](#provideallwith)
  - [provideAllWithEnv](#provideallwithenv)
  - [provideSome](#providesome)
  - [provideSomeWith](#providesomewith)
  - [provideSomeWithEnv](#providesomewithenv)
  - [race](#race)
  - [recoverWith](#recoverwith)
  - [scan](#scan)
  - [separate](#separate)
  - [since](#since)
  - [skip](#skip)
  - [skipAfter](#skipafter)
  - [skipRepeats](#skiprepeats)
  - [skipRepeatsWith](#skiprepeatswith)
  - [skipWhile](#skipwhile)
  - [slice](#slice)
  - [startWith](#startwith)
  - [switchFirst](#switchfirst)
  - [switchLatest](#switchlatest)
  - [switchMap](#switchmap)
  - [switchMapW](#switchmapw)
  - [take](#take)
  - [takeWhile](#takewhile)
  - [tap](#tap)
  - [throttle](#throttle)
  - [throwError](#throwerror)
  - [tupled](#tupled)
  - [until](#until)
  - [useAll](#useall)
  - [useAllWith](#useallwith)
  - [useAllWithEnv](#useallwithenv)
  - [useSome](#usesome)
  - [useSomeWith](#usesomewith)
  - [useSomeWithEnv](#usesomewithenv)
  - [withStream](#withstream)
  - [zero](#zero)
- [Constructor](#constructor)
  - [Do](#do)
  - [ask](#ask)
  - [asks](#asks)
  - [asksEnv](#asksenv)
  - [asksIO](#asksio)
  - [asksTask](#askstask)
  - [at](#at)
  - [empty](#empty)
  - [fromEnv](#fromenv)
  - [fromEnvK](#fromenvk)
  - [fromIO](#fromio)
  - [fromIOK](#fromiok)
  - [fromReader](#fromreader)
  - [fromReaderK](#fromreaderk)
  - [fromResume](#fromresume)
  - [fromResumeK](#fromresumek)
  - [fromStream](#fromstream)
  - [fromStreamK](#fromstreamk)
  - [fromTask](#fromtask)
  - [fromTaskK](#fromtaskk)
  - [never](#never)
  - [now](#now)
  - [of](#of)
  - [periodic](#periodic)
- [Instance](#instance)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [Compactable](#compactable)
  - [Filterable](#filterable)
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
  - [ReaderStream (interface)](#readerstream-interface)
- [Natural Transformation](#natural-transformation)
  - [toEnv](#toenv)
- [Type-level](#type-level)
  - [RequirementsOf (type alias)](#requirementsof-type-alias)
  - [ValueOf (type alias)](#valueof-type-alias)
- [Typeclass Constructor](#typeclass-constructor)
  - [getApplicativeMonoid](#getapplicativemonoid)
  - [getApplySemigroup](#getapplysemigroup)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## ap

**Signature**

```ts
export declare const ap: <R, A>(
  fa: Re.Reader<R, Stream<A>>
) => <B>(fab: Re.Reader<R, Stream<(a: A) => B>>) => Re.Reader<R, Stream<B>>
```

Added in v0.9.2

## apFirst

**Signature**

```ts
export declare const apFirst: <E, B>(second: ReaderStream<E, B>) => <A>(first: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## apFirstW

**Signature**

```ts
export declare const apFirstW: <E1, B>(
  second: ReaderStream<E1, B>
) => <E2, A>(first: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## apS

**Signature**

```ts
export declare const apS: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderStream<E, B>
) => (fa: ReaderStream<E, A>) => ReaderStream<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSEnv

**Signature**

```ts
export declare const apSEnv: <N extends string, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: E.Env<E, B>
) => (fa: ReaderStream<E, A>) => ReaderStream<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSEnvW

**Signature**

```ts
export declare const apSEnvW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: E.Env<E1, B>
) => <E2>(
  fa: ReaderStream<E2, A>
) => ReaderStream<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSW

**Signature**

```ts
export declare const apSW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderStream<E1, B>
) => <E2>(
  fa: ReaderStream<E2, A>
) => ReaderStream<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSecond

**Signature**

```ts
export declare const apSecond: <E, B>(
  second: ReaderStream<E, B>
) => <A>(first: ReaderStream<E, A>) => ReaderStream<E, B>
```

Added in v0.9.2

## apSecondW

**Signature**

```ts
export declare const apSecondW: <E1, B>(
  second: ReaderStream<E1, B>
) => <E2, A>(first: ReaderStream<E2, A>) => ReaderStream<E1 & E2, B>
```

Added in v0.9.2

## apT

**Signature**

```ts
export declare const apT: <E, B>(
  fb: ReaderStream<E, B>
) => <A>(fas: ReaderStream<E, A>) => ReaderStream<E, readonly [...A, B]>
```

Added in v0.9.2

## apTEnv

**Signature**

```ts
export declare const apTEnv: <E, B>(
  fb: E.Env<E, B>
) => <A extends readonly unknown[]>(fas: ReaderStream<E, A>) => ReaderStream<E, readonly [...A, B]>
```

Added in v0.9.2

## apTEnvW

**Signature**

```ts
export declare const apTEnvW: <E1, B>(
  fb: E.Env<E1, B>
) => <E2, A extends readonly unknown[]>(fas: ReaderStream<E2, A>) => ReaderStream<E1 & E2, readonly [...A, B]>
```

Added in v0.9.2

## apTW

**Signature**

```ts
export declare const apTW: <E1, B>(
  fb: ReaderStream<E1, B>
) => <E2, A extends readonly unknown[]>(fas: ReaderStream<E2, A>) => ReaderStream<E1 & E2, readonly [...A, B]>
```

Added in v0.9.2

## apW

**Signature**

```ts
export declare const apW: <R1, A>(
  fa: ReaderStream<R1, A>
) => <R2, B>(fab: ReaderStream<R2, FN.Arity1<A, B>>) => ReaderStream<R1 & R2, B>
```

Added in v0.9.2

## askAndProvide

**Signature**

```ts
export declare const askAndProvide: <E, B>(hkt: ReaderStream<E, B>) => ReaderStream<E, ReaderStream<unknown, B>>
```

Added in v0.9.2

## askAndUse

**Signature**

```ts
export declare const askAndUse: <E, B>(hkt: ReaderStream<E, B>) => ReaderStream<E, ReaderStream<unknown, B>>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderStream<E, B>
) => (ma: ReaderStream<E, A>) => ReaderStream<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindEnv

**Signature**

```ts
export declare const bindEnv: <N extends string, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => E.Env<E, B>
) => (ma: ReaderStream<E, A>) => ReaderStream<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindEnvW

**Signature**

```ts
export declare const bindEnvW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => E.Env<E1, B>
) => <E2>(
  ma: ReaderStream<E2, A>
) => ReaderStream<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(name: N) => <E, A>(fa: ReaderStream<E, A>) => ReaderStream<E, { readonly [K in N]: A }>
```

Added in v0.9.2

## bindW

**Signature**

```ts
export declare const bindW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderStream<E1, B>
) => <E2>(
  ma: ReaderStream<E2, A>
) => ReaderStream<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, R, B>(
  f: (a: A) => Re.Reader<R, Stream<B>>
) => (ma: Re.Reader<R, Stream<A>>) => Re.Reader<R, Stream<B>>
```

Added in v0.9.2

## chainEnvK

**Signature**

```ts
export declare const chainEnvK: <A, R1, B>(
  f: (value: A) => E.Env<R1, B>
) => <R2>(hkt: ReaderStream<R2, A>) => ReaderStream<R1, B>
```

Added in v0.9.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, E, B>(
  f: (a: A) => ReaderStream<E, B>
) => (first: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## chainFirstEnvK

**Signature**

```ts
export declare const chainFirstEnvK: <A, R1, B>(
  f: (value: A) => E.Env<R1, B>
) => <R2>(hkt: ReaderStream<R2, A>) => ReaderStream<R1, A>
```

Added in v0.9.2

## chainFirstIOK

**Signature**

```ts
export declare const chainFirstIOK: <A, B>(f: (a: A) => IO<B>) => <E>(first: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## chainFirstReaderK

**Signature**

```ts
export declare const chainFirstReaderK: <A, R, B>(
  f: (a: A) => Re.Reader<R, B>
) => (ma: ReaderStream<R, A>) => ReaderStream<R, A>
```

Added in v0.9.2

## chainFirstResumeK

**Signature**

```ts
export declare const chainFirstResumeK: <A, B>(
  f: (value: A) => Resume<B>
) => <E>(hkt: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## chainFirstStreamK

**Signature**

```ts
export declare const chainFirstStreamK: <A, B>(
  f: (value: A) => S.Stream<B>
) => <E>(hkt: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## chainFirstTaskK

**Signature**

```ts
export declare const chainFirstTaskK: <A, B>(
  f: (a: A) => Task<B>
) => <E>(first: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## chainFirstW

**Signature**

```ts
export declare const chainFirstW: <A, E1, B>(
  f: (a: A) => ReaderStream<E1, B>
) => <E2>(first: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## chainIOK

**Signature**

```ts
export declare const chainIOK: <A, B>(f: (a: A) => IO<B>) => <E>(first: ReaderStream<E, A>) => ReaderStream<E, B>
```

Added in v0.9.2

## chainReaderK

**Signature**

```ts
export declare const chainReaderK: <A, R, B>(
  f: (a: A) => Re.Reader<R, B>
) => (ma: ReaderStream<R, A>) => ReaderStream<R, B>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare function chainRec<A, E, B>(
  f: (value: A) => ReaderStream<E, Either<A, B>>
): (value: A) => ReaderStream<E, B>
```

Added in v0.9.2

## chainResumeK

**Signature**

```ts
export declare const chainResumeK: <A, B>(
  f: (value: A) => Resume<B>
) => <E>(hkt: ReaderStream<E, A>) => ReaderStream<E, B>
```

Added in v0.9.2

## chainStreamK

**Signature**

```ts
export declare const chainStreamK: <A, B>(
  f: (value: A) => S.Stream<B>
) => <E>(hkt: ReaderStream<E, A>) => ReaderStream<E, B>
```

Added in v0.9.2

## chainTaskK

**Signature**

```ts
export declare const chainTaskK: <A, B>(f: (a: A) => Task<B>) => <E>(first: ReaderStream<E, A>) => ReaderStream<E, B>
```

Added in v0.9.2

## chainW

**Signature**

```ts
export declare const chainW: <A, R1, B>(
  f: (a: A) => ReaderStream<R1, B>
) => <R2>(ma: ReaderStream<R2, A>) => ReaderStream<R1 & R2, B>
```

Added in v0.9.2

## collectEvents

**Signature**

```ts
export declare const collectEvents: (
  scheduler: S.Scheduler
) => <E, A>(rs: ReaderStream<E, A>) => Re.Reader<E, Promise<readonly A[]>>
```

Added in v0.9.2

## combine

**Signature**

```ts
export declare const combine: <A, B, C>(
  f: (a: A, b: B) => C
) => <E1>(rsa: ReaderStream<E1, A>) => <E2>(rsb: ReaderStream<E2, B>) => ReaderStream<E1 & E2, C>
```

Added in v0.9.2

## combineAll

**Signature**

```ts
export declare const combineAll: <A extends readonly ReaderStream<any, any>[]>(
  ...rss: A
) => ReaderStream<
  Intersect<{ readonly [K in keyof A]: RequirementsOf<A[K]> }, unknown>,
  { readonly [K in keyof A]: ValueOf<A[K]> }
>
```

Added in v0.9.2

## compact

**Signature**

```ts
export declare const compact: <E, A>(rs: ReaderStream<E, O.Option<A>>) => ReaderStream<E, A>
```

Added in v0.9.2

## concatMap

**Signature**

```ts
export declare function concatMap<A, E1>(f: (value: A) => ReaderStream<E1, A>)
```

Added in v0.9.2

## constant

**Signature**

```ts
export declare const constant: <B>(b: B) => <R>(fa: ReaderStream<R, unknown>) => ReaderStream<R, B>
```

Added in v0.9.2

## continueWith

**Signature**

```ts
export declare const continueWith: <E1, A>(
  f: () => ReaderStream<E1, A>
) => <E2, B>(rs: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A | B>
```

Added in v0.9.2

## debounce

**Signature**

```ts
export declare const debounce: (delay: S.Time) => <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## delay

**Signature**

```ts
export declare const delay: (delay: S.Time) => <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## during

**Signature**

```ts
export declare const during: <E1, E2>(
  timeWindow: ReaderStream<E1, ReaderStream<E2, any>>
) => <E3, A>(values: ReaderStream<E3, A>) => ReaderStream<E1 & E2 & E3, A>
```

Added in v0.9.2

## exhaustLatest

**Signature**

```ts
export declare const exhaustLatest: <E1, E2, A>(rs: ReaderStream<E1, ReaderStream<E2, A>>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## exhaustLatestEnv

**Signature**

```ts
export declare const exhaustLatestEnv: <E1, A>(
  env: E.Env<E1, A>
) => <E2, B>(rs: ReaderStream<E2, B>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## exhaustMapLatest

**Signature**

```ts
export declare const exhaustMapLatest: <A, E1, B>(
  f: (value: A) => ReaderStream<E1, B>
) => <E2>(rs: ReaderStream<E2, A>) => ReaderStream<E1 & E2, B>
```

Added in v0.9.2

## exhaustMapLatestEnv

**Signature**

```ts
export declare const exhaustMapLatestEnv: <A, E1, B>(
  f: (value: A) => E.Env<E1, B>
) => <E2>(rs: ReaderStream<E2, A>) => ReaderStream<E1 & E2, B>
```

Added in v0.9.2

## filter

**Signature**

```ts
export declare function filter<A, B extends A>(
  refinement: Refinement<A, B>
): <E>(rs: ReaderStream<E, A>) => ReaderStream<E, B>
export declare function filter<A>(predicate: Predicate<A>): <E>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## filterMap

**Signature**

```ts
export declare const filterMap: <A, B>(f: (a: A) => O.Option<B>) => <E>(fa: ReaderStream<E, A>) => ReaderStream<E, B>
```

Added in v0.9.2

## flap

**Signature**

```ts
export declare const flap: <A>(a: A) => <E, B>(fab: ReaderStream<E, (a: A) => B>) => ReaderStream<E, B>
```

Added in v0.9.2

## hold

**Signature**

```ts
export declare const hold: <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## join

**Signature**

```ts
export declare const join: <E1, E2, A>(rs: ReaderStream<E1, ReaderStream<E2, A>>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## keyed

**Signature**

```ts
export declare const keyed: <A>(
  Eq: Eq<A>
) => <E>(rs: ReaderStream<E, readonly A[]>) => ReaderStream<E, readonly S.Stream<A>[]>
```

Added in v0.9.2

## loop

**Signature**

```ts
export declare const loop: <A, B, C>(
  f: (a: A, b: B) => SV<A, C>,
  seed: A
) => <E>(fa: ReaderStream<E, B>) => ReaderStream<E, C>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(f: (a: A) => B) => <R>(fa: ReaderStream<R, A>) => ReaderStream<R, B>
```

Added in v0.9.2

## merge

**Signature**

```ts
export declare function merge<E1, A>(a: ReaderStream<E1, A>)
```

Added in v0.9.2

## mergeArray

**Signature**

```ts
export declare function mergeArray<A extends ReadonlyArray<ReaderStream<any, any>>>(
  streams: A
): ReaderStream<Intersect<{ readonly [K in keyof A]: RequirementsOf<A[K]> }>, ValueOf<A[number]>>
```

Added in v0.9.2

## mergeConcurrently

**Signature**

```ts
export declare const mergeConcurrently: (
  concurrency: number
) => <E1, E2, A>(rs: ReaderStream<E1, ReaderStream<E2, A>>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## mergeFirst

**Signature**

```ts
export declare function mergeFirst<E1, A>(a: ReaderStream<E1, A>)
```

Added in v0.9.2

## mergeMapWhen

**Signature**

```ts
export declare const mergeMapWhen: <V>(
  Eq?: Eq<V>
) => <E1, A>(
  f: (value: V) => ReaderStream<E1, A>
) => <E2>(values: ReaderStream<E2, readonly V[]>) => ReaderStream<E1 & E2, readonly A[]>
```

Added in v0.9.2

## multicast

**Signature**

```ts
export declare const multicast: <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## onDispose

**Signature**

```ts
export declare const onDispose: (disposable: S.Disposable) => <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## partition

**Signature**

```ts
export declare const partition: <A>(
  predicate: Predicate<A>
) => <E>(fa: ReaderStream<E, A>) => Separated<ReaderStream<E, A>, ReaderStream<E, A>>
```

Added in v0.9.2

## partitionMap

**Signature**

```ts
export declare const partitionMap: <A, B, C>(
  f: (a: A) => Either<B, C>
) => <E>(fa: ReaderStream<E, A>) => Separated<ReaderStream<E, B>, ReaderStream<E, C>>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <E1>(provided: E1) => <A>(rs: ReaderStream<E1, A>) => ReaderStream<unknown, A>
```

Added in v0.9.2

## provideAllWith

**Signature**

```ts
export declare const provideAllWith: <R, A>(
  provider: ReaderStream<R, A>
) => <B>(hkt: ReaderStream<A, B>) => ReaderStream<R, B>
```

Added in v0.9.2

## provideAllWithEnv

**Signature**

```ts
export declare const provideAllWithEnv: <E, A>(
  resume: E.Env<E, A>
) => <B>(hkt: ReaderStream<A, B>) => ReaderStream<E, B>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <E1>(provided: E1) => <E2, A>(rs: ReaderStream<E1 & E2, A>) => ReaderStream<E2, A>
```

Added in v0.9.2

## provideSomeWith

**Signature**

```ts
export declare const provideSomeWith: <E1, A>(
  provider: ReaderStream<E1, A>
) => P.Provider2<'@typed/fp/ReaderStream', A, E1>
```

Added in v0.9.2

## provideSomeWithEnv

**Signature**

```ts
export declare const provideSomeWithEnv: <E, A>(resume: E.Env<E, A>) => P.Provider2<'@typed/fp/ReaderStream', A, E>
```

Added in v0.9.2

## race

**Signature**

```ts
export declare const race: <E1, A>(
  second: ReaderStream<E1, A>
) => <E2, B>(first: ReaderStream<E2, B>) => ReaderStream<E1 & E2, A | B>
```

Added in v0.9.2

## recoverWith

**Signature**

```ts
export declare const recoverWith: <E1, A>(
  f: (error: Error) => ReaderStream<E1, A>
) => <E2>(rs: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## scan

**Signature**

```ts
export declare const scan: <A, B>(
  f: (acc: A, value: B) => A,
  seed: A
) => <E>(rs: ReaderStream<E, B>) => ReaderStream<E, A>
```

Added in v0.9.2

## separate

**Signature**

```ts
export declare const separate: <E, A, B>(
  rs: ReaderStream<E, Either<A, B>>
) => Separated<ReaderStream<E, A>, ReaderStream<E, B>>
```

Added in v0.9.2

## since

**Signature**

```ts
export declare const since: <E1>(
  timeWindow: ReaderStream<E1, any>
) => <E2, A>(values: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## skip

**Signature**

```ts
export declare const skip: (n: number) => <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## skipAfter

**Signature**

```ts
export declare const skipAfter: <A>(p: (a: A) => boolean) => <E>(s: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## skipRepeats

**Signature**

```ts
export declare const skipRepeats: <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## skipRepeatsWith

**Signature**

```ts
export declare const skipRepeatsWith: <A>(Eq: Eq<A>) => <E>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## skipWhile

**Signature**

```ts
export declare const skipWhile: <A>(p: (a: A) => boolean) => <E>(s: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## slice

**Signature**

```ts
export declare const slice: (skip: number, take: number) => <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## startWith

**Signature**

```ts
export declare const startWith: <A>(value: A) => <E, B>(stream: ReaderStream<E, B>) => ReaderStream<E, A | B>
```

Added in v0.9.2

## switchFirst

**Signature**

```ts
export declare const switchFirst: <R1, A>(
  second: ReaderStream<R1, A>
) => <R2, B>(first: ReaderStream<R2, B>) => ReaderStream<R1 & R2, B>
```

Added in v0.9.2

## switchLatest

**Signature**

```ts
export declare const switchLatest: <E1, E2, A>(rs: ReaderStream<E1, ReaderStream<E2, A>>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## switchMap

**Signature**

```ts
export declare const switchMap: <A, R, B>(
  f: (a: A) => Re.Reader<R, Stream<B>>
) => (ma: Re.Reader<R, Stream<A>>) => Re.Reader<R, Stream<B>>
```

Added in v0.9.2

## switchMapW

**Signature**

```ts
export declare const switchMapW: <A, R1, B>(
  f: (a: A) => ReaderStream<R1, B>
) => <R2>(ma: ReaderStream<R2, A>) => ReaderStream<R1 & R2, B>
```

Added in v0.9.2

## take

**Signature**

```ts
export declare const take: (n: number) => <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## takeWhile

**Signature**

```ts
export declare const takeWhile: <A>(p: (a: A) => boolean) => <E>(s: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## tap

**Signature**

```ts
export declare const tap: <A>(f: (value: A) => any) => <E>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## throttle

**Signature**

```ts
export declare const throttle: (period: number) => <E, A>(s: ReaderStream<E, A>) => ReaderStream<E, A>
```

Added in v0.9.2

## throwError

**Signature**

```ts
export declare const throwError: <E>(e: Error) => ReaderStream<E, never>
```

Added in v0.9.2

## tupled

**Signature**

```ts
export declare const tupled: <E, A>(fa: ReaderStream<E, A>) => ReaderStream<E, readonly [A]>
```

Added in v0.9.2

## until

**Signature**

```ts
export declare const until: <E1>(
  timeWindow: ReaderStream<E1, any>
) => <E2, A>(values: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <E1>(provided: E1) => <A>(rs: ReaderStream<E1, A>) => ReaderStream<unknown, A>
```

Added in v0.9.2

## useAllWith

**Signature**

```ts
export declare const useAllWith: <R, A>(
  provider: ReaderStream<R, A>
) => <B>(hkt: ReaderStream<A, B>) => ReaderStream<R, B>
```

Added in v0.9.2

## useAllWithEnv

**Signature**

```ts
export declare const useAllWithEnv: <E, A>(resume: E.Env<E, A>) => <B>(hkt: ReaderStream<A, B>) => ReaderStream<E, B>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <E1>(provided: E1) => <E2, A>(rs: ReaderStream<E1 & E2, A>) => ReaderStream<E2, A>
```

Added in v0.9.2

## useSomeWith

**Signature**

```ts
export declare const useSomeWith: <E1, A>(provider: ReaderStream<E1, A>) => P.Provider2<'@typed/fp/ReaderStream', A, E1>
```

Added in v0.9.2

## useSomeWithEnv

**Signature**

```ts
export declare const useSomeWithEnv: <E, A>(resume: E.Env<E, A>) => P.Provider2<'@typed/fp/ReaderStream', A, E>
```

Added in v0.9.2

## withStream

**Signature**

```ts
export declare const withStream: <A, B>(f: (stream: S.Stream<A>) => B) => <E>(rs: ReaderStream<E, A>) => Re.Reader<E, B>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: <A>() => ReaderStream<unknown, A>
```

Added in v0.9.2

# Constructor

## Do

**Signature**

```ts
export declare const Do: ReaderStream<unknown, {}>
```

Added in v0.9.2

## ask

**Signature**

```ts
export declare const ask: <R>() => ReaderStream<R, R>
```

Added in v0.9.2

## asks

**Signature**

```ts
export declare const asks: <R, A>(f: (r: R) => A) => ReaderStream<R, A>
```

Added in v0.9.2

## asksEnv

**Signature**

```ts
export declare const asksEnv: <E1, E2, B>(f: (e1: E1) => E.Env<E2, B>) => ReaderStream<E1 & E2, B>
```

Added in v0.9.2

## asksIO

**Signature**

```ts
export declare const asksIO: <E1, B>(f: (e1: E1) => IO<B>) => ReaderStream<E1, B>
```

Added in v0.9.2

## asksTask

**Signature**

```ts
export declare const asksTask: <E1, B>(f: (e1: E1) => Task<B>) => ReaderStream<E1, B>
```

Added in v0.9.2

## at

**Signature**

```ts
export declare const at: <A>(t: number, x: A) => ReaderStream<unknown, A>
```

Added in v0.9.2

## empty

**Signature**

```ts
export declare const empty: <E>() => ReaderStream<E, never>
```

Added in v0.9.2

## fromEnv

**Signature**

```ts
export declare const fromEnv: NaturalTransformation22<'@typed/fp/Env', '@typed/fp/ReaderStream'>
```

Added in v0.9.2

## fromEnvK

**Signature**

```ts
export declare const fromEnvK: <A, R, B>(f: (...args: A) => E.Env<R, B>) => (...args: A) => ReaderStream<R, B>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: NaturalTransformation12<'IO', '@typed/fp/ReaderStream'>
```

Added in v0.9.2

## fromIOK

**Signature**

```ts
export declare const fromIOK: <A, B>(f: (...a: A) => IO<B>) => <E>(...a: A) => ReaderStream<E, B>
```

Added in v0.9.2

## fromReader

**Signature**

```ts
export declare const fromReader: <R, A>(ma: Re.Reader<R, A>) => ReaderStream<R, A>
```

Added in v0.9.2

## fromReaderK

**Signature**

```ts
export declare const fromReaderK: <A, R, B>(f: (...a: A) => Re.Reader<R, B>) => (...a: A) => ReaderStream<R, B>
```

Added in v0.9.2

## fromResume

**Signature**

```ts
export declare const fromResume: NaturalTransformation12<'@typed/fp/Resume', '@typed/fp/ReaderStream'>
```

Added in v0.9.2

## fromResumeK

**Signature**

```ts
export declare const fromResumeK: <A, B>(f: (...args: A) => Resume<B>) => <E>(...args: A) => ReaderStream<E, B>
```

Added in v0.9.2

## fromStream

**Signature**

```ts
export declare const fromStream: NaturalTransformation12<'@most/core/Stream', '@typed/fp/ReaderStream'>
```

Added in v0.9.2

## fromStreamK

**Signature**

```ts
export declare const fromStreamK: <A, B>(f: (...args: A) => S.Stream<B>) => <E>(...args: A) => ReaderStream<E, B>
```

Added in v0.9.2

## fromTask

**Signature**

```ts
export declare const fromTask: NaturalTransformation12<'Task', '@typed/fp/ReaderStream'>
```

Added in v0.9.2

## fromTaskK

**Signature**

```ts
export declare const fromTaskK: <A, B>(f: (...a: A) => Task<B>) => <E>(...a: A) => ReaderStream<E, B>
```

Added in v0.9.2

## never

**Signature**

```ts
export declare const never: <E>() => ReaderStream<E, never>
```

Added in v0.9.2

## now

**Signature**

```ts
export declare const now: <A>(x: A) => ReaderStream<unknown, A>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A, R = unknown>(a: A) => ReaderStream<R, A>
```

Added in v0.9.2

## periodic

**Signature**

```ts
export declare const periodic: <E>(period: number) => ReaderStream<E, void>
```

Added in v0.9.2

# Instance

## Applicative

**Signature**

```ts
export declare const Applicative: App.Applicative2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Ch.Chain2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## Compactable

**Signature**

```ts
export declare const Compactable: Compactable2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## Filterable

**Signature**

```ts
export declare const Filterable: Filterable_.Filterable2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## FromEnv

**Signature**

```ts
export declare const FromEnv: FE.FromEnv2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FIO.FromIO2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## FromReader

**Signature**

```ts
export declare const FromReader: FR.FromReader2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## FromResume

**Signature**

```ts
export declare const FromResume: FRe.FromResume2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## FromStream

**Signature**

```ts
export declare const FromStream: FS.FromStream2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## FromTask

**Signature**

```ts
export declare const FromTask: FT.FromTask2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: F.Functor2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: P.Provide2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome2<'@typed/fp/ReaderStream'>
```

Added in v0.9.2

# Model

## ReaderStream (interface)

Env is specialization of Reader<R, Resume<A>>

**Signature**

```ts
export interface ReaderStream<R, A> extends Re.Reader<R, S.Stream<A>> {}
```

Added in v0.9.2

# Natural Transformation

## toEnv

**Signature**

```ts
export declare const toEnv: <E, A>(rs: ReaderStream<E, A>) => E.Env<E & SchedulerEnv, A>
```

Added in v0.9.2

# Type-level

## RequirementsOf (type alias)

**Signature**

```ts
export type RequirementsOf<A> = [A] extends [ReaderStream<infer R, any>] ? R : never
```

Added in v0.9.2

## ValueOf (type alias)

**Signature**

```ts
export type ValueOf<A> = [A] extends [ReaderStream<any, infer R>] ? R : never
```

Added in v0.9.2

# Typeclass Constructor

## getApplicativeMonoid

**Signature**

```ts
export declare const getApplicativeMonoid: <A, E>(M: Monoid<A>) => Monoid<ReaderStream<E, A>>
```

Added in v0.9.2

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A, E>(S: Semigroup<A>) => Semigroup<ReaderStream<E, A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/ReaderStream'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
