---
title: History.ts
nav_order: 5
parent: "@typed/dom"
---

## History overview

Low-level Effect wrappers for History and its usage via Context.

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [actions](#actions)
  - [back](#back)
  - [forward](#forward)
  - [getLength](#getlength)
  - [getScrollRestoration](#getscrollrestoration)
  - [getState](#getstate)
  - [go](#go)
  - [pushState](#pushstate)
  - [replaceState](#replacestate)
  - [setAutoScrollRestoration](#setautoscrollrestoration)
  - [setManualScrollRestoration](#setmanualscrollrestoration)
  - [setScrollRestoration](#setscrollrestoration)
- [context](#context)
  - [History](#history)
- [models](#models)
  - [History (interface)](#history-interface)

---

# actions

## back

Go back in the history

**Signature**

```ts
export declare const back: Effect.Effect<History, never, void>
```

Added in v8.19.0

## forward

Go forward in the history

**Signature**

```ts
export declare const forward: Effect.Effect<History, never, void>
```

Added in v8.19.0

## getLength

Get the number of history entries

**Signature**

```ts
export declare const getLength: Effect.Effect<History, never, number>
```

Added in v8.19.0

## getScrollRestoration

Get the current scroll restoration behavior

**Signature**

```ts
export declare const getScrollRestoration: Effect.Effect<History, never, ScrollRestoration>
```

Added in v8.19.0

## getState

get the current state from the History object

**Signature**

```ts
export declare const getState: Effect.Effect<History, never, unknown>
```

Added in v8.19.0

## go

Navigate to a delta in the history

**Signature**

```ts
export declare const go: (delta: number) => Effect.Effect<History, never, void>
```

Added in v8.19.0

## pushState

Call pushState on the History object

**Signature**

```ts
export declare const pushState: (url: string | URL, data?: unknown) => Effect.Effect<History, never, void>
```

Added in v8.19.0

## replaceState

Call replaceState on the History object

**Signature**

```ts
export declare const replaceState: (url: string | URL, data?: unknown) => Effect.Effect<History, never, void>
```

Added in v8.19.0

## setAutoScrollRestoration

Get the current scroll restoration behavior to "auto"

**Signature**

```ts
export declare const setAutoScrollRestoration: Effect.Effect<History, never, void>
```

Added in v8.19.0

## setManualScrollRestoration

Get the current scroll restoration behavior to "manual"

**Signature**

```ts
export declare const setManualScrollRestoration: Effect.Effect<History, never, void>
```

Added in v8.19.0

## setScrollRestoration

Set the current scroll restoration behavior

**Signature**

```ts
export declare const setScrollRestoration: (scrollRestoration: ScrollRestoration) => Effect.Effect<History, never, void>
```

Added in v8.19.0

# context

## History

A Context for the globalThis object

**Signature**

```ts
export declare const History: any
```

Added in v8.19.0

# models

## History (interface)

A Context for the History object

**Signature**

```ts
export interface History extends globalThis.History {}
```

Added in v8.19.0
