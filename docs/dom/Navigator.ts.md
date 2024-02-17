---
title: Navigator.ts
nav_order: 8
parent: "@typed/dom"
---

## Navigator overview

Low-level Effect wrappers for Location and its usage via Context.

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [actions](#actions)
  - [canShare](#canshare)
  - [share](#share)
  - [storeCredential](#storecredential)
  - [writeClipboard](#writeclipboard)
  - [writeClipboardText](#writeclipboardtext)
- [constructors](#constructors)
  - [createCredential](#createcredential)
  - [makeClipoboardItem](#makeclipoboarditem)
- [context](#context)
  - [Navigator](#navigator)
- [getters](#getters)
  - [checkCookieEnabled](#checkcookieenabled)
  - [checkOnline](#checkonline)
  - [checkPdfViewerEnabled](#checkpdfviewerenabled)
  - [getCredential](#getcredential)
  - [getCurrentPosition](#getcurrentposition)
  - [getHardwareConcurrency](#gethardwareconcurrency)
  - [getMaxTouchPoints](#getmaxtouchpoints)
  - [getMediaDevices](#getmediadevices)
  - [getMediaSession](#getmediasession)
  - [getUserAgent](#getuseragent)
  - [readClipboard](#readclipboard)
  - [readClipboardText](#readclipboardtext)
- [models](#models)
  - [Navigator (interface)](#navigator-interface)

---

# actions

## canShare

Check to see if the current navigator can share

**Signature**

```ts
export declare const canShare: (shareData?: ShareData) => Effect.Effect<boolean, never, Navigator>
```

Added in v8.19.0

## share

Share data with the current navigator

**Signature**

```ts
export declare const share: (shareData: ShareData) => Effect.Effect<void, never, Navigator>
```

Added in v8.19.0

## storeCredential

Store a Credential

**Signature**

```ts
export declare const storeCredential: (credential: Credential) => Effect.Effect<Credential, never, Navigator>
```

Added in v8.19.0

## writeClipboard

Write clipboard items

**Signature**

```ts
export declare const writeClipboard: (items: ClipboardItems) => Effect.Effect<void, never, Navigator>
```

Added in v8.19.0

## writeClipboardText

Write text from the clipboard

**Signature**

```ts
export declare const writeClipboardText: (text: string) => Effect.Effect<void, never, Navigator>
```

Added in v8.19.0

# constructors

## createCredential

Create a new Credential

**Signature**

```ts
export declare const createCredential: (
  options?: CredentialCreationOptions
) => Effect.Effect<Option<Credential>, never, Navigator>
```

Added in v8.19.0

## makeClipoboardItem

Create a new ClipboardItem

**Signature**

```ts
export declare const makeClipoboardItem: (
  items: Record<string, string | Blob | PromiseLike<string | Blob>>,
  options?: ClipboardItemOptions | undefined
) => Effect.Effect<ClipboardItem, never, GlobalThis>
```

Added in v8.19.0

# context

## Navigator

A Context for the Navigator API

**Signature**

```ts
export declare const Navigator: Context.Tagged<Navigator, Navigator>
```

Added in v8.19.0

# getters

## checkCookieEnabled

Check to see if the current navigator can utilize cookies

**Signature**

```ts
export declare const checkCookieEnabled: Effect.Effect<boolean, never, Navigator>
```

Added in v8.19.0

## checkOnline

Check to see if the current navigator is online

**Signature**

```ts
export declare const checkOnline: Effect.Effect<boolean, never, Navigator>
```

Added in v8.19.0

## checkPdfViewerEnabled

Check to see if the current navigator has a PDF viewer

**Signature**

```ts
export declare const checkPdfViewerEnabled: Effect.Effect<boolean, never, Navigator>
```

Added in v8.19.0

## getCredential

Get a Credential

**Signature**

```ts
export declare const getCredential: (
  options?: CredentialRequestOptions
) => Effect.Effect<Option<Credential>, never, Navigator>
```

Added in v8.19.0

## getCurrentPosition

Get the current navigator's geolocation

**Signature**

```ts
export declare const getCurrentPosition: (
  options?: PositionOptions
) => Effect.Effect<GeolocationPosition, GeolocationPositionError, Navigator>
```

Added in v8.19.0

## getHardwareConcurrency

Check to see if the current navigator concurrency

**Signature**

```ts
export declare const getHardwareConcurrency: Effect.Effect<number, never, Navigator>
```

Added in v8.19.0

## getMaxTouchPoints

Check to see if the current navigator's max touch points

**Signature**

```ts
export declare const getMaxTouchPoints: Effect.Effect<number, never, Navigator>
```

Added in v8.19.0

## getMediaDevices

Check to see if the current navigator has any media devices

**Signature**

```ts
export declare const getMediaDevices: Effect.Effect<MediaDevices, never, Navigator>
```

Added in v8.19.0

## getMediaSession

Check to see if the current navigator has any media sessions

**Signature**

```ts
export declare const getMediaSession: Effect.Effect<MediaSession, never, Navigator>
```

Added in v8.19.0

## getUserAgent

Get the current navigator's user agent

**Signature**

```ts
export declare const getUserAgent: Effect.Effect<string, never, Navigator>
```

Added in v8.19.0

## readClipboard

Read from the clipboard

**Signature**

```ts
export declare const readClipboard: Effect.Effect<ClipboardItems, never, Navigator>
```

Added in v8.19.0

## readClipboardText

Read text from the clipboard

**Signature**

```ts
export declare const readClipboardText: Effect.Effect<string, never, Navigator>
```

Added in v8.19.0

# models

## Navigator (interface)

A Context for the Navigator API

**Signature**

```ts
export interface Navigator extends globalThis.Navigator {}
```

Added in v8.19.0
