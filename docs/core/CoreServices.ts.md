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
  - [CoreServices (type alias)](#coreservices-type-alias)
  - [fromWindow](#fromwindow)

---

# utils

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
): Layer.Layer<never, never, CoreServices | DomServices>
```

Added in v1.0.0
