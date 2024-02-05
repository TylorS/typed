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
  | Router.CurrentRoute
  | RenderContext.RenderContext
```

Added in v1.0.0

## fromWindow

Construct CoreServices from a browser's Window object

**Signature**

```ts
export declare function fromWindow(
  window: Window & GlobalThis,
  options?: DomServicesElementParams & { readonly skipRenderScheduling?: boolean }
): Layer.Layer<never, never, CoreDomServices>
```

Added in v1.0.0
