---
title: RenderTemplate.ts
nav_order: 17
parent: "@typed/template"
---

## RenderTemplate overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [RenderTemplate](#rendertemplate)
  - [RenderTemplate (interface)](#rendertemplate-interface)
  - [as](#as)
  - [html](#html)

---

# utils

## RenderTemplate

**Signature**

```ts
export declare const RenderTemplate: Context.Tagged<RenderTemplate, RenderTemplate>
```

## RenderTemplate (interface)

**Signature**

```ts
export interface RenderTemplate {
  <Values extends ReadonlyArray<Renderable<any, any>>, T extends Rendered = Rendered>(
    templateStrings: TemplateStringsArray,
    values: Values,
    ref?: ElementRef<T, Placeholder.Error<Values[number]>>
  ): Effect<Scope | Placeholder.Context<Values[number]>, never, TemplateInstance<Placeholder.Error<Values[number]>, T>>
}
```

## as

**Signature**

```ts
export declare function as<T extends Rendered = Rendered, E = never>(ref: ElementRef<T, E>)
```

## html

**Signature**

```ts
export declare function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Effect<
  RenderTemplate | Scope | Placeholder.Context<Values[number]>,
  never,
  TemplateInstance<Placeholder.Error<Values[number]>, Rendered>
>
```
