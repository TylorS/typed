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
export declare function getUrlFromServerRequest(request: HttpServerRequest.HttpServerRequest): URL
```

Added in v1.0.0

## htmlResponse

**Signature**

```ts
export declare function htmlResponse<E, R>(
  fx: Fx.Fx<RenderEvent | null, E, R>,
  options?: HttpServerResponse.Options
): Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>
```

Added in v1.0.0

## htmlResponseString

**Signature**

```ts
export declare function htmlResponseString(
  html: string,
  options?: HttpServerResponse.Options
): HttpServerResponse.HttpServerResponse
```

Added in v1.0.0
