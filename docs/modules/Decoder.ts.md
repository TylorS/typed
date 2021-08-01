---
title: Decoder.ts
nav_order: 10
parent: Modules
---

## Decoder overview

Decoder is a data structure for representing runtime representations of your types.

Added in v0.9.4

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [absolve](#absolve)
  - [absolveWhen](#absolvewhen)
  - [ap](#ap)
  - [apFirst](#apfirst)
  - [apS](#aps)
  - [apSecond](#apsecond)
  - [apT](#apt)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [chain](#chain)
  - [chainFirst](#chainfirst)
  - [compose](#compose)
  - [condemmMissingKeys](#condemmmissingkeys)
  - [condemn](#condemn)
  - [condemnUnexpectedKeys](#condemnunexpectedkeys)
  - [condemnWhen](#condemnwhen)
  - [flap](#flap)
  - [getApplicativeMonoid](#getapplicativemonoid)
  - [map](#map)
  - [nullable](#nullable)
  - [optional](#optional)
  - [strict](#strict)
  - [tupled](#tupled)
- [Constructor](#constructor)
  - [Chain](#chain)
  - [Do](#do)
  - [array](#array)
  - [boolean](#boolean)
  - [fromArray](#fromarray)
  - [fromIO](#fromio)
  - [fromRefinement](#fromrefinement)
  - [fromStruct](#fromstruct)
  - [fromTuple](#fromtuple)
  - [missingIndexes](#missingindexes)
  - [missingKeys](#missingkeys)
  - [number](#number)
  - [of](#of)
  - [string](#string)
  - [struct](#struct)
  - [tuple](#tuple)
  - [unexpectedIndexes](#unexpectedindexes)
  - [unexpectedKeys](#unexpectedkeys)
  - [union](#union)
  - [unknownArray](#unknownarray)
  - [unknownRecord](#unknownrecord)
- [Instance](#instance)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Functor](#functor)
  - [Monad](#monad)
  - [Pointed](#pointed)
- [Model](#model)
  - [Decoder (interface)](#decoder-interface)
- [Type-level](#type-level)
  - [InputOf (type alias)](#inputof-type-alias)
  - [OutputOf (type alias)](#outputof-type-alias)
- [Typeclass Constructor](#typeclass-constructor)
  - [getApplySemigroup](#getapplysemigroup)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## absolve

**Signature**

```ts
export declare const absolve: <I, A>(decoder: Decoder<I, A>) => Decoder<I, A>
```

Added in v0.9.4

## absolveWhen

**Signature**

```ts
export declare function absolveWhen(predicate: Predicate<DE.DecodeError>)
```

Added in v0.9.4

## ap

**Signature**

```ts
export declare const ap: <E, A>(
  fa: Decoder<E, A>,
) => <B>(fab: Decoder<E, (a: A) => B>) => Decoder<E, B>
```

Added in v0.9.4

## apFirst

**Signature**

```ts
export declare const apFirst: <E, B>(
  second: Decoder<E, B>,
) => <A>(first: Decoder<E, A>) => Decoder<E, A>
```

Added in v0.9.4

## apS

**Signature**

```ts
export declare const apS: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: Decoder<E, B>,
) => (
  fa: Decoder<E, A>,
) => Decoder<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.4

## apSecond

**Signature**

```ts
export declare const apSecond: <E, B>(
  second: Decoder<E, B>,
) => <A>(first: Decoder<E, A>) => Decoder<E, B>
```

Added in v0.9.4

## apT

**Signature**

```ts
export declare const apT: <E, B>(
  fb: Decoder<E, B>,
) => <A>(fas: Decoder<E, A>) => Decoder<E, readonly [...A, B]>
```

Added in v0.9.4

## bind

**Signature**

```ts
export declare const bind: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Decoder<E, B>,
) => (
  ma: Decoder<E, A>,
) => Decoder<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.9.4

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(
  name: N,
) => <E, A>(fa: Decoder<E, A>) => Decoder<E, { readonly [K in N]: A }>
```

Added in v0.9.4

## chain

**Signature**

```ts
export declare const chain: <A, I, B>(
  f: (a: A) => Decoder<I, B>,
) => (decoder: Decoder<I, A>) => Decoder<I, B>
```

Added in v0.9.4

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, E, B>(
  f: (a: A) => Decoder<E, B>,
) => (first: Decoder<E, A>) => Decoder<E, A>
```

Added in v0.9.4

## compose

**Signature**

```ts
export declare const compose: <A, O>(
  second: Decoder<A, O>,
) => <I>(first: Decoder<I, A>) => Decoder<I, O>
```

Added in v0.9.4

## condemmMissingKeys

**Signature**

```ts
export declare const condemmMissingKeys: <I, A>(decoder: Decoder<I, A>) => Decoder<I, A>
```

Added in v0.9.4

## condemn

**Signature**

```ts
export declare const condemn: <I, A>(decoder: Decoder<I, A>) => Decoder<I, A>
```

Added in v0.9.4

## condemnUnexpectedKeys

**Signature**

```ts
export declare const condemnUnexpectedKeys: <I, A>(decoder: Decoder<I, A>) => Decoder<I, A>
```

Added in v0.9.4

## condemnWhen

**Signature**

```ts
export declare function condemnWhen(predicate: Predicate<DE.DecodeError>)
```

Added in v0.9.4

## flap

**Signature**

```ts
export declare const flap: <A>(a: A) => <E, B>(fab: Decoder<E, (a: A) => B>) => Decoder<E, B>
```

Added in v0.9.4

## getApplicativeMonoid

**Signature**

```ts
export declare const getApplicativeMonoid: <A, E>(M: Monoid<A>) => Monoid<Decoder<E, A>>
```

Added in v0.9.4

## map

**Signature**

```ts
export declare const map: <A, B>(f: (value: A) => B) => <I>(decoder: Decoder<I, A>) => Decoder<I, B>
```

Added in v0.9.4

## nullable

**Signature**

```ts
export declare const nullable: <O2>(first: Decoder<unknown, O2>) => Decoder<unknown, O2 | null>
```

Added in v0.9.4

## optional

**Signature**

```ts
export declare const optional: <O2>(first: Decoder<unknown, O2>) => Decoder<unknown, O2 | undefined>
```

Added in v0.9.4

## strict

**Signature**

```ts
export declare const strict: <I, A>(decoder: Decoder<I, A>) => Decoder<I, A>
```

Added in v0.9.4

## tupled

**Signature**

```ts
export declare const tupled: <E, A>(fa: Decoder<E, A>) => Decoder<E, readonly [A]>
```

Added in v0.9.4

# Constructor

## Chain

**Signature**

```ts
export declare const Chain: Ch.Chain2<'@typed/fp/Decoder'>
```

Added in v0.9.4

## Do

**Signature**

```ts
export declare const Do: Decoder<unknown, {}>
```

Added in v0.9.4

## array

**Signature**

```ts
export declare const array: <I, O>(
  member: Decoder<I, O>,
) => Decoder<readonly I[], readonly unknown[]>
```

Added in v0.9.4

## boolean

**Signature**

```ts
export declare const boolean: Decoder<unknown, boolean>
```

Added in v0.9.4

## fromArray

**Signature**

```ts
export declare const fromArray: <I, O>(member: Decoder<I, O>) => Decoder<readonly I[], readonly O[]>
```

Added in v0.9.4

## fromIO

**Signature**

```ts
export declare const fromIO: <A>(io: IO<A>) => Decoder<unknown, {}>
```

Added in v0.9.4

## fromRefinement

**Signature**

```ts
export declare function fromRefinement<I, O extends I>(
  refinement: Refinement<I, O>,
  expected: string,
): Decoder<I, O>
```

Added in v0.9.4

## fromStruct

**Signature**

```ts
export declare const fromStruct: <A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
) => Decoder<Readonly<Record<string, unknown>>, { readonly [K in keyof A]: OutputOf<A[K]> }>
```

Added in v0.9.4

## fromTuple

**Signature**

```ts
export declare function fromTuple<A extends readonly [Decoder<any, any>, ...Decoder<any, any>[]]>(
  ...tuple: A
): Decoder<readonly unknown[], { readonly [K in keyof A]: OutputOf<A[K]> }>
```

Added in v0.9.4

## missingIndexes

**Signature**

```ts
export declare function missingIndexes<
  A extends readonly [Decoder<any, any>, ...Decoder<any, any>[]],
>(...tuple: A): Decoder<readonly unknown[], readonly unknown[]>
```

Added in v0.9.4

## missingKeys

**Signature**

```ts
export declare function missingKeys<A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
): Decoder<Readonly<Record<string, unknown>>, { readonly [K in keyof A]: OutputOf<A[K]> }>
```

Added in v0.9.4

## number

**Signature**

```ts
export declare const number: Decoder<unknown, number>
```

Added in v0.9.4

## of

**Signature**

```ts
export declare const of: <A>(value: A) => Decoder<unknown, A>
```

Added in v0.9.4

## string

**Signature**

```ts
export declare const string: Decoder<unknown, string>
```

Added in v0.9.4

## struct

**Signature**

```ts
export declare function struct<A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
): Decoder<unknown, { readonly [K in keyof A]: OutputOf<A[K]> }>
```

Added in v0.9.4

## tuple

**Signature**

```ts
export declare function tuple<A extends readonly [Decoder<any, any>, ...Decoder<any, any>[]]>(
  ...tuple: A
): Decoder<unknown, { readonly [K in keyof A]: OutputOf<A[K]> }>
```

Added in v0.9.4

## unexpectedIndexes

**Signature**

```ts
export declare function unexpectedIndexes<
  A extends readonly [Decoder<any, any>, ...Decoder<any, any>[]],
>(...tuple: A): Decoder<readonly unknown[], readonly unknown[]>
```

Added in v0.9.4

## unexpectedKeys

**Signature**

```ts
export declare function unexpectedKeys<A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
): Decoder<Readonly<Record<string, unknown>>, { readonly [K in keyof A]: OutputOf<A[K]> }>
```

Added in v0.9.4

## union

**Signature**

```ts
export declare const union: <I, O1>(
  second: Decoder<I, O1>,
) => <O2>(first: Decoder<I, O2>) => Decoder<I, O1 | O2>
```

Added in v0.9.4

## unknownArray

**Signature**

```ts
export declare const unknownArray: Decoder<unknown, readonly unknown[]>
```

Added in v0.9.4

## unknownRecord

**Signature**

```ts
export declare const unknownRecord: Decoder<unknown, { readonly [key: string]: unknown }>
```

Added in v0.9.4

# Instance

## Applicative

**Signature**

```ts
export declare const Applicative: App.Applicative2<'@typed/fp/Decoder'>
```

Added in v0.9.4

## Apply

**Signature**

```ts
export declare const Apply: Ap.Apply2<'@typed/fp/Decoder'>
```

Added in v0.9.4

## Functor

**Signature**

```ts
export declare const Functor: F.Functor2<'@typed/fp/Decoder'>
```

Added in v0.9.4

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/Decoder'>
```

Added in v0.9.4

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/Decoder'>
```

Added in v0.9.4

# Model

## Decoder (interface)

**Signature**

```ts
export interface Decoder<I, O> {
  readonly decode: (input: I) => T.These<DE.DecodeErrors, O>
}
```

Added in v0.9.4

# Type-level

## InputOf (type alias)

**Signature**

```ts
export type InputOf<A> = [A] extends [Decoder<infer I, any>] ? I : never
```

Added in v0.9.4

## OutputOf (type alias)

**Signature**

```ts
export type OutputOf<A> = [A] extends [Decoder<any, infer O>] ? O : never
```

Added in v0.9.4

# Typeclass Constructor

## getApplySemigroup

**Signature**

```ts
export declare const getApplySemigroup: <A, E>(S: Semigroup<A>) => Semigroup<Decoder<E, A>>
```

Added in v0.9.4

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Decoder'
```

Added in v0.9.4

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.4
