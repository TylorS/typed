---
title: EventHandler.ts
nav_order: 5
parent: "@typed/template"
---

## EventHandler overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [EventHandler](#eventhandler)
  - [EventHandler (interface)](#eventhandler-interface)
  - [EventHandlerTypeId](#eventhandlertypeid)
  - [EventHandlerTypeId (type alias)](#eventhandlertypeid-type-alias)

---

# utils

## EventHandler

**Signature**

```ts
export declare function EventHandler<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<R, E, unknown>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev>
```

## EventHandler (interface)

**Signature**

```ts
export interface EventHandler<R, E, Ev extends Event = Event> {
  readonly [EventHandlerTypeId]: EventHandlerTypeId
  readonly handler: (event: Ev) => Effect<R, E, unknown>
  readonly options: AddEventListenerOptions | undefined
}
```

## EventHandlerTypeId

**Signature**

```ts
export declare const EventHandlerTypeId: typeof EventHandlerTypeId
```

## EventHandlerTypeId (type alias)

**Signature**

```ts
export type EventHandlerTypeId = typeof EventHandlerTypeId
```
