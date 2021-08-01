---
title: Eq.ts
nav_order: 16
parent: Modules
---

## Eq overview

Eq Instance for some common scenarios including deep equality.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [array](#array)
  - [intersect](#intersect)
  - [lazy](#lazy)
  - [nullable](#nullable)
  - [partial](#partial)
  - [record](#record)
  - [struct](#struct)
  - [sum](#sum)
  - [tuple](#tuple)
- [Instance](#instance)
  - [Schemable](#schemable)
  - [WithUnknownContainers](#withunknowncontainers)
  - [alwaysEqualsEq](#alwaysequalseq)
  - [deepEqualsEq](#deepequalseq)
  - [neverEqualsEq](#neverequalseq)
- [primitives](#primitives)
  - [UnknownArray](#unknownarray)
  - [UnknownRecord](#unknownrecord)
  - [boolean](#boolean)
  - [number](#number)
  - [string](#string)

---

# Combinator

## array

**Signature**

```ts
export declare const array: <A>(item: Eq.Eq<A>) => Eq.Eq<A[]>
```

Added in v2.2.2

## intersect

**Signature**

```ts
export declare const intersect: <B>(right: Eq.Eq<B>) => <A>(left: Eq.Eq<A>) => Eq.Eq<A & B>
```

Added in v2.2.2

## lazy

**Signature**

```ts
export declare function lazy<A>(f: () => Eq.Eq<A>): Eq.Eq<A>
```

Added in v2.2.2

## nullable

**Signature**

```ts
export declare const nullable: <A>(or: Eq.Eq<A>) => Eq.Eq<A | null>
```

Added in v2.2.2

## partial

**Signature**

```ts
export declare const partial: <A>(
  properties: { [K in keyof A]: Eq.Eq<A[K]> },
) => Eq.Eq<Partial<{ [K in keyof A]: A[K] }>>
```

Added in v2.2.2

## record

**Signature**

```ts
export declare const record: <A>(codomain: Eq.Eq<A>) => Eq.Eq<Record<string, A>>
```

Added in v2.2.2

## struct

**Signature**

```ts
export declare const struct: <A>(
  properties: { [K in keyof A]: Eq.Eq<A[K]> },
) => Eq.Eq<{ [K in keyof A]: A[K] }>
```

Added in v2.2.15

## sum

**Signature**

```ts
export declare const sum: <T extends string>(
  tag: T,
) => <A>(members: { [K in keyof A]: Eq.Eq<A[K] & Record<T, K>> }) => Eq.Eq<A[keyof A]>
```

Added in v2.2.2

## tuple

**Signature**

```ts
export declare const tuple: <A extends readonly unknown[]>(
  ...components: { [K in keyof A]: Eq.Eq<A[K]> }
) => Eq.Eq<A>
```

Added in v2.2.2

# Instance

## Schemable

**Signature**

```ts
export declare const Schemable: Schemable1<'@typed/fp/ToEq'>
```

Added in v0.9.4

## WithUnknownContainers

**Signature**

```ts
export declare const WithUnknownContainers: WithUnknownContainers1<'@typed/fp/ToEq'>
```

Added in v0.9.4

## alwaysEqualsEq

**Signature**

```ts
export declare const alwaysEqualsEq: Eq.Eq<any>
```

Added in v0.9.2

## deepEqualsEq

A deep-equality Eq instance. Supports Reference equality, all JavaScript Primitives including
`RegExp`, `Set` and `Map`.

**Signature**

```ts
export declare const deepEqualsEq: Eq.Eq<unknown>
```

Added in v0.9.2

## neverEqualsEq

**Signature**

```ts
export declare const neverEqualsEq: Eq.Eq<any>
```

Added in v0.9.2

# primitives

## UnknownArray

**Signature**

```ts
export declare const UnknownArray: Eq.Eq<readonly unknown[]>
```

Added in v2.2.2

## UnknownRecord

**Signature**

```ts
export declare const UnknownRecord: Eq.Eq<Readonly<Record<string, unknown>>>
```

Added in v2.2.2

## boolean

**Signature**

```ts
export declare const boolean: Eq.Eq<boolean>
```

Added in v2.2.2

## number

**Signature**

```ts
export declare const number: Eq.Eq<number>
```

Added in v2.2.2

## string

**Signature**

```ts
export declare const string: Eq.Eq<string>
```

Added in v2.2.2
