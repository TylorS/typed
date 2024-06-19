---
title: Platform.ts
nav_order: 16
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
export declare function htmlResponse<E, R>(
  fx: Fx.Fx<RenderEvent | null, E, R>,
  options?: HttpServer.response.Options
): Effect.Effect<HttpServer.response.ServerResponse, E, R>
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
