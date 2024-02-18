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
  - [renderToHtml](#rendertohtml)
  - [renderToHtmlString](#rendertohtmlstring)

---

# utils

## renderToHtml

**Signature**

```ts
export declare function renderToHtml<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>
): Fx.Fx<string, E, Exclude<R, RenderTemplate> | RenderContext>
```

Added in v1.0.0

## renderToHtmlString

**Signature**

```ts
export declare function renderToHtmlString<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>
): Effect.Effect<string, E, Exclude<R, RenderTemplate> | RenderContext>
```

Added in v1.0.0
