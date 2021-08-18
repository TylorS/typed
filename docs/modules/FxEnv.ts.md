---
title: FxEnv.ts
nav_order: 27
parent: Modules
---

## FxEnv overview

Added in v0.13.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
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
  - [bind](#bind)
  - [chain](#chain)
  - [chainFirst](#chainfirst)
  - [chainRec](#chainrec)
  - [doEnv](#doenv)
  - [getApplySemigroup](#getapplysemigroup)
  - [liftEnv](#liftenv)
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
  - [fromIO](#fromio)
  - [fromReader](#fromreader)
  - [fromResume](#fromresume)
  - [fromTask](#fromtask)
  - [of](#of)
- [ConstructorfromReader](#constructorfromreader)
  - [asks](#asks)
- [Instance](#instance)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Chain](#chain)
  - [ChainRec](#chainrec)
  - [FromReader](#fromreader)
  - [Functor](#functor)
  - [Monad](#monad)
  - [Pointed](#pointed)
  - [Provide](#provide)
  - [ProvideAll](#provideall)
  - [ProvideSome](#providesome)
  - [UseAll](#useall)
  - [UseSome](#usesome)
- [Interpreter](#interpreter)
  - [Do](#do)
  - [toEnv](#toenv)
- [Model](#model)
  - [FxEnv (interface)](#fxenv-interface)
- [Type-level](#type-level)
  - [GetRequirements (type alias)](#getrequirements-type-alias)
  - [GetValue (type alias)](#getvalue-type-alias)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## ap

**Signature**

```ts
export declare const ap: <E1, A>(
  fa: Fx<E.Env<E1, unknown>, A, unknown>,
) => <E2, B>(
  fab: Fx<E.Env<E2, unknown>, Arity1<A, B>, unknown>,
) => Fx<E.Env<E1 & E2, unknown>, B, unknown>
```

Added in v0.13.0

## apFirst

**Signature**

```ts
export declare const apFirst: <E, B>(second: FxEnv<E, B>) => <A>(first: FxEnv<E, A>) => FxEnv<E, A>
```

Added in v0.13.0

## apFirstW

**Signature**

```ts
export declare const apFirstW: <E1, B>(
  second: FxEnv<E1, B>,
) => <E2, A>(first: FxEnv<E2, A>) => FxEnv<E1 & E2, A>
```

Added in v0.13.0

## apS

**Signature**

```ts
export declare const apS: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: FxEnv<E, B>,
) => (fa: FxEnv<E, A>) => FxEnv<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.13.0

## apSW

**Signature**

```ts
export declare const apSW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: FxEnv<E1, B>,
) => <E2>(
  fa: FxEnv<E2, A>,
) => FxEnv<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.13.0

## apSecond

**Signature**

```ts
export declare const apSecond: <E, B>(second: FxEnv<E, B>) => <A>(first: FxEnv<E, A>) => FxEnv<E, B>
```

Added in v0.13.0

## apSecondW

**Signature**

```ts
export declare const apSecondW: <E1, B>(
  second: FxEnv<E1, B>,
) => <E2, A>(first: FxEnv<E2, A>) => FxEnv<E1 & E2, A>
```

Added in v0.13.0

## apT

**Signature**

```ts
export declare const apT: <E, B>(
  fb: FxEnv<E, B>,
) => <A>(fas: FxEnv<E, A>) => FxEnv<E, readonly [...A, B]>
```

Added in v0.13.0

## apTW

**Signature**

```ts
export declare const apTW: <E1, B>(
  fb: FxEnv<E1, B>,
) => <E2, A extends readonly unknown[]>(fas: FxEnv<E2, A>) => FxEnv<E1 & E2, readonly [...A, B]>
```

Added in v0.13.0

## askAndProvide

**Signature**

```ts
export declare const askAndProvide: <E, B>(hkt: FxEnv<E, B>) => FxEnv<E, FxEnv<unknown, B>>
```

Added in v0.13.0

## askAndUse

**Signature**

```ts
export declare const askAndUse: <E, B>(hkt: FxEnv<E, B>) => FxEnv<E, FxEnv<unknown, B>>
```

Added in v0.13.0

## bind

**Signature**

```ts
export declare const bind: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => FxEnv<E, B>,
) => (ma: FxEnv<E, A>) => FxEnv<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.13.0

## chain

**Signature**

```ts
export declare const chain: <A, E1, B>(
  f: (value: A) => Fx<E.Env<E1, unknown>, B, unknown>,
) => <E2>(fx: Fx<E.Env<E2, unknown>, A, unknown>) => Fx<E.Env<E1 & E2, unknown>, B, unknown>
```

Added in v0.13.0

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, E, B>(
  f: (a: A) => FxEnv<E, B>,
) => (first: FxEnv<E, A>) => FxEnv<E, A>
```

Added in v0.13.0

## chainRec

**Signature**

```ts
export declare const chainRec: <A, E, B>(
  f: Arity1<A, Fx<E.Env<E, unknown>, Either<A, B>, unknown>>,
) => (a: A) => Fx<E.Env<E, unknown>, B, unknown>
```

Added in v0.13.0

## doEnv

**Signature**

```ts
export declare const doEnv: <Y, R, N>(
  f: (lift: FxT.LiftFx2<'@typed/fp/Env'>) => Generator<Y, R, N>,
) => Fx<Y, R, N>
```

Added in v0.13.0

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A, E>(S: Semigroup<A>) => Semigroup<FxEnv<E, A>>
```

Added in v0.13.0

## liftEnv

**Signature**

```ts
export declare const liftEnv: FxT.LiftFx2<'@typed/fp/Env'>
```

Added in v0.13.0

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (value: A) => B,
) => <E>(fx: Fx<E.Env<E, unknown>, A, unknown>) => Fx<E.Env<E, unknown>, B, unknown>
```

Added in v0.13.0

## provideAll

**Signature**

```ts
export declare const provideAll: <A>(
  provided: A,
) => <T>(fx: Fx<E.Env<A, unknown>, T, unknown>) => Fx<E.Env<unknown, unknown>, T, unknown>
```

Added in v0.13.0

## provideAllWith

**Signature**

```ts
export declare const provideAllWith: <R, A>(
  provider: FxEnv<R, A>,
) => <B>(hkt: FxEnv<A, B>) => FxEnv<R, B>
```

Added in v0.13.0

## provideSome

**Signature**

```ts
export declare const provideSome: <A>(
  provided: A,
) => <B, T>(fx: Fx<E.Env<A & B, unknown>, T, unknown>) => Fx<E.Env<B, unknown>, T, unknown>
```

Added in v0.13.0

## provideSomeWith

**Signature**

```ts
export declare const provideSomeWith: <E1, A>(
  provider: FxEnv<E1, A>,
) => P.Provider2<'@typed/fp/Fx/Env', A, E1>
```

Added in v0.13.0

## useAll

**Signature**

```ts
export declare const useAll: <A>(
  provided: A,
) => <T>(fx: Fx<E.Env<A, unknown>, T, unknown>) => Fx<E.Env<unknown, unknown>, T, unknown>
```

Added in v0.13.0

## useAllWith

**Signature**

```ts
export declare const useAllWith: <R, A>(
  provider: FxEnv<R, A>,
) => <B>(hkt: FxEnv<A, B>) => FxEnv<R, B>
```

Added in v0.13.0

## useSome

**Signature**

```ts
export declare const useSome: <A>(
  provided: A,
) => <B, T>(fx: Fx<E.Env<A & B, unknown>, T, unknown>) => Fx<E.Env<B, unknown>, T, unknown>
```

Added in v0.13.0

## useSomeWith

**Signature**

```ts
export declare const useSomeWith: <E1, A>(
  provider: FxEnv<E1, A>,
) => P.Provider2<'@typed/fp/Fx/Env', A, E1>
```

Added in v0.13.0

# Constructor

## ask

**Signature**

```ts
export declare const ask: <A>() => Fx<E.Env<A, A>, A, unknown>
```

Added in v0.13.0

## fromIO

**Signature**

```ts
export declare const fromIO: <A, E>(fa: IO.IO<A>) => Fx<E.Env<E, A>, A, unknown>
```

Added in v0.13.0

## fromReader

**Signature**

```ts
export declare const fromReader: <R, A>(ma: R.Reader<R, A>) => Fx<E.Env<R, A>, A, unknown>
```

Added in v0.13.0

## fromResume

**Signature**

```ts
export declare const fromResume: <A, E>(fa: Re.Resume<A>) => Fx<E.Env<E, A>, A, unknown>
```

Added in v0.13.0

## fromTask

**Signature**

```ts
export declare const fromTask: <A, E>(fa: T.Task<A>) => Fx<E.Env<E, A>, A, unknown>
```

Added in v0.13.0

## of

**Signature**

```ts
export declare const of: <A, E>(value: A) => Fx<E.Env<E, A>, A, unknown>
```

Added in v0.13.0

# ConstructorfromReader

## asks

**Signature**

```ts
export declare const asks: <E, A>(fa: R.Reader<E, A>) => Fx<E.Env<E, A>, A, unknown>
```

Added in v0.13.0

# Instance

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## Chain

**Signature**

```ts
export declare const Chain: Ch.Chain2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## FromReader

**Signature**

```ts
export declare const FromReader: FromReader2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## Functor

**Signature**

```ts
export declare const Functor: F.Functor2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## Provide

**Signature**

```ts
export declare const Provide: P.Provide2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome2<'@typed/fp/Fx/Env'>
```

Added in v0.13.0

# Interpreter

## Do

**Signature**

```ts
export declare const Do: <Y extends E.Env<any, any>, R, N = unknown>(
  f: (lift: FxT.LiftFx2<'@typed/fp/Env'>) => Generator<Y, R, N>,
) => [Y] extends [E.Env<infer E, any>] ? E.Env<E, R> : never
```

Added in v0.13.0

## toEnv

**Signature**

```ts
export declare const toEnv: <Y extends E.Env<any, any>, R>(
  fx: Fx<Y, R, unknown>,
) => [Y] extends [E.Env<infer E, any>] ? E.Env<E, R> : never
```

Added in v0.13.0

# Model

## FxEnv (interface)

**Signature**

```ts
export interface FxEnv<E, A> extends Fx<E.Env<E, unknown>, A> {}
```

Added in v0.13.0

# Type-level

## GetRequirements (type alias)

**Signature**

```ts
export type GetRequirements<A> = A extends FxEnv<infer E, any> ? E : never
```

Added in v0.13.0

## GetValue (type alias)

**Signature**

```ts
export type GetValue<A> = A extends FxEnv<any, infer R> ? R : never
```

Added in v0.13.0

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Fx/Env'
```

Added in v0.13.0

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.13.0
