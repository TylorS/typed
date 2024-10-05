---
title: HttpApiGroup.ts
nav_order: 8
parent: "@typed/server"
---

## HttpApiGroup overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [annotations](#annotations)
  - [annotate](#annotate)
  - [annotateEndpoints](#annotateendpoints)
  - [annotateEndpointsMerge](#annotateendpointsmerge)
  - [annotateMerge](#annotatemerge)
- [constructors](#constructors)
  - [make](#make)
- [endpoints](#endpoints)
  - [add](#add)
  - [prefix](#prefix)
- [errors](#errors)
  - [addError](#adderror)
- [guards](#guards)
  - [isHttpApiGroup](#ishttpapigroup)
- [models](#models)
  - [HttpApiGroup (type alias)](#httpapigroup-type-alias)
  - [HttpApiGroup (namespace)](#httpapigroup-namespace)
    - [Service (interface)](#service-interface)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [ContextWithName (type alias)](#contextwithname-type-alias)
    - [Endpoints (type alias)](#endpoints-type-alias)
    - [EndpointsWithName (type alias)](#endpointswithname-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [ErrorWithName (type alias)](#errorwithname-type-alias)
    - [ToService (type alias)](#toservice-type-alias)
    - [WithName (type alias)](#withname-type-alias)

---

# annotations

## annotate

Add an annotation to an `HttpApiGroup`.

**Signature**

```ts
export declare const annotate: {
  <I, S>(tag: Context.Tag<I, S>, value: S): <A extends HttpApiGroup.Any>(self: A) => A
  <A extends HttpApiGroup.Any, I, S>(self: A, tag: Context.Tag<I, S>, value: S): A
}
```

Added in v1.0.0

## annotateEndpoints

For each endpoint in an `HttpApiGroup`, add an annotation.

Note that this will only add the annotation to the endpoints before this api
is called.

**Signature**

```ts
export declare const annotateEndpoints: {
  <I, S>(tag: Context.Tag<I, S>, value: S): <A extends HttpApiGroup.Any>(self: A) => A
  <A extends HttpApiGroup.Any, I, S>(self: A, tag: Context.Tag<I, S>, value: S): A
}
```

Added in v1.0.0

## annotateEndpointsMerge

For each endpoint in an `HttpApiGroup`, update the annotations with a new
context.

Note that this will only update the annotations before this api is called.

**Signature**

```ts
export declare const annotateEndpointsMerge: {
  <I>(context: Context.Context<I>): <A extends HttpApiGroup.Any>(self: A) => A
  <A extends HttpApiGroup.Any, I>(self: A, context: Context.Context<I>): A
}
```

Added in v1.0.0

## annotateMerge

Merge the annotations of an `HttpApiGroup` with a new context.

**Signature**

```ts
export declare const annotateMerge: {
  <I>(context: Context.Context<I>): <A extends HttpApiGroup.Any>(self: A) => A
  <A extends HttpApiGroup.Any, I>(self: A, context: Context.Context<I>): A
}
```

Added in v1.0.0

# constructors

## make

An `HttpApiGroup` is a collection of `HttpApiEndpoint`s. You can use an `HttpApiGroup` to
represent a portion of your domain.

The endpoints can be implemented later using the `HttpApiBuilder.group` api.

**Signature**

```ts
export declare const make: <Name extends string>(identifier: Name) => HttpApiGroup<Name>
```

Added in v1.0.0

# endpoints

## add

Add an `HttpApiEndpoint` to an `HttpApiGroup`.

**Signature**

```ts
export declare const add: {
  <A extends HttpApiEndpoint.HttpApiEndpoint.Any>(
    endpoint: A
  ): <Name extends string, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, Error, ErrorR>(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>
  ) => HttpApiGroup<Name, Endpoints | A, Error, ErrorR>
  <
    Name extends string,
    Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any,
    Error,
    ErrorR,
    A extends HttpApiEndpoint.HttpApiEndpoint.Any
  >(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>,
    endpoint: A
  ): HttpApiGroup<Name, Endpoints | A, Error, ErrorR>
}
```

Added in v1.0.0

## prefix

Add a path prefix to all endpoints in an `HttpApiGroup`. Note that this will only
add the prefix to the endpoints before this api is called.

**Signature**

```ts
export declare const prefix: {
  <Prefix extends Router.MatchInput.Any>(
    prefix: Prefix
  ): <Name extends string, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, Error, ErrorR>(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>
  ) => HttpApiGroup<Name, HttpApiEndpoint.HttpApiEndpoint.WithPrefix<Prefix, Endpoints>, Error, ErrorR>
  <
    Name extends string,
    Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any,
    Error,
    ErrorR,
    Prefix extends Router.MatchInput.Any
  >(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>,
    prefix: Prefix
  ): HttpApiGroup<Name, HttpApiEndpoint.HttpApiEndpoint.WithPrefix<Prefix, Endpoints>, Error, ErrorR>
}
```

Added in v1.0.0

# errors

## addError

Add an error schema to an `HttpApiGroup`, which is shared by all endpoints in the
group.

**Signature**

```ts
export declare const addError: {
  <A, I, R>(
    schema: Schema.Schema<A, I, R>,
    annotations?: { readonly status?: number | undefined }
  ): <Name extends string, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, Error, ErrorR>(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>
  ) => HttpApiGroup<Name, Endpoints, Error | A, ErrorR | R>
  <Name extends string, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, Error, ErrorR, A, I, R>(
    self: HttpApiGroup<Name, Endpoints, Error, ErrorR>,
    schema: Schema.Schema<A, I, R>,
    annotations?: { readonly status?: number | undefined }
  ): HttpApiGroup<Name, Endpoints, Error | A, ErrorR | R>
}
```

Added in v1.0.0

# guards

## isHttpApiGroup

**Signature**

```ts
export declare const isHttpApiGroup: (u: unknown) => u is HttpApiGroup.Any
```

Added in v1.0.0

# models

## HttpApiGroup (type alias)

An `HttpApiGroup` is a collection of `HttpApiEndpoint`s. You can use an `HttpApiGroup` to
represent a portion of your domain.

The endpoints can be implemented later using the `HttpApiBuilder.group` api.

**Signature**

```ts
export type HttpApiGroup<
  Name extends string,
  Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any = never,
  Error = HttpApiDecodeError,
  ErrorR = never
> = PlatformHttpApiGroup.HttpApiGroup<Name, Endpoints, Error, ErrorR>
```

Added in v1.0.0

## HttpApiGroup (namespace)

Added in v1.0.0

### Service (interface)

**Signature**

```ts
export interface Service<Name extends string> {
  readonly _: unique symbol
  readonly name: Name
}
```

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any =
  | HttpApiGroup<any, any, any, any>
  | HttpApiGroup<any, any, any, never>
  | HttpApiGroup<any, any, never, never>
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<Group> =
  Group extends HttpApiGroup<infer _Name, infer _Endpoints, infer _Error, infer _ErrorR>
    ? _ErrorR | HttpApiEndpoint.HttpApiEndpoint.Context<_Endpoints>
    : never
```

Added in v1.0.0

### ContextWithName (type alias)

**Signature**

```ts
export type ContextWithName<Group extends Any, Name extends string> = Context<WithName<Group, Name>>
```

Added in v1.0.0

### Endpoints (type alias)

**Signature**

```ts
export type Endpoints<Group> =
  Group extends HttpApiGroup<infer _Name, infer _Endpoints, infer _Error, infer _ErrorR> ? _Endpoints : never
```

Added in v1.0.0

### EndpointsWithName (type alias)

**Signature**

```ts
export type EndpointsWithName<Group extends Any, Name extends string> = Endpoints<WithName<Group, Name>>
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<Group> =
  Group extends HttpApiGroup<infer _Name, infer _Endpoints, infer _Error, infer _ErrorR> ? _Error : never
```

Added in v1.0.0

### ErrorWithName (type alias)

**Signature**

```ts
export type ErrorWithName<Group extends Any, Name extends string> = Error<WithName<Group, Name>>
```

Added in v1.0.0

### ToService (type alias)

**Signature**

```ts
export type ToService<Group> =
  Group extends HttpApiGroup<infer Name, infer _Endpoints, infer _Error, infer _ErrorR> ? Service<Name> : never
```

Added in v1.0.0

### WithName (type alias)

**Signature**

```ts
export type WithName<Group, Name extends string> = Extract<Group, { readonly identifier: Name }>
```

Added in v1.0.0
