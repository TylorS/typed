---
title: Guard.ts
nav_order: 28
parent: Modules
---

## Guard overview

Guard is a Typeclass for expressing Refinements

Added in v0.9.5

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [alt](#alt)
  - [array](#array)
  - [compose](#compose)
  - [id](#id)
  - [intersect](#intersect)
  - [lazy](#lazy)
  - [nullable](#nullable)
  - [partial](#partial)
  - [readonly](#readonly)
  - [record](#record)
  - [refine](#refine)
  - [struct](#struct)
  - [sum](#sum)
  - [tuple](#tuple)
  - [union](#union)
  - [zero](#zero)
  - [~~type~~](#type)
- [Decoder](#decoder)
  - [boolean](#boolean)
  - [date](#date)
  - [number](#number)
  - [string](#string)
  - [unknownArray](#unknownarray)
  - [unknownRecord](#unknownrecord)
- [Model](#model)
  - [Guard (interface)](#guard-interface)
- [constructors](#constructors)
  - [literal](#literal)
- [instances](#instances)
  - [Schemable](#schemable)
  - [URI](#uri)
  - [URI (type alias)](#uri-type-alias)
  - [WithRefine](#withrefine)
  - [WithUnion](#withunion)
- [utils](#utils)
  - [InputOf (type alias)](#inputof-type-alias)
  - [TypeOf (type alias)](#typeof-type-alias)

---

# Combinator

## alt

**Signature**

```ts
export declare const alt: <I, A extends I>(
  that: () => Guard<I, A>,
) => (me: Guard<I, A>) => Guard<I, A>
```

Added in v0.9.5

## array

**Signature**

```ts
export declare const array: <A>(item: Guard<unknown, A>) => Guard<unknown, A[]>
```

Added in v0.9.5

## compose

**Signature**

```ts
export declare const compose: <I, A extends I, B extends A>(
  to: Guard<A, B>,
) => (from: Guard<I, A>) => Guard<I, B>
```

Added in v0.9.5

## id

**Signature**

```ts
export declare const id: <A>() => Guard<A, A>
```

Added in v0.9.5

## intersect

**Signature**

```ts
export declare const intersect: <B>(
  right: Guard<unknown, B>,
) => <A>(left: Guard<unknown, A>) => Guard<unknown, A & B>
```

Added in v0.9.5

## lazy

**Signature**

```ts
export declare const lazy: <A>(f: () => Guard<unknown, A>) => Guard<unknown, A>
```

Added in v0.9.5

## nullable

**Signature**

```ts
export declare const nullable: <I, A extends I>(or: Guard<I, A>) => Guard<I | null, A | null>
```

Added in v0.9.5

## partial

**Signature**

```ts
export declare const partial: <A>(
  properties: { [K in keyof A]: Guard<unknown, A[K]> },
) => Guard<unknown, Partial<{ [K in keyof A]: A[K] }>>
```

Added in v0.9.5

## readonly

**Signature**

```ts
export declare const readonly: <I, A extends I>(guard: Guard<I, A>) => Guard<I, Readonly<A>>
```

Added in v2.2.15

## record

**Signature**

```ts
export declare const record: <A>(codomain: Guard<unknown, A>) => Guard<unknown, Record<string, A>>
```

Added in v0.9.5

## refine

**Signature**

```ts
export declare const refine: <I, A extends I, B extends A>(
  refinement: Refinement<A, B>,
) => (from: Guard<I, A>) => Guard<I, B>
```

Added in v0.9.5

## struct

**Signature**

```ts
export declare const struct: <A>(
  properties: { [K in keyof A]: Guard<unknown, A[K]> },
) => Guard<unknown, { [K in keyof A]: A[K] }>
```

Added in v2.2.15

## sum

**Signature**

```ts
export declare const sum: <T extends string>(
  tag: T,
) => <A>(
  members: { [K in keyof A]: Guard<unknown, A[K] & Record<T, K>> },
) => Guard<unknown, A[keyof A]>
```

Added in v0.9.5

## tuple

**Signature**

```ts
export declare const tuple: <A extends readonly unknown[]>(
  ...components: { [K in keyof A]: Guard<unknown, A[K]> }
) => Guard<unknown, A>
```

Added in v0.9.5

## union

**Signature**

```ts
export declare const union: <A>(
  second: Guard<unknown, A>,
) => <B>(first: Guard<unknown, B>) => Guard<unknown, A | B>
```

Added in v0.9.5

## zero

**Signature**

```ts
export declare const zero: <I, A extends I>() => Guard<I, A>
```

Added in v0.9.5

## ~~type~~

Use `struct` instead.

**Signature**

```ts
export declare const type: <A>(
  properties: { [K in keyof A]: Guard<unknown, A[K]> },
) => Guard<unknown, { [K in keyof A]: A[K] }>
```

Added in v0.9.5

# Decoder

## boolean

**Signature**

```ts
export declare const boolean: Guard<unknown, boolean>
```

Added in v0.9.5

## date

**Signature**

```ts
export declare const date: Guard<unknown, Date>
```

Added in v0.9.5

## number

Note: `NaN` is excluded.

**Signature**

```ts
export declare const number: Guard<unknown, number>
```

Added in v0.9.5

## string

**Signature**

```ts
export declare const string: Guard<unknown, string>
```

Added in v0.9.5

## unknownArray

**Signature**

```ts
export declare const unknownArray: Guard<unknown, unknown[]>
```

Added in v0.9.5

## unknownRecord

**Signature**

```ts
export declare const unknownRecord: Guard<unknown, Record<string, unknown>>
```

Added in v0.9.5

# Model

## Guard (interface)

**Signature**

```ts
export interface Guard<I, A extends I> {
  is: (i: I) => i is A
}
```

Added in v0.9.5

# constructors

## literal

**Signature**

```ts
export declare const literal: <A extends readonly [Literal, ...Literal[]]>(
  ...values: A
) => Guard<unknown, A[number]>
```

Added in v0.9.5

# instances

## Schemable

**Signature**

```ts
export declare const Schemable: Schemable1<'@typed/fp/Guard'>
```

Added in v0.9.5

## URI

**Signature**

```ts
export declare const URI: '@typed/fp/Guard'
```

Added in v0.9.5

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.9.5

## WithRefine

**Signature**

```ts
export declare const WithRefine: WithRefine1<'@typed/fp/Guard'>
```

Added in v0.9.5

## WithUnion

**Signature**

```ts
export declare const WithUnion: WithUnion1<'@typed/fp/Guard'>
```

Added in v0.9.5

# utils

## InputOf (type alias)

**Signature**

```ts
export type InputOf<G> = G extends Guard<infer I, any> ? I : never
```

Added in v0.9.5

## TypeOf (type alias)

**Signature**

```ts
export type TypeOf<G> = G extends Guard<any, infer A> ? A : never
```

Added in v2.2.2
