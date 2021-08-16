---
title: Schemable.ts
nav_order: 61
parent: Modules
---

## Schemable overview

Added in v0.9.4

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Literal (type alias)](#literal-type-alias)
  - [Schemable (interface)](#schemable-interface)
  - [Schemable1 (interface)](#schemable1-interface)
  - [Schemable2C (interface)](#schemable2c-interface)
  - [WithRefine (interface)](#withrefine-interface)
  - [WithRefine1 (interface)](#withrefine1-interface)
  - [WithRefine2C (interface)](#withrefine2c-interface)
  - [WithUnion (interface)](#withunion-interface)
  - [WithUnion1 (interface)](#withunion1-interface)
  - [WithUnion2C (interface)](#withunion2c-interface)
  - [memoize](#memoize)

---

# utils

## Literal (type alias)

**Signature**

```ts
export type Literal = string | number | boolean | null
```

Added in v0.9.4

## Schemable (interface)

**Signature**

```ts
export interface Schemable<S> {
  readonly URI: S
  readonly literal: <A extends readonly [Literal, ...Array<Literal>]>(
    ...values: A
  ) => HKT<S, A[number]>
  readonly string: HKT<S, string>
  readonly number: HKT<S, number>
  readonly boolean: HKT<S, boolean>
  readonly date: HKT<S, Date>
  readonly nullable: <A>(or: HKT<S, A>) => HKT<S, null | A>
  readonly struct: <A>(
    properties: { [K in keyof A]: HKT<S, A[K]> },
  ) => HKT<S, { [K in keyof A]: A[K] }>

  readonly record: <A>(codomain: HKT<S, A>) => HKT<S, Record<string, A>>
  readonly array: <A>(item: HKT<S, A>) => HKT<S, Array<A>>
  readonly tuple: <A extends ReadonlyArray<unknown>>(
    ...components: { readonly [K in keyof A]: HKT<S, A[K]> }
  ) => HKT<S, A>
  readonly intersect: <B>(right: HKT<S, B>) => <A>(left: HKT<S, A>) => HKT<S, A & B>
  readonly sum: <T extends string>(
    tag: T,
  ) => <A>(members: { [K in keyof A]: HKT<S, A[K] & Record<T, K>> }) => HKT<S, A[keyof A]>
  readonly lazy: <A>(id: string, f: () => HKT<S, A>) => HKT<S, A>

  readonly branded: <A extends Branded<any, any>>(item: HKT<S, ValueOf<A>>) => HKT<S, A>
  readonly unknownArray: HKT<S, Array<unknown>>
  readonly unknownRecord: HKT<S, Record<string, unknown>>
}
```

Added in v0.9.4

## Schemable1 (interface)

**Signature**

```ts
export interface Schemable1<S extends URIS> {
  readonly URI: S
  readonly literal: <A extends readonly [Literal, ...Array<Literal>]>(
    ...values: A
  ) => Kind<S, A[number]>
  readonly string: Kind<S, string>
  readonly number: Kind<S, number>
  readonly boolean: Kind<S, boolean>
  readonly date: Kind<S, Date>
  readonly nullable: <A>(or: Kind<S, A>) => Kind<S, null | A>
  readonly struct: <A>(
    properties: { [K in keyof A]: Kind<S, A[K]> },
  ) => Kind<S, { [K in keyof A]: A[K] }>
  readonly record: <A>(codomain: Kind<S, A>) => Kind<S, Record<string, A>>
  readonly array: <A>(item: Kind<S, A>) => Kind<S, Array<A>>
  readonly tuple: <A extends ReadonlyArray<unknown>>(
    ...components: { readonly [K in keyof A]: Kind<S, A[K]> }
  ) => Kind<S, A>
  readonly intersect: <B>(right: Kind<S, B>) => <A>(left: Kind<S, A>) => Kind<S, A & B>
  readonly sum: <T extends string>(
    tag: T,
  ) => <A>(members: { [K in keyof A]: Kind<S, A[K] & Record<T, K>> }) => Kind<S, A[keyof A]>
  readonly lazy: <A>(id: string, f: () => Kind<S, A>) => Kind<S, A>
  readonly branded: <A extends Branded<any, any>>(item: Kind<S, ValueOf<A>>) => Kind<S, A>
  readonly unknownArray: Kind<S, Array<unknown>>
  readonly unknownRecord: Kind<S, Record<string, unknown>>
}
```

Added in v0.9.4

## Schemable2C (interface)

**Signature**

```ts
export interface Schemable2C<S extends URIS2, E> {
  readonly URI: S
  readonly literal: <A extends readonly [Literal, ...Array<Literal>]>(
    ...values: A
  ) => Kind2<S, E, A[number]>
  readonly string: Kind2<S, E, string>
  readonly number: Kind2<S, E, number>
  readonly boolean: Kind2<S, E, boolean>
  readonly date: Kind2<S, E, Date>
  readonly nullable: <A>(or: Kind2<S, E, A>) => Kind2<S, E, null | A>
  readonly optional: <A>(or: Kind2<S, E, A>) => Kind2<S, E, undefined | A>
  readonly struct: <A>(
    properties: { [K in keyof A]: Kind2<S, E, A[K]> },
  ) => Kind2<S, E, { [K in keyof A]: A[K] }>
  readonly record: <A>(codomain: Kind2<S, E, A>) => Kind2<S, E, Record<string, A>>
  readonly array: <A>(item: Kind2<S, E, A>) => Kind2<S, E, ReadonlyArray<A>>
  readonly tuple: <A extends readonly unknown[]>(
    ...components: { readonly [K in keyof A]: Kind2<S, E, A[K]> }
  ) => Kind2<S, E, A>
  readonly intersect: <B>(right: Kind2<S, E, B>) => <A>(left: Kind2<S, E, A>) => Kind2<S, E, A & B>
  readonly sum: <T extends string>(
    tag: T,
  ) => <A>(members: { [K in keyof A]: Kind2<S, E, A[K] & Record<T, K>> }) => Kind2<S, E, A[keyof A]>
  readonly lazy: <A>(id: string, f: () => Kind2<S, E, A>) => Kind2<S, E, A>
  readonly branded: <A extends Branded<any, any>>(item: Kind2<S, E, ValueOf<A>>) => Kind2<S, E, A>
  readonly unknownArray: Kind2<S, E, ReadonlyArray<unknown>>
  readonly unknownRecord: Kind2<S, E, Record<string, unknown>>
}
```

Added in v0.9.4

## WithRefine (interface)

**Signature**

```ts
export interface WithRefine<S> {
  readonly refine: <A, B extends A>(
    refinement: Refinement<A, B>,
    id: string,
  ) => (from: HKT<S, A>) => HKT<S, B>
}
```

Added in v0.9.4

## WithRefine1 (interface)

**Signature**

```ts
export interface WithRefine1<S extends URIS> {
  readonly refine: <A, B extends A>(
    refinement: Refinement<A, B>,
    id: string,
  ) => (from: Kind<S, A>) => Kind<S, B>
}
```

Added in v0.9.4

## WithRefine2C (interface)

**Signature**

```ts
export interface WithRefine2C<S extends URIS2, E> {
  readonly refine: <A, B extends A>(
    refinement: Refinement<A, B>,
    id: string,
  ) => (from: Kind2<S, E, A>) => Kind2<S, E, B>
}
```

Added in v0.9.4

## WithUnion (interface)

**Signature**

```ts
export interface WithUnion<S> {
  readonly union: <A>(second: HKT<S, A>) => <B>(first: HKT<S, B>) => HKT<S, A | B>
}
```

Added in v0.9.4

## WithUnion1 (interface)

**Signature**

```ts
export interface WithUnion1<S extends URIS> {
  readonly union: <A>(second: Kind<S, A>) => <B>(first: Kind<S, B>) => Kind<S, A | B>
}
```

Added in v0.9.4

## WithUnion2C (interface)

**Signature**

```ts
export interface WithUnion2C<S extends URIS2, E> {
  readonly union: <A>(second: Kind2<S, E, A>) => <B>(first: Kind2<S, E, B>) => Kind2<S, E, A | B>
}
```

Added in v0.9.4

## memoize

**Signature**

```ts
export declare function memoize<A, B>(f: (a: A) => B): (a: A) => B
```

Added in v0.9.4
