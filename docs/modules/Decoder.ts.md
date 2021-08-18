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
  - [intersect](#intersect)
  - [map](#map)
  - [nullable](#nullable)
  - [optional](#optional)
  - [refine](#refine)
  - [strict](#strict)
  - [tupled](#tupled)
- [Constructor](#constructor)
  - [Chain](#chain)
  - [Do](#do)
  - [array](#array)
  - [boolean](#boolean)
  - [date](#date)
  - [fromArray](#fromarray)
  - [fromIO](#fromio)
  - [fromRecord](#fromrecord)
  - [fromRefinement](#fromrefinement)
  - [fromStruct](#fromstruct)
  - [fromTuple](#fromtuple)
  - [lazy](#lazy)
  - [literal](#literal)
  - [missingIndexes](#missingindexes)
  - [missingKeys](#missingkeys)
  - [number](#number)
  - [of](#of)
  - [record](#record)
  - [string](#string)
  - [struct](#struct)
  - [sum](#sum)
  - [tuple](#tuple)
  - [unexpectedIndexes](#unexpectedindexes)
  - [unexpectedKeys](#unexpectedkeys)
  - [union](#union)
  - [unknownArray](#unknownarray)
  - [unknownRecord](#unknownrecord)
- [Decoder](#decoder)
  - [dateFromISOString](#datefromisostring)
  - [jsonParse](#jsonparse)
  - [jsonParseFromString](#jsonparsefromstring)
- [Instance](#instance)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Functor](#functor)
  - [Monad](#monad)
  - [Pointed](#pointed)
  - [Schemable](#schemable)
  - [WithRefine](#withrefine)
  - [WithUnion](#withunion)
- [Interpreter](#interpreter)
  - [assert](#assert)
  - [assertStrict](#assertstrict)
- [Model](#model)
  - [Decoder (interface)](#decoder-interface)
- [Refinement](#refinement)
  - [isDate](#isdate)
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
export declare const condemmMissingKeys: <I, A>(decoder: Decoder<I, A>) => Decoder<I, Required<A>>
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

## intersect

**Signature**

```ts
export declare const intersect: <A, B>(
  second: Decoder<A, B>,
) => <C, D>(first: Decoder<C, D>) => Decoder<A & C, B & D>
```

Added in v0.9.6

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

## refine

**Signature**

```ts
export declare const refine: <A, B>(
  refinement: Refinement<A, B>,
  id: string,
) => (from: Decoder<unknown, A>) => Decoder<unknown, B>
```

Added in v0.9.5

## strict

**Signature**

```ts
export declare const strict: <I, A>(decoder: Decoder<I, A>) => Decoder<I, Required<A>>
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
export declare const array: <O>(member: Decoder<unknown, O>) => Decoder<unknown, readonly O[]>
```

Added in v0.9.4

## boolean

**Signature**

```ts
export declare const boolean: Decoder<unknown, boolean>
```

Added in v0.9.4

## date

**Signature**

```ts
export declare const date: Decoder<unknown, Date>
```

Added in v0.9.6

## fromArray

**Signature**

```ts
export declare const fromArray: <O>(
  member: Decoder<unknown, O>,
) => Decoder<readonly unknown[], readonly O[]>
```

Added in v0.9.4

## fromIO

**Signature**

```ts
export declare const fromIO: <A>(io: IO<A>) => Decoder<unknown, {}>
```

Added in v0.9.4

## fromRecord

**Signature**

```ts
export declare function fromRecord<A>(
  decoder: Decoder<unknown, A>,
): Decoder<Readonly<Record<string, unknown>>, Readonly<Record<string, A>>>
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
) => Decoder<
  Readonly<Record<string, unknown>>,
  { readonly [K in keyof A]?: OutputOf<A[K]> | undefined }
>
```

Added in v0.9.4

## fromTuple

**Signature**

```ts
export declare function fromTuple<A extends readonly unknown[]>(
  ...components: { readonly [K in keyof A]: Decoder<unknown, A[K]> }
): Decoder<readonly unknown[], A>
```

Added in v0.9.4

## lazy

**Signature**

```ts
export declare const lazy: <I, O>(id: string, f: () => Decoder<I, O>) => Decoder<I, O>
```

Added in v0.9.6

## literal

**Signature**

```ts
export declare const literal: <A extends readonly Literal[]>(
  ...literals: A
) => Decoder<unknown, A[number]>
```

Added in v0.9.6

## missingIndexes

**Signature**

```ts
export declare function missingIndexes<A extends readonly unknown[]>(
  ...components: { readonly [K in keyof A]: Decoder<unknown, A[K]> }
): Decoder<readonly unknown[], readonly unknown[]>
```

Added in v0.9.4

## missingKeys

**Signature**

```ts
export declare function missingKeys<A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
): Decoder<Readonly<Record<string, unknown>>, { readonly [K in keyof A]?: OutputOf<A[K]> }>
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

## record

**Signature**

```ts
export declare const record: <O>(
  codomain: Decoder<unknown, O>,
) => Decoder<unknown, Readonly<Record<string, O>>>
```

Added in v0.9.6

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
): Decoder<unknown, { readonly [K in keyof A]?: OutputOf<A[K]> }>
```

Added in v0.9.4

## sum

**Signature**

```ts
export declare const sum: <T extends string>(
  tag: T,
) => <A>(
  members: { [K in keyof A]: Decoder<unknown, A[K] & Record<T, K>> },
) => Decoder<unknown, A[keyof A]>
```

Added in v0.9.6

## tuple

**Signature**

```ts
export declare function tuple<A extends readonly unknown[]>(
  ...components: { readonly [K in keyof A]: Decoder<unknown, A[K]> }
): Decoder<unknown, A>
```

Added in v0.9.4

## unexpectedIndexes

**Signature**

```ts
export declare function unexpectedIndexes<A extends readonly unknown[]>(
  ...components: { readonly [K in keyof A]: Decoder<unknown, A[K]> }
): Decoder<readonly unknown[], readonly unknown[]>
```

Added in v0.9.4

## unexpectedKeys

**Signature**

```ts
export declare function unexpectedKeys<A extends { readonly [key: string]: Decoder<unknown, any> }>(
  properties: A,
): Decoder<Readonly<Record<string, unknown>>, { readonly [K in keyof A]?: OutputOf<A[K]> }>
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

# Decoder

## dateFromISOString

**Signature**

```ts
export declare const dateFromISOString: Decoder<string, Date>
```

Added in v0.9.5

## jsonParse

**Signature**

```ts
export declare const jsonParse: Decoder<unknown, Json>
```

Added in v0.9.5

## jsonParseFromString

**Signature**

```ts
export declare const jsonParseFromString: Decoder<string, Json>
```

Added in v0.9.5

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

## Schemable

**Signature**

```ts
export declare const Schemable: Schemable2C<'@typed/fp/Decoder', unknown>
```

Added in v0.9.5

## WithRefine

**Signature**

```ts
export declare const WithRefine: WithRefine2C<'@typed/fp/Decoder', unknown>
```

Added in v0.9.5

## WithUnion

**Signature**

```ts
export declare const WithUnion: WithUnion2C<'@typed/fp/Decoder', unknown>
```

Added in v0.9.5

# Interpreter

## assert

Throw if not a valid decoder. Absolves optional errors

**Signature**

```ts
export declare const assert: <I, O>(decoder: Decoder<I, O>) => (i: I) => O
```

Added in v0.9.5

## assertStrict

Throw if not a valid decoder. Condemns optional errors

**Signature**

```ts
export declare const assertStrict: <I, O>(decoder: Decoder<I, O>) => (i: I) => Required<O>
```

Added in v0.9.5

# Model

## Decoder (interface)

**Signature**

```ts
export interface Decoder<I, O> {
  readonly decode: (input: I) => T.These<DE.DecodeErrors, O>
}
```

Added in v0.9.4

# Refinement

## isDate

**Signature**

```ts
export declare const isDate: (x: unknown) => x is Date
```

Added in v0.9.6

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
