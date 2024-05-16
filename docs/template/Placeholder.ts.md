---
title: Placeholder.ts
nav_order: 14
parent: "@typed/template"
---

## Placeholder overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Placeholder (interface)](#placeholder-interface)
  - [Placeholder (namespace)](#placeholder-namespace)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Success (type alias)](#success-type-alias)
  - [PlaceholderTypeId](#placeholdertypeid)
  - [PlaceholderTypeId (type alias)](#placeholdertypeid-type-alias)

---

# utils

## Placeholder (interface)

**Signature**

```ts
export interface Placeholder<A = unknown, E = never, R = never> {
  readonly [PlaceholderTypeId]: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }
}
```

Added in v1.0.0

## Placeholder (namespace)

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any<A = any> =
  | Placeholder<A, any, any>
  | Placeholder<A, never, any>
  | Placeholder<A>
  | Placeholder<A, any>
  | Effect.Effect<A, any, any>
  // Null/Undefined cannot be modified globally to make them placeholders
  | ([A] extends [null] ? null : never)
  | ([A] extends [undefined] ? undefined : never)
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = [T] extends [never]
  ? never
  : T extends Effect.Effect<infer _A, infer _E, infer R>
    ? R
    : T extends Placeholder<infer _A, infer _E, infer R>
      ? R
      : never
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = [T] extends [never]
  ? never
  : T extends Effect.Effect<infer _A, infer E, infer _R>
    ? E
    : T extends Placeholder<infer _A, infer E, infer _R>
      ? E
      : never
```

Added in v1.0.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = [T] extends [never]
  ? never
  : T extends Effect.Effect<infer A, infer _E, infer _R>
    ? A
    : T extends Placeholder<infer A, infer _E, infer _R>
      ? A
      : never
```

Added in v1.0.0

## PlaceholderTypeId

**Signature**

```ts
export declare const PlaceholderTypeId: typeof PlaceholderTypeId
```

Added in v1.0.0

## PlaceholderTypeId (type alias)

**Signature**

```ts
export type PlaceholderTypeId = typeof PlaceholderTypeId
```

Added in v1.0.0
