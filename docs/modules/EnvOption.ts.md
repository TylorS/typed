---
title: EnvOption.ts
nav_order: 16
parent: Modules
---

## EnvOption overview

EnvOption is an OptionT of [Env](./Env.ts.md)

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
  - [apW](#apw)
  - [chain](#chain)
  - [chainEnvK](#chainenvk)
  - [chainFirstEnvK](#chainfirstenvk)
  - [chainFirstResumeK](#chainfirstresumek)
  - [chainNullableK](#chainnullablek)
  - [chainOptionK](#chainoptionk)
  - [chainReaderK](#chainreaderk)
  - [chainRec](#chainrec)
  - [chainResumeK](#chainresumek)
  - [getApplySemigroup](#getapplysemigroup)
  - [getOrElseEW](#getorelseew)
  - [map](#map)
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
  - [fromReaderK](#fromreaderk)
  - [fromResume](#fromresume)
  - [fromResumeK](#fromresumek)
  - [fromTask](#fromtask)
  - [some](#some)
  - [zero](#zero)
- [Deconstructor](#deconstructor)
  - [getOrElseE](#getorelsee)
  - [match](#match)
  - [matchE](#matche)
  - [matchEW](#matchew)
  - [matchW](#matchw)
- [Deconstuctor](#deconstuctor)
  - [getOrElse](#getorelse)
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
  - [EnvOption (interface)](#envoption-interface)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <E, A>(
  second: Lazy<E.Env<E, O.Option<A>>>,
) => (first: E.Env<E, O.Option<A>>) => E.Env<E, O.Option<A>>
```

Added in v0.9.2

## ap

**Signature**

```ts
export declare const ap: <E, A>(
  fa: E.Env<E, O.Option<A>>,
) => <B>(fab: E.Env<E, O.Option<(a: A) => B>>) => E.Env<E, O.Option<B>>
```

Added in v0.9.2

## apFirst

**Signature**

```ts
export declare const apFirst: <E, B>(
  second: EnvOption<E, B>,
) => <A>(first: EnvOption<E, A>) => EnvOption<E, A>
```

Added in v0.11.0

## apFirstW

**Signature**

```ts
export declare const apFirstW: <E1, B>(
  second: EnvOption<E1, B>,
) => <E2, A>(first: EnvOption<E2, A>) => EnvOption<E1 & E2, A>
```

Added in v0.11.0

## apS

**Signature**

```ts
export declare const apS: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: EnvOption<E, B>,
) => (
  fa: EnvOption<E, A>,
) => EnvOption<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.11.0

## apSW

**Signature**

```ts
export declare const apSW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: EnvOption<E1, B>,
) => <E2>(
  fa: EnvOption<E2, A>,
) => EnvOption<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.11.0

## apSecond

**Signature**

```ts
export declare const apSecond: <E, B>(
  second: EnvOption<E, B>,
) => <A>(first: EnvOption<E, A>) => EnvOption<E, B>
```

Added in v0.11.0

## apSecondW

**Signature**

```ts
export declare const apSecondW: <E1, B>(
  second: EnvOption<E1, B>,
) => <E2, A>(first: EnvOption<E2, A>) => EnvOption<E1 & E2, B>
```

Added in v0.11.0

## apT

**Signature**

```ts
export declare const apT: <E, B>(
  fb: EnvOption<E, B>,
) => <A>(fas: EnvOption<E, A>) => EnvOption<E, readonly [...A, B]>
```

Added in v0.11.0

## apTW

**Signature**

```ts
export declare const apTW: <E1, B>(
  fb: EnvOption<E1, B>,
) => <E2, A extends readonly unknown[]>(
  fas: EnvOption<E2, A>,
) => EnvOption<E1 & E2, readonly [...A, B]>
```

Added in v0.11.0

## apW

**Signature**

```ts
export declare const apW: <E1, A>(
  fa: E.Env<E1, O.Option<A>>,
) => <E2, B>(fab: E.Env<E2, O.Option<(a: A) => B>>) => E.Env<E1 & E2, O.Option<B>>
```

Added in v0.11.0

## chain

**Signature**

```ts
export declare const chain: <A, E, B>(
  f: (a: A) => E.Env<E, O.Option<B>>,
) => (ma: E.Env<E, O.Option<A>>) => E.Env<E, O.Option<B>>
```

Added in v0.9.2

## chainEnvK

**Signature**

```ts
export declare const chainEnvK: <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: EnvOption<R2, A>) => EnvOption<R1 & R2, B>
```

Added in v0.9.2

## chainFirstEnvK

**Signature**

```ts
export declare const chainFirstEnvK: <A, R1, B>(
  f: (value: A) => E.Env<R1, B>,
) => <R2>(hkt: EnvOption<R2, A>) => EnvOption<R1 & R2, A>
```

Added in v0.9.2

## chainFirstResumeK

**Signature**

```ts
export declare const chainFirstResumeK: <A, B>(
  f: (value: A) => Resume<B>,
) => <E>(hkt: EnvOption<E, A>) => EnvOption<E, A>
```

Added in v0.9.2

## chainNullableK

**Signature**

```ts
export declare const chainNullableK: <A, B>(
  f: (a: A) => B | null | undefined,
) => <E>(ma: E.Env<E, O.Option<A>>) => E.Env<E, O.Option<NonNullable<B>>>
```

Added in v0.9.2

## chainOptionK

**Signature**

```ts
export declare const chainOptionK: <A, B>(
  f: (a: A) => O.Option<B>,
) => <E>(ma: E.Env<E, O.Option<A>>) => E.Env<E, O.Option<B>>
```

Added in v0.9.2

## chainReaderK

**Signature**

```ts
export declare const chainReaderK: <A, R, B>(
  f: (a: A) => Reader<R, B>,
) => (ma: EnvOption<R, A>) => EnvOption<R, B>
```

Added in v0.9.2

## chainRec

**Signature**

```ts
export declare const chainRec: <A, E, B>(
  f: (value: A) => EnvOption<E, Ei.Either<A, B>>,
) => (value: A) => EnvOption<E, B>
```

Added in v0.9.2

## chainResumeK

**Signature**

```ts
export declare const chainResumeK: <A, B>(
  f: (value: A) => Resume<B>,
) => <E>(hkt: EnvOption<E, A>) => EnvOption<E, B>
```

Added in v0.9.2

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A, E>(S: Semigroup<A>) => Semigroup<EnvOption<E, A>>
```

Added in v0.11.0

## getOrElseEW

**Signature**

```ts
export declare const getOrElseEW: <E1, A>(
  onNone: Lazy<E.Env<E1, A>>,
) => <E2, B>(fa: E.Env<E2, O.Option<B>>) => E.Env<E1 & E2, A | B>
```

Added in v0.9.2

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <E>(fa: E.Env<E, O.Option<A>>) => E.Env<E, O.Option<B>>
```

Added in v0.9.2

# Constructor

## ask

**Signature**

```ts
export declare const ask: <R>() => EnvOption<R, R>
```

Added in v0.9.2

## asks

**Signature**

```ts
export declare const asks: <R, A>(f: (r: R) => A) => EnvOption<R, A>
```

Added in v0.9.2

## fromEither

**Signature**

```ts
export declare const fromEither: <A, E>(e: Ei.Either<unknown, A>) => E.Env<E, O.Option<A>>
```

Added in v0.9.2

## fromEnv

**Signature**

```ts
export declare const fromEnv: <E, A>(ma: E.Env<E, A>) => E.Env<E, O.Option<A>>
```

Added in v0.9.2

## fromEnvK

**Signature**

```ts
export declare const fromEnvK: <A, R, B>(
  f: (...args: A) => E.Env<R, B>,
) => (...args: A) => EnvOption<R, B>
```

Added in v0.9.2

## fromIO

**Signature**

```ts
export declare const fromIO: NaturalTransformation12<'IO', '@typed/fp/EnvOption'>
```

Added in v0.9.2

## fromNullable

**Signature**

```ts
export declare const fromNullable: <A, E>(a: A) => E.Env<E, O.Option<NonNullable<A>>>
```

Added in v0.9.2

## fromNullableK

**Signature**

```ts
export declare const fromNullableK: <A, B>(
  f: (...a: A) => B | null | undefined,
) => <E>(...a: A) => E.Env<E, O.Option<NonNullable<B>>>
```

Added in v0.9.2

## fromOptionK

**Signature**

```ts
export declare const fromOptionK: <A, B>(
  f: (...a: A) => O.Option<B>,
) => <E>(...a: A) => E.Env<E, O.Option<B>>
```

Added in v0.9.2

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B>(refinement: Refinement<A, B>): <E>(a: A) => E.Env<E, O.Option<B>>
  <A>(predicate: Predicate<A>): <E, B>(b: B) => E.Env<E, O.Option<B>>
}
```

Added in v0.9.2

## fromReaderK

**Signature**

```ts
export declare const fromReaderK: <A, R, B>(
  f: (...a: A) => Reader<R, B>,
) => (...a: A) => EnvOption<R, B>
```

Added in v0.9.2

## fromResume

**Signature**

```ts
export declare const fromResume: NaturalTransformation12<'@typed/fp/Resume', '@typed/fp/EnvOption'>
```

Added in v0.9.2

## fromResumeK

**Signature**

```ts
export declare const fromResumeK: <A, B>(
  f: (...args: A) => Resume<B>,
) => <E>(...args: A) => EnvOption<E, B>
```

Added in v0.9.2

## fromTask

**Signature**

```ts
export declare const fromTask: NaturalTransformation12<'Task', '@typed/fp/EnvOption'>
```

Added in v0.9.2

## some

**Signature**

```ts
export declare const some: <A, E>(a: A) => E.Env<E, O.Option<A>>
```

Added in v0.9.2

## zero

**Signature**

```ts
export declare const zero: <E, A>() => E.Env<E, O.Option<A>>
```

Added in v0.9.2

# Deconstructor

## getOrElseE

**Signature**

```ts
export declare const getOrElseE: <E, A>(
  onNone: Lazy<E.Env<E, A>>,
) => (fa: E.Env<E, O.Option<A>>) => E.Env<E, A>
```

Added in v0.9.2

## match

**Signature**

```ts
export declare const match: <B, A>(
  onNone: () => B,
  onSome: (a: A) => B,
) => <E>(ma: E.Env<E, O.Option<A>>) => E.Env<E, B>
```

Added in v0.9.2

## matchE

**Signature**

```ts
export declare const matchE: <E, B, A>(
  onNone: () => E.Env<E, B>,
  onSome: (a: A) => E.Env<E, B>,
) => (ma: E.Env<E, O.Option<A>>) => E.Env<E, B>
```

Added in v0.9.2

## matchEW

**Signature**

```ts
export declare const matchEW: <E1, A, E2, B, C>(
  onNone: () => E.Env<E1, A>,
  onSome: (a: B) => E.Env<E2, C>,
) => <E3>(ma: E.Env<E3, O.Option<B>>) => E.Env<E1 & E2 & E3, A | C>
```

Added in v0.12.1

## matchW

**Signature**

```ts
export declare const matchW: <A, B, C>(
  onNone: () => A,
  onSome: (b: B) => C,
) => <E>(ma: E.Env<E, O.Option<B>>) => E.Env<E, A | C>
```

Added in v0.12.1

# Deconstuctor

## getOrElse

**Signature**

```ts
export declare const getOrElse: <A>(
  onNone: Lazy<A>,
) => <E>(fa: E.Env<E, O.Option<A>>) => E.Env<E, A>
```

Added in v0.9.2

# Instance

## Alt

**Signature**

```ts
export declare const Alt: Alt2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## Alternative

**Signature**

```ts
export declare const Alternative: Alternative2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## Chain

**Signature**

```ts
export declare const Chain: Chain2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## FromEnv

**Signature**

```ts
export declare const FromEnv: FE.FromEnv2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## FromIO

**Signature**

```ts
export declare const FromIO: FromIO2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## FromReader

**Signature**

```ts
export declare const FromReader: FR.FromReader2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## FromResume

**Signature**

```ts
export declare const FromResume: FRe.FromResume2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## FromTask

**Signature**

```ts
export declare const FromTask: FromTask2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## Functor

**Signature**

```ts
export declare const Functor: Functor2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## MonadRec

**Signature**

```ts
export declare const MonadRec: MonadRec2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## Provide

**Signature**

```ts
export declare const Provide: Provide2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## ProvideAll

**Signature**

```ts
export declare const ProvideAll: ProvideAll2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## ProvideSome

**Signature**

```ts
export declare const ProvideSome: ProvideSome2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## UseAll

**Signature**

```ts
export declare const UseAll: UseAll2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

## UseSome

**Signature**

```ts
export declare const UseSome: UseSome2<'@typed/fp/EnvOption'>
```

Added in v0.9.2

# Model

## EnvOption (interface)

**Signature**

```ts
export interface EnvOption<E, A> extends E.Env<E, O.Option<A>> {}
```

Added in v0.9.2

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/EnvOption'
```

Added in v0.9.2

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.2
