---
title: Render.ts
nav_order: 16
parent: "@typed/template"
---

## Render overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ToRendered (type alias)](#torendered-type-alias)
  - [render](#render)
  - [renderLayer](#renderlayer)
  - [renderToLayer](#rendertolayer)

---

# utils

## ToRendered (type alias)

**Signature**

```ts
export type ToRendered<T extends RenderEvent | null> = T extends null ? Rendered | null : Rendered
```

Added in v1.0.0

## render

**Signature**

```ts
export declare function render<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<T, E, R>
): Fx.Fx<ToRendered<T>, E, R | RenderTemplate | RenderContext.RenderContext | RootElement>
```

Added in v1.0.0

## renderLayer

**Signature**

```ts
export declare const renderLayer: (
  window: Window & GlobalThis,
  options?: DomServicesElementParams
) => Layer.Layer<RenderTemplate | RenderContext.RenderContext | CurrentEnvironment | DomServices>
```

Added in v1.0.0

## renderToLayer

**Signature**

```ts
export declare function renderToLayer<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<T, E, R>
): Layer.Layer<never, never, RenderContext.RenderContext | RenderTemplate | RootElement | Exclude<R, Scope.Scope>>
```

Added in v1.0.0
