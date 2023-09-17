---
title: Location.ts
nav_order: 6
parent: "@typed/dom"
---

## Location overview

Low-level Effect wrappers for Location and its usage via Context.

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [actions](#actions)
  - [assign](#assign)
- [context](#context)
  - [Location](#location)
- [getters](#getters)
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
  - [replace](#replace)
- [models](#models)
  - [Location (interface)](#location-interface)

---

# actions

## assign

Assign the current URL

**Signature**

```ts
export declare const assign: (url: string) => Effect.Effect<Location, never, void>
```

Added in v8.19.0

# context

## Location

Context for the Location object

**Signature**

```ts
export declare const Location: any
```

Added in v8.19.0

# getters

## getHash

Get the hash from the current Location

**Signature**

```ts
export declare const getHash: Effect.Effect<Location, never, string>
```

Added in v8.19.0

## getHost

Get the host from the current Location

**Signature**

```ts
export declare const getHost: Effect.Effect<Location, never, string>
```

Added in v8.19.0

## getHostname

Get the hostname from the current Location

**Signature**

```ts
export declare const getHostname: Effect.Effect<Location, never, string>
```

Added in v8.19.0

## getHref

Get the href from the current Location

**Signature**

```ts
export declare const getHref: Effect.Effect<Location, never, string>
```

Added in v8.19.0

## getOrigin

Get the origin from the current Location

**Signature**

```ts
export declare const getOrigin: Effect.Effect<Location, never, string>
```

Added in v8.19.0

## getPathname

Get the pathname from the current Location

**Signature**

```ts
export declare const getPathname: Effect.Effect<Location, never, string>
```

Added in v8.19.0

## getPort

Get the port from the current Location

**Signature**

```ts
export declare const getPort: Effect.Effect<Location, never, string>
```

Added in v8.19.0

## getProtocol

Get the protocol from the current Location

**Signature**

```ts
export declare const getProtocol: Effect.Effect<Location, never, string>
```

Added in v8.19.0

## getSearch

Get the search params string from the current Location

**Signature**

```ts
export declare const getSearch: Effect.Effect<Location, never, URLSearchParams>
```

Added in v8.19.0

## reload

Reload the current URL

**Signature**

```ts
export declare const reload: Effect.Effect<Location, never, void>
```

Added in v8.19.0

## replace

Replace the current URL

**Signature**

```ts
export declare const replace: (url: string) => Effect.Effect<Location, never, void>
```

Added in v8.19.0

# models

## Location (interface)

Context for the Location object

**Signature**

```ts
export interface Location extends globalThis.Location {}
```

Added in v8.19.0
