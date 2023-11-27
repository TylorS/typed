---
title: Platform.ts
nav_order: 15
parent: "@typed/template"
---

## Platform overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [getUrlFromServerRequest](#geturlfromserverrequest)
  - [htmlResponse](#htmlresponse)
  - [htmlResponseString](#htmlresponsestring)

---

# utils

## getUrlFromServerRequest

**Signature**

```ts
export declare function getUrlFromServerRequest(request: ServerRequest): URL
```

Added in v1.0.0

## htmlResponse

**Signature**

```ts
export declare function htmlResponse<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>,
  options?: HttpServer.response.Options
): Effect.Effect<RenderContext.RenderContext | Exclude<R, RenderTemplate>, E, HttpServer.response.ServerResponse>
```

Added in v1.0.0

## htmlResponseString

**Signature**

```ts
export declare function htmlResponseString(
  html: string,
  options?: HttpServer.response.Options
): HttpServer.response.ServerResponse
```

Added in v1.0.0