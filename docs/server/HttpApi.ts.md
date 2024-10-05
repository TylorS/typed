---
title: HttpApi.ts
nav_order: 3
parent: "@typed/server"
---

## HttpApi overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [annotations](#annotations)
  - [annotate](#annotate)
  - [annotateMerge](#annotatemerge)
- [constructors](#constructors)
  - [addGroup](#addgroup)
  - [empty](#empty)
- [errors](#errors)
  - [addError](#adderror)
- [guards](#guards)
  - [isHttpApi](#ishttpapi)
- [models](#models)
  - [HttpApi (type alias)](#httpapi-type-alias)
- [reflection](#reflection)
  - [reflect](#reflect)
- [type ids](#type-ids)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)
- [utils](#utils)
  - [HttpApi](#httpapi)
  - [HttpApi (namespace)](#httpapi-namespace)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Service (type alias)](#service-type-alias)

---

# annotations

## annotate

**Signature**

```ts
export declare const annotate: {
  <I, S>(tag: Context.Tag<I, S>, value: S): <A extends HttpApi.Any>(self: A) => A
  <A extends HttpApi.Any, I, S>(self: A, tag: Context.Tag<I, S>, value: S): A
}
```

Added in v1.0.0

## annotateMerge

**Signature**

```ts
export declare const annotateMerge: {
  <I>(context: Context.Context<I>): <A extends HttpApi.Any>(self: A) => A
  <A extends HttpApi.Any, I>(self: A, context: Context.Context<I>): A
}
```

Added in v1.0.0

# constructors

## addGroup

Add a `HttpApiGroup` to an `HttpApi`.

**Signature**

```ts
export declare const addGroup: {
  <Group extends HttpApiGroup.HttpApiGroup.Any>(
    group: Group
  ): <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
    self: HttpApi<Groups, Error, ErrorR>
  ) => HttpApi<Groups | Group, Error, ErrorR>
  <Group extends HttpApiGroup.HttpApiGroup.Any, Prefix extends MatchInput.Any>(
    prefix: Prefix,
    group: Group
  ): <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
    self: HttpApi<Groups, Error, ErrorR>
  ) => HttpApi<Groups | Group, Error, ErrorR>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, Group extends HttpApiGroup.HttpApiGroup.Any>(
    self: HttpApi<Groups, Error, ErrorR>,
    group: Group
  ): HttpApi<Groups | Group, Error, ErrorR>
  <
    Groups extends HttpApiGroup.HttpApiGroup.Any,
    Error,
    ErrorR,
    Group extends HttpApiGroup.HttpApiGroup.Any,
    Prefix extends MatchInput.Any
  >(
    self: HttpApi<Groups, Error, ErrorR>,
    prefix: Prefix,
    group: Group
  ): HttpApi<Groups | Group, Error, ErrorR>
}
```

Added in v1.0.0

## empty

An empty `HttpApi`. You can use this to start building your `HttpApi`.

You can add groups to this `HttpApi` using the `addGroup` function.

**Signature**

```ts
export declare const empty: HttpApi<never, never, never>
```

Added in v1.0.0

# errors

## addError

Add an error schema to an `HttpApi`, which is shared by all endpoints in the
`HttpApi`.

Useful for adding error types from middleware or other shared error types.

**Signature**

```ts
export declare const addError: {
  <A, I, R>(
    schema: Schema.Schema<A, I, R>,
    annotations?: { readonly status?: number | undefined }
  ): <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
    self: HttpApi<Groups, Error, ErrorR>
  ) => HttpApi<Groups, Error | A, ErrorR | R>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, A, I, R>(
    self: HttpApi<Groups, Error, ErrorR>,
    schema: Schema.Schema<A, I, R>,
    annotations?: { readonly status?: number | undefined }
  ): HttpApi<Groups, Error | A, ErrorR | R>
}
```

Added in v1.0.0

# guards

## isHttpApi

**Signature**

```ts
export declare const isHttpApi: (u: unknown) => u is HttpApi<any, any>
```

Added in v1.0.0

# models

## HttpApi (type alias)

An `HttpApi` represents a collection of `HttpApiGroup`s. You can use an `HttpApi` to
represent your entire domain.

**Signature**

```ts
export type HttpApi<
  out Groups extends HttpApiGroup.HttpApiGroup.Any = never,
  in out Error = never,
  out ErrorR = never
> = PlatformHttpApi.HttpApi<Groups, Error, ErrorR>
```

Added in v1.0.0

# reflection

## reflect

Extract metadata from an `HttpApi`, which can be used to generate documentation
or other tooling.

See the `OpenApi` & `HttpApiClient` modules for examples of how to use this function.

**Signature**

```ts
export declare const reflect: <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
  self: HttpApi<Groups, Error, ErrorR>,
  options: {
    readonly onGroup: (options: {
      readonly group: HttpApiGroup.HttpApiGroup<string, any>
      readonly mergedAnnotations: Context.Context<never>
    }) => void
    readonly onEndpoint: (options: {
      readonly group: HttpApiGroup.HttpApiGroup<string, any>
      readonly endpoint: HttpApiEndpoint.HttpApiEndpoint<string, HttpMethod, MatchInput.Any>
      readonly mergedAnnotations: Context.Context<never>
      readonly successAST: Option.Option<AST.AST>
      readonly successStatus: number
      readonly successEncoding: HttpApiSchema.Encoding
      readonly errors: ReadonlyMap<number, Option.Option<AST.AST>>
    }) => void
  }
) => void
```

Added in v1.0.0

# type ids

## TypeId

**Signature**

```ts
export declare const TypeId: typeof TypeId
```

Added in v1.0.0

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

Added in v1.0.0

# utils

## HttpApi

**Signature**

```ts
export declare const HttpApi: Context.Tag<PlatformHttpApi.HttpApi.Service, PlatformHttpApi.HttpApi.Any>
```

Added in v1.0.0

## HttpApi (namespace)

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any = PlatformHttpApi.HttpApi.Any
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<A> = PlatformHttpApi.HttpApi.Context<A>
```

Added in v1.0.0

### Service (type alias)

**Signature**

```ts
export type Service = PlatformHttpApi.HttpApi.Service
```

Added in v1.0.0
