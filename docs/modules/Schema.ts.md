---
title: Schema.ts
nav_order: 54
parent: Modules
---

## Schema overview

Added in v0.9.4

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [Interpret (interface)](#interpret-interface)
  - [interpret](#interpret)
  - [toDecoder](#todecoder)
  - [toEq](#toeq)
  - [toGuard](#toguard)
- [Constructor](#constructor)
  - [create](#create)
  - [make](#make)
  - [withRefine](#withrefine)
  - [withUnion](#withunion)
- [Model](#model)
  - [Schema (interface)](#schema-interface)
  - [WithRefineSchema (interface)](#withrefineschema-interface)
  - [WithUnionRefineSchema (interface)](#withunionrefineschema-interface)
  - [WithUnionSchema (interface)](#withunionschema-interface)
- [Type-level](#type-level)
  - [TypeOf (type alias)](#typeof-type-alias)

---

# Combinator

## Interpret (interface)

**Signature**

```ts
export interface Interpret {
  <S extends URIS2, E>(S: Schemable2C<S, E> & WithRefine2C<S, E> & WithUnion2C<S, E>): <A>(
    schema: WithUnionRefineSchema<A> | WithUnionSchema<A> | WithRefineSchema<A> | Schema<A>,
  ) => Kind2<S, E, A>
  <S extends URIS2, E>(S: Schemable2C<S, E> & WithRefine2C<S, E>): <A>(
    schema: WithRefineSchema<A> | Schema<A>,
  ) => Kind2<S, E, A>
  <S extends URIS2, E>(S: Schemable2C<S, E> & WithUnion2C<S, E>): <A>(
    schema: WithUnionSchema<A> | Schema<A>,
  ) => Kind2<S, E, A>
  <S extends URIS2, E>(S: Schemable2C<S, E>): <A>(schema: Schema<A>) => Kind2<S, E, A>
  <S extends URIS>(S: Schemable1<S> & WithRefine1<S> & WithUnion1<S>): <A>(
    schema: WithUnionRefineSchema<A> | WithRefineSchema<A> | WithUnionSchema<A> | Schema<A>,
  ) => Kind<S, A>
  <S extends URIS>(S: Schemable1<S> & WithRefine1<S>): <A>(
    schema: WithRefineSchema<A> | Schema<A>,
  ) => Kind<S, A>
  <S extends URIS>(S: Schemable1<S> & WithUnion1<S>): <A>(
    schema: WithUnionSchema<A> | Schema<A>,
  ) => Kind<S, A>
  <S extends URIS>(S: Schemable1<S>): <A>(schema: Schema<A>) => Kind<S, A>
}
```

Added in v0.9.5

## interpret

**Signature**

```ts
export declare const interpret: Interpret
```

Added in v0.9.4

## toDecoder

**Signature**

```ts
export declare const toDecoder: <A>(
  schema: WithUnionRefineSchema<A> | WithUnionSchema<A> | WithRefineSchema<A> | Schema<A>,
) => D.Decoder<unknown, A>
```

Added in v0.9.5

## toEq

**Signature**

```ts
export declare const toEq: <A>(schema: Schema<A>) => Eq.Eq<A>
```

Added in v0.9.5

## toGuard

**Signature**

```ts
export declare const toGuard: <A>(
  schema: WithUnionRefineSchema<A> | WithRefineSchema<A> | WithUnionSchema<A> | Schema<A>,
) => G.Guard<unknown, A>
```

Added in v0.9.5

# Constructor

## create

**Signature**

```ts
export declare function create<A>(schema: WithUnionRefineSchema<A>): WithUnionRefineSchema<A>
```

Added in v0.9.5

## make

**Signature**

```ts
export declare function make<A>(schema: Schema<A>): Schema<A>
```

Added in v0.9.4

## withRefine

**Signature**

```ts
export declare function withRefine<A>(schema: WithRefineSchema<A>): WithRefineSchema<A>
```

Added in v0.9.5

## withUnion

**Signature**

```ts
export declare function withUnion<A>(schema: WithUnionSchema<A>): WithUnionSchema<A>
```

Added in v0.9.5

# Model

## Schema (interface)

**Signature**

```ts
export interface Schema<A> {
  <S>(S: Schemable<S>): HKT<S, A>
}
```

Added in v0.9.4

## WithRefineSchema (interface)

**Signature**

```ts
export interface WithRefineSchema<A> {
  <S>(S: Schemable<S> & WithRefine<S>): HKT<S, A>
}
```

Added in v0.9.5

## WithUnionRefineSchema (interface)

**Signature**

```ts
export interface WithUnionRefineSchema<A> {
  <S>(S: Schemable<S> & WithUnion<S> & WithRefine<S>): HKT<S, A>
}
```

Added in v0.9.5

## WithUnionSchema (interface)

**Signature**

```ts
export interface WithUnionSchema<A> {
  <S>(S: Schemable<S> & WithUnion<S>): HKT<S, A>
}
```

Added in v0.9.5

# Type-level

## TypeOf (type alias)

**Signature**

```ts
export type TypeOf<S> = S extends Schema<infer A>
  ? A
  : S extends WithRefineSchema<infer A>
  ? A
  : S extends WithUnionSchema<infer A>
  ? A
  : S extends WithUnionRefineSchema<infer A>
  ? A
  : never
```

Added in v0.9.4
