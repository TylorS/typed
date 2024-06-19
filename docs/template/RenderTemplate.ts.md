---
title: RenderTemplate.ts
nav_order: 22
parent: "@typed/template"
---

## RenderTemplate overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [RenderTemplate](#rendertemplate)
  - [RenderTemplate (interface)](#rendertemplate-interface)
  - [html](#html)

---

# utils

## RenderTemplate

**Signature**

```ts
export declare const RenderTemplate: Context.Tagged<RenderTemplate, RenderTemplate>
```

Added in v1.0.0

## RenderTemplate (interface)

**Signature**

```ts
export interface RenderTemplate {
  <Values extends ReadonlyArray<Renderable<any, any>>>(
    templateStrings: TemplateStringsArray,
    values: Values
  ): Fx.Fx<RenderEvent, Placeholder.Error<Values[number]>, Scope | RenderQueue | Placeholder.Context<Values[number]>>
}
```

Added in v1.0.0

## html

**Signature**

```ts
export declare function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<
  RenderEvent,
  Placeholder.Error<Values[number]>,
  RenderTemplate | RenderQueue | Scope | Placeholder.Context<Values[number]>
>
```

Added in v1.0.0
