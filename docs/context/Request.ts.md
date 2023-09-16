---
title: Request.ts
nav_order: 19
parent: "@typed/context"
---

## Request overview

Contextual wrappers around @effect/io/Request

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Request](#request)
  - [Request (namespace)](#request-namespace)
    - [Error (type alias)](#error-type-alias)
    - [Identifier (type alias)](#identifier-type-alias)
    - [Input (type alias)](#input-type-alias)
    - [InputArg (type alias)](#inputarg-type-alias)
    - [Req (type alias)](#req-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [RequestConstructor (interface)](#requestconstructor-interface)
- [models](#models)
  - [Request (interface)](#request-interface)

---

# constructors

## Request

Construct a Request implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare const Request: RequestConstructor
```

Added in v1.0.0

## Request (namespace)

Added in v1.0.0

### Error (type alias)

Extract the Error of a Request

**Signature**

```ts
export type Error<T> = R.Request.Error<Req<T>>
```

Added in v1.0.0

### Identifier (type alias)

Extract the Identifier of a Request

**Signature**

```ts
export type Identifier<T> = T extends Request<infer Id, infer _, infer __> ? Id : never
```

Added in v1.0.0

### Input (type alias)

Extract the Input of a Request

**Signature**

```ts
export type Input<T> = T extends Request<infer _, infer Input, infer __> ? Input : never
```

Added in v1.0.0

### InputArg (type alias)

Extract the InputArg of a Request

**Signature**

```ts
export type InputArg<T> = [keyof Input<T>] extends [never] ? [Input<T>?] : [Input<T>]
```

Added in v1.0.0

### Req (type alias)

Extract the Request of a Request

**Signature**

```ts
export type Req<T> = T extends Request<infer _, infer __, infer Req> ? Req : never
```

Added in v1.0.0

### Success (type alias)

Extract the Success of a Request

**Signature**

```ts
export type Success<T> = R.Request.Success<Req<T>>
```

Added in v1.0.0

## RequestConstructor (interface)

Construct a Request implementation to be utilized from the Effect Context.

**Signature**

```ts
export interface RequestConstructor {
  <Input, Req extends R.Request<any, any>>(makeRequest: (input: Input) => Req): {
    <const Id extends IdentifierFactory<any>>(id: Id): Request<IdentifierOf<Id>, Input, Req>
    <const Id>(id: Id): Request<IdentifierOf<Id>, Input, Req>
  }

  /**
   * Construct a tagged Request implementation to be utilized from the Effect Context.
   * @since 1.0.0
   * @category constructors
   */
  readonly tagged: <Req extends R.Request<any, any> & { readonly _tag: string }>(
    tag: Req['_tag']
  ) => {
    <const Id extends IdentifierFactory<any>>(id: Id): Request<
      IdentifierOf<Id>,
      Compact<Omit<Req, '_tag' | typeof R.RequestTypeId | keyof Data.Case>>,
      Req
    >
    <const Id>(id: Id): Request<
      IdentifierOf<Id>,
      Compact<Omit<Req, '_tag' | typeof R.RequestTypeId | keyof Data.Case>>,
      Req
    >
  }
  /**
   * Construct a Request implementation to be utilized from the Effect Context.
   * @since 1.0.0
   * @category constructors
   */
  readonly of: <Req extends R.Request<any, any>>() => {
    <const Id extends IdentifierFactory<any>>(id: Id): Request<
      IdentifierOf<Id>,
      Compact<Omit<Req, typeof R.RequestTypeId | keyof Data.Case>>,
      Req
    >
    <const Id>(id: Id): Request<IdentifierOf<Id>, Compact<Omit<Req, typeof R.RequestTypeId | keyof Data.Case>>, Req>
  }
}
```

Added in v1.0.0

# models

## Request (interface)

Contextual wrappers around @effect/io/Request

**Signature**

```ts
export interface Request<I, Input, Req extends R.Request<any, any>>
  extends Fn<I, (requests: Req) => Effect<never, R.Request.Error<Req>, R.Request.Success<Req>>> {
  /**
   * Make the request using the provided impleemtation from the Effect Context.
   * @since 1.0.0
   */
  readonly make: (...input: SimplifyInputArg<Input>) => Effect<I, R.Request.Error<Req>, R.Request.Success<Req>>
}
```

Added in v1.0.0
