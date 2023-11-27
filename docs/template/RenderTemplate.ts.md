---
title: RenderTemplate.ts
nav_order: 20
parent: "@typed/template"
---

## RenderTemplate overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [RenderTemplate](#rendertemplate)
  - [RenderTemplate (interface)](#rendertemplate-interface)
  - [TemplateFx (interface)](#templatefx-interface)
  - [as](#as)
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
  <Values extends ReadonlyArray<Renderable<any, any>>, T extends Rendered = Rendered>(
    templateStrings: TemplateStringsArray,
    values: Values,
    ref?: ElementRef<T>
  ): Effect.Effect<
    Scope | Placeholder.Context<readonly [] extends Values ? never : Values[number]>,
    never,
    TemplateInstance<Placeholder.Error<Values[number]>, T>
  >
}
```

Added in v1.0.0

## TemplateFx (interface)

**Signature**

```ts
export interface TemplateFx<R, E, T extends Rendered = Rendered>
  extends Fx.Fx<RenderTemplate | Scope | R, E, RenderEvent> {
  readonly instance: Effect.Effect<RenderTemplate | Scope | R, never, TemplateInstance<E, T>>
}
```

Added in v1.0.0

## as

**Signature**

```ts
export declare function as<T extends Rendered = Rendered>(ref: ElementRef<T>)
```

Added in v1.0.0

## html

**Signature**

```ts
export declare function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): TemplateFx<Placeholder.Context<Values[number]>, Placeholder.Error<Values[number]>>
```

Added in v1.0.0
