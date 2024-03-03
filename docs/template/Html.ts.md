---
title: Html.ts
nav_order: 6
parent: "@typed/template"
---

## Html overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [renderHtmlTemplate](#renderhtmltemplate)
  - [renderToHtml](#rendertohtml)
  - [renderToHtmlString](#rendertohtmlstring)
  - [serverLayer](#serverlayer)
  - [staticLayer](#staticlayer)

---

# utils

## renderHtmlTemplate

**Signature**

```ts
export declare function renderHtmlTemplate(ctx: RenderContext.RenderContext)
```

Added in v1.0.0

## renderToHtml

**Signature**

```ts
export declare function renderToHtml<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>
): Fx.Fx<string, E, R | RenderTemplate | RenderContext.RenderContext>
```

Added in v1.0.0

## renderToHtmlString

**Signature**

```ts
export declare function renderToHtmlString<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>
): Effect.Effect<string, E, R | RenderTemplate | RenderContext.RenderContext>
```

Added in v1.0.0

## serverLayer

**Signature**

```ts
export declare const serverLayer: Layer.Layer<
  RenderTemplate | RenderContext.RenderContext | CurrentEnvironment,
  never,
  never
>
```

Added in v1.0.0

## staticLayer

**Signature**

```ts
export declare const staticLayer: Layer.Layer<
  RenderTemplate | RenderContext.RenderContext | CurrentEnvironment,
  never,
  never
>
```

Added in v1.0.0
