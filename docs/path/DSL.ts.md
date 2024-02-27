---
title: DSL.ts
nav_order: 1
parent: "@typed/path"
---

## DSL overview

DSL for subset of path-to-regexp syntax

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor](#constructor)
  - [oneOrMore](#oneormore)
  - [optional](#optional)
  - [param](#param)
  - [paramWithOptions](#paramwithoptions)
  - [prefix](#prefix)
  - [queryParam](#queryparam)
  - [queryParams](#queryparams)
  - [unnamed](#unnamed)
  - [zeroOrMore](#zeroormore)
- [Model](#model)
  - [OneOrMore (type alias)](#oneormore-type-alias)
  - [Optional (type alias)](#optional-type-alias)
  - [Param (type alias)](#param-type-alias)
  - [ParamWithOptions (type alias)](#paramwithoptions-type-alias)
  - [Prefix (type alias)](#prefix-type-alias)
  - [QueryParam (type alias)](#queryparam-type-alias)
  - [QueryParams (type alias)](#queryparams-type-alias)
  - [Unnamed (type alias)](#unnamed-type-alias)
  - [ZeroOrMore (type alias)](#zeroormore-type-alias)

---

# Constructor

## oneOrMore

one or more path parts will be matched to this param

**Signature**

```ts
export declare const oneOrMore: <A extends string>(param: A) => `${A}+`
```

Added in v1.0.0

## optional

**Signature**

```ts
export declare const optional: <A extends string>(param: A) => `${A}?`
```

Added in v1.0.0

## param

**Signature**

```ts
export declare const param: <A extends string>(param: A) => `:${A}`
```

Added in v1.0.0

## paramWithOptions

**Signature**

```ts
export declare const paramWithOptions: <const A extends string, Options extends readonly string[]>(
  param: A,
  ...options: Options
) => `:${A}(${S.Join<Options, "|">})`
```

Added in v1.0.0

## prefix

**Signature**

```ts
export declare const prefix: <P extends string, A extends `:${string}` | "(.*)">(prefix: P, param: A) => `{${P}${A}}`
```

Added in v1.0.0

## queryParam

Construct query params

**Signature**

```ts
export declare const queryParam: <K extends string, V extends string>(key: K, value: V) => QueryParam<K, V>
```

Added in v1.0.0

## queryParams

**Signature**

```ts
export declare const queryParams: <P extends readonly [any, ...any[]]>(...params: P) => QueryParams<P, "">
```

Added in v1.0.0

## unnamed

**Signature**

```ts
export declare const unnamed: "(.*)"
```

Added in v1.0.0

## zeroOrMore

**Signature**

```ts
export declare const zeroOrMore: <A extends string>(param: A) => `${A}*`
```

Added in v1.0.0

# Model

## OneOrMore (type alias)

**Signature**

```ts
export type OneOrMore<A extends string> = `${A}+`
```

Added in v1.0.0

## Optional (type alias)

Template for optional path parts

**Signature**

```ts
export type Optional<A extends string> = `${A}?`
```

Added in v1.0.0

## Param (type alias)

Template for parameters

**Signature**

```ts
export type Param<A extends string> = `:${A}`
```

Added in v1.0.0

## ParamWithOptions (type alias)

Template for parameters

**Signature**

```ts
export type ParamWithOptions<A extends string, Options extends ReadonlyArray<string>> = `:${A}(${S.Join<Options, "|">})`
```

Added in v1.0.0

## Prefix (type alias)

Construct a custom prefix

**Signature**

```ts
export type Prefix<P extends string, A extends string> = `{${P}${A}}`
```

Added in v1.0.0

## QueryParam (type alias)

Construct query params

**Signature**

```ts
export type QueryParam<K extends string, V extends string> = `` extends V ? K : `${K}=${V}`
```

Added in v1.0.0

## QueryParams (type alias)

Creates the path-to-regexp syntax for query parameters

**Signature**

```ts
export type QueryParams<Q extends ReadonlyArray<QueryParam<any, any>>, R extends string = ``> = Q extends readonly [
  infer Head extends string,
  ...infer Tail extends ReadonlyArray<QueryParam<any, any>>
]
  ? QueryParams<Tail, `` extends R ? `\\?${Head}` : `${R}&${Head}`>
  : R
```

Added in v1.0.0

## Unnamed (type alias)

**Signature**

```ts
export type Unnamed = typeof unnamed
```

Added in v1.0.0

## ZeroOrMore (type alias)

zero or more path parts will be matched to this param

**Signature**

```ts
export type ZeroOrMore<A extends string> = `${A}*`
```

Added in v1.0.0
