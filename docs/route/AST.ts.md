---
title: AST.ts
nav_order: 1
parent: "@typed/route"
---

## AST overview

Added in v5.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AST (type alias)](#ast-type-alias)
  - [Concat (class)](#concat-class)
    - [\_tag (property)](#_tag-property)
  - [InterpolateLiteral (class)](#interpolateliteral-class)
    - [\_tag (property)](#_tag-property-1)
  - [InterpolateParam (class)](#interpolateparam-class)
    - [\_tag (property)](#_tag-property-2)
  - [Interpolater (type alias)](#interpolater-type-alias)
  - [InterpolationPart (type alias)](#interpolationpart-type-alias)
  - [Literal (class)](#literal-class)
    - [\_tag (property)](#_tag-property-3)
  - [Matcher (type alias)](#matcher-type-alias)
  - [OneOrMore (class)](#oneormore-class)
    - [\_tag (property)](#_tag-property-4)
  - [Optional (class)](#optional-class)
    - [\_tag (property)](#_tag-property-5)
  - [Param (class)](#param-class)
    - [\_tag (property)](#_tag-property-6)
  - [Prefix (class)](#prefix-class)
    - [\_tag (property)](#_tag-property-7)
  - [QueryParam (class)](#queryparam-class)
    - [\_tag (property)](#_tag-property-8)
  - [QueryParams (class)](#queryparams-class)
    - [\_tag (property)](#_tag-property-9)
  - [UnnamedParam (class)](#unnamedparam-class)
    - [\_tag (property)](#_tag-property-10)
  - [WithSchema (class)](#withschema-class)
    - [\_tag (property)](#_tag-property-11)
  - [ZeroOrMore (class)](#zeroormore-class)
    - [\_tag (property)](#_tag-property-12)
  - [astToInterpolation](#asttointerpolation)
  - [astToMatcher](#asttomatcher)
  - [getAstSegments](#getastsegments)
  - [getOptionalQueryParams](#getoptionalqueryparams)
  - [getPathAndQuery](#getpathandquery)
  - [getQueryParams](#getqueryparams)
  - [parse](#parse)
  - [splitByQueryParams](#splitbyqueryparams)
  - [toPath](#topath)
  - [toPathSchema](#topathschema)
  - [toQuerySchema](#toqueryschema)
  - [toSchema](#toschema)

---

# utils

## AST (type alias)

**Signature**

```ts
export type AST =
  | Literal<string>
  | UnnamedParam
  | Param<string>
  | ZeroOrMore<AST>
  | OneOrMore<AST>
  | Optional<AST>
  | Prefix<string, AST>
  | QueryParams<ReadonlyArray<QueryParam<string, AST>>>
  | Concat<AST, AST>
  | WithSchema<AST, Schema.Schema.All>
```

Added in v5.0.0

## Concat (class)

**Signature**

```ts
export declare class Concat<L, R> { constructor(readonly left: L, readonly right: R) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "Concat"
```

Added in v5.0.0

## InterpolateLiteral (class)

**Signature**

```ts
export declare class InterpolateLiteral { constructor(readonly value: string) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "Literal"
```

Added in v5.0.0

## InterpolateParam (class)

**Signature**

```ts
export declare class InterpolateParam { constructor(
    readonly interpolate: Interpolater
  ) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "Param"
```

Added in v5.0.0

## Interpolater (type alias)

**Signature**

```ts
export type Interpolater = (params: Readonly<Record<string, string | ReadonlyArray<string>>>) => string
```

Added in v5.0.0

## InterpolationPart (type alias)

**Signature**

```ts
export type InterpolationPart = InterpolateLiteral | InterpolateParam
```

Added in v5.0.0

## Literal (class)

**Signature**

```ts
export declare class Literal<L> { constructor(readonly literal: L) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "Literal"
```

Added in v5.0.0

## Matcher (type alias)

**Signature**

```ts
export type Matcher = (
  pathSegments: Array<string>,
  query: URLSearchParams
) => Option.Option<Record<string, string | ReadonlyArray<string>>>
```

Added in v5.0.0

## OneOrMore (class)

**Signature**

```ts
export declare class OneOrMore<P> { constructor(readonly param: P) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "OneOrMore"
```

Added in v5.0.0

## Optional (class)

**Signature**

```ts
export declare class Optional<P> { constructor(readonly param: P) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "Optional"
```

Added in v5.0.0

## Param (class)

**Signature**

```ts
export declare class Param<P> { constructor(readonly param: P) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "Param"
```

Added in v5.0.0

## Prefix (class)

**Signature**

```ts
export declare class Prefix<P, A> { constructor(readonly prefix: P, readonly param: A) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "Prefix"
```

Added in v5.0.0

## QueryParam (class)

**Signature**

```ts
export declare class QueryParam<K, V> { constructor(readonly key: K, readonly value: V) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "QueryParam"
```

Added in v5.0.0

## QueryParams (class)

**Signature**

```ts
export declare class QueryParams<P> { constructor(readonly params: P) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "QueryParams"
```

Added in v5.0.0

## UnnamedParam (class)

**Signature**

```ts
export declare class UnnamedParam
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "UnnamedParam"
```

Added in v5.0.0

## WithSchema (class)

**Signature**

```ts
export declare class WithSchema<A, S> { constructor(readonly ast: A, readonly schema: S) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "WithSchema"
```

Added in v5.0.0

## ZeroOrMore (class)

**Signature**

```ts
export declare class ZeroOrMore<P> { constructor(readonly param: P) }
```

Added in v5.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "ZeroOrMore"
```

Added in v5.0.0

## astToInterpolation

**Signature**

```ts
export declare function astToInterpolation(ast: AST): InterpolationPart
```

Added in v5.0.0

## astToMatcher

**Signature**

```ts
export declare function astToMatcher(ast: AST, end: boolean = false): Matcher
```

Added in v5.0.0

## getAstSegments

**Signature**

```ts
export declare function getAstSegments(part: AST): Array<Array<AST>>
```

Added in v5.0.0

## getOptionalQueryParams

**Signature**

```ts
export declare function getOptionalQueryParams(ast: AST): ReadonlyArray<QueryParam<string, AST>>
```

Added in v5.0.0

## getPathAndQuery

**Signature**

```ts
export declare function getPathAndQuery(path: string)
```

Added in v5.0.0

## getQueryParams

**Signature**

```ts
export declare function getQueryParams(ast: AST): QueryParams<ReadonlyArray<QueryParam<string, AST>>> | null
```

Added in v5.0.0

## parse

**Signature**

```ts
export declare function parse(path: string)
```

Added in v5.0.0

## splitByQueryParams

**Signature**

```ts
export declare function splitByQueryParams(path: string): readonly [Array<string>, string]
```

Added in v5.0.0

## toPath

**Signature**

```ts
export declare function toPath<A extends AST>(ast: A): string
```

Added in v5.0.0

## toPathSchema

**Signature**

```ts
export declare function toPathSchema<A extends AST>(ast: A): Schema.Schema.All
```

Added in v5.0.0

## toQuerySchema

**Signature**

```ts
export declare function toQuerySchema<A extends AST>(ast: A): Schema.Schema.All
```

Added in v5.0.0

## toSchema

**Signature**

```ts
export declare function toSchema<A extends AST>(ast: A): Schema.Schema.All
```

Added in v5.0.0
