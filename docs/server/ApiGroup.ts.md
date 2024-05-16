---
title: ApiGroup.ts
nav_order: 3
parent: "@typed/server"
---

## ApiGroup overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ApiGroup](#apigroup)
  - [Options](#options)
  - [addEndpoint](#addendpoint)
  - [addResponse](#addresponse)
  - [delete](#delete)
  - [endpoint](#endpoint)
  - [get](#get)
  - [make](#make)
  - [patch](#patch)
  - [post](#post)
  - [put](#put)
  - [setRequest](#setrequest)
  - [setRequestBody](#setrequestbody)
  - [setRequestHeaders](#setrequestheaders)
  - [setRequestPath](#setrequestpath)
  - [setRequestQuery](#setrequestquery)
  - [setResponse](#setresponse)
  - [setResponseBody](#setresponsebody)
  - [setResponseHeaders](#setresponseheaders)
  - [setResponseRepresentations](#setresponserepresentations)
  - [setResponseStatus](#setresponsestatus)
  - [setSecurity](#setsecurity)

---

# utils

## ApiGroup

**Signature**

```ts
export declare const ApiGroup: any
```

Added in v1.0.0

## Options

**Signature**

```ts
export declare const Options: any
```

Added in v1.0.0

## addEndpoint

**Signature**

```ts
export declare const addEndpoint: <E2 extends ApiEndpoint.Any>(
  endpoint: E2
) => <E1 extends ApiEndpoint.Any>(api: ApiGroup<E1>) => ApiGroup<E2 | E1>
```

Added in v1.0.0

## addResponse

**Signature**

```ts
export declare const addResponse: <Status extends number, Body = Ignored, Headers = Ignored, R = never>(
  response:
    | ApiResponse<Status, Body, Headers, R>
    | { readonly status: Status; readonly body?: Schema<Body, any, R>; readonly headers?: Schema<Headers, any, R> }
) => <
  Id extends string,
  Request extends ApiRequest.Any,
  Response1 extends ApiResponse.Any,
  Security extends Security.Any
>(
  endpoint: ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint<Id, Request, ApiResponse<Status, Body, Headers, R> | Response1, Security>
```

Added in v1.0.0

## delete

**Signature**

```ts
export declare const delete: <Id, I, O>(id: Id, route: I, options: O) => ApiEndpoint<Id, ApiRequest<Ignored, MatchInput.HasPathParams<I> extends true ? Schema.Type<Route.PathSchema<MatchInput.Route<I>>> : Ignored, MatchInput.HasQueryParams<I> extends true ? Schema.Type<Route.QuerySchema<MatchInput.Route<I>>> : Ignored, Ignored, MatchInput.Context<I>>, ApiResponse.Default, Security<void, never, never>>
```

Added in v1.0.0

## endpoint

**Signature**

```ts
export declare const endpoint: typeof make
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: <const Id extends string, I extends MatchInput.Any, O extends Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint<
  Id,
  ApiRequest<
    Ignored,
    MatchInput.HasPathParams<I> extends true ? Schema.Type<Route.PathSchema<MatchInput.Route<I>>> : Ignored,
    MatchInput.HasQueryParams<I> extends true ? Schema.Type<Route.QuerySchema<MatchInput.Route<I>>> : Ignored,
    Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.Default,
  Security<void, never, never>
>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare const make: (name: string, options?: Partial<Options> | undefined) => ApiGroup.Empty
```

Added in v1.0.0

## patch

**Signature**

```ts
export declare const patch: <const Id extends string, I extends MatchInput.Any, O extends Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint<
  Id,
  ApiRequest<
    Ignored,
    MatchInput.HasPathParams<I> extends true ? Schema.Type<Route.PathSchema<MatchInput.Route<I>>> : Ignored,
    MatchInput.HasQueryParams<I> extends true ? Schema.Type<Route.QuerySchema<MatchInput.Route<I>>> : Ignored,
    Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.Default,
  Security<void, never, never>
>
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: <const Id extends string, I extends MatchInput.Any, O extends Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint<
  Id,
  ApiRequest<
    Ignored,
    MatchInput.HasPathParams<I> extends true ? Schema.Type<Route.PathSchema<MatchInput.Route<I>>> : Ignored,
    MatchInput.HasQueryParams<I> extends true ? Schema.Type<Route.QuerySchema<MatchInput.Route<I>>> : Ignored,
    Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.Default,
  Security<void, never, never>
>
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: <const Id extends string, I extends MatchInput.Any, O extends Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint<
  Id,
  ApiRequest<
    Ignored,
    MatchInput.HasPathParams<I> extends true ? Schema.Type<Route.PathSchema<MatchInput.Route<I>>> : Ignored,
    MatchInput.HasQueryParams<I> extends true ? Schema.Type<Route.QuerySchema<MatchInput.Route<I>>> : Ignored,
    Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.Default,
  Security<void, never, never>
>
```

Added in v1.0.0

## setRequest

**Signature**

```ts
export declare const setRequest: <Request extends ApiRequest.Any>(
  request: Request
) => <Id extends string, _ extends ApiRequest.Any, Response extends ApiResponse.Any, Security extends Security.Any>(
  endpoint: ApiEndpoint<Id, _, Response, Security>
) => ApiEndpoint<Id, Request, Response, Security>
```

Added in v1.0.0

## setRequestBody

**Signature**

```ts
export declare const setRequestBody: <B, R2>(
  schema: Schema<B, any, R2>
) => <Id extends string, _, P, Q, H, R1, Response extends ApiResponse.Any, Security extends Security.Any>(
  endpoint: ApiEndpoint<Id, ApiRequest<_, P, Q, H, R1>, Response, Security>
) => ApiEndpoint<Id, ApiRequest<B, P, Q, H, R2 | R1>, Response, Security>
```

Added in v1.0.0

## setRequestHeaders

**Signature**

```ts
export declare const setRequestHeaders: <H, R2>(
  schema: Schema<H, any, R2>
) => <Id extends string, B, P, Q, _, R1, Response extends ApiResponse.Any, Security extends Security.Any>(
  endpoint: ApiEndpoint<Id, ApiRequest<B, P, Q, _, R1>, Response, Security>
) => ApiEndpoint<Id, ApiRequest<B, P, Q, H, R2 | R1>, Response, Security>
```

Added in v1.0.0

## setRequestPath

**Signature**

```ts
export declare const setRequestPath: <P, R2>(
  schema: Schema<P, any, R2>
) => <Id extends string, B, _, Q, H, R1, Response extends ApiResponse.Any, Security extends Security.Any>(
  endpoint: ApiEndpoint<Id, ApiRequest<B, _, Q, H, R1>, Response, Security>
) => ApiEndpoint<Id, ApiRequest<B, P, Q, H, R2 | R1>, Response, Security>
```

Added in v1.0.0

## setRequestQuery

**Signature**

```ts
export declare const setRequestQuery: <Q, R2>(
  schema: Schema<Q, any, R2>
) => <Id extends string, B, P, _, H, R1, Response extends ApiResponse.Any, Security extends Security.Any>(
  endpoint: ApiEndpoint<Id, ApiRequest<B, P, _, H, R1>, Response, Security>
) => ApiEndpoint<Id, ApiRequest<B, P, Q, H, R2 | R1>, Response, Security>
```

Added in v1.0.0

## setResponse

**Signature**

```ts
export declare const setResponse: <Status extends number, Body = Ignored, Headers = Ignored, R = never>(
  response:
    | { readonly status: Status; readonly body?: Schema<Body, any, R>; readonly headers?: Schema<Headers, any, R> }
    | ApiResponse<Status, Body, Headers, R>
) => <Id extends string, Request extends ApiRequest.Any, _ extends ApiResponse.Any, Security extends Security.Any>(
  endpoint: ApiEndpoint<Id, Request, _, Security>
) => ApiEndpoint<Id, Request, ApiResponse<Status, Body, Headers, R>, Security>
```

Added in v1.0.0

## setResponseBody

**Signature**

```ts
export declare const setResponseBody: <B, R2>(
  schema: Schema<B, any, R2>
) => <Id extends string, Request extends ApiRequest.Any, S extends number, _, H, R1, Security extends Security.Any>(
  endpoint: ApiEndpoint<Id, Request, ApiResponse<S, _, H, R1>, Security>
) => ApiEndpoint<Id, Request, ApiResponse<S, B, H, R2 | R1>, Security>
```

Added in v1.0.0

## setResponseHeaders

**Signature**

```ts
export declare const setResponseHeaders: <H, R2>(
  schema: Schema<H, any, R2>
) => <Id extends string, Request extends ApiRequest.Any, S extends number, B, _, R1, Security extends Security.Any>(
  endpoint: ApiEndpoint<Id, Request, ApiResponse<S, B, _, R1>, Security>
) => ApiEndpoint<Id, Request, ApiResponse<S, B, H, R2 | R1>, Security>
```

Added in v1.0.0

## setResponseRepresentations

**Signature**

```ts
export declare const setResponseRepresentations: (
  representations: readonly [Representation, ...Representation[]]
) => <
  Id extends string,
  Request extends ApiRequest.Any,
  Response extends ApiResponse.Any,
  Security extends Security.Any
>(
  endpoint: ApiEndpoint<Id, Request, Response, Security>
) => ApiEndpoint<Id, Request, Response, Security>
```

Added in v1.0.0

## setResponseStatus

**Signature**

```ts
export declare const setResponseStatus: <Status extends number>(
  status: Status
) => <Id extends string, Request extends ApiRequest.Any, _ extends number, B, H, R, Security extends Security.Any>(
  endpoint: ApiEndpoint<Id, Request, ApiResponse<_, B, H, R>, Security>
) => ApiEndpoint<Id, Request, ApiResponse<Status, B, H, R>, Security>
```

Added in v1.0.0

## setSecurity

**Signature**

```ts
export declare const setSecurity: <Security extends Security.Any>(
  security: Security
) => <Id extends string, Request extends ApiRequest.Any, Response extends ApiResponse.Any, _ extends Security.Any>(
  endpoint: ApiEndpoint<Id, Request, Response, _>
) => ApiEndpoint<Id, Request, Response, Security>
```

Added in v1.0.0
