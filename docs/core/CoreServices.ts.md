---
title: CoreServices.ts
nav_order: 3
parent: "@typed/core"
---

## CoreServices overview

CoreServices are the services that are available to all Typed applications.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [CoreDomServices (type alias)](#coredomservices-type-alias)
  - [CoreServices (type alias)](#coreservices-type-alias)
  - [fromWindow](#fromwindow)
  - [server](#server)
  - [static](#static)

---

# utils

## CoreDomServices (type alias)

**Signature**

```ts
export type CoreDomServices = DomServices | CoreServices
```

Added in v1.0.0

## CoreServices (type alias)

CoreServices are the services that are available to all Typed applications.

**Signature**

```ts
export type CoreServices =
  | CurrentEnvironment
  | GetRandomValues
  | Navigation.Navigation
  | CurrentRoute
  | RenderContext.RenderContext
  | RenderQueue.RenderQueue
  | RenderTemplate
```

Added in v1.0.0

## fromWindow

**Signature**

```ts
export declare function fromWindow(
  window: Window & GlobalThis,
  options?: DomServicesElementParams & { readonly queue?: "raf" | "sync" | "mixed" | ["idle", IdleRequestOptions] }
): Layer.Layer<CoreDomServices>
```

Added in v1.0.0

## server

**Signature**

```ts
export declare const server: Layer.Layer<
  | CurrentEnvironment
  | CurrentRoute
  | GetRandomValues
  | RenderContext.RenderContext
  | RenderQueue.RenderQueue
  | RenderTemplate,
  never,
  never
>
```

Added in v1.0.0

## static

**Signature**

```ts
export declare const static: Layer.Layer<
  | CurrentEnvironment
  | CurrentRoute
  | GetRandomValues
  | RenderContext.RenderContext
  | RenderQueue.RenderQueue
  | RenderTemplate,
  never,
  never
>
```

Added in v1.0.0
