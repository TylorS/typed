---
title: Platform.ts
nav_order: 15
parent: "@typed/core"
---

## Platform overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [GuardsNotMatched (class)](#guardsnotmatched-class)
  - [LayoutParams (type alias)](#layoutparams-type-alias)
  - [LayoutTemplate (type alias)](#layouttemplate-type-alias)
  - [getContentType](#getcontenttype)
  - [staticFiles](#staticfiles)
  - [toHttpRouter](#tohttprouter)
  - [toServerRouter](#toserverrouter)

---

# utils

## GuardsNotMatched (class)

**Signature**

```ts
export declare class GuardsNotMatched
```

Added in v1.0.0

## LayoutParams (type alias)

**Signature**

```ts
export type LayoutParams<Content extends Fx.Fx<RenderEvent | null, any, any>> = {
  readonly content: Content
  readonly request: ServerRequest
  readonly head: Fx.Fx<
    RenderEvent | null,
    never,
    RenderContext.RenderContext | RenderQueue.RenderQueue | RenderTemplate | Scope.Scope
  > | null
  readonly script: Fx.Fx<
    RenderEvent | null,
    never,
    RenderContext.RenderContext | RenderQueue.RenderQueue | RenderTemplate | Scope.Scope
  > | null
}
```

Added in v1.0.0

## LayoutTemplate (type alias)

**Signature**

```ts
export type LayoutTemplate<Content extends Fx.Fx<RenderEvent | null, any, any>, E, R> = (
  params: LayoutParams<Content>
) => Fx.Fx<RenderEvent | null, E, R>
```

Added in v1.0.0

## getContentType

**Signature**

```ts
export declare const getContentType: (filePath: string) => string
```

Added in v1.0.0

## staticFiles

A very simple static file middleware with support for gzip'd files.

**Signature**

```ts
export declare function staticFiles({
  cacheControl,
  enabled,
  options,
  serverOutputDirectory
}: {
  serverOutputDirectory: string
  enabled: boolean
  options: TypedOptions
  cacheControl?: (filePath: string) => {
    readonly maxAge: number
    readonly immutable?: boolean
  }
}): <E, R>(
  self: Http.app.Default<E, R>
) => Effect.Effect<
  Http.response.ServerResponse,
  E | BadArgument | PlatformError,
  ServerRequest | R | Http.platform.Platform | FileSystem | Path
>
```

Added in v1.0.0

## toHttpRouter

**Signature**

```ts
export declare function toHttpRouter<
  M extends Router.RouteMatch.RouteMatch<Route.Route.Any, any, any, any, RenderEvent | null, any, any>,
  E2 = never,
  R2 = never
>(
  matcher: Router.RouteMatcher<M>,
  options?: {
    clientEntry?: string
    layout?: LayoutTemplate<
      Fx.Fx<RenderEvent | null, Router.RouteMatch.RouteMatch.Error<M>, Router.RouteMatch.RouteMatch.Context<M>>,
      E2,
      R2
    >
    base?: string
    environment?: "server" | "static"
  }
): Http.router.Router<
  Router.RouteMatch.RouteMatch.Error<M> | E2 | GuardsNotMatched,
  ServerRequest | Exclude<Router.RouteMatch.RouteMatch.Context<M> | R2, Navigation.Navigation | Router.CurrentRoute>
>
```

Added in v1.0.0

## toServerRouter

**Signature**

```ts
export declare function toServerRouter<
  M extends Router.RouteMatch.RouteMatch<Route.Route.Any, any, any, any, RenderEvent | null, any, any>,
  E2 = never,
  R2 = never
>(
  matcher: Router.RouteMatcher<M>,
  options?: {
    clientEntry?: string
    layout?: LayoutTemplate<
      Fx.Fx<RenderEvent | null, Router.RouteMatch.RouteMatch.Error<M>, Router.RouteMatch.RouteMatch.Context<M>>,
      E2,
      R2
    >
    base?: string
  }
): ServerRouter.Router<
  Router.RouteMatch.RouteMatch.Error<M> | E2 | GuardsNotMatched,
  ServerRequest | Exclude<Router.RouteMatch.RouteMatch.Context<M> | R2, Navigation.Navigation | Router.CurrentRoute>
>
```

Added in v1.0.0
