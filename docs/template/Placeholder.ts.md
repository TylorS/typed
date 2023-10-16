---
title: Placeholder.ts
nav_order: 12
parent: "@typed/template"
---

## Placeholder overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Placeholder (interface)](#placeholder-interface)
  - [Placeholder (namespace)](#placeholder-namespace)
    - [Context (type alias)](#context-type-alias)
    - [Error (type alias)](#error-type-alias)
    - [Success (type alias)](#success-type-alias)

---

# utils

## Placeholder (interface)

**Signature**

```ts
export interface Placeholder<out R = never, out E = never, out A = unknown> {
  readonly __Placeholder__: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }
}
```

## Placeholder (namespace)

### Context (type alias)

**Signature**

```ts
export type Context<T> = [T] extends [never] ? never : T extends Placeholder<infer R, infer _E, infer _A> ? R : never
```

### Error (type alias)

**Signature**

```ts
export type Error<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer E, infer _A> ? E : never
```

### Success (type alias)

**Signature**

```ts
export type Success<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer _E, infer A> ? A : never
```
