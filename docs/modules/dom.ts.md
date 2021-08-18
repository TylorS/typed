---
title: dom.ts
nav_order: 12
parent: Modules
---

## dom overview

Added in v0.13.2

---

<h2 class="text-delta">Table of contents</h2>

- [DOM](#dom)
  - [getDocument](#getdocument)
  - [getHistory](#gethistory)
  - [getLocation](#getlocation)
  - [getRootElement](#getrootelement)
  - [getWindow](#getwindow)
  - [patch](#patch)
  - [queryRootElement](#queryrootelement)
  - [querySelector](#queryselector)
  - [querySelectorAll](#queryselectorall)
- [Effect](#effect)
  - [raf](#raf)
  - [whenIdle](#whenidle)
- [Environment](#environment)
  - [DocumentEnv (type alias)](#documentenv-type-alias)
  - [HistoryEnv (type alias)](#historyenv-type-alias)
  - [LocationEnv (type alias)](#locationenv-type-alias)
  - [QueryRootElementFailure (type alias)](#queryrootelementfailure-type-alias)
  - [RafEnv (type alias)](#rafenv-type-alias)
  - [RootElementEnv (type alias)](#rootelementenv-type-alias)
  - [WhenIdleEnv (type alias)](#whenidleenv-type-alias)
  - [WindowEnv (type alias)](#windowenv-type-alias)
- [Failure](#failure)
  - [QueryRootElementFailure](#queryrootelementfailure)
- [History](#history)
  - [getState](#getstate)
  - [goBack](#goback)
  - [goForward](#goforward)
  - [goTo](#goto)
  - [navigateTo](#navigateto)
  - [pushState](#pushstate)
  - [replaceState](#replacestate)
- [Location](#location)
  - [assign](#assign)
  - [getHash](#gethash)
  - [getHost](#gethost)
  - [getHostname](#gethostname)
  - [getHref](#gethref)
  - [getOrigin](#getorigin)
  - [getPathname](#getpathname)
  - [getPort](#getport)
  - [getProtocol](#getprotocol)
  - [getSearch](#getsearch)
  - [reload](#reload)
- [Type-level](#type-level)
  - [GetDefaultEventMap (type alias)](#getdefaulteventmap-type-alias)
  - [WithCurrentTarget (type alias)](#withcurrenttarget-type-alias)
- [Use](#use)
  - [useEventListener](#useeventlistener)
  - [useHashChange](#usehashchange)
  - [useHistory](#usehistory)
  - [useLocation](#uselocation)
  - [usePopstate](#usepopstate)
  - [useWhenUrlChanges](#usewhenurlchanges)

---

# DOM

## getDocument

**Signature**

```ts
export declare const getDocument: E.Env<DocumentEnv, Document>
```

Added in v0.13.2

## getHistory

**Signature**

```ts
export declare const getHistory: E.Env<HistoryEnv, History>
```

Added in v0.13.2

## getLocation

**Signature**

```ts
export declare const getLocation: E.Env<LocationEnv, Location>
```

Added in v0.13.2

## getRootElement

**Signature**

```ts
export declare const getRootElement: E.Env<RootElementEnv, Element>
```

Added in v0.13.2

## getWindow

**Signature**

```ts
export declare const getWindow: E.Env<WindowEnv, Window>
```

Added in v0.13.2

## patch

Common setup for rendering an application into an element

**Signature**

```ts
export declare const patch: <Patch extends (element: any, renderable: any) => any>(
  patch: Patch,
) => <E>(
  stream: RS.ReaderStream<E, ArgsOf<Patch>[1]>,
) => RS.ReaderStream<
  E &
    KV.Env &
    RootElementEnv &
    Fail.Fail<
      '@typed/fp/dom/QueryRootElementError',
      { readonly selector: string; readonly message: string }
    >,
  ArgsOf<Patch>[0]
>
```

Added in v0.13.4

## queryRootElement

Provide the root element to your application by querying for an element in the document

**Signature**

```ts
export declare const queryRootElement: (
  selector: string,
) => E.Env<
  Fail.Fail<
    '@typed/fp/dom/QueryRootElementError',
    { readonly selector: string; readonly message: string }
  > &
    DocumentEnv,
  RootElementEnv
>
```

Added in v0.13.2

## querySelector

**Signature**

```ts
export declare const querySelector: <S extends string>(
  selector: S,
) => <N extends ParentNode>(el: N) => O.Option<NonNullable<ParseSelector<S, A.Cast<N, Element>>>>
```

Added in v0.13.2

## querySelectorAll

**Signature**

```ts
export declare const querySelectorAll: <S extends string>(
  selector: S,
) => <N extends ParentNode>(el: N) => readonly ParseSelector<S, Element>[]
```

Added in v0.13.2

# Effect

## raf

**Signature**

```ts
export declare const raf: E.Env<RafEnv, number>
```

Added in v0.13.2

## whenIdle

**Signature**

```ts
export declare const whenIdle: E.Env<WhenIdleEnv, any>
```

Added in v0.13.2

# Environment

## DocumentEnv (type alias)

**Signature**

```ts
export type DocumentEnv = { readonly document: Document }
```

Added in v0.13.2

## HistoryEnv (type alias)

**Signature**

```ts
export type HistoryEnv = { readonly history: History }
```

Added in v0.13.2

## LocationEnv (type alias)

**Signature**

```ts
export type LocationEnv = { readonly location: Location }
```

Added in v0.13.2

## QueryRootElementFailure (type alias)

A Failure used to represent being unable to query for our RootElement

**Signature**

```ts
export type QueryRootElementFailure = Fail.EnvOf<typeof QueryRootElementFailure>
```

Added in v0.13.4

## RafEnv (type alias)

**Signature**

```ts
export type RafEnv = {
  readonly raf: Resume<number>
}
```

Added in v0.13.2

## RootElementEnv (type alias)

**Signature**

```ts
export type RootElementEnv = { readonly rootElement: Element }
```

Added in v0.13.2

## WhenIdleEnv (type alias)

**Signature**

```ts
export type WhenIdleEnv = {
  readonly whenIdle: Resume<IdleDeadline>
}
```

Added in v0.13.2

## WindowEnv (type alias)

**Signature**

```ts
export type WindowEnv = { readonly window: Window }
```

Added in v0.13.2

# Failure

## QueryRootElementFailure

A Failure used to represent being unable to query for our RootElement

**Signature**

```ts
export declare const QueryRootElementFailure: Fail.Failure<
  '@typed/fp/dom/QueryRootElementError',
  { readonly selector: string; readonly message: string }
>
```

Added in v0.13.4

# History

## getState

**Signature**

```ts
export declare const getState: E.Env<HistoryEnv, unknown>
```

Added in v0.13.2

## goBack

**Signature**

```ts
export declare const goBack: E.Env<HistoryEnv, void>
```

Added in v0.13.3

## goForward

**Signature**

```ts
export declare const goForward: E.Env<HistoryEnv, void>
```

Added in v0.13.3

## goTo

**Signature**

```ts
export declare const goTo: (n: number) => E.Env<HistoryEnv, void>
```

Added in v0.13.3

## navigateTo

**Signature**

```ts
export declare const navigateTo: (path: string) => E.Env<HistoryEnv, void>
```

Added in v0.13.2

## pushState

**Signature**

```ts
export declare const pushState: <A>(state: A, path: string) => E.Env<HistoryEnv, void>
```

Added in v0.13.2

## replaceState

**Signature**

```ts
export declare const replaceState: <A>(state: A, path: string) => E.Env<HistoryEnv, void>
```

Added in v0.13.2

# Location

## assign

**Signature**

```ts
export declare const assign: (url: string | URL) => E.Env<LocationEnv, void>
```

Added in v0.13.2

## getHash

**Signature**

```ts
export declare const getHash: E.Env<LocationEnv, string>
```

Added in v0.13.3

## getHost

**Signature**

```ts
export declare const getHost: E.Env<LocationEnv, string>
```

Added in v0.13.3

## getHostname

**Signature**

```ts
export declare const getHostname: E.Env<LocationEnv, string>
```

Added in v0.13.3

## getHref

**Signature**

```ts
export declare const getHref: E.Env<LocationEnv, string>
```

Added in v0.13.3

## getOrigin

**Signature**

```ts
export declare const getOrigin: E.Env<LocationEnv, string>
```

Added in v0.13.3

## getPathname

**Signature**

```ts
export declare const getPathname: E.Env<LocationEnv, string>
```

Added in v0.13.3

## getPort

**Signature**

```ts
export declare const getPort: E.Env<LocationEnv, string>
```

Added in v0.13.3

## getProtocol

**Signature**

```ts
export declare const getProtocol: E.Env<LocationEnv, string>
```

Added in v0.13.3

## getSearch

**Signature**

```ts
export declare const getSearch: E.Env<LocationEnv, string>
```

Added in v0.13.3

## reload

**Signature**

```ts
export declare const reload: E.Env<LocationEnv, void>
```

Added in v0.13.2

# Type-level

## GetDefaultEventMap (type alias)

Find the default EventMap for a given element

**Signature**

```ts
export type GetDefaultEventMap<Target> = Target extends Window
  ? WindowEventMap
  : Target extends Document
  ? DocumentEventMap
  : Target extends HTMLBodyElement
  ? HTMLBodyElementEventMap
  : Target extends HTMLVideoElement
  ? HTMLVideoElementEventMap
  : Target extends HTMLMediaElement
  ? HTMLMediaElementEventMap
  : Target extends HTMLFrameSetElement
  ? HTMLFrameSetElementEventMap
  : Target extends HTMLElement
  ? HTMLElementEventMap
  : Target extends SVGElement
  ? SVGElementEventMap
  : Target extends Element
  ? ElementEventMap
  : Readonly<Record<string, unknown>>
```

Added in v0.13.4

## WithCurrentTarget (type alias)

Append the proper CurrentTarget to an Event

**Signature**

```ts
export type WithCurrentTarget<Ev, Target> = Ev & { readonly currentTarget: Target }
```

Added in v0.13.4

# Use

## useEventListener

**Signature**

```ts
export declare const useEventListener: <
  E1,
  Target extends EventTarget,
  EventName extends string,
  E2,
  A,
>(
  getEventListener: E.Env<E1, O.Option<Target>>,
  eventName: EventName,
  onEvent: (
    event: WithCurrentTarget<GetDefaultEventMap<Target>[EventName], Target>,
  ) => E.Env<E2, A>,
) => E.Env<E1 & E2 & KV.Env & SchedulerEnv, O.Option<A>>
```

Added in v0.13.4

## useHashChange

**Signature**

```ts
export declare const useHashChange: () => E.Env<
  LocationEnv & WindowEnv & KV.Env & SchedulerEnv,
  string
>
```

Added in v0.13.2

## useHistory

**Signature**

```ts
export declare const useHistory: E.Env<
  LocationEnv & WindowEnv & KV.Env & SchedulerEnv & HistoryEnv,
  History
>
```

Added in v0.13.2

## useLocation

**Signature**

```ts
export declare const useLocation: E.Env<
  LocationEnv & WindowEnv & KV.Env & SchedulerEnv & HistoryEnv,
  Location
>
```

Added in v0.13.2

## usePopstate

**Signature**

```ts
export declare const usePopstate: () => E.Env<
  HistoryEnv & WindowEnv & KV.Env & SchedulerEnv,
  unknown
>
```

Added in v0.13.2

## useWhenUrlChanges

**Signature**

```ts
export declare const useWhenUrlChanges: <E, A>(
  env: E.Env<E, A>,
) => E.Env<LocationEnv & WindowEnv & KV.Env & SchedulerEnv & HistoryEnv & E, A>
```

Added in v0.13.2
