---
title: Platform.ts
nav_order: 14
parent: "@typed/core"
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
export declare function toHttpRouter<E, R, E2 = never, R2 = never>(
  matcher: RouteMatcher<RenderEvent, E, R>,
  options?: {
    layout?: (content: Fx.Fx<RenderEvent, E, R>) => Fx.Fx<RenderEvent, E2, R2>
    base?: string
    environment?: "server" | "static"
  }
): HttpServer.router.Router<Exclude<R | R2, CoreServices> | ServerRequest, E | E2 | GuardsNotMatched>
```

Added in v1.0.0
