---
title: RequestResolver.ts
nav_order: 20
parent: "@typed/context"
---

## RequestResolver overview

Contextual wrappers around @effect/io/RequestResolver

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [RequestResolver](#requestresolver)
- [models](#models)
  - [RequestResolver (interface)](#requestresolver-interface)
- [utils](#utils)
  - [RequestResolver (namespace)](#requestresolver-namespace)
    - [Identifier (type alias)](#identifier-type-alias)
    - [Identifiers (type alias)](#identifiers-type-alias)
    - [Requests (type alias)](#requests-type-alias)
    - [Resolver (type alias)](#resolver-type-alias)

---

# constructors

## RequestResolver

Construct a RequestResolver implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function RequestResolver<const Requests extends Readonly<Record<string, Request<any, any, any>>>>(
  requests: Requests
): {
  <const Id extends IdentifierFactory<any>>(id: Id): RequestResolver<IdentifierOf<Id>, Requests>
  <const Id>(id: Id): RequestResolver<IdentifierOf<Id>, Requests>
}
```

Added in v1.0.0

# models

## RequestResolver (interface)

Contextual wrappers around @effect/io/RequestResolver

**Signature**

```ts
export interface RequestResolver<Id, Requests extends Readonly<Record<string, Request<any, any, any>>>>
  extends Tag<Id, RR.RequestResolver<Request.Req<Requests[keyof Requests]>>> {
  readonly requests: Compact<DerivedRequests<Id, Requests>>

  readonly fromFunction: (
    f: (req: Request.Req<Requests[keyof Requests]>) => Request.Success<Requests[keyof Requests]>
  ) => Layer.Layer<Id | Request.Identifier<Requests[keyof Requests]>>

  readonly fromFunctionBatched: (
    f: (reqs: Array<Request.Req<Requests[keyof Requests]>>) => Array<Request.Success<Requests[keyof Requests]>>
  ) => Layer.Layer<Id | Request.Identifier<Requests[keyof Requests]>>

  readonly make: <R>(
    f: (req: Array<Array<Request.Req<Requests[keyof Requests]>>>) => Effect.Effect<void, never, R>
  ) => Layer.Layer<Id, never, R>

  readonly makeBatched: <R>(
    f: (req: Array<Request.Req<Requests[keyof Requests]>>) => Effect.Effect<void, never, R>
  ) => Layer.Layer<Id | Request.Identifier<Requests[keyof Requests]>, never, R>

  readonly makeWithEntry: <R>(
    f: (req: Array<Array<Req.Entry<Request.Req<Requests[keyof Requests]>>>>) => Effect.Effect<void, never, R>
  ) => Layer.Layer<Id | Request.Identifier<Requests[keyof Requests]>, never, R>
}
```

Added in v1.0.0

# utils

## RequestResolver (namespace)

Added in v1.0.0

### Identifier (type alias)

Extract the Identifier of a RequestResolver

**Signature**

```ts
export type Identifier<T> = T extends RequestResolver<infer Id, infer _> ? Id : never
```

Added in v1.0.0

### Identifiers (type alias)

Extract the Identifiers of a RequestResolver

**Signature**

```ts
export type Identifiers<T> = Identifier<T> | Request.Identifier<Requests<T>>
```

Added in v1.0.0

### Requests (type alias)

Extract the Requests of a RequestResolver

**Signature**

```ts
export type Requests<T> = T extends RequestResolver<infer _, infer Requests> ? Requests : never
```

Added in v1.0.0

### Resolver (type alias)

Extract the RequestResolver

**Signature**

```ts
export type Resolver<T> = RR.RequestResolver<Request.Req<Requests<T>[keyof Requests<T>]>, Identifiers<T>>
```

Added in v1.0.0
