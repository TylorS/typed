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
export interface Placeholder<out R = never, out E = never, out A = unknown> {
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
  | Placeholder<any, any, A>
  | Placeholder<any, never, A>
  | Placeholder<never, never, A>
  | Placeholder<never, any, A>
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = [T] extends [never] ? never : T extends Placeholder<infer R, infer _E, infer _A> ? R : never
```

Added in v1.0.0

### Error (type alias)

**Signature**

```ts
export type Error<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer E, infer _A> ? E : never
```

Added in v1.0.0

### Success (type alias)

**Signature**

```ts
export type Success<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer _E, infer A> ? A : never
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
