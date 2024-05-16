---
title: RouterBuilder.ts
nav_order: 21
parent: "@typed/server"
---

## RouterBuilder overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [handle](#handle)
- [handling](#handling)
  - [make](#make)
- [models](#models)
  - [RouterBuilder (interface)](#routerbuilder-interface)
- [utils](#utils)
  - [Options (interface)](#options-interface)
  - [RouterBuilder (namespace)](#routerbuilder-namespace)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [RemainingEndpoints (type alias)](#remainingendpoints-type-alias)
  - [build](#build)
  - [buildPartial](#buildpartial)
  - [fromEndpoint](#fromendpoint)
  - [getRouter](#getrouter)

---

# constructors

## handle

Handle an endpoint using a handler function.

**Signature**

```ts
export declare const handle: {
  <
    E,
    R,
    RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
    Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>,
    E2,
    R2
  >(
    id: Id,
    handler: EffectHttpRoute.HandlerFunction<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, R2, E2>
  ): (
    builder: RouterBuilder<E, R, RemainingEndpoints>
  ) => RouterBuilder<
    | E
    | E2
    | RouteHandler.RouteNotMatched
    | Route.RouteDecodeError<
        Route.Route<
          PathInput,
          Extract<
            ApiRequest.ApiRequest.Path<
              ApiEndpoint.ApiEndpoint.Request<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>
            >,
            Schema.Schema.All
          >
        >
      >,
    | R
    | Exclude<
        Exclude<
          R2,
          RouteHandler.CurrentParams<
            Route.Route<
              PathInput,
              Extract<
                ApiRequest.ApiRequest.Path<
                  ApiEndpoint.ApiEndpoint.Request<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>
                >,
                Schema.Schema.All
              >
            >
          >
        >,
        Navigation
      >,
    ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
  >
  <
    E,
    R,
    RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any,
    Id extends ApiEndpoint.ApiEndpoint.Id<RemainingEndpoints>,
    E2,
    R2
  >(
    builder: RouterBuilder<E, R, RemainingEndpoints>,
    id: Id,
    handler: EffectHttpRoute.HandlerFunction<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>, R2, E2>
  ): RouterBuilder<
    | E
    | E2
    | RouteHandler.RouteNotMatched
    | Route.RouteDecodeError<
        Route.Route<
          PathInput,
          Extract<
            ApiRequest.ApiRequest.Path<
              ApiEndpoint.ApiEndpoint.Request<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>
            >,
            Schema.Schema.All
          >
        >
      >,
    | R
    | Exclude<
        Exclude<
          R2,
          RouteHandler.CurrentParams<
            Route.Route<
              PathInput,
              Extract<
                ApiRequest.ApiRequest.Path<
                  ApiEndpoint.ApiEndpoint.Request<ApiEndpoint.ApiEndpoint.ExtractById<RemainingEndpoints, Id>>
                >,
                Schema.Schema.All
              >
            >
          >
        >,
        Navigation
      >,
    ApiEndpoint.ApiEndpoint.ExcludeById<RemainingEndpoints, Id>
  >
}
```

Added in v1.0.0

# handling

## make

Create a new unimplemeted `RouterBuilder` from an `Api`.

**Signature**

```ts
export declare const make: <A extends Api.Api.Any>(
  api: A,
  options?: Partial<Options>
) => RouterBuilder<never, never, Api.Api.Endpoints<A>>
```

Added in v1.0.0

# models

## RouterBuilder (interface)

**Signature**

```ts
export interface RouterBuilder<E, R, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any> extends Pipeable.Pipeable {
  readonly remainingEndpoints: ReadonlyArray<RemainingEndpoints>
  readonly api: Api.Api.Any
  readonly router: Router.Router<E, R>
  readonly options: Options
}
```

Added in v1.0.0

# utils

## Options (interface)

**Signature**

```ts
export interface Options extends EffectHttpRouterBuilder.Options {}
```

Added in v1.0.0

## RouterBuilder (namespace)

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends RouterBuilder<any, infer R, any> ? R : never
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = T extends RouterBuilder<infer E, any, any> ? E : never
```

Added in v1.0.0

### RemainingEndpoints (type alias)

**Signature**

```ts
export type RemainingEndpoints<T> =
  T extends RouterBuilder<any, any, infer RemainingEndpoints> ? RemainingEndpoints : never
```

Added in v1.0.0

## build

**Signature**

```ts
export declare const build: <E, R>(
  builder: RouterBuilder<E, R, never>
) => Default<FlattenDecodeError<E>, R | CurrentRoute | SwaggerRouter.SwaggerFiles>
```

Added in v1.0.0

## buildPartial

**Signature**

```ts
export declare const buildPartial: <E, R, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>(
  builder: RouterBuilder<E, R, RemainingEndpoints>
) => Default<FlattenDecodeError<E>, CurrentRoute | SwaggerRouter.SwaggerFiles | R>
```

Added in v1.0.0

## fromEndpoint

**Signature**

```ts
export declare const fromEndpoint: {
  <E extends ApiEndpoint.ApiEndpoint.Any, R2, E2>(
    handler: EffectHttpRoute.HandlerFunction<E, R2, E2>
  ): (
    endpoint: E
  ) => <E1, R1, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>(
    builder: RouterBuilder<E1, R1, E | RemainingEndpoints>
  ) => RouterBuilder<
    | RouteHandler.RouteNotMatched
    | E2
    | E1
    | Route.RouteDecodeError<
        Route.Route<
          PathInput,
          Extract<ApiRequest.ApiRequest.Path<ApiEndpoint.ApiEndpoint.Request<E>>, Schema.Schema.All>
        >
      >,
    | R2
    | R1
    | Exclude<
        Exclude<
          R2,
          RouteHandler.CurrentParams<
            Route.Route<
              PathInput,
              Extract<ApiRequest.ApiRequest.Path<ApiEndpoint.ApiEndpoint.Request<E>>, Schema.Schema.All>
            >
          >
        >,
        Navigation
      >,
    Exclude<RemainingEndpoints, E>
  >
  <E extends ApiEndpoint.ApiEndpoint.Any, R2, E2>(
    endpoint: E,
    handler: EffectHttpRoute.HandlerFunction<E, R2, E2>
  ): <E1, R1, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>(
    builder: RouterBuilder<E1, R1, E | RemainingEndpoints>
  ) => RouterBuilder<
    | RouteHandler.RouteNotMatched
    | E2
    | E1
    | Route.RouteDecodeError<
        Route.Route<
          PathInput,
          Extract<ApiRequest.ApiRequest.Path<ApiEndpoint.ApiEndpoint.Request<E>>, Schema.Schema.All>
        >
      >,
    | R2
    | R1
    | Exclude<
        Exclude<
          R2,
          RouteHandler.CurrentParams<
            Route.Route<
              PathInput,
              Extract<ApiRequest.ApiRequest.Path<ApiEndpoint.ApiEndpoint.Request<E>>, Schema.Schema.All>
            >
          >
        >,
        Navigation
      >,
    Exclude<RemainingEndpoints, E>
  >
}
```

Added in v1.0.0

## getRouter

**Signature**

```ts
export declare function getRouter<E, R, RemainingEndpoints extends ApiEndpoint.ApiEndpoint.Any>(
  builder: RouterBuilder<E, R, RemainingEndpoints>
): Router.Router<FlattenDecodeError<E>, R>
```

Added in v1.0.0
