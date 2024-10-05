---
title: Node.ts
nav_order: 13
parent: "@typed/core"
---

## Node overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Options (type alias)](#options-type-alias)
  - [getOrCreateServer](#getorcreateserver)
  - [listen](#listen)
  - [run](#run)

---

# utils

## Options (type alias)

**Signature**

```ts
export type Options = {
  readonly serverDirectory: string
  readonly port?: number
  readonly static?: boolean
  readonly serveStatic?: boolean
  readonly logLevel?: LogLevel.LogLevel
  readonly cacheControl?: (filePath: string) => { readonly maxAge: number; readonly immutable?: boolean }
}
```

Added in v1.0.0

## getOrCreateServer

TODO: Allow configuration of the server for HTTPS and HTTP2

**Signature**

```ts
export declare function getOrCreateServer()
```

Added in v1.0.0

## listen

**Signature**

```ts
export declare const listen: {
  (
    options: Options
  ): <E, R>(
    app: HttpApp.Default<E, R>
  ) => Effect.Effect<
    never,
    HttpServerError.HttpServerError,
    Exclude<
      R,
      | HttpServerRequest.HttpServerRequest
      | Scope.Scope
      | HttpServer.HttpServer
      | HttpPlatform
      | CurrentEnvironment
      | GetRandomValues
      | RenderContext.RenderContext
      | RenderQueue.RenderQueue
      | RenderTemplate
    >
  >
  <E, R>(
    app: HttpApp.Default<E, R>,
    options: Options
  ): Effect.Effect<
    never,
    HttpServerError.HttpServerError,
    Exclude<
      R,
      | HttpServerRequest.HttpServerRequest
      | Scope.Scope
      | HttpServer.HttpServer
      | HttpPlatform
      | CurrentEnvironment
      | GetRandomValues
      | RenderContext.RenderContext
      | RenderQueue.RenderQueue
      | RenderTemplate
    >
  >
}
```

Added in v1.0.0

## run

**Signature**

```ts
export declare const run: <A, E>(
  effect: Effect.Effect<A, E, NodeContext.NodeContext | CurrentEnvironment | CurrentRoute>,
  options?: RunForkOptions & { readonly static?: boolean; readonly base?: string }
) => Disposable
```

Added in v1.0.0
