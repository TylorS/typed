---
title: Fail.ts
nav_order: 19
parent: Modules
---

## Fail overview

Fail is an Env-based abstraction for a try/catch style API which is based on continuations to
provide type-safe errors with distinct channels to help separate errors that originate from
different places.

Added in v0.9.2

---

<h2 class="text-delta">Table of contents</h2>

- [Combinator](#combinator)
  - [attempt](#attempt)
  - [catchError](#catcherror)
  - [catchErrorW](#catcherrorw)
- [Constructor](#constructor)
  - [named](#named)
  - [throwError](#throwerror)
- [Environment](#environment)
  - [criticalExpection](#criticalexpection)
- [Model](#model)
  - [Fail (type alias)](#fail-type-alias)
  - [Failure (interface)](#failure-interface)
- [Type-level](#type-level)
  - [EnvOf (type alias)](#envof-type-alias)
  - [ErrorOf (type alias)](#errorof-type-alias)
  - [KeyOf (type alias)](#keyof-type-alias)

---

# Combinator

## attempt

**Signature**

```ts
export declare const attempt: <Key extends string | number | symbol>(
  key: Key,
) => <R, E, B>(env: Env<Fail<Key, E>, B> | Env<R & Fail<Key, E>, B>) => Env<R, Either<E, B>>
```

Added in v0.9.2

## catchError

**Signature**

```ts
export declare const catchError: <Key extends string | number | symbol>(
  key: Key,
) => <E, R1, A>(
  onError: (err: E) => Env<R1, A>,
) => {
  <R2>(env: Env<Fail<Key, E>, A> | Env<R2 & Fail<Key, E>, A>): Env<R1 & R2, A>
  (env: Env<Fail<Key, E>, A>): Env<R1, A>
}
```

Added in v0.9.2

## catchErrorW

**Signature**

```ts
export declare const catchErrorW: <Key extends string | number | symbol>(
  key: Key,
) => <E, R1, A>(
  onError: (err: E) => Env<R1, A>,
) => <R2, B>(env: Env<Fail<Key, E>, B> | Env<R2 & Fail<Key, E>, B>) => Env<R1 & R2, A | B>
```

Added in v0.9.2

# Constructor

## named

**Signature**

```ts
export declare const named: <E>() => <K extends string | number | symbol>(name: K) => Failure<K, E>
```

Added in v0.9.2

## throwError

**Signature**

```ts
export declare const throwError: <Key extends string | number | symbol>(
  key: Key,
) => <E>(err: E) => Env<Fail<Key, E>, never>
```

Added in v0.9.2

# Environment

## criticalExpection

Creates a Provider for an Error which will throw an Exception. Reserve this only for _critical_
application errors

**Signature**

```ts
export declare const criticalExpection: <K extends string | number | symbol>(
  key: K,
) => <E>(f: (error: E) => string) => Fail<K, E>
```

Added in v0.13.4

# Model

## Fail (type alias)

**Signature**

```ts
export type Fail<Key extends PropertyKey, E> = {
  readonly [_ in Key]: (e: E) => Resume<never>
}
```

Added in v0.9.2

## Failure (interface)

**Signature**

```ts
export interface Failure<K extends PropertyKey, E> {
  readonly throw: (err: E) => Env<Fail<K, E>, never>

  readonly catchW: <R1, A>(
    onError: (err: E) => Env<R1, A>,
  ) => <R2, B>(env: Env<Fail<K, E>, B> | Env<R2 & Fail<K, E>, B>) => Env<R1 & R2, A | B>

  readonly catch: <R1, A>(
    onError: (err: E) => Env<R1, A>,
  ) => {
    <R2>(env: Env<Fail<K, E>, A> | Env<R2 & Fail<K, E>, A>): Env<R1 & R2, A>
    (env: Env<Fail<K, E>, A>): Env<R1, A>
  }

  readonly attempt: <R, B>(env: Env<Fail<K, E>, B> | Env<R & Fail<K, E>, B>) => Env<R, Either<E, B>>

  readonly criticalExpection: (f: (error: E) => string) => Fail<K, E>
}
```

Added in v0.9.2

# Type-level

## EnvOf (type alias)

**Signature**

```ts
export type EnvOf<A> = [A] extends [Failure<infer K, infer E>]
  ? Fail<K, E>
  : [A] extends [Fail<infer K, infer E>]
  ? Fail<K, E>
  : never
```

Added in v0.13.4

## ErrorOf (type alias)

**Signature**

```ts
export type ErrorOf<A> = [A] extends [Failure<infer _, infer E>]
  ? E
  : [A] extends [Fail<infer _, infer E>]
  ? E
  : never
```

Added in v0.13.4

## KeyOf (type alias)

**Signature**

```ts
export type KeyOf<A> = [A] extends [Failure<infer K, infer _>]
  ? K
  : [A] extends [Fail<infer K, infer _>]
  ? K
  : never
```

Added in v0.13.4
