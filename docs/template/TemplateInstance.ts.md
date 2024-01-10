---
title: TemplateInstance.ts
nav_order: 22
parent: "@typed/template"
---

## TemplateInstance overview

Added in v1.0.0

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
  events: Fx.Fx<Scope, E, RenderEvent>,
  ref: ElementRef<T>
): TemplateInstance<E, T>
```

Added in v1.0.0

## TemplateInstance (interface)

**Signature**

```ts
export interface TemplateInstance<E, T extends Rendered = Rendered>
  extends Versioned.Versioned<never, never, Scope, E, RenderEvent, never, E | NoSuchElementException, T> {
  readonly [TemplateInstanceTypeId]: TemplateInstanceTypeId

  readonly query: ElementRef<T>["query"]

  readonly events: ElementRef<T>["events"]

  readonly elements: ElementRef<T>["elements"]

  readonly dispatchEvent: ElementRef<T>["dispatchEvent"]
}
```

Added in v1.0.0

## TemplateInstanceTypeId

**Signature**

```ts
export declare const TemplateInstanceTypeId: typeof TemplateInstanceTypeId
```

Added in v1.0.0

## TemplateInstanceTypeId (type alias)

**Signature**

```ts
export type TemplateInstanceTypeId = typeof TemplateInstanceTypeId
```

Added in v1.0.0
