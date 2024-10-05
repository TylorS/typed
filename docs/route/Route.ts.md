---
title: Route.ts
nav_order: 3
parent: "@typed/route"
---

## Route overview

Added in v5.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [BigInt](#bigint)
  - [Order](#order)
  - [QueryParamsFromObject (type alias)](#queryparamsfromobject-type-alias)
  - [QueryParamsFromObjectSchema (type alias)](#queryparamsfromobjectschema-type-alias)
  - [Route (interface)](#route-interface)
  - [Route (namespace)](#route-namespace)
    - [Variance (interface)](#variance-interface)
    - [Any (type alias)](#any-type-alias)
    - [Concat (type alias)](#concat-type-alias)
    - [ConcatAll (type alias)](#concatall-type-alias)
    - [ConcatQuery (type alias)](#concatquery-type-alias)
    - [ConcatSchemas (type alias)](#concatschemas-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Encoded (type alias)](#encoded-type-alias)
    - [Interpolate (type alias)](#interpolate-type-alias)
    - [Params (type alias)](#params-type-alias)
    - [ParamsAreOptional (type alias)](#paramsareoptional-type-alias)
    - [ParamsList (type alias)](#paramslist-type-alias)
    - [Path (type alias)](#path-type-alias)
    - [PathSchema (type alias)](#pathschema-type-alias)
    - [PathSchemaFromInput (type alias)](#pathschemafrominput-type-alias)
    - [PathWithoutQuery (type alias)](#pathwithoutquery-type-alias)
    - [Query (type alias)](#query-type-alias)
    - [QueryParams (type alias)](#queryparams-type-alias)
    - [QuerySchema (type alias)](#queryschema-type-alias)
    - [QuerySchemaFromInput (type alias)](#queryschemafrominput-type-alias)
    - [Schema (type alias)](#schema-type-alias)
    - [SchemaFromInput (type alias)](#schemafrominput-type-alias)
    - [SchemaFromPath (type alias)](#schemafrompath-type-alias)
    - [Type (type alias)](#type-type-alias)
    - [UpdatePath (type alias)](#updatepath-type-alias)
    - [UpdateSchema (type alias)](#updateschema-type-alias)
    - [PathSchema (namespace)](#pathschema-namespace)
      - [ExtractKeys (type alias)](#extractkeys-type-alias)
      - [GetPath (type alias)](#getpath-type-alias)
      - [GetPathEncodedKeys (type alias)](#getpathencodedkeys-type-alias)
      - [GetPathTypeKeys (type alias)](#getpathtypekeys-type-alias)
    - [QuerySchema (namespace)](#queryschema-namespace)
      - [ExtractKeys (type alias)](#extractkeys-type-alias-1)
      - [GetQuery (type alias)](#getquery-type-alias)
      - [GetQueryEncodedKeys (type alias)](#getqueryencodedkeys-type-alias)
      - [GetQueryTypeKeys (type alias)](#getquerytypekeys-type-alias)
  - [RouteDecodeError (class)](#routedecodeerror-class)
    - [toJSON (method)](#tojson-method)
    - [toString (method)](#tostring-method)
  - [RouteEncodeError (class)](#routeencodeerror-class)
    - [toJSON (method)](#tojson-method-1)
    - [toString (method)](#tostring-method-1)
  - [RouteFromQueryParamsObject (type alias)](#routefromqueryparamsobject-type-alias)
  - [RouteOptions (interface)](#routeoptions-interface)
  - [RouteTypeId](#routetypeid)
  - [RouteTypeId (type alias)](#routetypeid-type-alias)
  - [addTag](#addtag)
  - [attachPropertySignature](#attachpropertysignature)
  - [base64Url](#base64url)
  - [bigDecimal](#bigdecimal)
  - [boolean](#boolean)
  - [concat](#concat)
  - [date](#date)
  - [decode](#decode)
  - [decode\_](#decode_)
  - [encode](#encode)
  - [encode\_](#encode_)
  - [end](#end)
  - [getInterpolate](#getinterpolate)
  - [getMatch](#getmatch)
  - [getPath](#getpath)
  - [home](#home)
  - [integer](#integer)
  - [isRoute](#isroute)
  - [literal](#literal)
  - [make](#make)
  - [nanoId](#nanoid)
  - [number](#number)
  - [oneOrMore](#oneormore)
  - [optional](#optional)
  - [param](#param)
  - [paramWithSchema](#paramwithschema)
  - [parse](#parse)
  - [prefix](#prefix)
  - [queryParams](#queryparams)
  - [sortRoutes](#sortroutes)
  - [transform](#transform)
  - [transformOrFail](#transformorfail)
  - [ulid](#ulid)
  - [unnamed](#unnamed)
  - [updateSchema](#updateschema)
  - [uuid](#uuid)
  - [withSchema](#withschema)
  - [zeroOrMore](#zeroormore)

---

# utils

## BigInt

**Signature**

```ts
export declare const BigInt: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: bigint }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## Order

**Signature**

```ts
export declare const Order: Ord.Order<Route.Any>
```

Added in v5.0.0

## QueryParamsFromObject (type alias)

**Signature**

```ts
export type QueryParamsFromObject<O extends Readonly<Record<string, Route.Any>>> = Path.QueryParams<
  U.ListOf<
    {
      readonly [K in keyof O]: `${Extract<K, string | number>}=${Route.Path<O[K]>}`
    }[keyof O]
  >
>
```

Added in v5.0.0

## QueryParamsFromObjectSchema (type alias)

**Signature**

```ts
export type QueryParamsFromObjectSchema<O extends Readonly<Record<string, Route.Any>>> = Sch.Schema<
  Types.Simplify<
    Types.UnionToIntersection<
      {
        readonly [K in keyof O]: Route.Type<O[K]>
      }[keyof O]
    >
  >,
  Types.Simplify<
    Types.UnionToIntersection<
      {
        readonly [K in keyof O]: Route.Encoded<O[K]>
      }[keyof O]
    >
  >,
  Route.Context<O[keyof O]>
>
```

Added in v5.0.0

## Route (interface)

**Signature**

```ts
export interface Route<P extends string, S extends Sch.Schema.All = never> extends Pipeable {
  readonly [RouteTypeId]: Route.Variance<P, S>

  /**
   * @since 5.0.0
   */
  readonly routeAst: AST.AST

  /**
   * @since 5.0.0
   */
  readonly routeOptions: RouteOptions

  /**
   * @since 5.0.0
   */
  readonly path: Path.PathJoin<[P]>

  /**
   * @since 5.0.0
   */
  readonly schema: Route.SchemaFromInput<P, S>

  /**
   * @since 5.0.0
   */
  readonly pathSchema: Route.PathSchemaFromInput<P, S>

  /**
   * @since 5.0.0
   */
  readonly querySchema: Route.QuerySchemaFromInput<P, S>

  /**
   * @since 5.0.0
   */
  readonly match: (path: string) => Option.Option<Path.ParamsOf<P>>

  /**
   * @since 5.0.0
   */
  readonly interpolate: <P2 extends Path.ParamsOf<P>>(params: P2) => Path.Interpolate<P, P2>

  /**
   * @since 5.0.0
   */
  readonly concat: <R2 extends ReadonlyArray<Route.Any>>(...right: R2) => Route.ConcatAll<[Route<P, S>, ...R2]>

  /**
   * @since 5.0.0
   */
  readonly optional: () => Route<
    Path.Optional<P>,
    [S] extends [never]
      ? Sch.Schema<
          Types.Simplify<Optional<Sch.Schema.Type<Route.SchemaFromPath<Path.Optional<P>>>>>,
          Types.Simplify<Optional<Sch.Schema.Encoded<Route.SchemaFromPath<Path.Optional<P>>>>>,
          never
        >
      : Sch.Schema<
          Types.Simplify<Optional<Sch.Schema.Type<S>>>,
          Types.Simplify<Optional<Sch.Schema.Encoded<S>>>,
          Sch.Schema.Context<S>
        >
  >

  /**
   * @since 5.0.0
   */
  readonly oneOrMore: () => Route<
    Path.OneOrMore<P>,
    [S] extends [never]
      ? never
      : Sch.Schema<
          readonly [Types.Simplify<Sch.Schema.Type<S>>, ...Array<Types.Simplify<Sch.Schema.Type<S>>>],
          readonly [Types.Simplify<Sch.Schema.Encoded<S>>, ...Array<Types.Simplify<Sch.Schema.Encoded<S>>>],
          Sch.Schema.Context<S>
        >
  >

  /**
   * @since 5.0.0
   */
  readonly zeroOrMore: () => Route<
    Path.ZeroOrMore<P>,
    [S] extends [never]
      ? never
      : Sch.Schema<
          ReadonlyArray<Types.Simplify<Sch.Schema.Type<S>>>,
          ReadonlyArray<Types.Simplify<Sch.Schema.Encoded<S>>>,
          Sch.Schema.Context<S>
        >
  >

  /**
   * @since 5.0.0
   */
  readonly prefix: <P2 extends string>(prefix: P2) => Route<Path.Prefix<P2, P>, S>
}
```

Added in v5.0.0

## Route (namespace)

Added in v5.0.0

### Variance (interface)

**Signature**

```ts
export interface Variance<P extends string, S extends Sch.Schema.All> {
  readonly _P: Types.Covariant<P>
  readonly _S: Types.Covariant<S>
}
```

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any = Route<any, any> | Route<any, never>
```

Added in v1.0.0

### Concat (type alias)

**Signature**

```ts
export type Concat<I extends Route.Any, I2 extends Route.Any> =
  Route<
    Path.PathJoin<[PathWithoutQuery<I>, PathWithoutQuery<I2>, ConcatQuery<Query<I>, Query<I2>>]>,
    ConcatSchemas<Schema<I>, Schema<I2>>
  > extends Route<infer P, infer S>
    ? Route<P, S>
    : never
```

Added in v1.0.0

### ConcatAll (type alias)

**Signature**

```ts
export type ConcatAll<Routes extends ReadonlyArray<any>> = Routes extends readonly [infer Head extends Route.Any]
  ? Head extends Route.Any
    ? Head
    : never
  : Routes extends readonly [infer Head extends Route.Any, ...infer Tail]
    ? Concat<Head, ConcatAll<Tail> extends infer R2 extends Route.Any ? R2 : never> extends infer R extends Route.Any
      ? R
      : never
    : never
```

Added in v1.0.0

### ConcatQuery (type alias)

**Signature**

```ts
export type ConcatQuery<Q1 extends string, Q2 extends string> = [Q1, Q2] extends ["", ""]
  ? ""
  : [Q1] extends [""]
    ? `\\?${RemoveQuestionMark<Q2>}`
    : [Q2] extends [""]
      ? `\\?${RemoveQuestionMark<Q1>}`
      : `\\?${RemoveQuestionMark<Q1>}&${RemoveQuestionMark<Q2>}`
```

Added in v1.0.0

### ConcatSchemas (type alias)

**Signature**

```ts
export type ConcatSchemas<S1 extends Sch.Schema.All, S2 extends Sch.Schema.All> = [S1] extends [never]
  ? S2
  : [S2] extends [never]
    ? S1
    : Sch.Schema<
        MergeSchemaTypes<Sch.Schema.Type<S1>, Sch.Schema.Type<S2>>,
        MergeSchemaTypes<Sch.Schema.Encoded<S1>, Sch.Schema.Encoded<S2>>,
        Sch.Schema.Context<S1> | Sch.Schema.Context<S2>
      >
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<R extends Route.Any> = Sch.Schema.Context<R>
```

Added in v1.0.0

### Encoded (type alias)

**Signature**

```ts
export type Encoded<R extends Route.Any> = Sch.Schema.Encoded<R["schema"]>
```

Added in v1.0.0

### Interpolate (type alias)

**Signature**

```ts
export type Interpolate<R extends Route.Any, P extends Route.Params<R>> = Path.Interpolate<Route.Path<R>, P>
```

Added in v1.0.0

### Params (type alias)

**Signature**

```ts
export type Params<R extends Route.Any> = Path.ParamsOf<Route.Path<R>>
```

Added in v1.0.0

### ParamsAreOptional (type alias)

**Signature**

```ts
export type ParamsAreOptional<R extends Route.Any> = [keyof Params<R>] extends [never]
  ? true
  : KeysAreOptional<Params<R>>
```

Added in v1.0.0

### ParamsList (type alias)

**Signature**

```ts
export type ParamsList<R extends Route.Any> = Path.ParamsList<Route.Path<R>>
```

Added in v1.0.0

### Path (type alias)

**Signature**

```ts
export type Path<T> = [T] extends [never] ? never : T extends Route<infer P, infer _> ? P : never
```

Added in v1.0.0

### PathSchema (type alias)

**Signature**

```ts
export type PathSchema<T> = [T] extends [never]
  ? never
  : T extends Route<infer P, infer S>
    ? PathSchemaFromInput<P, S>
    : never
```

Added in v1.0.0

### PathSchemaFromInput (type alias)

**Signature**

```ts
export type PathSchemaFromInput<P extends string, S extends Sch.Schema.All = never> = [S] extends [never]
  ? PathSchema.ExtractKeys<
      SchemaFromPath<P>,
      PathSchema.GetPathTypeKeys<PathSchema.GetPath<P>>,
      PathSchema.GetPathEncodedKeys<PathSchema.GetPath<P>>
    >
  : PathSchema.ExtractKeys<
      S,
      PathSchema.GetPathTypeKeys<PathSchema.GetPath<P>>,
      PathSchema.GetPathEncodedKeys<PathSchema.GetPath<P>>
    >
```

Added in v1.0.0

### PathWithoutQuery (type alias)

**Signature**

```ts
export type PathWithoutQuery<T> = Path<T> extends `${infer P}\\?${infer _}` ? P : Path<T>
```

Added in v1.0.0

### Query (type alias)

**Signature**

```ts
export type Query<T> =
  Path<T> extends `${string}\\?${infer Q}` ? `\\?${Q}` : Path<T> extends `${string}?${infer Q}` ? `?${Q}` : ""
```

Added in v1.0.0

### QueryParams (type alias)

**Signature**

```ts
export type QueryParams<R extends Route.Any> = Path.QueryParams<Route.Path<R>>
```

Added in v1.0.0

### QuerySchema (type alias)

**Signature**

```ts
export type QuerySchema<T> = [T] extends [never]
  ? never
  : T extends Route<infer P, infer S>
    ? QuerySchemaFromInput<P, S>
    : never
```

Added in v1.0.0

### QuerySchemaFromInput (type alias)

**Signature**

```ts
export type QuerySchemaFromInput<P extends string, S extends Sch.Schema.All = never> = [S] extends [never]
  ? QuerySchema.ExtractKeys<
      SchemaFromPath<QuerySchema.GetQuery<P>>,
      QuerySchema.GetQueryTypeKeys<QuerySchema.GetQuery<P>>,
      QuerySchema.GetQueryEncodedKeys<QuerySchema.GetQuery<P>>
    >
  : QuerySchema.ExtractKeys<
      S,
      QuerySchema.GetQueryTypeKeys<QuerySchema.GetQuery<P>>,
      QuerySchema.GetQueryEncodedKeys<QuerySchema.GetQuery<P>>
    >
```

Added in v1.0.0

### Schema (type alias)

**Signature**

```ts
export type Schema<T> = [T] extends [never] ? never : T extends Route<infer P, infer S> ? SchemaFromInput<P, S> : never
```

Added in v1.0.0

### SchemaFromInput (type alias)

**Signature**

```ts
export type SchemaFromInput<P extends string, S extends Sch.Schema.All = never> = [S] extends [never]
  ? SchemaFromPath<P>
  : S
```

Added in v1.0.0

### SchemaFromPath (type alias)

**Signature**

```ts
export type SchemaFromPath<P extends string> = Sch.Schema<Path.ParamsOf<P>>
```

Added in v1.0.0

### Type (type alias)

**Signature**

```ts
export type Type<R extends Route.Any> = Sch.Schema.Type<R["schema"]>
```

Added in v1.0.0

### UpdatePath (type alias)

**Signature**

```ts
export type UpdatePath<T, P extends string> = T extends Route<infer _, infer S> ? Route<P, S> : never
```

Added in v1.0.0

### UpdateSchema (type alias)

**Signature**

```ts
export type UpdateSchema<T, S extends Sch.Schema.All> = T extends Route<infer P, infer _> ? Route<P, S> : never
```

Added in v1.0.0

### PathSchema (namespace)

Added in v1.0.0

#### ExtractKeys (type alias)

**Signature**

```ts
export type ExtractKeys<S extends Sch.Schema.All, TK extends PropertyKey, EK extends PropertyKey> =
  Sch.Schema<
    Types.Simplify<Pick<Sch.Schema.Type<S>, TK>>,
    Types.Simplify<Pick<Sch.Schema.Encoded<S>, EK>>,
    Sch.Schema.Context<S>
  > extends Sch.Schema<infer A, infer I, infer R>
    ? Sch.Schema<A, I, R>
    : never
```

Added in v1.0.0

#### GetPath (type alias)

**Signature**

```ts
export type GetPath<P extends string> = P extends `${infer R}\\?${infer _}` ? R : P
```

Added in v1.0.0

#### GetPathEncodedKeys (type alias)

**Signature**

```ts
export type GetPathEncodedKeys<P extends string> = keyof Sch.Schema.Encoded<SchemaFromPath<P>>
```

Added in v1.0.0

#### GetPathTypeKeys (type alias)

**Signature**

```ts
export type GetPathTypeKeys<P extends string> = keyof Sch.Schema.Type<SchemaFromPath<P>>
```

Added in v1.0.0

### QuerySchema (namespace)

Added in v1.0.0

#### ExtractKeys (type alias)

**Signature**

```ts
export type ExtractKeys<S extends Sch.Schema.All, TK extends PropertyKey, EK extends PropertyKey> = [
  Sch.Schema<
    Types.Simplify<Pick<Sch.Schema.Type<S>, TK>>,
    Types.Simplify<Pick<Sch.Schema.Encoded<S>, EK>>,
    Sch.Schema.Context<S>
  >
] extends [Sch.Schema<infer A, infer I, infer R>]
  ? Sch.Schema<A, I, R>
  : never
```

Added in v1.0.0

#### GetQuery (type alias)

**Signature**

```ts
export type GetQuery<P extends string> = P extends `${infer _}\\?${infer R}` ? `\\?${R}` : never
```

Added in v1.0.0

#### GetQueryEncodedKeys (type alias)

**Signature**

```ts
export type GetQueryEncodedKeys<P extends string> = keyof Sch.Schema.Encoded<SchemaFromPath<P>>
```

Added in v1.0.0

#### GetQueryTypeKeys (type alias)

**Signature**

```ts
export type GetQueryTypeKeys<P extends string> = keyof Sch.Schema.Type<SchemaFromPath<P>>
```

Added in v1.0.0

## RouteDecodeError (class)

**Signature**

```ts
export declare class RouteDecodeError<R> {
  constructor(props: { readonly route: R; readonly issue: ParseIssue })
}
```

Added in v5.0.0

### toJSON (method)

**Signature**

```ts
toJSON(): unknown
```

Added in v5.0.0

### toString (method)

**Signature**

```ts
toString(): string
```

Added in v5.0.0

## RouteEncodeError (class)

**Signature**

```ts
export declare class RouteEncodeError<R>
```

Added in v5.0.0

### toJSON (method)

**Signature**

```ts
toJSON(): unknown
```

Added in v5.0.0

### toString (method)

**Signature**

```ts
toString()
```

Added in v5.0.0

## RouteFromQueryParamsObject (type alias)

**Signature**

```ts
export type RouteFromQueryParamsObject<O extends Readonly<Record<string, Route.Any>>> =
  Route<QueryParamsFromObject<O>, QueryParamsFromObjectSchema<O>> extends Route<
    infer P,
    Sch.Schema<infer A, infer I, infer R>
  >
    ? Route<P, Sch.Schema<A, I, R>>
    : never
```

Added in v5.0.0

## RouteOptions (interface)

**Signature**

```ts
export interface RouteOptions {
  readonly end: boolean
}
```

Added in v5.0.0

## RouteTypeId

**Signature**

```ts
export declare const RouteTypeId: typeof RouteTypeId
```

Added in v5.0.0

## RouteTypeId (type alias)

**Signature**

```ts
export type RouteTypeId = typeof RouteTypeId
```

Added in v5.0.0

## addTag

**Signature**

```ts
export declare const addTag: {
  <const T extends string>(
    tag: T
  ): <R extends Route.Any>(
    route: R
  ) => Route.UpdateSchema<R, Sch.Schema<Route.Type<R> & { readonly _tag: T }, Route.Encoded<R>, Route.Context<R>>>
  <R extends Route.Any, const T extends string>(
    route: R,
    tag: T
  ): Route.UpdateSchema<R, Sch.Schema<Route.Type<R> & { readonly _tag: T }, Route.Encoded<R>, Route.Context<R>>>
}
```

Added in v5.0.0

## attachPropertySignature

**Signature**

```ts
export declare const attachPropertySignature: {
  <K extends string, V extends symbol | SchemaAST.LiteralValue>(
    key: K,
    value: V
  ): <R extends Route.Any>(
    route: R
  ) => Route.UpdateSchema<R, Sch.Schema<Route.Type<R> & { readonly [_ in K]: V }, Route.Encoded<R>, Route.Context<R>>>
  <R extends Route.Any, K extends string, V extends symbol | SchemaAST.LiteralValue>(
    route: R,
    key: K,
    value: V
  ): Route.UpdateSchema<R, Sch.Schema<Route.Type<R> & { readonly [_ in K]: V }, Route.Encoded<R>, Route.Context<R>>>
}
```

Added in v5.0.0

## base64Url

**Signature**

```ts
export declare const base64Url: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: Uint8Array }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## bigDecimal

**Signature**

```ts
export declare const bigDecimal: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: BigDecimal }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## boolean

**Signature**

```ts
export declare const boolean: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: boolean }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## concat

**Signature**

```ts
export declare const concat: {
  <R extends Route.Any>(right: R): <L extends Route.Any>(left: L) => Route.Concat<L, R>
  <L extends Route.Any, R extends Route.Any>(left: L, right: R): Route.Concat<L, R>
}
```

Added in v5.0.0

## date

**Signature**

```ts
export declare const date: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: Date }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## decode

**Signature**

```ts
export declare const decode: {
  (
    path: string
  ): <R extends Route.Any>(
    route: R
  ) => Effect.Effect<Route.Type<R>, NoSuchElementException | RouteDecodeError<R>, Route.Context<R>>
  <R extends Route.Any>(
    route: R,
    path: string
  ): Effect.Effect<Route.Type<R>, NoSuchElementException | RouteDecodeError<R>, Route.Context<R>>
}
```

Added in v5.0.0

## decode\_

**Signature**

```ts
export declare const decode_: {
  <R extends Route.Any>(
    route: R
  ): (path: string) => Effect.Effect<Route.Type<R>, NoSuchElementException | RouteDecodeError<R>, Route.Context<R>>
  <R extends Route.Any>(
    path: string,
    route: R
  ): Effect.Effect<Route.Type<R>, NoSuchElementException | RouteDecodeError<R>, Route.Context<R>>
}
```

Added in v5.0.0

## encode

**Signature**

```ts
export declare const encode: {
  <R extends Route.Any, O extends Route.Type<R>>(
    params: O
  ): (route: R) => Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>>
  <R extends Route.Any, O extends Route.Type<R>>(
    route: R,
    params: O
  ): Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>>
}
```

Added in v5.0.0

## encode\_

**Signature**

```ts
export declare const encode_: {
  <R extends Route.Any, O extends Route.Type<R>>(
    route: R
  ): (params: O) => Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>>
  <R extends Route.Any, O extends Route.Type<R>>(
    params: O,
    route: R
  ): Effect.Effect<Route.Interpolate<R, Route.Params<R>>, RouteEncodeError<R>, Route.Context<R>>
}
```

Added in v5.0.0

## end

**Signature**

```ts
export declare const end: Route<"/", never>
```

Added in v5.0.0

## getInterpolate

**Signature**

```ts
export declare function getInterpolate<R extends Route.Any>(
  route: R
): <P extends Route.Params<R>>(params: P) => Route.Interpolate<R, P>
```

Added in v5.0.0

## getMatch

**Signature**

```ts
export declare function getMatch<R extends Route.Any>(
  route: R,
  options?: { end?: boolean }
): (path: string) => Option.Option<Route.Params<R>>
```

Added in v5.0.0

## getPath

**Signature**

```ts
export declare const getPath: <R extends Route.Any>(route: R) => Route.Path<R>
```

Added in v5.0.0

## home

**Signature**

```ts
export declare const home: Route<"/", never>
```

Added in v5.0.0

## integer

**Signature**

```ts
export declare const integer: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: number }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## isRoute

**Signature**

```ts
export declare function isRoute(value: unknown): value is Route.Any
```

Added in v5.0.0

## literal

**Signature**

```ts
export declare const literal: <const L extends string>(literal: L, options?: Partial<RouteOptions>) => Route<L>
```

Added in v5.0.0

## make

**Signature**

```ts
export declare const make: <P extends string, S extends Sch.Schema.All>(
  ast: AST.AST,
  options?: Partial<RouteOptions>
) => Route<P, S>
```

Added in v5.0.0

## nanoId

**Signature**

```ts
export declare const nanoId: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: NanoId }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## number

**Signature**

```ts
export declare const number: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: number }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## oneOrMore

**Signature**

```ts
export declare const oneOrMore: <R extends Route<any, never>>(
  route: R
) => Route.UpdatePath<R, Path.OneOrMore<Route.Path<R>>>
```

Added in v5.0.0

## optional

**Signature**

```ts
export declare const optional: <R extends Route<any, never>>(
  route: R
) => Route.UpdatePath<R, Path.Optional<Route.Path<R>>>
```

Added in v5.0.0

## param

**Signature**

```ts
export declare const param: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>>
```

Added in v5.0.0

## paramWithSchema

**Signature**

```ts
export declare const paramWithSchema: {
  <A, R = never>(
    schema: Sch.Schema<A, string, R>,
    options?: Partial<RouteOptions>
  ): <const Name extends string>(
    name: Name
  ) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: A }, { readonly [_ in Name]: string }, R>>
  <const Name extends string, A, R = never>(
    name: Name,
    schema: Sch.Schema<A, string, R>,
    options?: Partial<RouteOptions>
  ): Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: A }, { readonly [_ in Name]: string }, R>>
}
```

Added in v5.0.0

## parse

**Signature**

```ts
export declare const parse: <const P extends string>(path: P, options?: Partial<RouteOptions>) => Route<P>
```

Added in v5.0.0

## prefix

**Signature**

```ts
export declare const prefix: {
  <P extends string>(prefix: P): <R extends Route.Any>(route: R) => Route.UpdatePath<R, Path.Prefix<P, Route.Path<R>>>
  <R extends Route.Any, P extends string>(prefix: P, route: R): Route.UpdatePath<R, `{${P}${Route.Path<R>}}`>
}
```

Added in v5.0.0

## queryParams

**Signature**

```ts
export declare function queryParams<Params extends Readonly<Record<string, Route.Any>>>(
  params: Params
): RouteFromQueryParamsObject<Params>
```

Added in v5.0.0

## sortRoutes

**Signature**

```ts
export declare function sortRoutes<Routes extends ReadonlyArray<Route.Any>>(
  routes: Routes
): Routes extends ReadonlyArray<infer R> ? ReadonlyArray<R> : never
```

Added in v5.0.0

## transform

**Signature**

```ts
export declare const transform: {
  <R extends Route.Any, S extends Sch.Schema.Any>(
    toSchema: S,
    from: (o: Route.Type<R>) => Sch.Schema.Encoded<S>,
    to: (s: Sch.Schema.Encoded<S>) => Route.Type<R>
  ): (route: R) => Route.UpdateSchema<R, Sch.transform<Route.Schema<R>, S>>
  <R extends Route.Any, S extends Sch.Schema.Any>(
    route: R,
    toSchema: S,
    from: (o: Route.Type<R>) => Sch.Schema.Encoded<S>,
    to: (s: Sch.Schema.Encoded<S>) => Route.Type<R>
  ): Route.UpdateSchema<R, Sch.transform<Route.Schema<R>, S>>
}
```

Added in v5.0.0

## transformOrFail

**Signature**

```ts
export declare const transformOrFail: {
  <R extends Route.Any, S extends Sch.Schema.Any, R2>(
    toSchema: S,
    from: (o: Route.Type<R>) => Effect.Effect<Sch.Schema.Encoded<S>, ParseIssue, R2>,
    to: (s: Sch.Schema.Encoded<S>) => Effect.Effect<Route.Type<R>, ParseIssue, R2>
  ): (route: R) => Route.UpdateSchema<R, Sch.transformOrFail<Route.Schema<R>, S, R2>>
  <R extends Route.Any, S extends Sch.Schema.Any, R2>(
    route: R,
    toSchema: S,
    from: (o: Route.Type<R>) => Effect.Effect<Sch.Schema.Encoded<S>, ParseIssue, R2>,
    to: (s: Sch.Schema.Encoded<S>) => Effect.Effect<Route.Type<R>, ParseIssue, R2>
  ): Route.UpdateSchema<R, Sch.transformOrFail<Route.Schema<R>, S, R2>>
}
```

Added in v5.0.0

## ulid

**Signature**

```ts
export declare const ulid: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: string }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## unnamed

**Signature**

```ts
export declare const unnamed: Route<"(.*)", never>
```

Added in v5.0.0

## updateSchema

**Signature**

```ts
export declare const updateSchema: {
  <R extends Route.Any, S extends Sch.Schema.Any>(f: (s: Route.Schema<R>) => S): (route: R) => Route.UpdateSchema<R, S>
  <R extends Route.Any, S extends Sch.Schema.Any>(route: R, f: (s: Route.Schema<R>) => S): Route.UpdateSchema<R, S>
}
```

Added in v5.0.0

## uuid

**Signature**

```ts
export declare const uuid: <const Name extends string>(
  name: Name,
  options?: Partial<RouteOptions>
) => Route<Path.Param<Name>, Sch.Schema<{ readonly [_ in Name]: Uuid }, { readonly [_ in Name]: string }, never>>
```

Added in v5.0.0

## withSchema

**Signature**

```ts
export declare const withSchema: {
  <R extends Route.Any, S extends Sch.Schema<any, Path.ParamsOf<Route.Path<R>>, any>>(
    schema: S
  ): (route: R) => Route.UpdateSchema<R, S>
  <R extends Route.Any, S extends Sch.Schema<any, Path.ParamsOf<Route.Path<R>>, any>>(
    route: R,
    schema: S
  ): Route.UpdateSchema<R, S>
}
```

Added in v5.0.0

## zeroOrMore

**Signature**

```ts
export declare const zeroOrMore: <R extends Route<any, never>>(
  route: R
) => Route.UpdatePath<R, Path.ZeroOrMore<Route.Path<R>>>
```

Added in v5.0.0
