---
title: ApiEndpoint.ts
nav_order: 2
parent: "@typed/server"
---

## ApiEndpoint overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ApiEndpoint](#apiendpoint)
  - [Options](#options)
  - [addResponse](#addresponse)
  - [delete](#delete)
  - [get](#get)
  - [head](#head)
  - [make](#make)
  - [options](#options-1)
  - [patch](#patch)
  - [post](#post)
  - [put](#put)
  - [setRequest](#setrequest)
  - [setRequestBody](#setrequestbody)
  - [setRequestHeaders](#setrequestheaders)
  - [setRequestPath](#setrequestpath)
  - [setRequestQuery](#setrequestquery)
  - [setRequestRoute](#setrequestroute)
  - [setResponse](#setresponse)
  - [setResponseBody](#setresponsebody)
  - [setResponseHeaders](#setresponseheaders)
  - [setResponseRepresentations](#setresponserepresentations)
  - [setResponseStatus](#setresponsestatus)
  - [setSecurity](#setsecurity)

---

# utils

## ApiEndpoint

**Signature**

```ts
export declare const ApiEndpoint: any
```

Added in v1.0.0

## Options

**Signature**

```ts
export declare const Options: any
```

Added in v1.0.0

## addResponse

**Signature**

```ts
export declare const addResponse: <
  Status extends number,
  Body = ApiSchema.Ignored,
  Headers = ApiSchema.Ignored,
  R = never
>(
  response:
    | ApiResponse.ApiResponse<Status, Body, Headers, R>
    | { readonly status: Status; readonly body?: Schema<Body, any, R>; readonly headers?: Schema<Headers, any, R> }
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response1 extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response1, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<Status, Body, Headers, R> | Response1, Security>
```

Added in v1.0.0

## delete

**Signature**

```ts
export declare const delete: <Id, I, O>(id: Id, route: I, options: O) => ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<ApiSchema.Ignored, GetSchemaPathType<I>, GetSchemaQueryType<I>, ApiSchema.Ignored, MatchInput.Context<I>>, ApiResponse.ApiResponse.Default, Security.Security<void, never, never>>
```

Added in v1.0.0

## get

**Signature**

```ts
export declare const get: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
>
```

Added in v1.0.0

## head

**Signature**

```ts
export declare const head: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<
  M extends Method,
  const Id extends string,
  I extends MatchInput.Any,
  O extends ApiEndpoint.Options
>(
  method: M,
  id: Id,
  route: I,
  options: O
): ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
>
```

Added in v1.0.0

## options

**Signature**

```ts
export declare const options: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
>
```

Added in v1.0.0

## patch

**Signature**

```ts
export declare const patch: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
>
```

Added in v1.0.0

## post

**Signature**

```ts
export declare const post: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
>
```

Added in v1.0.0

## put

**Signature**

```ts
export declare const put: <const Id extends string, I extends MatchInput.Any, O extends ApiEndpoint.Options>(
  id: Id,
  route: I,
  options: O
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<
    ApiSchema.Ignored,
    GetSchemaPathType<I>,
    GetSchemaQueryType<I>,
    ApiSchema.Ignored,
    MatchInput.Context<I>
  >,
  ApiResponse.ApiResponse.Default,
  Security.Security<void, never, never>
>
```

Added in v1.0.0

## setRequest

**Signature**

```ts
export declare const setRequest: <Request extends ApiRequest.ApiRequest.Any>(
  request: Request
) => <
  Id extends string,
  _ extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, _, Response, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
```

Added in v1.0.0

## setRequestBody

**Signature**

```ts
export declare const setRequestBody: <B, R2>(
  schema: Schema<B, any, R2>
) => <
  Id extends string,
  _,
  P,
  Q,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<_, P, Q, H, R1>, Response, Security>
) => ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R2 | R1>, Response, Security>
```

Added in v1.0.0

## setRequestHeaders

**Signature**

```ts
export declare const setRequestHeaders: <H, R2>(
  schema: Schema<H, any, R2>
) => <
  Id extends string,
  B,
  P,
  Q,
  _,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, _, R1>, Response, Security>
) => ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R2 | R1>, Response, Security>
```

Added in v1.0.0

## setRequestPath

**Signature**

```ts
export declare const setRequestPath: <P, R2>(
  schema: Schema<P, any, R2>
) => <
  Id extends string,
  B,
  _,
  Q,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, _, Q, H, R1>, Response, Security>
) => ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R2 | R1>, Response, Security>
```

Added in v1.0.0

## setRequestQuery

**Signature**

```ts
export declare const setRequestQuery: <Q, R2>(
  schema: Schema<Q, any, R2>
) => <
  Id extends string,
  B,
  P,
  _,
  H,
  R1,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, _, H, R1>, Response, Security>
) => ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, P, Q, H, R2 | R1>, Response, Security>
```

Added in v1.0.0

## setRequestRoute

**Signature**

```ts
export declare function setRequestRoute<I extends MatchInput.Any>(
  route: I
): <Id extends string, B, _, Q, H, R1, Response extends ApiResponse.ApiResponse.Any, S extends Security.Security.Any>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, ApiRequest.ApiRequest<B, _, Q, H, R1>, Response, S>
) => ApiEndpoint.ApiEndpoint<
  Id,
  ApiRequest.ApiRequest<B, GetSchemaPathType<I>, GetSchemaQueryType<I>, H, MatchInput.Context<I> | R1>,
  Response,
  S
>
```

Added in v1.0.0
type

## setResponse

**Signature**

```ts
export declare const setResponse: <
  Status extends number,
  Body = ApiSchema.Ignored,
  Headers = ApiSchema.Ignored,
  R = never
>(
  response:
    | { readonly status: Status; readonly body?: Schema<Body, any, R>; readonly headers?: Schema<Headers, any, R> }
    | ApiResponse.ApiResponse<Status, Body, Headers, R>
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  _ extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, _, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<Status, Body, Headers, R>, Security>
```

Added in v1.0.0

## setResponseBody

**Signature**

```ts
export declare const setResponseBody: <B, R2>(
  schema: Schema<B, any, R2>
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  S extends number,
  _,
  H,
  R1,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, _, H, R1>, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, B, H, R2 | R1>, Security>
```

Added in v1.0.0

## setResponseHeaders

**Signature**

```ts
export declare const setResponseHeaders: <H, R2>(
  schema: Schema<H, any, R2>
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  S extends number,
  B,
  _,
  R1,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, B, _, R1>, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<S, B, H, R2 | R1>, Security>
```

Added in v1.0.0

## setResponseRepresentations

**Signature**

```ts
export declare const setResponseRepresentations: (
  representations: readonly [Representation, ...Representation[]]
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
```

Added in v1.0.0

## setResponseStatus

**Signature**

```ts
export declare const setResponseStatus: <Status extends number>(
  status: Status
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  _ extends number,
  B,
  H,
  R,
  Security extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<_, B, H, R>, Security>
) => ApiEndpoint.ApiEndpoint<Id, Request, ApiResponse.ApiResponse<Status, B, H, R>, Security>
```

Added in v1.0.0

## setSecurity

**Signature**

```ts
export declare const setSecurity: <Security extends Security.Security.Any>(
  security: Security
) => <
  Id extends string,
  Request extends ApiRequest.ApiRequest.Any,
  Response extends ApiResponse.ApiResponse.Any,
  _ extends Security.Security.Any
>(
  endpoint: ApiEndpoint.ApiEndpoint<Id, Request, Response, _>
) => ApiEndpoint.ApiEndpoint<Id, Request, Response, Security>
```

Added in v1.0.0
