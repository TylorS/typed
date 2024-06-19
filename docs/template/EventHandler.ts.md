---
title: EventHandler.ts
nav_order: 6
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
  - [EventOptions (type alias)](#eventoptions-type-alias)
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
export type Context<T> = T extends EventHandler<infer _Ev, infer _E, infer R> ? R : never
```

Added in v1.0.0

## Error (type alias)

**Signature**

```ts
export type Error<T> = T extends EventHandler<infer _Ev, infer E, infer _R> ? E : never
```

Added in v1.0.0

## EventHandler (interface)

**Signature**

```ts
export interface EventHandler<Ev extends Event = Event, E = never, R = never> extends Placeholder<never, E, R> {
  readonly [EventHandlerTypeId]: EventHandlerTypeId
  readonly handler: (event: Ev) => Effect.Effect<unknown, E, R>
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
export type EventOf<T> = T extends EventHandler<infer Ev, infer _E, infer _R> ? Ev : never
```

Added in v1.0.0

## EventOptions (type alias)

**Signature**

```ts
export type EventOptions = {
  readonly preventDefault?: boolean
  readonly stopPropagation?: boolean
  readonly stopImmediatePropagation?: boolean
}
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
export declare function make<Ev extends Event, E = never, R = never>(
  handler: (event: Ev) => Effect.Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R>
```

Added in v1.0.0

## preventDefault

**Signature**

```ts
export declare function preventDefault<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect.Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R>
```

Added in v1.0.0

## stopImmediatePropagation

**Signature**

```ts
export declare function stopImmediatePropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect.Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R>
```

Added in v1.0.0

## stopPropagation

**Signature**

```ts
export declare function stopPropagation<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect.Effect<unknown, E, R>,
  options?: AddEventListenerOptions
): EventHandler<Ev, E, R>
```

Added in v1.0.0

## target

**Signature**

```ts
export declare function target<T extends HTMLElement>(eventOptions?: {
  preventDefault?: boolean
  stopPropagation?: boolean
  stopImmediatePropagation?: boolean
})
```

Added in v1.0.0
