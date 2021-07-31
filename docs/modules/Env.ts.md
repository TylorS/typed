---
title: Env.ts
nav_order: 9
parent: Modules
---

## Env overview

Env is a ReaderT of Resume. Capable of utilizing Dependency Injection from Reader,
and execute Synchronous and Asynchronous operations with the same effect. This
is the basis of many of the higher-level APIs like Ref.

`Env` is the core of the higher-level modules like @see Ref and is a `ReaderT` of `Resume`; but
to be honest, being used so much, I didn't like writing `ReaderResume<E, A>` and chose to shorten to
`Env<E, A>` for the "environmental" quality Reader provides. Combining Reader and Resume allows for
creating APIs capable of utilizing dependency injection for their configuration and testability
while still combining your sync/async workflows.

While designing application APIs it is often better to describe the logic of your system separate
from the implementation details. `Env` or rather `Reader` helps you accomplish this through the
[Dependency Inversion Principle](https://alexnault.dev/dependency-inversion-principle-in-functional-typescript).
This principle is one of the easiest ways to begin improving any codebase.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [FromResume](#fromresume)
  - [alt](#alt)
  - [altAll](#altall)
  - [altW](#altw)
  - [ap](#ap)
  - [apFirst](#apfirst)
  - [apFirstW](#apfirstw)
  - [apS](#aps)
  - [apSW](#apsw)
  - [apSecond](#apsecond)
  - [apSecondW](#apsecondw)
  - [apT](#apt)
  - [apTW](#aptw)
  - [apW](#apw)
  - [askAndProvide](#askandprovide)
  - [askAndUse](#askanduse)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [bindW](#bindw)
  - [chain](#chain)
  - [chainFirst](#chainfirst)
  - [chainFirstIOK](#chainfirstiok)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainFirstTaskK](#chainfirsttaskk)
  - [chainFirstW](#chainfirstw)
  - [chainIOK](#chainiok)
  - [chainReaderK](#chainreaderk)
  - [chainRec](#chainrec)
  - [chainResumeK](#chainresumek)
  - [chainTaskK](#chaintaskk)
  - [chainW](#chainw)
  - [combineAll](#combineall)
  - [constant](#constant)
  - [flap](#flap)
  - [flatten](#flatten)
  - [flattenW](#flattenw)
  - [map](#map)
  - [provideAll](#provideall)
  - [provideAllWith](#provideallwith)
  - [provideSome](#providesome)
  - [provideSomeWith](#providesomewith)
  - [race](#race)
  - [raceW](#racew)
  - [tap](#tap)
  - [tapEnv](#tapenv)
  - [toResume](#toresume)
  - [toResumeK](#toresumek)
  - [tupled](#tupled)
  - [useAll](#useall)
  - [useAllWith](#useallwith)
  - [useSome](#usesome)
  - [useSomeWith](#usesomewith)
  - [zip](#zip)
  - [zipW](#zipw)
- [Constructor](#constructor)
  - [Do](#do)
  - [ask](#ask)
  - [asks](#asks)
  - [asksE](#askse)
  - [asksIOK](#asksiok)
  - [asksTaskK](#askstaskk)
  - [fromIO](#fromio)
  - [fromIOK](#fromiok)
  - [fromReader](#fromreader)
  - [fromReaderK](#fromreaderk)
  - [fromResume](#fromresume)
  - [fromResumeK](#fromresumek)
  - [fromTask](#fromtask)
  - [fromTaskK](#fromtaskk)
  - [of](#of)
  - [op](#op)
- [Execution](#execution)
  - [execWith](#execwith)
  - [runWith](#runwith)
- [Instance](#instance)
  - [Alt](#alt)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [FromIO](#fromio)
  - [FromReader](#fromreader)
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
  - [Env (interface)](#env-interface)
  - [Of (type alias)](#of-type-alias)
- [Type-level](#type-level)
  - [RequirementsOf (type alias)](#requirementsof-type-alias)
  - [ValueOf (type alias)](#valueof-type-alias)
- [Typeclass Constructor](#typeclass-constructor)
  - [getMonoid](#getmonoid)
  - [getSemigroup](#getsemigroup)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## FromResume

**Signature**

```ts
export declare const FromResume: FRe.FromResume2<'@typed/fp/Env'>
```

Added in v0.9.2

## alt

**Signature**

```ts
export declare const alt: <E, A>(second: FN.Lazy<Env<E, A>>) => (first: Env<E, A>) => Env<E, A>
```

Added in v0.9.2

## altAll

**Signature**

```ts
export declare const altAll: <E, A>(startWith: Env<E, A>) => (as: readonly Env<E, A>[]) => Env<E, A>
```

Added in v0.9.2

## altW

**Signature**

```ts
export declare const altW: <E1, A>(snd: FN.Lazy<Env<E1, A>>) => <E2>(fst: Env<E2, A>) => Env<E1 & E2, A>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <R, A>(fa: Env<R, A>) => <B>(fab: Env<R, Arity1<A, B>>) => Env<R, B>
```

Added in v0.9.2

## apFirst

**Signature**

```ts
export declare const apFirst: <E, B>(second: Env<E, B>) => <A>(first: Env<E, A>) => Env<E, A>
```

Added in v0.9.2

## apFirstW

**Signature**

```ts
export declare const apFirstW: <E1, B>(second: Env<E1, B>) => <E2, A>(first: Env<E2, A>) => Env<E1 & E2, A>
```

Added in v0.9.2

## apS

**Signature**

```ts
export declare const apS: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: Env<E, B>
) => (fa: Env<E, A>) => Env<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSW

**Signature**

```ts
export declare const apSW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: Env<E1, B>
) => <E2>(fa: Env<E2, A>) => Env<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## apSecond

**Signature**

```ts
export declare const apSecond: <E, B>(second: Env<E, B>) => <A>(first: Env<E, A>) => Env<E, B>
```

Added in v0.9.2

## apSecondW

**Signature**

```ts
export declare const apSecondW: <E1, B>(second: Env<E1, B>) => <E2, A>(first: Env<E2, A>) => Env<E1 & E2, B>
```

Added in v0.9.2

## apT

**Signature**

```ts
export declare const apT: <E, B>(fb: Env<E, B>) => <A>(fas: Env<E, A>) => Env<E, readonly [...A, B]>
```

Added in v0.9.2

## apTW

**Signature**

```ts
export declare const apTW: <E1, B>(
  fb: Env<E1, B>
) => <E2, A extends readonly unknown[]>(fas: Env<E2, A>) => Env<E1 & E2, readonly [...A, B]>
```

Added in v0.9.2

## apW

**Signature**

```ts
export declare const apW: <R1, A>(fa: Env<R1, A>) => <R2, B>(fab: Env<R2, Arity1<A, B>>) => Env<R1 & R2, B>
```

Added in v0.9.2

## askAndProvide

**Signature**

```ts
export declare const askAndProvide: <E, B>(hkt: Env<E, B>) => Env<E, Env<unknown, B>>
```

Added in v0.9.2

## askAndUse

**Signature**

```ts
export declare const askAndUse: <E, B>(hkt: Env<E, B>) => Env<E, Env<unknown, B>>
```

Added in v0.9.2

## bind

**Signature**

```ts
export declare const bind: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Env<E, B>
) => (ma: Env<E, A>) => Env<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(name: N) => <E, A>(fa: Env<E, A>) => Env<E, { readonly [K in N]: A }>
```

Added in v0.9.2

## bindW

**Signature**

```ts
export declare const bindW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Env<E1, B>
) => <E2>(ma: Env<E2, A>) => Env<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.2

## chain

**Signature**

```ts
export declare const chain: <A, R, B>(
  f: (a: A) => Re.Reader<R, R.Resume<B>>
) => (ma: Re.Reader<R, R.Resume<A>>) => Re.Reader<R, R.Resume<B>>
```

Added in v0.9.2

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, E, B>(f: (a: A) => Env<E, B>) => (first: Env<E, A>) => Env<E, A>
```

Added in v0.9.2

## chainFirstIOK

**Signature**

```ts
export declare const chainFirstIOK: <A, B>(f: (a: A) => IO.IO<B>) => <E>(first: Env<E, A>) => Env<E, A>
```

Added in v0.9.2

## chainFirstResumeK

**Signature**

```ts
export declare const chainFirstResumeK: <A, B>(f: (value: A) => R.Resume<B>) => <E>(hkt: Env<E, A>) => Env<E, A>
```

Added in v0.9.2

## chainFirstTaskK

**Signature**

```ts
export declare const chainFirstTaskK: <A, B>(f: (a: A) => Task.Task<B>) => <E>(first: Env<E, A>) => Env<E, A>
```

Added in v0.9.2

## chainFirstW

**Signature**

```ts
export declare const chainFirstW: <A, E1, B>(f: (a: A) => Env<E1, B>) => <E2>(first: Env<E2, A>) => Env<E1 & E2, A>
```

Added in v0.9.2

## chainIOK

**Signature**

```ts
export declare const chainIOK: <A, B>(f: (a: A) => IO.IO<B>) => <E>(first: Env<E, A>) => Env<E, B>
```

Added in v0.9.2

## chainReaderK

**Signature**

```ts
export declare const chainReaderK: <A, R, B>(f: (a: A) => Re.Reader<R, B>) => (ma: Env<R, A>) => Env<R, B>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare function chainRec<F extends (value: any) => Env<any, E.Either<any, any>>>(
  f: F
): (
  value: ArgsOf<F>[0]
) => Env<RequirementsOf<ReturnType<F>>, [ValueOf<ReturnType<F>>] extends [E.Either<any, infer R>] ? R : never>
```

Added in v0.9.2

## chainResumeK

**Signature**

```ts
export declare const chainResumeK: <A, B>(f: (value: A) => R.Resume<B>) => <E>(hkt: Env<E, A>) => Env<E, B>
```

Added in v0.9.2

## chainTaskK

**Signature**

```ts
export declare const chainTaskK: <A, B>(f: (a: A) => Task.Task<B>) => <E>(first: Env<E, A>) => Env<E, B>
```

Added in v0.9.2

## chainW

**Signature**

```ts
export declare const chainW: <A, R1, B>(f: (a: A) => Env<R1, B>) => <R2>(ma: Env<R2, A>) => Env<R1 & R2, B>
```

Added in v0.9.2

## combineAll

**Signature**

```ts
export declare const combineAll: <A extends readonly Env<any, any>[]>(
  ...envs: A
) => Env<Intersect<{ [K in keyof A]: RequirementsOf<A[K]> }, unknown>, { [K in keyof A]: ValueOf<A[K]> }>
```

Added in v0.9.2

## constant

**Signature**

```ts
export declare const constant: <A>(a: A) => <R>(fa: Env<R, unknown>) => Env<R, A>
```

Added in v0.9.2

## flap

**Signature**

```ts
export declare const flap: <A>(a: A) => <E, B>(fab: Env<E, (a: A) => B>) => Env<E, B>
```

Added in v0.9.2

## flatten

**Signature**

```ts
export declare const flatten: <E, A>(env: Env<E, Env<E, A>>) => Env<E, A>
```

Added in v0.9.2

## flattenW

**Signature**

```ts
export declare const flattenW: <E1, E2, A>(env: Env<E1, Env<E2, A>>) => Env<E1 & E2, A>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(f: (a: A) => B) => <R>(fa: Env<R, A>) => Env<R, B>
```

Added in v0.9.2

## provideAll

**Signature**

```ts
export declare const provideAll: <E1>(provided: E1) => <A>(env: Env<E1, A>) => Env<unknown, A>
```

Added in v0.9.2

## provideAllWith

**Signature**

```ts
export declare const provideAllWith: <R, A>(provider: Env<R, A>) => <B>(hkt: Env<A, B>) => Env<R, B>
```

Added in v0.9.2

## provideSome

**Signature**

```ts
export declare const provideSome: <E1>(provided: E1) => <E2, A>(env: Env<E1 & E2, A>) => Env<E2, A>
```

Added in v0.9.2

## provideSomeWith

**Signature**

```ts
export declare const provideSomeWith: <E1, A>(provider: Env<E1, A>) => P.Provider2<'@typed/fp/Env', A, E1>
```

Added in v0.9.2

## race

**Signature**

```ts
export declare const race: <E, A>(a: Env<E, A>) => <B>(b: Env<E, B>) => Env<E, A | B>
```

Added in v0.9.2

## raceW

**Signature**

```ts
export declare const raceW: <E1, A>(a: Env<E1, A>) => <E2, B>(b: Env<E2, B>) => Env<E1 & E2, A | B>
```

Added in v0.9.2

## tap

**Signature**

```ts
export declare const tap: <A>(f: (a: A) => any) => <R>(fa: Env<R, A>) => Env<R, A>
```

Added in v0.9.2

## tapEnv

**Signature**

```ts
export declare const tapEnv: <R>(f: (a: R) => any) => <A>(fa: Env<R, A>) => Env<R, A>
```

Added in v0.9.2

## toResume

**Signature**

```ts
export declare const toResume: <E, B>(hkt: Env<E, B>) => Env<E, R.Resume<B>>
```

Added in v0.9.2

## toResumeK

**Signature**

```ts
export declare const toResumeK: <Args extends readonly any[], E, A>(
  envK: (...args: Args) => Env<E, A>
) => Env<E, (...args: Args) => R.Resume<A>>
```

Added in v0.9.2

## tupled

**Signature**

```ts
export declare const tupled: <E, A>(fa: Env<E, A>) => Env<E, readonly [A]>
```

Added in v0.9.2

## useAll

**Signature**

```ts
export declare const useAll: <E1>(provided: E1) => <A>(env: Env<E1, A>) => Env<unknown, A>
```

Added in v0.9.2

## useAllWith

**Signature**

```ts
export declare const useAllWith: <R, A>(provider: Env<R, A>) => <B>(hkt: Env<A, B>) => Env<R, B>
```

Added in v0.9.2

## useSome

**Signature**

```ts
export declare const useSome: <E1>(provided: E1) => <E2, A>(env: Env<E1 & E2, A>) => Env<E2, A>
```

Added in v0.9.2

## useSomeWith

**Signature**

```ts
export declare const useSomeWith: <E1, A>(provider: Env<E1, A>) => P.Provider2<'@typed/fp/Env', A, E1>
```

Added in v0.9.2

## zip

**Signature**

```ts
export declare const zip: <E, A>(ta: readonly Env<E, A>[]) => Env<E, readonly A[]>
```

Added in v0.9.2

## zipW

**Signature**

```ts
export declare const zipW: <A extends readonly Env<any, any>[]>(
  envs: A
) => Env<Intersect<{ [K in keyof A]: RequirementsOf<A[K]> }, unknown>, { [K in keyof A]: ValueOf<A[K]> }>
```

Added in v0.9.2

# Constructor

## Do

**Signature**

```ts
export declare const Do: Env<unknown, {}>
```

Added in v0.9.2

## ask

**Signature**

```ts
export declare const ask: <R>() => Env<R, R>
```

Added in v0.9.2

## asks

**Signature**

```ts
export declare const asks: <R, A>(f: (r: R) => A) => Env<R, A>
```

Added in v0.9.2

## asksE

**Signature**

```ts
export declare const asksE: <R, E, A>(f: (r: R) => Env<E, A>) => Env<E & R, A>
```

Added in v0.9.2

## asksIOK

**Signature**

```ts
export declare const asksIOK: <R, A>(f: (r: R) => IO.IO<A>) => Env<R, A>
```

Added in v0.9.2

## asksTaskK

**Signature**

```ts
export declare const asksTaskK: <R, A>(f: (r: R) => Task.Task<A>) => Env<R, A>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: <A>(fa: IO.IO<A>) => Env<unknown, A>
```

Added in v0.9.2

## fromIOK

**Signature**

```ts
export declare const fromIOK: <A, B>(f: (...a: A) => IO.IO<B>) => <E>(...a: A) => Env<E, B>
```

Added in v0.9.2

## fromReader

**Signature**

```ts
export declare const fromReader: <R, A>(ma: Re.Reader<R, A>) => Env<R, A>
```

Added in v0.9.2

## fromReaderK

**Signature**

```ts
export declare const fromReaderK: <A, R, B>(f: (...a: A) => Re.Reader<R, B>) => (...a: A) => Env<R, B>
```

Added in v0.9.2

## fromResume

**Signature**

```ts
export declare const fromResume: <A, E = unknown>(resume: R.Resume<A>) => Env<E, A>
```

Added in v0.9.2

## fromResumeK

**Signature**

```ts
export declare const fromResumeK: <A, B>(f: (...args: A) => R.Resume<B>) => <E>(...args: A) => Env<E, B>
```

Added in v0.9.2

## fromTask

**Signature**

```ts
export declare const fromTask: <A, E = unknown>(fa: Task.Task<A>) => Env<E, A>
```

Added in v0.9.2

## fromTaskK

**Signature**

```ts
export declare const fromTaskK: <A, B>(f: (...a: A) => Task.Task<B>) => <E>(...a: A) => Env<E, B>
```

Added in v0.9.2

## of

**Signature**

```ts
export declare const of: <A>(a: A) => Of<A>
```

Added in v0.9.2

## op

Construct an Env to a lazily-defined Env-based effect that must be provided later.
Does not support functions which require type-parameters as they will resolve to unknown, due
to limitations in TS, if you need this maybe @see asksE

**Signature**

```ts
export declare const op: <F extends (...args: readonly any[]) => Env<any, any>>() => <
  K extends string | number | symbol
>(
  key: K
) => { (...args: ArgsOf<F>): Env<{ readonly [_ in K]: F }, ValueOf<ReturnType<F>>>; readonly key: K }
```

Added in v0.9.2

# Execution

## execWith

**Signature**

```ts
export declare const execWith: <E>(requirements: E) => (env: Env<E, any>) => Disposable
```

Added in v0.9.2

## runWith

**Signature**

```ts
export declare const runWith: <A>(f: (value: A) => Disposable) => <E>(requirements: E) => (env: Env<E, A>) => Disposable
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt_.Alt2<'@typed/fp/Env'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: FpApplicative.Applicative2<'@typed/fp/Env'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply2<'@typed/fp/Env'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: FpChain.Chain2<'@typed/fp/Env'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'@typed/fp/Env'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FIO.FromIO2<'@typed/fp/Env'>
```

Added in v0.9.2

## FromReader

**Signature**

```ts
export declare const FromReader: FR.FromReader2<'@typed/fp/Env'>
```

Added in v0.9.2

## FromTask

**Signature**

```ts
export declare const FromTask: FT.FromTask2<'@typed/fp/Env'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor2<'@typed/fp/Env'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/Env'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'@typed/fp/Env'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/Env'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: P.Provide2<'@typed/fp/Env'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll2<'@typed/fp/Env'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome2<'@typed/fp/Env'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll2<'@typed/fp/Env'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome2<'@typed/fp/Env'>
```

Added in v0.9.2

# Model

## Env (interface)

Env is specialization of Reader<R, Resume<A>>

**Signature**

```ts
export interface Env<R, A> extends Re.Reader<R, R.Resume<A>> {}
```

Added in v0.9.2

## Of (type alias)

**Signature**

```ts
export type Of<A> = Env<unknown, A>
```

Added in v0.9.2

# Type-level

## RequirementsOf (type alias)

**Signature**

```ts
export type RequirementsOf<A> = [A] extends [Env<infer R, any>]
  ? R
  : [A] extends [FN.FunctionN<any, Env<infer R, any>>]
  ? R
  : never
```

Added in v0.9.2

## ValueOf (type alias)

**Signature**

```ts
export type ValueOf<A> = A extends Env<any, infer R> ? R : A extends FN.FunctionN<any, Env<any, infer R>> ? R : never
```

Added in v0.9.2

# Typeclass Constructor

## getMonoid

**Signature**

```ts
export declare const getMonoid: <A, E>(M: Monoid<A>) => Monoid<Env<E, A>>
```

Added in v0.9.2

## getSemigroup

**Signature**

```ts
export declare const getSemigroup: <A, E>(S: Semigroup<A>) => Semigroup<Env<E, A>>
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Env'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
