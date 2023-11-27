---
title: EventTarget.ts
nav_order: 4
parent: "@typed/dom"
---

## EventTarget overview

Low-level Effect wrappers for EventTarget APIs.

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [events](#events)
  - [AddEventListenerOptions (interface)](#addeventlisteneroptions-interface)
  - [EventWithCurrentTarget (type alias)](#eventwithcurrenttarget-type-alias)
  - [EventWithTarget (type alias)](#eventwithtarget-type-alias)
  - [addEventListener](#addeventlistener)
  - [dispatchEvent](#dispatchevent)
  - [isUsingKeyModifier](#isusingkeymodifier)

---

# events

## AddEventListenerOptions (interface)

Add an event listener to an EventTarget

**Signature**

```ts
export interface AddEventListenerOptions<T extends EventTarget, EventName extends string, R2>
  extends globalThis.AddEventListenerOptions {
  readonly eventName: EventName

  readonly handler: (
    event: EventWithCurrentTarget<T, DefaultEventMap<T>[EventName]>
  ) => Effect.Effect<R2, never, unknown>
}
```

Added in v8.19.0

## EventWithCurrentTarget (type alias)

Helper for creating an Event that has the currentTarget property set.

**Signature**

```ts
export type EventWithCurrentTarget<T, Ev = Event> = Ev & { currentTarget: T }
```

Added in v8.19.0

## EventWithTarget (type alias)

Helper for creating an Event that has the target property set.

**Signature**

```ts
export type EventWithTarget<T, Ev = Event> = Ev & { target: T }
```

Added in v8.19.0

## addEventListener

Add an event listener to an EventTarget

**Signature**

```ts
export declare const addEventListener: {
  <T extends EventTarget, EventName extends string, R = never>(
    options: AddEventListenerOptions<T, EventName, R>
  ): (target: T) => Effect.Effect<Scope.Scope | R, never, void>
  <T extends EventTarget, EventName extends string, R = never>(
    target: T,
    options: AddEventListenerOptions<T, EventName, R>
  ): Effect.Effect<Scope.Scope | R, never, void>
}
```

Added in v8.19.0

## dispatchEvent

Dispatch an event from an EventTarget

**Signature**

```ts
export declare const dispatchEvent: {
  <T extends EventTarget, EventName extends keyof DefaultEventMap<T>>(
    event: EventName,
    options?: EventInit
  ): (target: T) => Effect.Effect<GlobalThis, never, boolean>
  <T extends EventTarget, EventName extends keyof DefaultEventMap<T>>(
    target: T,
    event: EventName,
    options?: EventInit
  ): Effect.Effect<GlobalThis, never, boolean>
}
```

Added in v8.19.0

## isUsingKeyModifier

Check to see if a key modifier is being used

**Signature**

```ts
export declare function isUsingKeyModifier(event: KeyboardEvent | MouseEvent): boolean
```

Added in v8.19.0
