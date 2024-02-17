---
title: EventHandler.ts
nav_order: 5
parent: "@typed/template"
---

## EventHandler overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Context (type alias)](#context-type-alias)
  - [Error (type alias)](#error-type-alias)
  - [EventHandler (interface)](#eventhandler-interface)
  - [EventHandlerTypeId](#eventhandlertypeid)
  - [EventHandlerTypeId (type alias)](#eventhandlertypeid-type-alias)
  - [EventOf (type alias)](#eventof-type-alias)
  - [keys](#keys)
  - [make](#make)
  - [preventDefault](#preventdefault)
  - [stopImmediatePropagation](#stopimmediatepropagation)
  - [stopPropagation](#stoppropagation)
  - [target](#target)

---

# utils

## Context (type alias)

**Signature**

```ts
export type Context<T> = T extends EventHandler<infer R, infer _E, infer _Ev> ? R : never
```

Added in v1.0.0

## Error (type alias)

**Signature**

```ts
export type Error<T> = T extends EventHandler<infer _R, infer E, infer _Ev> ? E : never
```

Added in v1.0.0

## EventHandler (interface)

**Signature**

```ts
export interface EventHandler<R, E, Ev extends Event = Event> extends Placeholder<R, E, null> {
  readonly [EventHandlerTypeId]: EventHandlerTypeId
  readonly handler: (event: Ev) => Effect<unknown, E, R>
  readonly options: AddEventListenerOptions | undefined
}
```

Added in v1.0.0

## EventHandlerTypeId

**Signature**

```ts
export declare const EventHandlerTypeId: typeof EventHandlerTypeId
```

Added in v1.0.0

## EventHandlerTypeId (type alias)

**Signature**

```ts
export type EventHandlerTypeId = typeof EventHandlerTypeId
```

Added in v1.0.0

## EventOf (type alias)

**Signature**

```ts
export type EventOf<T> = T extends EventHandler<infer _R, infer _E, infer Ev> ? Ev : never
```

Added in v1.0.0

## keys

**Signature**

```ts
export declare function keys<Keys extends ReadonlyArray<string>>(...keys: Keys)
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev>
```

Added in v1.0.0

## preventDefault

**Signature**

```ts
export declare function preventDefault<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev>
```

Added in v1.0.0

## stopImmediatePropagation

**Signature**

```ts
export declare function stopImmediatePropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev>
```

Added in v1.0.0

## stopPropagation

**Signature**

```ts
export declare function stopPropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev>
```

Added in v1.0.0

## target

**Signature**

```ts
export declare function target<T extends HTMLElement>()
```

Added in v1.0.0
