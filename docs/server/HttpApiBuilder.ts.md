---
title: HttpApiBuilder.ts
nav_order: 4
parent: "@typed/server"
---

## HttpApiBuilder overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [api](#api)
  - [httpApp](#httpapp)
  - [serve](#serve)
  - [toWebHandler](#towebhandler)
- [handlers](#handlers)
  - [group](#group)
  - [handle](#handle)
- [middleware](#middleware)
  - [ApiMiddleware (namespace)](#apimiddleware-namespace)
    - [Fn (type alias)](#fn-type-alias)
  - [Middleware (class)](#middleware-class)
  - [SecurityMiddleware (interface)](#securitymiddleware-interface)
  - [middleware](#middleware-1)
  - [middlewareCors](#middlewarecors)
  - [middlewareLayer](#middlewarelayer)
  - [middlewareLayerScoped](#middlewarelayerscoped)
  - [middlewareOpenApi](#middlewareopenapi)
  - [middlewareSecurity](#middlewaresecurity)
  - [middlewareSecurityVoid](#middlewaresecurityvoid)
  - [securityDecode](#securitydecode)
  - [securitySetCookie](#securitysetcookie)
- [router](#router)
  - [HttpApiBuilderRouter (class)](#httpapibuilderrouter-class)

---

# constructors

## api

Build a root level `Layer` from an `HttpApi` instance.

The `Layer` will provide the `HttpApi` service, and will require the
implementation for all the `HttpApiGroup`'s contained in the `HttpApi`.

The resulting `Layer` can be provided to the `HttpApiBuilder.serve` layer.

**Signature**

```ts
export declare const api: <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR>(
  self: HttpApi.HttpApi<Groups, Error, ErrorR>
) => Layer.Layer<HttpApi.HttpApi.Service, never, HttpApiGroup.HttpApiGroup.ToService<Groups> | ErrorR>
```

Added in v1.0.0

## httpApp

Construct an `HttpApp` from an `HttpApi` instance.

**Signature**

```ts
export declare const httpApp: Effect.Effect<
  HttpApp.Default<never, CurrentRoute>,
  never,
  HttpApi.Service | HttpApiBuilderRouter
>
```

Added in v1.0.0

## serve

Build an `HttpApp` from an `HttpApi` instance, and serve it using an
`HttpServer`.

Optionally, you can provide a middleware function that will be applied to
the `HttpApp` before serving.

**Signature**

```ts
export declare const serve: {
  (): Layer.Layer<never, never, HttpServer.HttpServer | HttpApi.HttpApi.Service | HttpRouter.HttpRouter.DefaultServices>
  <R>(
    middleware: (httpApp: HttpApp.Default) => HttpApp.Default<never, R>
  ): Layer.Layer<
    never,
    never,
    | HttpServer.HttpServer
    | HttpRouter.HttpRouter.DefaultServices
    | Exclude<R, Scope | HttpServerRequest.HttpServerRequest>
    | HttpApi.HttpApi.Service
  >
}
```

Added in v1.0.0

## toWebHandler

Construct an http web handler from an `HttpApi` instance.

**Signature**

```ts
export declare const toWebHandler: <R, ER>(
  runtime: ManagedRuntime<
    R | HttpApi.HttpApi.Service | HttpApiBuilderRouter | HttpRouter.HttpRouter.DefaultServices,
    ER
  >,
  middleware?: (
    httpApp: HttpApp.Default
  ) => HttpApp.Default<
    never,
    R | HttpApi.HttpApi.Service | HttpApiBuilderRouter | HttpRouter.HttpRouter.DefaultServices
  >
) => (request: Request) => Promise<Response>
```

**Example**

```ts
import { HttpApi } from "@effect/platform"
import { Etag, HttpApiBuilder, HttpMiddleware, HttpPlatform } from "@effect/platform"
import { NodeContext } from "@effect/platform-node"
import { Layer, ManagedRuntime } from "effect"

const ApiLive = HttpApiBuilder.api(HttpApi.empty)

const runtime = ManagedRuntime.make(
  Layer.mergeAll(ApiLive, HttpApiBuilder.Router.Live, HttpPlatform.layer, Etag.layerWeak).pipe(
    Layer.provideMerge(NodeContext.layer)
  )
)

const handler = HttpApiBuilder.toWebHandler(runtime, HttpMiddleware.logger)
```

Added in v1.0.0

# handlers

## group

Create a `Layer` that will implement all the endpoints in an `HttpApiGroup`.

An unimplemented `Handlers` instance is passed to the `build` function, which
you can use to add handlers to the group.

You can implement endpoints using the `HttpApiBuilder.handle` api.

**Signature**

```ts
export declare const group: <
  Groups extends HttpApiGroup.HttpApiGroup.Any,
  ApiError,
  ApiErrorR,
  const Name extends Groups["identifier"],
  RH,
  EX = never,
  RX = never
>(
  api: HttpApi.HttpApi<Groups, ApiError, ApiErrorR>,
  groupName: Name,
  build: (
    handlers: HttpApiHandlers.HttpApiHandlers<never, never, HttpApiGroup.HttpApiGroup.EndpointsWithName<Groups, Name>>
  ) =>
    | HttpApiHandlers.HttpApiHandlers<NoInfer<ApiError> | HttpApiGroup.HttpApiGroup.ErrorWithName<Groups, Name>, RH>
    | Effect.Effect<
        HttpApiHandlers.HttpApiHandlers<NoInfer<ApiError> | HttpApiGroup.HttpApiGroup.ErrorWithName<Groups, Name>, RH>,
        EX,
        RX
      >
) => Layer.Layer<
  HttpApiGroup.HttpApiGroup.Service<Name>,
  EX,
  RX | RH | HttpApiGroup.HttpApiGroup.ContextWithName<Groups, Name> | ApiErrorR
>
```

Added in v1.0.0

## handle

Add the implementation for an `HttpApiEndpoint` to a `Handlers` group.

**Signature**

```ts
export declare const handle: {
  <Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, const Name extends Endpoints["name"], E, R>(
    name: Name,
    handler: HttpApiEndpoint.HttpApiEndpoint.HandlerWithName<Endpoints, Name, E, R>
  ): <EG, RG>(
    self: HttpApiHandlers.HttpApiHandlers<EG, RG, Endpoints>
  ) => HttpApiHandlers.HttpApiHandlers<
    EG | Exclude<E, HttpApiEndpoint.HttpApiEndpoint.ErrorWithName<Endpoints, Name>> | HttpApiDecodeError,
    RG | HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<R>,
    HttpApiEndpoint.HttpApiEndpoint.ExcludeName<Endpoints, Name>
  >
  <Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, const Name extends Endpoints["name"], E, R>(
    name: Name,
    handler: HttpApiEndpoint.HttpApiEndpoint.HandlerResponseWithName<Endpoints, Name, E, R>,
    options: { readonly withFullResponse: true }
  ): <EG, RG>(
    self: HttpApiHandlers.HttpApiHandlers<EG, RG, Endpoints>
  ) => HttpApiHandlers.HttpApiHandlers<
    EG | Exclude<E, HttpApiEndpoint.HttpApiEndpoint.ErrorWithName<Endpoints, Name>> | HttpApiDecodeError,
    RG | HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<R>,
    HttpApiEndpoint.HttpApiEndpoint.ExcludeName<Endpoints, Name>
  >
}
```

Added in v1.0.0

# middleware

## ApiMiddleware (namespace)

Added in v1.0.0

### Fn (type alias)

**Signature**

```ts
export type Fn<Error, R = HttpRouter.HttpRouter.Provided> = (httpApp: HttpApp.Default) => HttpApp.Default<Error, R>
```

Added in v1.0.0

## Middleware (class)

**Signature**

```ts
export declare class Middleware
```

Added in v1.0.0

## SecurityMiddleware (interface)

**Signature**

```ts
export interface SecurityMiddleware<I, EM = never, RM = never> {
  <Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any, E, R>(
    self: HttpApiHandlers.HttpApiHandlers<E, R, Endpoints>
  ): HttpApiHandlers.HttpApiHandlers<
    E | EM,
    Exclude<R, I> | HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<RM>,
    Endpoints
  >
}
```

Added in v1.0.0

## middleware

Add `HttpMiddleware` to a `Handlers` group.

Any errors are required to have a corresponding schema in the API.
You can add middleware errors to an `HttpApiGroup` using the `HttpApiGroup.addError`
api.

**Signature**

```ts
export declare const middleware: <E, R, E1, R1>(
  middleware: HttpApiHandlers.HttpApiHandlers.Middleware<E, R, E1, R1>
) => <Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any>(
  self: HttpApiHandlers.HttpApiHandlers<E, R, Endpoints>
) => HttpApiHandlers.HttpApiHandlers<E1, HttpApiEndpoint.HttpApiEndpoint.ExcludeProvided<R1>, Endpoints>
```

Added in v1.0.0

## middlewareCors

A CORS middleware layer that can be provided to the `HttpApiBuilder.serve` layer.

**Signature**

```ts
export declare const middlewareCors: (
  options?:
    | {
        readonly allowedOrigins?: ReadonlyArray<string> | undefined
        readonly allowedMethods?: ReadonlyArray<string> | undefined
        readonly allowedHeaders?: ReadonlyArray<string> | undefined
        readonly exposedHeaders?: ReadonlyArray<string> | undefined
        readonly maxAge?: number | undefined
        readonly credentials?: boolean | undefined
      }
    | undefined
) => Layer.Layer<never>
```

Added in v1.0.0

## middlewareLayer

Create an `HttpApi` level middleware `Layer`.

**Signature**

```ts
export declare const middlewareLayer: {
  <EX = never, RX = never>(
    middleware: ApiMiddleware.Fn<never> | Effect.Effect<ApiMiddleware.Fn<never>, EX, RX>,
    options?: { readonly withContext?: false | undefined }
  ): Layer.Layer<never, EX, RX>
  <R, EX = never, RX = never>(
    middleware: ApiMiddleware.Fn<never, R> | Effect.Effect<ApiMiddleware.Fn<never, R>, EX, RX>,
    options: { readonly withContext: true }
  ): Layer.Layer<never, EX, HttpRouter.HttpRouter.ExcludeProvided<R> | RX>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, EX = never, RX = never>(
    api: HttpApi.HttpApi<Groups, Error, ErrorR>,
    middleware: ApiMiddleware.Fn<NoInfer<Error>> | Effect.Effect<ApiMiddleware.Fn<NoInfer<Error>>, EX, RX>,
    options?: { readonly withContext?: false | undefined }
  ): Layer.Layer<never, EX, RX>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, R, EX = never, RX = never>(
    api: HttpApi.HttpApi<Groups, Error, ErrorR>,
    middleware: ApiMiddleware.Fn<NoInfer<Error>, R> | Effect.Effect<ApiMiddleware.Fn<NoInfer<Error>, R>, EX, RX>,
    options: { readonly withContext: true }
  ): Layer.Layer<never, EX, HttpRouter.HttpRouter.ExcludeProvided<R> | RX>
}
```

Added in v1.0.0

## middlewareLayerScoped

Create an `HttpApi` level middleware `Layer`, that has a `Scope` provided to
the constructor.

**Signature**

```ts
export declare const middlewareLayerScoped: {
  <EX, RX>(
    middleware: Effect.Effect<ApiMiddleware.Fn<never>, EX, RX>,
    options?: { readonly withContext?: false | undefined }
  ): Layer.Layer<never, EX, Exclude<RX, Scope>>
  <R, EX, RX>(
    middleware: Effect.Effect<ApiMiddleware.Fn<never, R>, EX, RX>,
    options: { readonly withContext: true }
  ): Layer.Layer<never, EX, HttpRouter.HttpRouter.ExcludeProvided<R> | Exclude<RX, Scope>>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, EX, RX>(
    api: HttpApi.HttpApi<Groups, Error, ErrorR>,
    middleware: Effect.Effect<ApiMiddleware.Fn<NoInfer<Error>>, EX, RX>,
    options?: { readonly withContext?: false | undefined }
  ): Layer.Layer<never, EX, Exclude<RX, Scope>>
  <Groups extends HttpApiGroup.HttpApiGroup.Any, Error, ErrorR, R, EX, RX>(
    api: HttpApi.HttpApi<Groups, Error, ErrorR>,
    middleware: Effect.Effect<ApiMiddleware.Fn<NoInfer<Error>, R>, EX, RX>,
    options: { readonly withContext: true }
  ): Layer.Layer<never, EX, HttpRouter.HttpRouter.ExcludeProvided<R> | Exclude<RX, Scope>>
}
```

Added in v1.0.0

## middlewareOpenApi

A middleware that adds an openapi.json endpoint to the API.

**Signature**

```ts
export declare const middlewareOpenApi: (
  options?: { readonly path?: PathInput | undefined } | undefined
) => Layer.Layer<never, never, HttpApi.HttpApi.Service>
```

Added in v1.0.0

## middlewareSecurity

Make a middleware from an `HttpApiSecurity` instance, that can be used when
constructing a `Handlers` group.

**Signature**

```ts
export declare const middlewareSecurity: <Security extends HttpApiSecurity.HttpApiSecurity, I, S, EM, RM>(
  self: Security,
  tag: Context.Tag<I, S>,
  f: (credentials: HttpApiSecurity.HttpApiSecurity.Type<Security>) => Effect.Effect<S, EM, RM>
) => SecurityMiddleware<I, EM, RM>
```

**Example**

```ts
import { HttpApiBuilder, HttpApiSecurity } from "@effect/platform"
import { Schema } from "@effect/schema"
import { Context, Effect, Redacted } from "effect"

class User extends Schema.Class<User>("User")({
  id: Schema.Number
}) {}

class CurrentUser extends Context.Tag("CurrentUser")<CurrentUser, User>() {}

class Accounts extends Context.Tag("Accounts")<
  Accounts,
  {
    readonly findUserByAccessToken: (accessToken: string) => Effect.Effect<User>
  }
>() {}

const securityMiddleware = Effect.gen(function* () {
  const accounts = yield* Accounts
  return HttpApiBuilder.middlewareSecurity(HttpApiSecurity.bearer, CurrentUser, (token) =>
    accounts.findUserByAccessToken(Redacted.value(token))
  )
})
```

Added in v1.0.0

## middlewareSecurityVoid

Make a middleware from an `HttpApiSecurity` instance, that can be used when
constructing a `Handlers` group.

This version does not supply any context to the HttpApiHandlers.

**Signature**

```ts
export declare const middlewareSecurityVoid: <Security extends HttpApiSecurity.HttpApiSecurity, X, EM, RM>(
  self: Security,
  f: (credentials: HttpApiSecurity.HttpApiSecurity.Type<Security>) => Effect.Effect<X, EM, RM>
) => SecurityMiddleware<never, EM, RM>
```

Added in v1.0.0

## securityDecode

**Signature**

```ts
export declare const securityDecode: <Security extends HttpApiSecurity.HttpApiSecurity>(
  self: Security
) => Effect.Effect<
  HttpApiSecurity.HttpApiSecurity.Type<Security>,
  HttpApiSecurity.SecurityDecodeError,
  HttpServerRequest.HttpServerRequest | HttpServerRequest.ParsedSearchParams
>
```

Added in v1.0.0

## securitySetCookie

Set a cookie from an `HttpApiSecurity.HttpApiKey` instance.

You can use this api before returning a response from an endpoint handler.

```ts
ApiBuilder.handle("authenticate", (_) => ApiBuilder.securitySetCookie(security, "secret123"))
```

**Signature**

```ts
export declare const securitySetCookie: (
  self: HttpApiSecurity.ApiKey,
  value: string | Redacted.Redacted,
  options?: Cookie["options"]
) => Effect.Effect<void>
```

Added in v1.0.0

# router

## HttpApiBuilderRouter (class)

The router that the API endpoints are attached to.

**Signature**

```ts
export declare class HttpApiBuilderRouter
```

Added in v1.0.0
