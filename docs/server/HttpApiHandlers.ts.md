---
title: HttpApiHandlers.ts
nav_order: 9
parent: "@typed/server"
---

## HttpApiHandlers overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [HttpApiHandlers (interface)](#httpapihandlers-interface)
  - [HttpApiHandlers (namespace)](#httpapihandlers-namespace)
    - [Item (type alias)](#item-type-alias)
    - [Middleware (type alias)](#middleware-type-alias)
  - [HttpApiHandlersTypeId](#httpapihandlerstypeid)
  - [HttpApiHandlersTypeId (type alias)](#httpapihandlerstypeid-type-alias)
  - [makeHandler](#makehandler)
  - [makeHandlers](#makehandlers)
  - [makeMiddleware](#makemiddleware)

---

# utils

## HttpApiHandlers (interface)

**Signature**

```ts
export interface HttpApiHandlers<E, R, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any = never> {
  readonly [HttpApiHandlersTypeId]: {
    readonly _Endpoints: Types.Covariant<Endpoints>
  }
  readonly group: HttpApiGroup.HttpApiGroup<any, HttpApiEndpoint.HttpApiEndpoint.Any, any, R>
  readonly handlers: Chunk.Chunk<HttpApiHandlers.Item<E, R>>
}
```

Added in v1.0.0

## HttpApiHandlers (namespace)

Added in v1.0.0

### Item (type alias)

**Signature**

```ts
export type Item<E, R> =
  | {
      readonly _tag: "Handler"
      readonly endpoint: HttpApiEndpoint.HttpApiEndpoint.Any
      readonly handler: HttpApiEndpoint.HttpApiEndpoint.Handler<any, any, any>
      readonly withFullResponse: boolean
    }
  | {
      readonly _tag: "Middleware"
      readonly middleware: Middleware<any, any, E, R>
    }
```

Added in v1.0.0

### Middleware (type alias)

**Signature**

```ts
export type Middleware<E, R, E1, R1> = (self: HttpRouter.Route.Middleware<E, R>) => HttpApp.Default<E1, R1>
```

Added in v1.0.0

## HttpApiHandlersTypeId

**Signature**

```ts
export declare const HttpApiHandlersTypeId: typeof HttpApiHandlersTypeId
```

Added in v1.0.0

## HttpApiHandlersTypeId (type alias)

**Signature**

```ts
export type HttpApiHandlersTypeId = typeof HttpApiHandlersTypeId
```

Added in v1.0.0

## makeHandler

**Signature**

```ts
export declare const makeHandler: <Endpoint extends HttpApiEndpoint.HttpApiEndpoint.Any, E, R>(
  endpoint: Endpoint,
  handler: HttpApiEndpoint.HttpApiEndpoint.Handler<Endpoint, E, R>,
  options?: { readonly withFullResponse?: boolean }
) => HttpApiHandlers.Item<E, R>
```

Added in v1.0.0

## makeHandlers

**Signature**

```ts
export declare const makeHandlers: <E, R, Endpoints extends HttpApiEndpoint.HttpApiEndpoint.Any>(options: {
  readonly group: HttpApiGroup.HttpApiGroup<any, HttpApiEndpoint.HttpApiEndpoint.Any, any, R>
  readonly handlers: Chunk.Chunk<HttpApiHandlers.Item<E, R>>
}) => HttpApiHandlers<E, R, Endpoints>
```

Added in v1.0.0

## makeMiddleware

**Signature**

```ts
export declare const makeMiddleware: <E, R>(
  middleware: HttpApiHandlers.Middleware<any, any, E, R>
) => HttpApiHandlers.Item<E, R>
```

Added in v1.0.0
