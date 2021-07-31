---
title: function.ts
nav_order: 18
parent: Modules
---

## function overview

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Type-level](#type-level)
  - [AnyFn (type alias)](#anyfn-type-alias)
  - [ArgsOf (type alias)](#argsof-type-alias)
  - [Arity1 (type alias)](#arity1-type-alias)
  - [Arity2 (type alias)](#arity2-type-alias)
  - [Arity3 (type alias)](#arity3-type-alias)
  - [Arity4 (type alias)](#arity4-type-alias)
  - [Arity5 (type alias)](#arity5-type-alias)

---

# Type-level

## AnyFn (type alias)

**Signature**

```ts
export type AnyFn<R = any> = FunctionN<readonly any[], R>
```

Added in v0.9.2

## ArgsOf (type alias)

**Signature**

```ts
export type ArgsOf<A> = A extends FunctionN<infer R, any> ? R : never
```

Added in v0.9.2

## Arity1 (type alias)

**Signature**

```ts
export type Arity1<A, B> = FunctionN<[a: A], B>
```

Added in v0.9.2

## Arity2 (type alias)

**Signature**

```ts
export type Arity2<A, B, C> = FunctionN<[a: A, b: B], C>
```

Added in v0.9.2

## Arity3 (type alias)

**Signature**

```ts
export type Arity3<A, B, C, D> = FunctionN<[a: A, b: B, c: C], D>
```

Added in v0.9.2

## Arity4 (type alias)

**Signature**

```ts
export type Arity4<A, B, C, D, E> = FunctionN<[a: A, b: B, c: C, d: D], E>
```

Added in v0.9.2

## Arity5 (type alias)

**Signature**

```ts
export type Arity5<A, B, C, D, E, F> = FunctionN<[a: A, b: B, c: C, d: D, e: E], F>
```

Added in v0.9.2
