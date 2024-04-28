---
title: RenderEvent.ts
nav_order: 19
parent: "@typed/template"
---

## RenderEvent overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [DomRenderEvent](#domrenderevent)
  - [DomRenderEvent (type alias)](#domrenderevent-type-alias)
  - [HtmlRenderEvent](#htmlrenderevent)
  - [HtmlRenderEvent (type alias)](#htmlrenderevent-type-alias)
  - [RenderEvent (type alias)](#renderevent-type-alias)
  - [isHtmlRenderEvent](#ishtmlrenderevent)
  - [isRenderEvent](#isrenderevent)

---

# utils

## DomRenderEvent

**Signature**

```ts
export declare function DomRenderEvent(rendered: Rendered): DomRenderEvent
```

Added in v1.0.0

## DomRenderEvent (type alias)

**Signature**

```ts
export type DomRenderEvent = {
  readonly _tag: "dom"
  readonly rendered: Rendered
  readonly valueOf: () => Rendered
}
```

Added in v1.0.0

## HtmlRenderEvent

**Signature**

```ts
export declare function HtmlRenderEvent(html: string, done: boolean): HtmlRenderEvent
```

Added in v1.0.0

## HtmlRenderEvent (type alias)

**Signature**

```ts
export type HtmlRenderEvent = {
  readonly _tag: "html"
  readonly html: string
  readonly done: boolean
  readonly valueOf: () => string
}
```

Added in v1.0.0

## RenderEvent (type alias)

**Signature**

```ts
export type RenderEvent = DomRenderEvent | HtmlRenderEvent
```

Added in v1.0.0

## isHtmlRenderEvent

**Signature**

```ts
export declare function isHtmlRenderEvent(value: unknown): value is HtmlRenderEvent
```

Added in v1.0.0

## isRenderEvent

**Signature**

```ts
export declare function isRenderEvent(value: unknown): value is RenderEvent
```

Added in v1.0.0
