---
title: Render.ts
nav_order: 13
parent: "@typed/template"
---

## Render overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [buildTemplate](#buildtemplate)
  - [render](#render)

---

# utils

## buildTemplate

**Signature**

```ts
export declare function buildTemplate(document: Document, { nodes }: Template.Template): DocumentFragment
```

## render

**Signature**

```ts
export declare function render<R, E, T extends RenderEvent | null>(
  rendered: Fx.Fx<R, E, T>
): Fx.Fx<Exclude<R, RenderTemplate> | Document | RenderContext | RootElement, E, ToRendered<T>>
```
