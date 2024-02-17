---
title: DomServices.ts
nav_order: 3
parent: "@typed/dom"
---

## DomServices overview

Low-level Effect wrappers for DOM APIS and usage from the Context.

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [makeDomServices](#makedomservices)
- [context](#context)
  - [DomServices](#domservices)
  - [domServices](#domservices-1)
  - [provideDomServices](#providedomservices)
- [models](#models)
  - [DomServices (type alias)](#domservices-type-alias)
- [params](#params)
  - [DomServicesElementParams (type alias)](#domserviceselementparams-type-alias)
  - [DomServicesParams (type alias)](#domservicesparams-type-alias)

---

# constructors

## makeDomServices

Create a DomServices Context

**Signature**

```ts
export declare const makeDomServices: (params: DomServicesParams) => Context.Context<DomServices>
```

Added in v8.19.0

# context

## DomServices

All of the core DOM services accessible via a single interfae

**Signature**

```ts
export declare const DomServices: Context.TaggedStruct<{
  readonly globalThis: Context.Tagged<GlobalThis, GlobalThis>
  readonly window: Context.Tagged<Window, Window>
  readonly document: Context.Tagged<Document, Document>
  readonly rootElement: Context.Tagged<RootElement, RootElement>
  readonly parentElement: Context.Tagged<ParentElement, ParentElement>
  readonly history: Context.Tagged<History, History>
  readonly location: Context.Tagged<Location, Location>
  readonly navigator: Context.Tagged<Navigator, Navigator>
}>
```

Added in v8.19.0

## domServices

Create a Layer for DOM services that depend on a Window and GlobalThis

**Signature**

```ts
export declare const domServices: (
  params?: DomServicesElementParams
) => Layer.Layer<DomServices, never, Window | GlobalThis>
```

Added in v8.19.0

## provideDomServices

Provide DOM services to an Effect

**Signature**

```ts
export declare const provideDomServices: (
  window: Window & GlobalThis,
  params?: DomServicesElementParams
) => <R, E, A>(effect: Effect.Effect<A, E, DomServices | R>) => Effect.Effect<A, E, Exclude<R, DomServices>>
```

Added in v8.19.0

# models

## DomServices (type alias)

All of the core DOM services

**Signature**

```ts
export type DomServices = GlobalThis | Window | Document | RootElement | ParentElement | History | Location | Navigator
```

Added in v8.19.0

# params

## DomServicesElementParams (type alias)

The elements to use for the root and parent elements

**Signature**

```ts
export type DomServicesElementParams = {
  readonly rootElement?: HTMLElement | undefined
  readonly parentElement?: HTMLElement | undefined
}
```

Added in v8.19.0

## DomServicesParams (type alias)

Parameters for creating DomServices

**Signature**

```ts
export type DomServicesParams = {
  readonly window: Window
  readonly globalThis: GlobalThis
  readonly rootElement?: HTMLElement | undefined
  readonly parentElement?: HTMLElement | undefined
}
```

Added in v8.19.0
