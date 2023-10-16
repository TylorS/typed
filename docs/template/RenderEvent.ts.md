---
title: RenderEvent.ts
nav_order: 16
parent: "@typed/template"
---

## RenderEvent overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [DomRenderEvent](#domrenderevent)
  - [DomRenderEvent (type alias)](#domrenderevent-type-alias)
  - [HtmlRenderEvent](#htmlrenderevent)
  - [HtmlRenderEvent (type alias)](#htmlrenderevent-type-alias)
  - [RenderEvent (type alias)](#renderevent-type-alias)
  - [isRenderEvent](#isrenderevent)

---

# utils

## DomRenderEvent

**Signature**

```ts
export declare function DomRenderEvent(rendered: Rendered): DomRenderEvent
```

## DomRenderEvent (type alias)

**Signature**

```ts
export type DomRenderEvent = {
  readonly _tag: 'dom'
  readonly rendered: Rendered
  readonly valueOf: () => Rendered
}
```

## HtmlRenderEvent

**Signature**

```ts
export declare function HtmlRenderEvent(html: string): HtmlRenderEvent
```

## HtmlRenderEvent (type alias)

**Signature**

```ts
export type HtmlRenderEvent = {
  readonly _tag: 'html'
  readonly html: string
  readonly valueOf: () => string
}
```

## RenderEvent (type alias)

**Signature**

```ts
export type RenderEvent = DomRenderEvent | HtmlRenderEvent
```

## isRenderEvent

**Signature**

```ts
export declare function isRenderEvent(value: unknown): value is RenderEvent
```
