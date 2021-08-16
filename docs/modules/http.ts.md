---
title: http.ts
nav_order: 30
parent: Modules
---

## http overview

Added in v0.9.4

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor](#constructor)
  - [http](#http)
- [Environment](#environment)
  - [HttpEnv (type alias)](#httpenv-type-alias)
- [Model](#model)
  - [HttpHeaders (type alias)](#httpheaders-type-alias)
  - [HttpMethod (type alias)](#httpmethod-type-alias)
  - [HttpResponse (interface)](#httpresponse-interface)
- [Options](#options)
  - [HttpOptions (type alias)](#httpoptions-type-alias)

---

# Constructor

## http

**Signature**

```ts
export declare const http: {
  (url: string, options?: HttpOptions | undefined): E.Env<
    {
      readonly http: (
        url: string,
        options?: HttpOptions | undefined,
      ) => E.Of<Ei.Either<Error, HttpResponse>>
    },
    Ei.Either<Error, HttpResponse>
  >
  readonly key: 'http'
}
```

Added in v0.9.4

# Environment

## HttpEnv (type alias)

**Signature**

```ts
export type HttpEnv = E.RequirementsOf<typeof http>
```

Added in v0.9.4

# Model

## HttpHeaders (type alias)

**Signature**

```ts
export type HttpHeaders = Readonly<Record<string, string | undefined>>
```

Added in v0.9.4

## HttpMethod (type alias)

**Signature**

```ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH' | 'HEAD'
```

Added in v0.9.4

## HttpResponse (interface)

**Signature**

```ts
export interface HttpResponse {
  readonly body: unknown
  readonly status: number
  readonly headers: HttpHeaders
}
```

Added in v0.9.4

# Options

## HttpOptions (type alias)

**Signature**

```ts
export type HttpOptions = {
  readonly method?: HttpMethod
  readonly headers?: HttpHeaders
  readonly body?: string
}
```

Added in v0.9.4
