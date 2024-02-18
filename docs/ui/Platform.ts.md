---
title: Platform.ts
nav_order: 5
parent: "@typed/ui"
---

## Platform overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [GuardsNotMatched (class)](#guardsnotmatched-class)
  - [toHttpRouter](#tohttprouter)

---

# utils

## GuardsNotMatched (class)

**Signature**

```ts
export declare class GuardsNotMatched
```

Added in v1.0.0

## toHttpRouter

**Signature**

```ts
export declare function toHttpRouter<E, R>(
  matcher: RouteMatcher<RenderEvent, E, R>
): HttpServer.router.Router<
  R | RenderTemplate | RenderContext.RenderContext | ServerRequest | Scope.Scope,
  E | GuardsNotMatched
>
```

Added in v1.0.0
