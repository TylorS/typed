---
title: Anchor.ts
nav_order: 1
parent: "@typed/ui"
---

## Anchor overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Anchor](#anchor)
  - [AnchorProps (type alias)](#anchorprops-type-alias)
  - [EventHandlerProps (type alias)](#eventhandlerprops-type-alias)
  - [GetEventHandlers (type alias)](#geteventhandlers-type-alias)
  - [GetEventHandlersContext (type alias)](#geteventhandlerscontext-type-alias)
  - [addEventListeners](#addeventlisteners)
  - [getEventHandler](#geteventhandler)
  - [getEventHandlers](#geteventhandlers)

---

# utils

## Anchor

**Signature**

```ts
export declare function Anchor<
  const Props extends AnchorProps,
  Children extends ReadonlyArray<Renderable<any, any>> = readonly []
>(
  props: Props,
  ...children: Children
): TemplateFx<
  Placeholder.Context<Props[keyof Props] | ReturnOf<Props["ref"]> | Children[number]>,
  Placeholder.Error<Props[keyof Props] | ReturnOf<Props["ref"]> | Children[number]>,
  HTMLAnchorElement
>
```

Added in v1.0.0

## AnchorProps (type alias)

**Signature**

```ts
export type AnchorProps = {
  readonly [K in keyof HTMLAnchorElementProperties]?:
    | HTMLAnchorElementProperties[K]
    | Placeholder.Any<HTMLAnchorElementProperties[K]>
    | undefined
} & {
  readonly ref?: ((ref: ElementSource<HTMLAnchorElement>) => Effect.Effect<any, any, any>) | undefined
  readonly data?: Placeholder.Any<ReadonlyRecord.ReadonlyRecord<any>> | undefined
} & EventHandlerProps<HTMLAnchorElement>
```

Added in v1.0.0

## EventHandlerProps (type alias)

**Signature**

```ts
export type EventHandlerProps<El extends HTMLElement | SVGElement, EventMap extends {} = DefaultEventMap<El>> = {
  readonly [K in keyof EventMap as K extends string ? `on${Capitalize<K>}` : never]?:
    | EventHandler.EventHandler<any, any, EventWithCurrentTarget<El, Extract<EventMap[K], Event>>>
    | Effect.Effect<any, any, unknown>
    | null
    | undefined
}
```

Added in v1.0.0

## GetEventHandlers (type alias)

**Signature**

```ts
export type GetEventHandlers<T extends EventHandlerProps<any>> = [
  ReadonlyArray<
    ValuesOf<{
      readonly [K in keyof T as K extends `on${string}` ? K : never]: readonly [ToEventType<K>, GetEventHandler<T[K]>]
    }>
  >
] extends [ReadonlyArray<infer R>]
  ? ReadonlyArray<R>
  : never
```

Added in v1.0.0

## GetEventHandlersContext (type alias)

**Signature**

```ts
export type GetEventHandlersContext<T extends EventHandlerProps<any>> = ValuesOf<{
  readonly [K in keyof T as K extends `on${string}` ? K : never]: EventHandler.Context<GetEventHandler<T[K]>>
}>
```

Added in v1.0.0

## addEventListeners

**Signature**

```ts
export declare function addEventListeners<Props extends EventHandlerProps<any>, T extends Rendered>(
  props: Props,
  ref: ElementSource<T>
): Effect.Effect<Scope.Scope | GetEventHandlersContext<Props>, never, void>
```

Added in v1.0.0

## getEventHandler

**Signature**

```ts
export declare function getEventHandler<R, E, Ev extends Event = Event>(
  handler: EventHandler.EventHandler<R, E, Ev> | Effect.Effect<R, E, unknown> | null | undefined
): EventHandler.EventHandler<R, E, Ev> | null
```

Added in v1.0.0

## getEventHandlers

**Signature**

```ts
export declare function getEventHandlers<Props extends EventHandlerProps<any>>(props: Props)
```

Added in v1.0.0
