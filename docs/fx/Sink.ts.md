---
title: Sink.ts
nav_order: 3
parent: "@typed/fx"
---

## Sink overview

Sink is a data structure that represents a place to send failures and successes
over time in an effectful manner.

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Sink](#sink)
  - [WithContext](#withcontext)
- [context](#context)
  - [provide](#provide)
- [models](#models)
  - [Sink (interface)](#sink-interface)
  - [WithContext (interface)](#withcontext-interface)
  - [WithEarlyExit (interface)](#withearlyexit-interface)
- [utils](#utils)
  - [Sink (namespace)](#sink-namespace)
    - [Error (type alias)](#error-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [WithContext (namespace)](#withcontext-namespace)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias-1)
    - [Success (type alias)](#success-type-alias-1)

---

# constructors

## Sink

Construct a Sink that can be used to handle failures and successes.

**Signature**

```ts
export declare function Sink<E, A>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<never, never, unknown>,
  onSuccess: (a: A) => Effect.Effect<never, never, unknown>
): Sink<E, A>
```

Added in v1.18.0

## WithContext

Construct a Sink that can be used to handle failures and successes with a Context.

**Signature**

```ts
export declare function WithContext<R, E, A, R2>(
  onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>,
  onSuccess: (a: A) => Effect.Effect<R2, never, unknown>
): WithContext<R | R2, E, A>
```

Added in v1.18.0

# context

## provide

Provide a Context to a Sink

**Signature**

```ts
export declare function provide<R, E, A>(sink: WithContext<R, E, A>, ctx: Context<R>): Sink<E, A>
```

Added in v1.18.0

# models

## Sink (interface)

Sink is a data structure that represents a place to send failures and successes
over time in an effectful manner.

**Signature**

```ts
export interface Sink<E, A> extends WithContext<never, E, A> {}
```

Added in v1.18.0

## WithContext (interface)

A Sink that can be used to handle failures and successes with a Context.

**Signature**

```ts
export interface WithContext<R, E, A> {
  readonly onFailure: (cause: Cause.Cause<E>) => Effect.Effect<R, never, unknown>
  readonly onSuccess: (a: A) => Effect.Effect<R, never, unknown>
}
```

Added in v1.18.0

## WithEarlyExit (interface)

A Sink which can be utilized to exit early from an Fx.
Useful for operators the end the stream early.

**Signature**

```ts
export interface WithEarlyExit<E, A> extends Sink<E, A> {
  readonly earlyExit: Effect.Effect<never, never, void>
}
```

Added in v1.18.0

# utils

## Sink (namespace)

Added in v1.18.0

### Error (type alias)

Extract the Error type from a Sink

**Signature**

```ts
export type Error<T> = T extends Sink<infer E, any> ? E : never
```

Added in v1.18.0

### Success (type alias)

Extract the Success type from a Sink

**Signature**

```ts
export type Success<T> = T extends Sink<any, infer A> ? A : never
```

Added in v1.18.0

## WithContext (namespace)

Added in v1.18.0

### Context (type alias)

Extract the Context type from a Sink

**Signature**

```ts
export type Context<T> = T extends WithContext<infer R, any, any> ? R : never
```

Added in v1.18.0

### Error (type alias)

Extract the Error type from a Sink

**Signature**

```ts
export type Error<T> = T extends WithContext<any, infer E, any> ? E : never
```

Added in v1.18.0

### Success (type alias)

Extract the Success type from a Sink

**Signature**

```ts
export type Success<T> = T extends WithContext<any, any, infer A> ? A : never
```

Added in v1.18.0
