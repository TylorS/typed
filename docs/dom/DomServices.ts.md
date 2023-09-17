---
title: DomServices.ts
nav_order: 2
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
export declare const makeDomServices: (params: DomServicesParams) => C.Context<DomServices>
```

Added in v8.19.0

# context

## DomServices

All of the core DOM services accessible via a single interfae

**Signature**

```ts
export declare const DomServices: C.Tagged<
  DomServices,
  {
    readonly globalThis: GlobalThis
    readonly window: Window
    readonly document: Document
    readonly rootElement: RootElement
    readonly parentElement: ParentElement
    readonly history: History
    readonly location: Location
    readonly navigator: Navigator
  }
>
```

Added in v8.19.0

## domServices

Create a Layer for DOM services that depend on a Window and GlobalThis

**Signature**

```ts
export declare const domServices: (
  params?: DomServicesElementParams
) => Layer.Layer<Window | GlobalThis, never, DomServices>
```

Added in v8.19.0

## provideDomServices

Provide DOM services to an Effect

**Signature**

```ts
export declare const provideDomServices: (
  window: Window & GlobalThis,
  params?: DomServicesElementParams
) => <R, E, A>(effect: Effect.Effect<DomServices | R, E, A>) => Effect.Effect<Exclude<R, DomServices>, E, A>
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
  readonly rootElement?: HTMLElement
  readonly parentElement?: HTMLElement
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
  readonly rootElement?: HTMLElement
  readonly parentElement?: HTMLElement
}
```

Added in v8.19.0
