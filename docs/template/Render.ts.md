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
  rendered: Fx.Fx<R, E, T>
): Fx.Fx<Exclude<R, RenderTemplate> | Document | RenderContext | RootElement, E, ToRendered<T>>
```

Added in v1.0.0

## renderLayer

**Signature**

```ts
export declare function renderLayer<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
): Layer.Layer<never, never, Document | RenderContext | RootElement | Exclude<Exclude<R, RenderTemplate>, Scope.Scope>>
```

Added in v1.0.0
