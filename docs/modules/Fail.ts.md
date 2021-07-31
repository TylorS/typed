---
title: Fail.ts
nav_order: 14
parent: Modules
---

## Fail overview

Fail is an Env-based abstraction for a try/catch style API
which is based on continuations to provide type-safe errors
with distinct channels to help separate errors that originate from different places.

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
- [Model](#model)
  - [Fail (type alias)](#fail-type-alias)
  - [Failure (interface)](#failure-interface)

---

# Combinator

## attempt

**Signature**

```ts
export declare const attempt: <Key extends string | number | symbol>(
  key: Key
) => <R, E, B>(
  env:
    | Env<Readonly<Record<Key, (e: E) => Resume<never>>>, B>
    | Env<R & Readonly<Record<Key, (e: E) => Resume<never>>>, B>
) => Env<R, Either<E, B>>
```

Added in v0.9.2

## catchError

**Signature**

```ts
export declare const catchError: <Key extends string | number | symbol>(
  key: Key
) => <E, R1, A>(
  onError: (err: E) => Env<R1, A>
) => {
  <R2>(
    env:
      | Env<Readonly<Record<Key, (e: E) => Resume<never>>>, A>
      | Env<R2 & Readonly<Record<Key, (e: E) => Resume<never>>>, A>
  ): Env<R1 & R2, A>
  (env: Env<Readonly<Record<Key, (e: E) => Resume<never>>>, A>): Env<R1, A>
}
```

Added in v0.9.2

## catchErrorW

**Signature**

```ts
export declare const catchErrorW: <Key extends string | number | symbol>(
  key: Key
) => <E, R1, A>(
  onError: (err: E) => Env<R1, A>
) => <R2, B>(
  env:
    | Env<Readonly<Record<Key, (e: E) => Resume<never>>>, B>
    | Env<R2 & Readonly<Record<Key, (e: E) => Resume<never>>>, B>
) => Env<R1 & R2, A | B>
```

Added in v0.9.2

# Constructor

## named

**Signature**

```ts
export declare const named: <E>() => <K extends string>(name: K) => Failure<K, E>
```

Added in v0.9.2

## throwError

**Signature**

```ts
export declare const throwError: <Key extends string | number | symbol>(
  key: Key
) => <E>(err: E) => Env<Readonly<Record<Key, (e: E) => Resume<never>>>, never>
```

Added in v0.9.2

# Model

## Fail (type alias)

**Signature**

```ts
export type Fail<Key extends PropertyKey, E> = Readonly<Record<Key, (e: E) => Resume<never>>>
```

Added in v0.9.2

## Failure (interface)

**Signature**

```ts
export interface Failure<K extends string, E> {
  readonly throw: (err: E) => Env<Fail<K, E>, never>

  readonly catchW: <R1, A>(
    onError: (err: E) => Env<R1, A>
  ) => <R2, B>(env: Env<Fail<K, E>, B> | Env<R2 & Fail<K, E>, B>) => Env<R1 & R2, A | B>

  readonly catch: <R1, A>(
    onError: (err: E) => Env<R1, A>
  ) => {
    <R2>(env: Env<Fail<K, E>, A> | Env<R2 & Fail<K, E>, A>): Env<R1 & R2, A>
    (env: Env<Fail<K, E>, A>): Env<R1, A>
  }

  readonly attempt: <R, B>(env: Env<Fail<K, E>, B> | Env<R & Fail<K, E>, B>) => Env<R, Either<E, B>>
}
```

Added in v0.9.2
