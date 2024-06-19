---
title: Hydrate.ts
nav_order: 9
parent: "@typed/template"
---

## Hydrate overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [hydrate](#hydrate)
  - [hydrateToLayer](#hydratetolayer)

---

# utils

## hydrate

**Signature**

```ts
export declare function hydrate<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<T, E, R>
): Fx.Fx<ToRendered<T>, E, R | RenderTemplate | RenderContext.RenderContext | RootElement>
```

Added in v1.0.0

## hydrateToLayer

**Signature**

```ts
export declare function hydrateToLayer<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<T, E, R>
): Layer.Layer<never, never, R | RenderTemplate | RenderContext.RenderContext | RootElement>
```

Added in v1.0.0
