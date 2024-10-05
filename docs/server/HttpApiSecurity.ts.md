---
title: HttpApiSecurity.ts
nav_order: 11
parent: "@typed/server"
---

## HttpApiSecurity overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [annotations](#annotations)
  - [annotate](#annotate)
  - [annotateMerge](#annotatemerge)
- [constructors](#constructors)
  - [apiKey](#apikey)
  - [authorization](#authorization)
  - [basic](#basic)
  - [bearer](#bearer)
- [models](#models)
  - [And (interface)](#and-interface)
  - [ApiKey (interface)](#apikey-interface)
  - [Authorization (interface)](#authorization-interface)
  - [Basic (interface)](#basic-interface)
  - [Credentials (interface)](#credentials-interface)
  - [HttpApiSecurity (type alias)](#httpapisecurity-type-alias)
  - [HttpApiSecurity (namespace)](#httpapisecurity-namespace)
    - [Proto (interface)](#proto-interface)
    - [Base (type alias)](#base-type-alias)
    - [Type (type alias)](#type-type-alias)
  - [Optional (interface)](#optional-interface)
  - [Or (interface)](#or-interface)
- [type ids](#type-ids)
  - [TypeId](#typeid)
  - [TypeId (type alias)](#typeid-type-alias)
- [utils](#utils)
  - [SecurityDecodeError (class)](#securitydecodeerror-class)
  - [and](#and)
  - [optional](#optional)
  - [or](#or)

---

# annotations

## annotate

**Signature**

```ts
export declare const annotate: {
  <I, S>(tag: Context.Tag<I, S>, value: S): <A extends HttpApiSecurity>(self: A) => A
  <A extends HttpApiSecurity, I, S>(self: A, tag: Context.Tag<I, S>, value: S): A
}
```

Added in v1.0.0

## annotateMerge

**Signature**

```ts
export declare const annotateMerge: {
  <I>(context: Context.Context<I>): <A extends HttpApiSecurity>(self: A) => A
  <A extends HttpApiSecurity, I>(self: A, context: Context.Context<I>): A
}
```

Added in v1.0.0

# constructors

## apiKey

Create an API key security scheme.

You can implement some api middleware for this security scheme using
`HttpApiBuilder.middlewareSecurity`.

To set the correct cookie in a handler, you can use
`HttpApiBuilder.securitySetCookie`.

**Signature**

```ts
export declare const apiKey: (options: {
  readonly key: string
  readonly in?: "header" | "query" | "cookie" | undefined
}) => ApiKey
```

Added in v1.0.0

## authorization

**Signature**

```ts
export declare const authorization: (scheme: string) => Authorization
```

Added in v1.0.0

## basic

**Signature**

```ts
export declare const basic: Basic
```

Added in v1.0.0

## bearer

Create an Bearer token security scheme.

You can implement some api middleware for this security scheme using
`HttpApiBuilder.middlewareSecurity`.

**Signature**

```ts
export declare const bearer: Authorization
```

Added in v1.0.0

# models

## And (interface)

**Signature**

```ts
export interface And<A extends HttpApiSecurity, B extends HttpApiSecurity>
  extends HttpApiSecurity.Proto<readonly [HttpApiSecurity.Type<A>, HttpApiSecurity.Type<B>]> {
  readonly _tag: "And"
  readonly first: A
  readonly second: A
}
```

Added in v1.0.0

## ApiKey (interface)

**Signature**

```ts
export interface ApiKey extends HttpApiSecurity.Proto<Redacted> {
  readonly _tag: "ApiKey"
  readonly in: "header" | "query" | "cookie"
  readonly key: string
}
```

Added in v1.0.0

## Authorization (interface)

**Signature**

```ts
export interface Authorization extends HttpApiSecurity.Proto<Redacted> {
  readonly _tag: "Authorization"
  readonly scheme: string
}
```

Added in v1.0.0

## Basic (interface)

**Signature**

```ts
export interface Basic extends HttpApiSecurity.Proto<Credentials> {
  readonly _tag: "Basic"
}
```

Added in v1.0.0

## Credentials (interface)

**Signature**

```ts
export interface Credentials {
  readonly username: string
  readonly password: Redacted
}
```

Added in v1.0.0

## HttpApiSecurity (type alias)

**Signature**

```ts
export type HttpApiSecurity =
  | HttpApiSecurity.Base
  | Optional<HttpApiSecurity>
  | Or<HttpApiSecurity, HttpApiSecurity>
  | And<HttpApiSecurity, HttpApiSecurity>
```

Added in v1.0.0

## HttpApiSecurity (namespace)

Added in v1.0.0

### Proto (interface)

**Signature**

```ts
export interface Proto<out A> extends Pipeable {
  readonly [TypeId]: {
    readonly _A: Covariant<A>
  }
  readonly annotations: Context.Context<never>
}
```

Added in v1.0.0

### Base (type alias)

**Signature**

```ts
export type Base = Authorization | ApiKey | Basic
```

Added in v1.0.0

### Type (type alias)

**Signature**

```ts
export type Type<A extends HttpApiSecurity> = A extends Proto<infer Out> ? Out : never
```

Added in v1.0.0

## Optional (interface)

**Signature**

```ts
export interface Optional<A extends HttpApiSecurity>
  extends HttpApiSecurity.Proto<Option.Option<HttpApiSecurity.Type<A>>> {
  readonly _tag: "Optional"
  readonly security: A
}
```

Added in v1.0.0

## Or (interface)

**Signature**

```ts
export interface Or<A extends HttpApiSecurity, B extends HttpApiSecurity>
  extends HttpApiSecurity.Proto<HttpApiSecurity.Type<A> | HttpApiSecurity.Type<B>> {
  readonly _tag: "Or"
  readonly first: A
  readonly second: B
}
```

Added in v1.0.0

# type ids

## TypeId

**Signature**

```ts
export declare const TypeId: typeof TypeId
```

Added in v1.0.0

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

Added in v1.0.0

# utils

## SecurityDecodeError (class)

**Signature**

```ts
export declare class SecurityDecodeError
```

Added in v1.0.0

## and

**Signature**

```ts
export declare const and: {
  <B extends HttpApiSecurity>(second: B): <A extends HttpApiSecurity>(first: A) => Or<A, B>
  <A extends HttpApiSecurity, B extends HttpApiSecurity>(first: A, second: B): Or<A, B>
}
```

Added in v1.0.0

## optional

**Signature**

```ts
export declare const optional: <A extends HttpApiSecurity>(security: A) => Optional<A>
```

Added in v1.0.0

## or

**Signature**

```ts
export declare const or: {
  <B extends HttpApiSecurity>(second: B): <A extends HttpApiSecurity>(first: A) => Or<A, B>
  <A extends HttpApiSecurity, B extends HttpApiSecurity>(first: A, second: B): Or<A, B>
}
```

Added in v1.0.0
