---
title: HttpApiEndpoint.ts
nav_order: 6
parent: "@typed/server"
---

## HttpApiEndpoint overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [annotations](#annotations)
  - [annotate](#annotate)
  - [annotateMerge](#annotatemerge)
- [models](#models)
  - [HttpApiEndpoint (interface)](#httpapiendpoint-interface)
- [reflection](#reflection)
  - [schemaSuccess](#schemasuccess)
- [request](#request)
  - [prefix](#prefix)
  - [setHeaders](#setheaders)
  - [setPayload](#setpayload)
- [result](#result)
  - [setSuccess](#setsuccess)
- [utils](#utils)
  - [HttpApiEndpoint (namespace)](#httpapiendpoint-namespace)
    - [Any (interface)](#any-interface)
    - [Builder (type alias)](#builder-type-alias)
    - [ClientRequest (type alias)](#clientrequest-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [ErrorWithName (type alias)](#errorwithname-type-alias)
    - [ExcludeName (type alias)](#excludename-type-alias)
    - [ExcludeProvided (type alias)](#excludeprovided-type-alias)
    - [Handler (type alias)](#handler-type-alias)
    - [HandlerRedacted (type alias)](#handlerredacted-type-alias)
    - [HandlerResponse (type alias)](#handlerresponse-type-alias)
    - [HandlerResponseWithName (type alias)](#handlerresponsewithname-type-alias)
    - [HandlerWithName (type alias)](#handlerwithname-type-alias)
    - [Headers (type alias)](#headers-type-alias)
    - [PathParsed (type alias)](#pathparsed-type-alias)
    - [Payload (type alias)](#payload-type-alias)
    - [Provided (type alias)](#provided-type-alias)
    - [Request (type alias)](#request-type-alias)
    - [Success (type alias)](#success-type-alias)
    - [WithPrefix (type alias)](#withprefix-type-alias)
  - [addError](#adderror)
  - [del](#del)
  - [get](#get)
  - [handle](#handle)
  - [head](#head)
  - [isTypedHttpApiEndpoint](#istypedhttpapiendpoint)
  - [make](#make)
  - [options](#options)
  - [patch](#patch)
  - [post](#post)
  - [put](#put)

---

# annotations

## annotate

Add an annotation to the endpoint.

**Signature**

```ts
export declare const annotate: {
  <I, S>(tag: Context.Tag<I, S>, value: S): <A extends HttpApiEndpoint.Any>(self: A) => A
  <A extends HttpApiEndpoint.Any, I, S>(self: A, tag: Context.Tag<I, S>, value: S): A
}
```

Added in v1.0.0

## annotateMerge

Merge the annotations of the endpoint with the provided context.

**Signature**

```ts
export declare const annotateMerge: {
  <I>(context: Context.Context<I>): <A extends HttpApiEndpoint.Any>(self: A) => A
  <A extends HttpApiEndpoint.Any, I>(self: A, context: Context.Context<I>): A
}
```

Added in v1.0.0

# models

## HttpApiEndpoint (interface)

**Signature**

```ts
export interface HttpApiEndpoint<
  Name extends string,
  Method extends HttpMethod,
  Route extends MatchInput.MatchInput.Any,
  Payload = never,
  Headers = never,
  Success = void,
  Error = never,
  R = never
> extends PlatformHttpApiEndpoint.HttpApiEndpoint<
    Name,
    Method,
    Schema.Schema.Type<MatchInput.MatchInput.Schema<Route>>,
    Payload,
    Headers,
    Success,
    Error,
    Exclude<R, CurrentParams<Route>>
  > {
  readonly route: Route
}
```

Added in v1.0.0

# reflection

## schemaSuccess

**Signature**

```ts
export declare const schemaSuccess: <A extends HttpApiEndpoint.Any>(
  self: A
) => Option.Option<
  Schema.Schema<PlatformHttpApiEndpoint.HttpApiEndpoint.Success<A>, unknown, HttpApiEndpoint.Context<A>>
>
```

Added in v1.0.0

# request

## prefix

Add a prefix to the path of the endpoint.

**Signature**

```ts
export declare const prefix: {
  <Prefix extends MatchInput.MatchInput.Any>(
    prefix: Prefix
  ): <A extends HttpApiEndpoint.Any>(self: A) => HttpApiEndpoint.WithPrefix<Prefix, A>
  <A extends HttpApiEndpoint.Any, Prefix extends MatchInput.MatchInput.Any>(
    self: A,
    prefix: Prefix
  ): HttpApiEndpoint.WithPrefix<Prefix, A>
}
```

Added in v1.0.0

## setHeaders

Set the schema for the headers of the endpoint. The schema will be
used to validate the headers before the handler is called.

**Signature**

```ts
export declare const setHeaders: {
  <Method extends HttpMethod, H extends Schema.Schema.Any>(
    schema: H & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidateHeaders<H>
  ): <Name extends string, _Route extends MatchInput.MatchInput.Any, _P, _H, _S, _E, _R>(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>
  ) => HttpApiEndpoint<Name, Method, _Route, _P, Schema.Schema.Type<H>, _S, _E, _R | Schema.Schema.Context<H>>
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    H extends Schema.Schema.Any
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: H & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidateHeaders<H>
  ): HttpApiEndpoint<Name, Method, _Route, _P, Schema.Schema.Type<H>, _S, _E, _R | Schema.Schema.Context<H>>
}
```

Added in v1.0.0

## setPayload

Set the schema for the request body of the endpoint. The schema will be
used to validate the request body before the handler is called.

For endpoints with no request body, the payload will use the url search
parameters.

You can set a multipart schema to handle file uploads by using the
`HttpApiSchema.Multipart` combinator.

**Signature**

```ts
export declare const setPayload: {
  <Method extends HttpMethod, P extends Schema.Schema.All>(
    schema: P & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidatePayload<Method, P>
  ): <Name extends string, _Route extends MatchInput.MatchInput.Any, _P, _H, _S, _E, _R>(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>
  ) => HttpApiEndpoint<Name, Method, _Route, Schema.Schema.Type<P>, _H, _S, _E, _R | Schema.Schema.Context<P>>
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    P extends Schema.Schema.All
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: P & PlatformHttpApiEndpoint.HttpApiEndpoint.ValidatePayload<Method, P>
  ): HttpApiEndpoint<Name, Method, _Route, Schema.Schema.Type<P>, _H, _S, _E, _R | Schema.Schema.Context<P>>
}
```

Added in v1.0.0

# result

## setSuccess

Set the schema for the success response of the endpoint. The status code
will be inferred from the schema, otherwise it will default to 200.

**Signature**

```ts
export declare const setSuccess: {
  <S extends Schema.Schema.Any>(
    schema: S,
    annotations?: { readonly status?: number | undefined }
  ): <Name extends string, Method extends HttpMethod, _Route extends MatchInput.MatchInput.Any, _P, _H, _S, _E, _R>(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>
  ) => HttpApiEndpoint<Name, Method, _Route, _P, _H, Schema.Schema.Type<S>, _E, _R | Schema.Schema.Context<S>>
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    S extends Schema.Schema.Any
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: S,
    annotations?: { readonly status?: number | undefined }
  ): HttpApiEndpoint<Name, Method, _Route, _P, _H, Schema.Schema.Type<S>, _E, _R | Schema.Schema.Context<S>>
}
```

Added in v1.0.0

# utils

## HttpApiEndpoint (namespace)

Added in v1.0.0

### Any (interface)

**Signature**

```ts
export interface Any extends PlatformHttpApiEndpoint.HttpApiEndpoint.All {
  readonly route: MatchInput.MatchInput.Any
}
```

Added in v1.0.0

### Builder (type alias)

**Signature**

```ts
export type Builder<Endpoint extends Any, E, R> = {
  readonly endpoint: Endpoint
  readonly handler: Handler<Endpoint, E, R>
}
```

Added in v1.0.0

### ClientRequest (type alias)

**Signature**

```ts
export type ClientRequest<Path, Payload, Headers> = PlatformHttpApiEndpoint.HttpApiEndpoint.ClientRequest<
  Path,
  Payload,
  Headers
>
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<Endpoint extends Any> =
  | PlatformHttpApiEndpoint.HttpApiEndpoint.Context<Endpoint>
  | MatchInput.MatchInput.Context<Endpoint["route"]>
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<Endpoint extends Any> =
  | PlatformHttpApiEndpoint.HttpApiEndpoint.Error<Endpoint>
  | MatchInput.MatchInput.Error<Endpoint["route"]>
```

Added in v1.0.0

### ErrorWithName (type alias)

**Signature**

```ts
export type ErrorWithName<
  Endpoints extends Any,
  Name extends Endpoints["name"]
> = PlatformHttpApiEndpoint.HttpApiEndpoint.ErrorWithName<Endpoints, Name>
```

Added in v1.0.0

### ExcludeName (type alias)

**Signature**

```ts
export type ExcludeName<
  Endpoints extends Any,
  Name extends Endpoints["name"]
> = PlatformHttpApiEndpoint.HttpApiEndpoint.ExcludeName<Endpoints, Name>
```

Added in v1.0.0

### ExcludeProvided (type alias)

**Signature**

```ts
export type ExcludeProvided<R> = HttpRouter.ExcludeProvided<R>
```

Added in v1.0.0

### Handler (type alias)

**Signature**

```ts
export type Handler<Endpoint extends Any, E, R> = (
  request: Types.Simplify<Request<Endpoint>>
) => Effect.Effect<Success<Endpoint>, E, R>
```

Added in v1.0.0

### HandlerRedacted (type alias)

**Signature**

```ts
export type HandlerRedacted<Endpoint extends Any, E, R> = PlatformHttpApiEndpoint.HttpApiEndpoint.HandlerRedacted<
  Endpoint,
  E,
  R
>
```

Added in v1.0.0

### HandlerResponse (type alias)

**Signature**

```ts
export type HandlerResponse<Endpoint extends Any, E, R> = PlatformHttpApiEndpoint.HttpApiEndpoint.HandlerResponse<
  Endpoint,
  E,
  R
>
```

Added in v1.0.0

### HandlerResponseWithName (type alias)

**Signature**

```ts
export type HandlerResponseWithName<
  Endpoint extends Any,
  Name extends Endpoint["name"],
  E,
  R
> = PlatformHttpApiEndpoint.HttpApiEndpoint.HandlerResponseWithName<Endpoint, Name, E, R>
```

Added in v1.0.0

### HandlerWithName (type alias)

**Signature**

```ts
export type HandlerWithName<
  Endpoints extends Any,
  Name extends Endpoints["name"],
  E,
  R
> = PlatformHttpApiEndpoint.HttpApiEndpoint.HandlerWithName<Endpoints, Name, E, R>
```

Added in v1.0.0

### Headers (type alias)

**Signature**

```ts
export type Headers<Endpoint extends Any> = PlatformHttpApiEndpoint.HttpApiEndpoint.Headers<Endpoint>
```

Added in v1.0.0

### PathParsed (type alias)

**Signature**

```ts
export type PathParsed<Endpoint extends Any> = PlatformHttpApiEndpoint.HttpApiEndpoint.PathParsed<Endpoint>
```

Added in v1.0.0

### Payload (type alias)

**Signature**

```ts
export type Payload<Endpoint extends Any> = PlatformHttpApiEndpoint.HttpApiEndpoint.Payload<Endpoint>
```

Added in v1.0.0

### Provided (type alias)

**Signature**

```ts
export type Provided = HttpRouter.Provided
```

Added in v1.0.0

### Request (type alias)

**Signature**

```ts
export type Request<Endpoint extends Any> = {
  readonly path: MatchInput.MatchInput.Success<Endpoint["route"]>
} & ([Payload<Endpoint>] extends [infer P] ? ([P] extends [never] ? {} : { readonly payload: P }) : {}) &
  ([Headers<Endpoint>] extends [infer H] ? ([H] extends [never] ? {} : { readonly headers: H }) : {})
```

Added in v1.0.0

### Success (type alias)

**Signature**

```ts
export type Success<Endpoint extends Any> = PlatformHttpApiEndpoint.HttpApiEndpoint.Success<Endpoint>
```

Added in v1.0.0

### WithPrefix (type alias)

**Signature**

```ts
export type WithPrefix<Prefix extends MatchInput.MatchInput.Any, Endpoint extends Any> =
  Endpoint extends HttpApiEndpoint<
    infer Name,
    infer Method,
    infer Route,
    infer Headers,
    infer Payload,
    infer Success,
    infer Error,
    infer Context
  >
    ? HttpApiEndpoint<
        Name,
        Method,
        MatchInput.MatchInput.Concat<Prefix, Route>,
        Headers,
        Payload,
        Success,
        Error,
        Context
      >
    : never
```

Added in v1.0.0

## addError

**Signature**

```ts
export declare const addError: {
  <E extends Schema.Schema.All>(
    schema: E,
    annotations?: { readonly status?: number | undefined }
  ): <Name extends string, Method extends HttpMethod, _Route extends MatchInput.MatchInput.Any, _P, _H, _S, _E, _R>(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>
  ) => HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E | Schema.Schema.Type<E>, _R | Schema.Schema.Context<E>>
  <
    Name extends string,
    Method extends HttpMethod,
    _Route extends MatchInput.MatchInput.Any,
    _P,
    _H,
    _S,
    _E,
    _R,
    E extends Schema.Schema.All
  >(
    self: HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E, _R>,
    schema: E,
    annotations?: { readonly status?: number | undefined }
  ): HttpApiEndpoint<Name, Method, _Route, _P, _H, _S, _E | Schema.Schema.Type<E>, _R | Schema.Schema.Context<E>>
}
```

Added in v1.0.0

## del

**Signature**

```ts
export declare const del: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "DELETE", R>
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "GET", R>
```

Added in v1.0.0

## handle

**Signature**

```ts
export declare const handle: {
  <Endpoint extends HttpApiEndpoint.Any, E2, R2>(
    handler: HttpApiEndpoint.Handler<Endpoint, E2, R2>
  ): (
    endpoint: Endpoint
  ) => <E, R, Endpoints extends HttpApiEndpoint.Any>(
    handlers: HttpApiHandlers.HttpApiHandlers<E, R, Endpoints>
  ) => HttpApiHandlers.HttpApiHandlers<E | E2, R | R2, HttpApiEndpoint.ExcludeName<Endpoints, Endpoint["name"]>>
  <Endpoint extends HttpApiEndpoint.Any, E2, R2>(
    endpoint: Endpoint,
    handler: HttpApiEndpoint.Handler<Endpoint, E2, R2>
  ): <E, R, Endpoints extends HttpApiEndpoint.Any>(
    handlers: HttpApiHandlers.HttpApiHandlers<E, R, Endpoints>
  ) => HttpApiHandlers.HttpApiHandlers<E | E2, R | R2, HttpApiEndpoint.ExcludeName<Endpoints, Endpoint["name"]>>
}
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "HEAD", R>
```

Added in v1.0.0

## isTypedHttpApiEndpoint

**Signature**

```ts
export declare const isTypedHttpApiEndpoint: (u: any) => u is HttpApiEndpoint.Any
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: <Method extends HttpMethod>(
  method: Method
) => <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  input: R
) => HttpApiEndpoint<Name, Method, R>
```

Added in v1.0.0

## options

**Signature**

```ts
export declare const options: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "OPTIONS", R>
```

Added in v1.0.0

## patch

**Signature**

```ts
export declare const patch: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "PATCH", R>
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "POST", R>
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: <const Name extends string, R extends MatchInput.MatchInput.Any>(
  name: Name,
  route: R
) => HttpApiEndpoint<Name, "PUT", R>
```

Added in v1.0.0
