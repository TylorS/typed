---
title: FxEnvEither.ts
nav_order: 28
parent: Modules
---

## FxEnvEither overview

Added in v0.13.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [ap](#ap)
  - [askAndProvide](#askandprovide)
  - [askAndUse](#askanduse)
  - [chain](#chain)
  - [chainRec](#chainrec)
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
  - [fromIO](#fromio)
  - [fromOption](#fromoption)
  - [fromReader](#fromreader)
  - [liftEnvEither](#liftenveither)
  - [of](#of)
- [Do](#do)
  - [doEnvEither](#doenveither)
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
  - [Do](#do-1)
  - [toEnvEither](#toenveither)
- [Model](#model)
  - [FxEnvEither (interface)](#fxenveither-interface)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## ap

**Signature**

```ts
export declare const ap: <R1, E1, A>(
  fa: Fx<EE.EnvEither<R1, E1, unknown>, A, unknown>,
) => <R2, E2, B>(
  fab: Fx<EE.EnvEither<R2, E2, unknown>, Arity1<A, B>, unknown>,
) => Fx<EE.EnvEither<R1 & R2, E1 | E2, unknown>, B, unknown>
```

Added in v0.13.0

## askAndProvide

**Signature**

```ts
export declare const askAndProvide: <R, E, B>(
  hkt: FxEnvEither<R, E, B>,
) => FxEnvEither<R, E, FxEnvEither<unknown, E, B>>
```

Added in v0.13.0

## askAndUse

**Signature**

```ts
export declare const askAndUse: <R, E, B>(
  hkt: FxEnvEither<R, E, B>,
) => FxEnvEither<R, E, FxEnvEither<unknown, E, B>>
```

Added in v0.13.0

## chain

**Signature**

```ts
export declare const chain: <A, R1, E1, B>(
  f: (value: A) => Fx<EE.EnvEither<R1, E1, unknown>, B, unknown>,
) => <R2, E2>(
  fx: Fx<EE.EnvEither<R2, E2, unknown>, A, unknown>,
) => Fx<EE.EnvEither<R1 & R2, E1 | E2, unknown>, B, unknown>
```

Added in v0.13.0

## chainRec

**Signature**

```ts
export declare const chainRec: <A, R, E, B>(
  f: Arity1<A, Fx<EE.EnvEither<R, E, unknown>, EI.Either<A, B>, unknown>>,
) => (a: A) => Fx<EE.EnvEither<R, E, unknown>, B, unknown>
```

Added in v0.13.0

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (value: A) => B,
) => <R, E>(
  fx: Fx<EE.EnvEither<R, E, unknown>, A, unknown>,
) => Fx<EE.EnvEither<R, E, unknown>, B, unknown>
```

Added in v0.13.0

## provideAll

**Signature**

```ts
export declare const provideAll: <A>(
  provided: A,
) => <E, T>(
  fx: Fx<EE.EnvEither<A, E, unknown>, T, unknown>,
) => Fx<EE.EnvEither<unknown, E, unknown>, T, unknown>
```

Added in v0.13.0

## provideAllWith

**Signature**

```ts
export declare const provideAllWith: <R, E1, A>(
  provider: FxEnvEither<R, E1, A>,
) => <E2, B>(hkt: FxEnvEither<A, E2, B>) => FxEnvEither<R, E1, B>
```

Added in v0.13.0

## provideSome

**Signature**

```ts
export declare const provideSome: <A>(
  provided: A,
) => <B, E, T>(
  fx: Fx<EE.EnvEither<A & B, E, unknown>, T, unknown>,
) => Fx<EE.EnvEither<B, E, unknown>, T, unknown>
```

Added in v0.13.0

## provideSomeWith

**Signature**

```ts
export declare const provideSomeWith: <R1, E1, A>(
  provider: FxEnvEither<R1, E1, A>,
) => P.Provider3<'@typed/fp/Fx/EnvEither', A, R1, E1>
```

Added in v0.13.0

## useAll

**Signature**

```ts
export declare const useAll: <A>(
  provided: A,
) => <E, T>(
  fx: Fx<EE.EnvEither<A, E, unknown>, T, unknown>,
) => Fx<EE.EnvEither<unknown, E, unknown>, T, unknown>
```

Added in v0.13.0

## useAllWith

**Signature**

```ts
export declare const useAllWith: <R, E1, A>(
  provider: FxEnvEither<R, E1, A>,
) => <E2, B>(hkt: FxEnvEither<A, E2, B>) => FxEnvEither<R, E1, B>
```

Added in v0.13.0

## useSome

**Signature**

```ts
export declare const useSome: <A>(
  provided: A,
) => <B, E, T>(
  fx: Fx<EE.EnvEither<A & B, E, unknown>, T, unknown>,
) => Fx<EE.EnvEither<B, E, unknown>, T, unknown>
```

Added in v0.13.0

## useSomeWith

**Signature**

```ts
export declare const useSomeWith: <R1, E1, A>(
  provider: FxEnvEither<R1, E1, A>,
) => P.Provider3<'@typed/fp/Fx/EnvEither', A, R1, E1>
```

Added in v0.13.0

# Constructor

## ask

**Signature**

```ts
export declare const ask: <A>() => Fx<EE.EnvEither<A, never, A>, A, unknown>
```

Added in v0.13.0

## asks

**Signature**

```ts
export declare const asks: <E, A, R>(fa: R.Reader<E, A>) => Fx<EE.EnvEither<R, E, A>, A, unknown>
```

Added in v0.13.0

## fromEither

**Signature**

```ts
export declare const fromEither: <E, A, R>(
  fa: EI.Either<E, A>,
) => Fx<EE.EnvEither<R, E, A>, A, unknown>
```

Added in v0.13.1

## fromEnv

**Signature**

```ts
export declare const fromEnv: <E, A, R>(fa: E.Env<E, A>) => Fx<EE.EnvEither<R, E, A>, A, unknown>
```

Added in v0.13.1

## fromIO

**Signature**

```ts
export declare const fromIO: <A, R, E>(fa: IO.IO<A>) => Fx<EE.EnvEither<R, E, A>, A, unknown>
```

Added in v0.13.1

## fromOption

**Signature**

```ts
export declare const fromOption: <E>(
  lazy: Lazy<E>,
) => <A, R>(fa: Option<A>) => Fx<EE.EnvEither<R, E, A>, A, unknown>
```

Added in v0.13.1

## fromReader

**Signature**

```ts
export declare const fromReader: <R, A, E = never>(
  fa: R.Reader<R, A>,
) => Fx<EE.EnvEither<R, E, A>, A, unknown>
```

Added in v0.13.0

## liftEnvEither

**Signature**

```ts
export declare const liftEnvEither: FxT.LiftFx3<'@typed/fp/EnvEither'>
```

Added in v0.13.0

## of

**Signature**

```ts
export declare const of: <A, R, E>(value: A) => Fx<EE.EnvEither<R, E, A>, A, unknown>
```

Added in v0.13.0

# Do

## doEnvEither

**Signature**

```ts
export declare const doEnvEither: <Y, Z, N>(
  f: (lift: FxT.LiftFx3<'@typed/fp/EnvEither'>) => Generator<Y, Z, N>,
) => Fx<Y, Z, N>
```

Added in v0.13.0

# Instance

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## Apply

**Signature**

```ts
export declare const Apply: Apply3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## Chain

**Signature**

```ts
export declare const Chain: Chain3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## FromReader

**Signature**

```ts
export declare const FromReader: FromReader3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## Functor

**Signature**

```ts
export declare const Functor: Functor3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## Monad

**Signature**

```ts
export declare const Monad: Monad3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## Provide

**Signature**

```ts
export declare const Provide: P.Provide3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: P.ProvideAll3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: P.ProvideSome3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## UseAll

**Signature**

```ts
export declare const UseAll: P.UseAll3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

## UseSome

**Signature**

```ts
export declare const UseSome: P.UseSome3<'@typed/fp/Fx/EnvEither'>
```

Added in v0.13.0

# Interpreter

## Do

**Signature**

```ts
export declare const Do: <Y extends EE.EnvEither<any, any, any>, Z, N = unknown>(
  f: (lift: FxT.LiftFx3<'@typed/fp/EnvEither'>) => Generator<Y, Z, N>,
) => EE.EnvEither<
  Intersect<ListOf<[Y] extends [EE.EnvEither<infer R, any, any>] ? R : never>, unknown>,
  ListOf<[Y] extends [EE.EnvEither<any, infer R, any>] ? R : never>[number],
  Z
>
```

Added in v0.13.0

## toEnvEither

**Signature**

```ts
export declare const toEnvEither: <E, R>(
  fx: Fx<E, R, unknown>,
) => EE.EnvEither<
  Intersect<ListOf<[E] extends [EE.EnvEither<infer R, any, any>] ? R : never>, unknown>,
  ListOf<[E] extends [EE.EnvEither<any, infer R, any>] ? R : never>[number],
  R
>
```

Added in v0.13.0

# Model

## FxEnvEither (interface)

**Signature**

```ts
export interface FxEnvEither<R, E, A> extends Fx<EE.EnvEither<R, E, unknown>, A> {}
```

Added in v0.13.0

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Fx/EnvEither'
```

Added in v0.13.0

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.13.0
