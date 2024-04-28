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
  - [AST (namespace)](#ast-namespace)
    - [Base (type alias)](#base-type-alias)
  - [Concat (class)](#concat-class)
    - [\_tag (property)](#_tag-property)
  - [Literal (class)](#literal-class)
    - [\_tag (property)](#_tag-property-1)
  - [OneOrMore (class)](#oneormore-class)
    - [\_tag (property)](#_tag-property-2)
  - [Optional (class)](#optional-class)
    - [\_tag (property)](#_tag-property-3)
  - [Param (class)](#param-class)
    - [\_tag (property)](#_tag-property-4)
  - [Prefix (class)](#prefix-class)
    - [\_tag (property)](#_tag-property-5)
  - [QueryParam (class)](#queryparam-class)
    - [\_tag (property)](#_tag-property-6)
  - [QueryParams (class)](#queryparams-class)
    - [\_tag (property)](#_tag-property-7)
  - [UnnamedParam (class)](#unnamedparam-class)
    - [\_tag (property)](#_tag-property-8)
  - [WithSchema (class)](#withschema-class)
    - [\_tag (property)](#_tag-property-9)
  - [ZeroOrMore (class)](#zeroormore-class)
    - [\_tag (property)](#_tag-property-10)
  - [toPath](#topath)
  - [toSchema](#toschema)

---

# utils

## AST (type alias)

**Signature**

```ts
export type AST =
  | AST.Base
  | QueryParams<ReadonlyArray<QueryParam<any, AST.Base>>>
  | Concat<AST, AST>
  | WithSchema<AST, Schema.Schema.All>
```

Added in v5.0.0

## AST (namespace)

Added in v5.0.0

### Base (type alias)

**Signature**

```ts
export type Base =
  | Literal<any>
  | UnnamedParam
  | Param<any>
  | ZeroOrMore<any>
  | OneOrMore<any>
  | Optional<AST>
  | Prefix<any, AST>
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

## toPath

**Signature**

```ts
export declare function toPath<A extends AST>(ast: A): string
```

Added in v5.0.0

## toSchema

**Signature**

```ts
export declare function toSchema<A extends AST>(ast: A): Schema.Schema.All
```

Added in v5.0.0
