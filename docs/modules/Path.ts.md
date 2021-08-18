---
title: Path.ts
nav_order: 38
parent: Modules
---

## Path overview

Added in v0.13.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [formatPart](#formatpart)
  - [pathJoin](#pathjoin)
  - [removeLeadingSlash](#removeleadingslash)
- [Constructor](#constructor)
  - [oneOrMore](#oneormore)
  - [optional](#optional)
  - [param](#param)
  - [prefix](#prefix)
  - [queryParam](#queryparam)
  - [queryParams](#queryparams)
  - [unnamed](#unnamed)
  - [zeroOrMore](#zeroormore)
- [Model](#model)
  - [OneOrMore (type alias)](#oneormore-type-alias)
  - [Optional (type alias)](#optional-type-alias)
  - [Param (type alias)](#param-type-alias)
  - [Prefix (type alias)](#prefix-type-alias)
  - [QueryParam (type alias)](#queryparam-type-alias)
  - [QueryParams (type alias)](#queryparams-type-alias)
  - [Unnamed (type alias)](#unnamed-type-alias)
  - [ZeroOrMore (type alias)](#zeroormore-type-alias)
- [Type-level](#type-level)
  - [AppendPrefix (type alias)](#appendprefix-type-alias)
  - [FindNextIndex (type alias)](#findnextindex-type-alias)
  - [FormatPart (type alias)](#formatpart-type-alias)
  - [InpterpolateParts (type alias)](#inpterpolateparts-type-alias)
  - [InpterpolatePartsWithNext (type alias)](#inpterpolatepartswithnext-type-alias)
  - [Interpolate (type alias)](#interpolate-type-alias)
  - [InterpolatePart (type alias)](#interpolatepart-type-alias)
  - [InterpolateQueryParamPart (type alias)](#interpolatequeryparampart-type-alias)
  - [InterpolateUnnamedPart (type alias)](#interpolateunnamedpart-type-alias)
  - [ParamsOf (type alias)](#paramsof-type-alias)
  - [PartToParam (type alias)](#parttoparam-type-alias)
  - [PartsToParams (type alias)](#partstoparams-type-alias)
  - [PathJoin (type alias)](#pathjoin-type-alias)
  - [PathToParts (type alias)](#pathtoparts-type-alias)
  - [PathToQuery (type alias)](#pathtoquery-type-alias)
  - [QueryParamsOf (type alias)](#queryparamsof-type-alias)
  - [QueryParamsToParts (type alias)](#queryparamstoparts-type-alias)
  - [QueryToParams (type alias)](#querytoparams-type-alias)
  - [RemoveLeadingSlash (type alias)](#removeleadingslash-type-alias)

---

# Combinator

## formatPart

Formats a piece of a path

**Signature**

```ts
export declare const formatPart: (part: string) => string
```

Added in v0.13.0

## pathJoin

**Signature**

```ts
export declare const pathJoin: <P extends readonly string[]>(...parts: P) => PathJoin<P>
```

Added in v0.13.0

## removeLeadingSlash

**Signature**

```ts
export declare const removeLeadingSlash: <A extends string>(a: A) => RemoveLeadingSlash<A>
```

Added in v0.13.0

# Constructor

## oneOrMore

one or more path parts will be matched to this param

**Signature**

```ts
export declare const oneOrMore: <A extends string>(param: A) => `:${A}+`
```

Added in v0.13.0

## optional

**Signature**

```ts
export declare const optional: <A extends string>(param: A) => `${A}?`
```

Added in v0.13.0

## param

**Signature**

```ts
export declare const param: <A extends string>(param: A) => `:${A}`
```

Added in v0.13.0

## prefix

**Signature**

```ts
export declare const prefix: <P extends string, A extends `:${string}` | '(.*)'>(
  prefix: P,
  param: A,
) => `{${P}${A}}`
```

Added in v0.13.0

## queryParam

Construct query params

**Signature**

```ts
export declare const queryParam: <K extends string, V extends string>(
  key: K,
  value: V,
) => QueryParam<K, V>
```

Added in v0.13.0

## queryParams

**Signature**

```ts
export declare const queryParams: <P extends readonly [any, ...any[]]>(
  ...params: P
) => QueryParams<P, ''>
```

Added in v0.13.0

## unnamed

**Signature**

```ts
export declare const unnamed: '(.*)'
```

Added in v0.13.0

## zeroOrMore

**Signature**

```ts
export declare const zeroOrMore: <A extends string>(param: A) => `:${A}*`
```

Added in v0.13.0

# Model

## OneOrMore (type alias)

**Signature**

```ts
export type OneOrMore<A extends string> = `${Param<A>}+`
```

Added in v0.13.0

## Optional (type alias)

Template for optional path parts

**Signature**

```ts
export type Optional<A extends string> = `${A}?`
```

Added in v0.13.0

## Param (type alias)

Template for parameters

**Signature**

```ts
export type Param<A extends string> = `:${A}`
```

Added in v0.13.0

## Prefix (type alias)

Construct a custom prefix

**Signature**

```ts
export type Prefix<P extends string, A extends string> = `{${P}${A}}`
```

Added in v0.13.0

## QueryParam (type alias)

Construct query params

**Signature**

```ts
export type QueryParam<K extends string, V extends string> = `` extends V ? K : `${K}=${V}`
```

Added in v0.13.0

## QueryParams (type alias)

Creates the path-to-regexp syntax for query parameters

**Signature**

```ts
export type QueryParams<
  Q extends readonly QueryParam<any, any>[],
  R extends string = ``,
> = Q extends readonly [infer Head, ...infer Tail]
  ? QueryParams<
      A.Cast<Tail, readonly QueryParam<any, any>[]>,
      `` extends R ? `\\?${A.Cast<Head, string>}` : `${R}&${A.Cast<Head, string>}`
    >
  : R
```

Added in v0.13.0

## Unnamed (type alias)

**Signature**

```ts
export type Unnamed = typeof unnamed
```

Added in v0.13.0

## ZeroOrMore (type alias)

zero or more path parts will be matched to this param

**Signature**

```ts
export type ZeroOrMore<A extends string> = `${Param<A>}*`
```

Added in v0.13.0

# Type-level

## AppendPrefix (type alias)

**Signature**

```ts
export type AppendPrefix<
  R extends readonly any[],
  Pre extends string,
  P extends string,
> = R extends readonly [...infer Init, infer L]
  ? readonly [...Init, `${A.Cast<L, string>}${Pre}${P}`]
  : R
```

Added in v0.13.0

## FindNextIndex (type alias)

**Signature**

```ts
export type FindNextIndex<AST, I extends number = 0> = I extends keyof AST
  ? FindNextIndex<AST, N.Add<I, 1>>
  : I
```

Added in v0.13.0

## FormatPart (type alias)

**Signature**

```ts
export type FormatPart<P extends string> = `` extends P
  ? P
  : RemoveLeadingSlash<P> extends `\\?${infer _}`
  ? RemoveLeadingSlash<P>
  : RemoveLeadingSlash<P> extends `{${infer _}`
  ? RemoveLeadingSlash<P>
  : P extends QueryParam<infer _, infer _> | QueryParams<infer _, infer _>
  ? P
  : `/${RemoveLeadingSlash<P>}`
```

Added in v0.13.0

## InpterpolateParts (type alias)

**Signature**

```ts
export type InpterpolateParts<
  Parts extends readonly any[],
  Params extends {},
  R extends readonly any[] = [],
  AST = {},
> = Parts extends readonly [infer H, ...infer T]
  ? H extends Optional<Prefix<infer Pre, Unnamed>>
    ? FindNextIndex<AST> extends keyof Params
      ? InpterpolateParts<
          T,
          Params,
          AppendPrefix<R, Pre, `${A.Cast<Params[FindNextIndex<AST>], string | number>}`>,
          AST & Record<H, Params[FindNextIndex<AST>]>
        >
      : InpterpolateParts<T, Params, R, AST>
    : H extends Prefix<infer Pre, Unnamed>
    ? InpterpolateParts<
        T,
        Params,
        AppendPrefix<
          R,
          Pre,
          `${A.Cast<Params[A.Cast<FindNextIndex<AST>, keyof Params>], string | number>}`
        >,
        AST & Record<H, Params[A.Cast<FindNextIndex<AST>, keyof Params>]>
      >
    : H extends Optional<Prefix<infer Pre, Param<infer P>>>
    ? P extends keyof Params
      ? InpterpolateParts<
          T,
          Params,
          AppendPrefix<R, Pre, A.Cast<Params[A.Cast<P, keyof Params>], string>>,
          AST & Record<H, Params[A.Cast<P, keyof Params>]>
        >
      : InpterpolateParts<T, Params, R, AST>
    : H extends Prefix<infer Pre, Param<infer P>>
    ? InpterpolateParts<
        T,
        Params,
        AppendPrefix<R, Pre, A.Cast<Params[A.Cast<P, keyof Params>], string>>,
        AST & Record<H, Params[A.Cast<P, keyof Params>]>
      >
    : InterpolatePart<H, Params, AST> extends readonly [infer A, infer B]
    ? InpterpolatePartsWithNext<T, Params, R, readonly [A, B]>
    : InpterpolateParts<T, Params, R, AST>
  : readonly [R, AST]
```

Added in v0.13.0

## InpterpolatePartsWithNext (type alias)

**Signature**

```ts
export type InpterpolatePartsWithNext<
  Parts extends readonly any[],
  Params extends {},
  R extends readonly any[],
  Next extends readonly [any, any],
> = InpterpolateParts<Parts, Params, readonly [...R, Next[0]], Next[1]>
```

Added in v0.13.0

## Interpolate (type alias)

**Signature**

```ts
export type Interpolate<
  P extends string,
  Params extends ParamsOf<P>,
> = P extends `${infer Head}\\?${infer Tail}`
  ? PathJoin<
      InterpolateWithQueryParams<
        SplitQueryParams<Tail>,
        Params,
        InpterpolateParts<PathToParts<Head>, Params>
      >[0]
    >
  : PathJoin<InpterpolateParts<PathToParts<P>, Params>[0]>
```

Added in v0.13.0

## InterpolatePart (type alias)

**Signature**

```ts
export type InterpolatePart<P, Params, AST> = P extends Optional<Param<infer R>>
  ? R extends keyof Params
    ? readonly [Params[R], AST & Record<R, Params[R]>]
    : readonly ['', AST]
  : P extends Param<infer R>
  ? R extends keyof Params
    ? readonly [Params[R], AST & Record<R, Params[R]>]
    : readonly [P, AST]
  : P extends Unnamed
  ? FindNextIndex<AST> extends keyof Params
    ? InterpolateUnnamedPart<Params, FindNextIndex<AST>, AST>
    : readonly [P, AST]
  : P extends Prefix<infer Pre, Param<infer R>>
  ? R extends keyof Params
    ? [`${Pre}${A.Cast<Params[R], string>}`, AST & Record<R, Params[R]>]
    : []
  : P extends Optional<Prefix<infer Pre, Param<infer R>>>
  ? R extends keyof Params
    ? [`${Pre}${A.Cast<Params[R], string>}`, AST & Partial<Record<R, Params[R]>>]
    : []
  : readonly [P, AST]
```

Added in v0.13.0

## InterpolateQueryParamPart (type alias)

**Signature**

```ts
export type InterpolateQueryParamPart<
  Part,
  Params,
  Previous extends readonly [readonly string[], any],
  First extends boolean,
> = Part extends QueryParam<infer K, infer V>
  ? InterpolateQueryParamPartWithKey<
      First extends true ? `?${K}` : `&${K}`,
      Previous[0],
      InterpolatePart<V, Params, Previous[1]>,
      First
    >
  : readonly [[[...Previous[0], Part], Previous[1]], false]
```

Added in v0.13.0

## InterpolateUnnamedPart (type alias)

**Signature**

```ts
export type InterpolateUnnamedPart<Params, K extends keyof Params, AST> = readonly [
  Params[K],
  AST & Record<K, Params[K]>,
]
```

Added in v0.13.0

## ParamsOf (type alias)

**Signature**

```ts
export type ParamsOf<A extends string> = Compact<PartsToParams<PathToParts<A>>>
```

Added in v0.13.0

## PartToParam (type alias)

**Signature**

```ts
export type PartToParam<A extends string, AST> = A extends `\\${infer R}`
  ? PartsToParams<QueryParamsToParts<R, []>, AST>
  : A extends Unnamed
  ? {
      readonly [K in FindNextIndex<AST> extends number ? FindNextIndex<AST> : never]: string
    }
  : A extends `${infer _}${Unnamed}}?`
  ? { readonly [K in FindNextIndex<AST> extends number ? FindNextIndex<AST> : never]?: string }
  : A extends `${infer _}${Unnamed}}`
  ? { readonly [K in FindNextIndex<AST> extends number ? FindNextIndex<AST> : never]: string }
  : A extends `${infer _}${Param<infer R>}}?`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Param<infer R>}}`
  ? { readonly [K in R]: string }
  : A extends `${infer _}${Param<infer R>}?`
  ? { readonly [K in R]?: string }
  : A extends `${infer _}${Param<infer R>}+`
  ? { readonly [K in R]: readonly [string, ...string[]] }
  : A extends `${infer _}${Param<infer R>}*`
  ? { readonly [K in R]: readonly string[] }
  : A extends `${infer _}${Param<infer R>}`
  ? { readonly [K in R]: string }
  : {}
```

Added in v0.13.0

## PartsToParams (type alias)

**Signature**

```ts
export type PartsToParams<A extends ReadonlyArray<string>, AST = {}> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? PartsToParams<A.Cast<Tail, readonly string[]>, AST & PartToParam<A.Cast<Head, string>, AST>>
  : AST
```

Added in v0.13.0

## PathJoin (type alias)

Composes other path parts into a single path

**Signature**

```ts
export type PathJoin<A extends ReadonlyArray<string>> = A extends readonly [
  infer Head,
  ...infer Tail
]
  ? `${FormatPart<A.Cast<Head, string>>}${PathJoin<A.Cast<Tail, ReadonlyArray<string>>>}`
  : ``
```

Added in v0.13.0

## PathToParts (type alias)

**Signature**

```ts
export type PathToParts<P> = P extends `${infer Head}\\?${infer Tail}`
  ? readonly [...PathToParts<Head>, `\\?${Tail}`]
  : P extends `${infer Head}/${infer Tail}`
  ? readonly [...PathToParts<Head>, ...PathToParts<Tail>]
  : P extends `${infer Head}{${infer Q}}?${infer Tail}`
  ? readonly [...PathToParts<Head>, `{${Q}}?`, ...PathToParts<`${Tail}`>]
  : P extends `${infer Head}{${infer Q}}${infer Tail}`
  ? readonly [...PathToParts<Head>, `{${Q}}`, ...PathToParts<`${Tail}`>]
  : `` extends P
  ? readonly []
  : readonly [P]
```

Added in v0.13.0

## PathToQuery (type alias)

**Signature**

```ts
export type PathToQuery<P extends string> = P extends `${infer _}\\${infer Q}` ? Q : ``
```

Added in v0.13.0

## QueryParamsOf (type alias)

**Signature**

```ts
export type QueryParamsOf<P extends string> = Compact<QueryToParams<PathToQuery<P>>>
```

Added in v0.13.0

## QueryParamsToParts (type alias)

**Signature**

```ts
export type QueryParamsToParts<
  Q extends string,
  R extends ReadonlyArray<string>,
> = Q extends `\\?${infer Q}`
  ? QueryParamsToParts<Q, R>
  : Q extends `?${infer Q}`
  ? QueryParamsToParts<Q, R>
  : Q extends `${infer Head}&${infer Tail}`
  ? QueryParamsToParts<Tail, QueryParamsToParts<Head, R>>
  : readonly [...R, QueryParamValue<Q>]
```

Added in v0.13.0

## QueryToParams (type alias)

**Signature**

```ts
export type QueryToParams<Q extends string, AST = {}> = Q extends `${infer Head}&${infer Tail}`
  ? QueryToParams<Tail, QueryToParams<Head, AST>>
  : Q extends `?${infer K}`
  ? QueryToParams<K, AST>
  : Q extends `${infer K}?`
  ? AST & Partial<QueryParamAst<K>>
  : Q extends `${infer K}`
  ? AST & QueryParamAst<K>
  : AST
```

Added in v0.13.0

## RemoveLeadingSlash (type alias)

Remove forward slashes prefixes recursively

**Signature**

```ts
export type RemoveLeadingSlash<A> = A extends `/${infer R}` ? RemoveLeadingSlash<R> : A
```

Added in v0.13.0
