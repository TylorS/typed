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
  - [hydrateFromWindow](#hydratefromwindow)
  - [server](#server)
  - [static](#static)
  - [static\_](#static_)

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
  | RenderTemplate
```

Added in v1.0.0

## fromWindow

**Signature**

```ts
export declare function fromWindow(
  window: Window & GlobalThis,
  options?: DomServicesElementParams & {
    readonly skipRenderScheduling?: boolean
  }
): Layer.Layer<CoreDomServices>
```

Added in v1.0.0

## hydrateFromWindow

**Signature**

```ts
export declare function hydrateFromWindow(
  window: Window & GlobalThis,
  options?: DomServicesElementParams & {
    readonly skipRenderScheduling?: boolean
  }
): Layer.Layer<CoreDomServices>
```

Added in v1.0.0

## server

**Signature**

```ts
export declare function server(options: Navigation.InitialMemoryOptions): Layer.Layer<CoreServices>
```

Added in v1.0.0

## static

**Signature**

```ts
export declare const static: typeof static_
```

Added in v1.0.0

## static\_

**Signature**

```ts
function static_(options: Navigation.InitialMemoryOptions): Layer.Layer<CoreServices>
```

Added in v1.0.0
