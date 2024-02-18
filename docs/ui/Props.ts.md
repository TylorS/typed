---
title: Props.ts
nav_order: 6
parent: "@typed/ui"
---

## Props overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AttrsOf (type alias)](#attrsof-type-alias)
  - [BooleanAttrsOf (type alias)](#booleanattrsof-type-alias)
  - [DataProps (type alias)](#dataprops-type-alias)
  - [EventsOf (type alias)](#eventsof-type-alias)
  - [PropsOf (type alias)](#propsof-type-alias)
  - [RefOf (type alias)](#refof-type-alias)
  - [TypedPropertiesMap (type alias)](#typedpropertiesmap-type-alias)
  - [TypedProps (type alias)](#typedprops-type-alias)
  - [getEventHandler](#geteventhandler)

---

# utils

## AttrsOf (type alias)

**Signature**

```ts
export type AttrsOf<Props extends Record<string, any>> = {
  readonly [K in keyof Props]?: Props[K] | Placeholder.Any<Props[K]>
}
```

Added in v1.0.0

## BooleanAttrsOf (type alias)

**Signature**

```ts
export type BooleanAttrsOf<Attrs extends Record<string, any>> = {
  readonly [K in keyof Attrs as K extends string ? (boolean extends Attrs[K] ? `?${K}` : never) : never]?:
    | Attrs[K]
    | Placeholder.Any<Attrs[K]>
}
```

Added in v1.0.0

## DataProps (type alias)

**Signature**

```ts
export type DataProps = {
  readonly data?: ReadonlyRecord.ReadonlyRecord<any> | Placeholder.Any<ReadonlyRecord.ReadonlyRecord<any>> | undefined
}
```

Added in v1.0.0

## EventsOf (type alias)

**Signature**

```ts
export type EventsOf<El, EventMap extends {} = DefaultEventMap<El>> = {
  readonly [K in keyof EventMap as K extends string ? `on${Capitalize<K>}` : never]?:
    | EventHandler.EventHandler<EventWithCurrentTarget<El, Extract<EventMap[K], Event>>, any, any>
    | Effect.Effect<unknown, any, any>
    | null
    | undefined
}
```

Added in v1.0.0

## PropsOf (type alias)

**Signature**

```ts
export type PropsOf<Attrs extends Record<string, any>> = {
  readonly [K in keyof Attrs as K extends string ? `.${K}` : never]?: Attrs[K] | Placeholder.Any<Attrs[K]>
}
```

Added in v1.0.0

## RefOf (type alias)

**Signature**

```ts
export type RefOf<T extends Rendered> = {
  readonly ref?: ElementRef<T> | undefined
}
```

Added in v1.0.0

## TypedPropertiesMap (type alias)

**Signature**

```ts
export type TypedPropertiesMap = {
  readonly [K in keyof HTMLPropertiesMap]: K extends keyof HTMLElementTagNameMap
    ? TypedProps<HTMLPropertiesMap[K], HTMLElementTagNameMap[K]>
    : TypedProps<HTMLPropertiesMap[K], HTMLElement>
}
```

Added in v1.0.0

## TypedProps (type alias)

**Signature**

```ts
export type TypedProps<Input extends Record<string, any>, Element extends Rendered> = [
  AttrsOf<Input> & BooleanAttrsOf<Input> & PropsOf<Input> & EventsOf<Element> & RefOf<Element> & DataProps
] extends [infer R]
  ? { readonly [K in keyof R]: R[K] }
  : never
```

Added in v1.0.0

## getEventHandler

**Signature**

```ts
export declare function getEventHandler<R, E, Ev extends Event = Event>(
  handler: EventHandler.EventHandler<Ev, E, R> | Effect.Effect<unknown, E, R> | null | undefined
): EventHandler.EventHandler<Ev, E, R> | null
```

Added in v1.0.0
