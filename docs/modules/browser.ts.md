---
title: browser.ts
nav_order: 3
parent: Modules
---

## browser overview

Added in v0.9.4

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor](#constructor)
  - [broadcastChannel](#broadcastchannel)
  - [random16Bits](#random16bits)
  - [random32Bits](#random32bits)
  - [random8Bits](#random8bits)
- [DOM](#dom)
  - [getDocument](#getdocument)
  - [getHistory](#gethistory)
  - [getLocation](#getlocation)
  - [getRootElement](#getrootelement)
  - [getWindow](#getwindow)
  - [patchKVOnRaf](#patchkvonraf)
  - [patchKVWhenIdle](#patchkvwhenidle)
  - [queryRootElement](#queryrootelement)
  - [querySelector](#queryselector)
  - [querySelectorAll](#queryselectorall)
- [Effect](#effect)
  - [raf](#raf)
  - [whenIdle](#whenidle)
- [Environment](#environment)
  - [DocumentEnv (type alias)](#documentenv-type-alias)
  - [HistoryEnv (type alias)](#historyenv-type-alias)
  - [HttpEnv](#httpenv)
  - [LocationEnv (type alias)](#locationenv-type-alias)
  - [RafEnv (type alias)](#rafenv-type-alias)
  - [RootElementEnv (type alias)](#rootelementenv-type-alias)
  - [WhenIdleEnv (type alias)](#whenidleenv-type-alias)
  - [WindowEnv (type alias)](#windowenv-type-alias)
  - [rafEnv](#rafenv)
  - [whenIdleEnv](#whenidleenv)
- [History](#history)
  - [getState](#getstate)
  - [navigateTo](#navigateto)
  - [pushState](#pushstate)
  - [replaceState](#replacestate)
- [Location](#location)
  - [assign](#assign)
  - [reload](#reload)
- [Use](#use)
  - [useHashChange](#usehashchange)
  - [useHistory](#usehistory)
  - [useLocation](#uselocation)
  - [usePopstate](#usepopstate)
  - [useWhenUrlChanges](#usewhenurlchanges)

---

# Constructor

## broadcastChannel

Constructs an Adapter that utilizes a BroadcastChannel to communicate messages across all scripts of
the same origin, including workers.

_Note:_ An error will occur, and the stream will fail, if you send events which cannot be
structurally cloned. See
https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm

**Signature**

```ts
export declare const broadcastChannel: <A>(name: string) => readonly [(event: A) => void, Stream<A>]
```

Added in v0.12.2

## random16Bits

Utilize the Crypto API to generate 16-bit numbers

**Signature**

```ts
export declare const random16Bits: (count: number) => E.Of<readonly number[]>
```

Added in v0.12.2

## random32Bits

Utilize the Crypto API to generate 32-bit numbers

**Signature**

```ts
export declare const random32Bits: (count: number) => E.Of<readonly number[]>
```

Added in v0.12.2

## random8Bits

Utilize the Crypto API to generate 8-bit numbers

**Signature**

```ts
export declare const random8Bits: (count: number) => E.Of<readonly number[]>
```

Added in v0.12.2

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
export declare const getRootElement: E.Env<RootElementEnv, HTMLElement>
```

Added in v0.13.2

## getWindow

**Signature**

```ts
export declare const getWindow: E.Env<WindowEnv, Window>
```

Added in v0.13.2

## patchKVOnRaf

Common setup for rendering an application into an element queried from the DOM utilizing
requestAnimationFrame.

**Signature**

```ts
export declare const patchKVOnRaf: <A>(
  patch: (element: HTMLElement, renderable: A) => HTMLElement,
  selector: string,
) => <E>(env: E.Env<E, A>) => any
```

Added in v0.13.2

## patchKVWhenIdle

Common setup for rendering an application into an element queried from the DOM utilizing
requestAnimationFrame.

**Signature**

```ts
export declare const patchKVWhenIdle: <A>(
  patch: (element: HTMLElement, renderable: A) => HTMLElement,
  selector: string,
) => <E>(env: E.Env<E, A>) => any
```

Added in v0.13.2

## queryRootElement

Provide the root element to your application by querying for an element in the document

**Signature**

```ts
export declare const queryRootElement: <E extends HTMLElement>(selector: string) => any
```

Added in v0.13.2

## querySelector

**Signature**

```ts
export declare const querySelector: <E extends Element>(selector: string) => any
```

Added in v0.13.2

## querySelectorAll

**Signature**

```ts
export declare const querySelectorAll: <E extends Element>(selector: string) => any
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

## HttpEnv

**Signature**

```ts
export declare const HttpEnv: {
  readonly http: (
    url: string,
    options?: http.HttpOptions | undefined,
  ) => E.Of<Ei.Either<Error, http.HttpResponse>>
}
```

Added in v0.9.4

## LocationEnv (type alias)

**Signature**

```ts
export type LocationEnv = { readonly location: Location }
```

Added in v0.13.2

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
export type RootElementEnv = { readonly rootElement: HTMLElement }
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

## rafEnv

**Signature**

```ts
export declare const rafEnv: RafEnv
```

Added in v0.13.2

## whenIdleEnv

**Signature**

```ts
export declare const whenIdleEnv: WhenIdleEnv
```

Added in v0.13.2

# History

## getState

**Signature**

```ts
export declare const getState: any
```

Added in v0.13.2

## navigateTo

**Signature**

```ts
export declare const navigateTo: (path: string) => any
```

Added in v0.13.2

## pushState

**Signature**

```ts
export declare const pushState: <A>(state: A, path: string) => any
```

Added in v0.13.2

## replaceState

**Signature**

```ts
export declare const replaceState: <A>(state: A, path: string) => any
```

Added in v0.13.2

# Location

## assign

**Signature**

```ts
export declare const assign: (url: string | URL) => any
```

Added in v0.13.2

## reload

**Signature**

```ts
export declare const reload: any
```

Added in v0.13.2

# Use

## useHashChange

**Signature**

```ts
export declare const useHashChange: () => any
```

Added in v0.13.2

## useHistory

**Signature**

```ts
export declare const useHistory: any
```

Added in v0.13.2

## useLocation

**Signature**

```ts
export declare const useLocation: any
```

Added in v0.13.2

## usePopstate

**Signature**

```ts
export declare const usePopstate: () => any
```

Added in v0.13.2

## useWhenUrlChanges

**Signature**

```ts
export declare const useWhenUrlChanges: <E, A>(env: E.Env<E, A>) => any
```

Added in v0.13.2
