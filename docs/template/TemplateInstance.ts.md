---
title: TemplateInstance.ts
nav_order: 19
parent: "@typed/template"
---

## TemplateInstance overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [TemplateInstance](#templateinstance)
  - [TemplateInstance (interface)](#templateinstance-interface)
  - [TemplateInstanceTypeId](#templateinstancetypeid)
  - [TemplateInstanceTypeId (type alias)](#templateinstancetypeid-type-alias)

---

# utils

## TemplateInstance

**Signature**

```ts
export declare function TemplateInstance<T extends Rendered = Rendered, E = never>(
  events: Fx.Fx<never, E, RenderEvent>,
  ref: ElementRef<T, E>,
  parts: Parts
): TemplateInstance<E, T>
```

## TemplateInstance (interface)

**Signature**

```ts
export interface TemplateInstance<E, T extends Rendered = Rendered>
  extends Fx.Fx<never, E, RenderEvent>,
    Effect<never, E | NoSuchElementException, T> {
  readonly [TemplateInstanceTypeId]: TemplateInstanceTypeId

  readonly parts: Parts

  readonly query: ElementRef<T, E>['query']
  readonly events: ElementRef<T, E>['events']
  readonly elements: ElementRef<T, E>['elements']
}
```

## TemplateInstanceTypeId

**Signature**

```ts
export declare const TemplateInstanceTypeId: typeof TemplateInstanceTypeId
```

## TemplateInstanceTypeId (type alias)

**Signature**

```ts
export type TemplateInstanceTypeId = typeof TemplateInstanceTypeId
```
