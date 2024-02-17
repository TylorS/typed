---
title: RootElement.ts
nav_order: 10
parent: "@typed/dom"
---

## RootElement overview

Contextual represenation of the root element of your application

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [context](#context)
  - [RootElement](#rootelement)
- [models](#models)
  - [RootElement (interface)](#rootelement-interface)
  - [addRootElementListener](#addrootelementlistener)

---

# context

## RootElement

The root element of your application

**Signature**

```ts
export declare const RootElement: Context.Tagged<RootElement, RootElement>
```

Added in v8.19.0

# models

## RootElement (interface)

The root element of your application

**Signature**

```ts
export interface RootElement {
  readonly rootElement: ParentNode & HTMLElement
}
```

Added in v8.19.0

## addRootElementListener

Add an event listener to the root of your application.

**Signature**

```ts
export declare const addRootElementListener: <EventName extends string, R = never>(
  options: AddEventListenerOptions<ParentNode & HTMLElement, EventName, R>
) => Effect.Effect<void, never, Scope.Scope | R | RootElement>
```

Added in v8.19.0
