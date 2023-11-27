---
title: ParentElement.ts
nav_order: 9
parent: "@typed/dom"
---

## ParentElement overview

Contextual represenation of the parentElement of an HTMLElement

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [actions](#actions)
  - [dispatchEvent](#dispatchevent)
- [context](#context)
  - [ParentElement](#parentelement)
- [getters](#getters)
  - [addParentElementListener](#addparentelementlistener)
  - [querySelector](#queryselector)
  - [querySelectorAll](#queryselectorall)
- [models](#models)
  - [ParentElement (interface)](#parentelement-interface)

---

# actions

## dispatchEvent

Dispatch an Event from the current ParentElement

**Signature**

```ts
export declare const dispatchEvent: <EventName extends keyof HTMLElementEventMap>(
  event: EventName,
  options?: EventInit
) => Effect.Effect<GlobalThis | ParentElement, never, boolean>
```

Added in v8.19.0

# context

## ParentElement

A Context for the parentElement of an HTMLElement

**Signature**

```ts
export declare const ParentElement: Context.Tagged<ParentElement, ParentElement>
```

Added in v8.19.0

# getters

## addParentElementListener

Add an event listener to the current ParentElement

**Signature**

```ts
export declare const addParentElementListener: <EventName extends string, R = never>(
  options: EventTarget.AddEventListenerOptions<ParentNode & HTMLElement, EventName, R>
) => Effect.Effect<Scope.Scope | ParentElement | R, never, void>
```

Added in v8.19.0

## querySelector

Query for an element using a CSS selector, relative to the current ParentElement

**Signature**

```ts
export declare const querySelector: <A extends HTMLElement>(
  selector: string
) => Effect.Effect<ParentElement, never, Option.Option<A>>
```

Added in v8.19.0

## querySelectorAll

Query for multiple elements using a CSS selector, relative to the current ParentElement

**Signature**

```ts
export declare const querySelectorAll: <A extends HTMLElement>(
  selector: string
) => Effect.Effect<ParentElement, never, readonly A[]>
```

Added in v8.19.0

# models

## ParentElement (interface)

A Context for the parentElement of an HTMLElement

**Signature**

```ts
export interface ParentElement {
  readonly parentElement: ParentNode & HTMLElement
}
```

Added in v8.19.0
