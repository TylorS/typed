---
title: Window.ts
nav_order: 12
parent: "@typed/dom"
---

## Window overview

Low-level Effect wrappers for Window and its usage via Context.

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [context](#context)
  - [Window](#window)
- [events](#events)
  - [addWindowListener](#addwindowlistener)
- [getters](#getters)
  - [getComputedStyle](#getcomputedstyle)
  - [getInnerHeight](#getinnerheight)
  - [getInnerWidth](#getinnerwidth)
- [models](#models)
  - [Window (interface)](#window-interface)

---

# context

## Window

Context for the Window object

**Signature**

```ts
export declare const Window: Context.Tagged<Window, Window>
```

Added in v8.19.0

# events

## addWindowListener

Add an event listener to the Window

**Signature**

```ts
export declare const addWindowListener: <EventName extends string, R = never>(
  options: EventTarget.AddEventListenerOptions<Window, EventName, R>
) => Effect.Effect<void, never, Window | R | Scope.Scope>
```

Added in v8.19.0

# getters

## getComputedStyle

Get the computed style of an Element

**Signature**

```ts
export declare const getComputedStyle: (el: Element) => Effect.Effect<CSSStyleDeclaration, never, Window>
```

Added in v8.19.0

## getInnerHeight

Get the innerHeight from the Window

**Signature**

```ts
export declare const getInnerHeight: Effect.Effect<number, never, Window>
```

Added in v8.19.0

## getInnerWidth

Get the innerWidth from the Window

**Signature**

```ts
export declare const getInnerWidth: Effect.Effect<number, never, Window>
```

Added in v8.19.0

# models

## Window (interface)

Context for the Window object

**Signature**

```ts
export interface Window extends globalThis.Window {}
```

Added in v8.19.0
