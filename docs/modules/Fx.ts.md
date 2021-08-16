---
title: Fx.ts
nav_order: 25
parent: Modules
---

## Fx overview

Added in v0.13.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [ap](#ap)
  - [chain](#chain)
  - [chainRec](#chainrec)
  - [doFx](#dofx)
  - [map](#map)
- [Constructor](#constructor)
  - [fromIO](#fromio)
  - [of](#of)
  - [pure](#pure)
- [Instance](#instance)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [ChainRec](#chainrec)
  - [FromIO](#fromio)
  - [Functor](#functor)
  - [Monad](#monad)
  - [Pointed](#pointed)
- [Model](#model)
  - [Fx (interface)](#fx-interface)
  - [Pure (interface)](#pure-interface)
- [Type-level](#type-level)
  - [GetEffects (type alias)](#geteffects-type-alias)
  - [GetNext (type alias)](#getnext-type-alias)
  - [GetResult (type alias)](#getresult-type-alias)
- [URI](#uri)
  - [URI](#uri-1)
  - [URI (type alias)](#uri-type-alias)

---

# Combinator

## ap

**Signature**

```ts
export declare const ap: <E1, A>(
  fa: Fx<E1, A, unknown>,
) => <E2, B>(fab: Fx<E2, (a: A) => B, unknown>) => Fx<E1 | E2, B, unknown>
```

Added in v0.13.0

## chain

**Signature**

```ts
export declare const chain: <A, E1, B>(
  f: (value: A) => Fx<E1, B, unknown>,
) => <E2>(fa: Fx<E2, A, unknown>) => Fx<E1 | E2, B, unknown>
```

Added in v0.13.0

## chainRec

**Signature**

```ts
export declare const chainRec: <A, E, B>(
  f: (value: A) => Fx<E, Either<A, B>, unknown>,
) => (value: A) => Fx<E, B, unknown>
```

Added in v0.13.0

## doFx

Extract the values being returned to the internal Fx

**Signature**

```ts
export declare function doFx<G extends Generator<any, any, any>>(
  generatorFn: () => G,
): Fx<GetEffects<G>, GetResult<G>, GetNext<G>>
```

Added in v0.13.0

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (value: A) => B,
) => <E>(fa: Fx<E, A, unknown>) => Fx<E, B, unknown>
```

Added in v0.13.0

# Constructor

## fromIO

**Signature**

```ts
export declare const fromIO: <A>(io: IO<A>) => Pure<A>
```

Added in v0.13.0

## of

**Signature**

```ts
export declare const of: <A>(value: A) => Pure<A>
```

Added in v0.13.0

## pure

**Signature**

```ts
export declare const pure: <A>(value: A) => Pure<A>
```

Added in v0.13.0

# Instance

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative2<'@typed/fp/Fx'>
```

Added in v0.13.0

## Apply

**Signature**

```ts
export declare const Apply: Apply2<'@typed/fp/Fx'>
```

Added in v0.13.0

## ChainRec

**Signature**

```ts
export declare const ChainRec: ChainRec2<'@typed/fp/Fx'>
```

Added in v0.13.0

## FromIO

**Signature**

```ts
export declare const FromIO: FromIO2<'@typed/fp/Fx'>
```

Added in v0.13.0

## Functor

**Signature**

```ts
export declare const Functor: Functor2<'@typed/fp/Fx'>
```

Added in v0.13.0

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'@typed/fp/Fx'>
```

Added in v0.13.0

## Pointed

**Signature**

```ts
export declare const Pointed: Pointed2<'@typed/fp/Fx'>
```

Added in v0.13.0

# Model

## Fx (interface)

Fx is a generator-based abstraction for do-notation for any single-shot effect. Due to the mutable
nature of generators however, we cannot support this syntax for multi-shot effects like reactive
Streams/Observables. Most of the effects you likely use are single-shot like Option/Either/Task.

An Fx is a set of Effects which are being `yield`ed from the Generator. This can be a powerful way
to construct algorithms separate from their interpretation.

Fx's Result parameter is the secret to getting type-safety by using yield\* when running an Fx.

**Signature**

```ts
export interface Fx<Effects, Result, Next = unknown> {
  readonly [Symbol.iterator]: () => Generator<Effects, Result, Next>
}
```

Added in v0.13.0

## Pure (interface)

An Fx which has no Effects or they have all been accounted for.

**Signature**

```ts
export interface Pure<A> extends Fx<never, A> {}
```

Added in v0.13.0

# Type-level

## GetEffects (type alias)

Extract the effects being performed within an Fx

**Signature**

```ts
export type GetEffects<A> = A extends Fx<infer R, any, any>
  ? IsNever<R> extends false
    ? R
    : unknown
  : unknown
```

Added in v0.13.0

## GetNext (type alias)

Extract the values being returned to the internal Fx

**Signature**

```ts
export type GetNext<A> = A extends Fx<any, any, infer R> ? R : never
```

Added in v0.13.0

## GetResult (type alias)

Extract the result being performed within an Fx

**Signature**

```ts
export type GetResult<A> = A extends Fx<any, infer R, any> ? R : never
```

Added in v0.13.0

# URI

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Fx'
```

Added in v0.13.0

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.13.0
