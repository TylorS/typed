---
title: RefBoolean.ts
nav_order: 16
parent: "@typed/fx"
---

## RefBoolean overview

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
  - [tagged](#tagged)
- [models](#models)
  - [RefBoolean (interface)](#refboolean-interface)
- [utils](#utils)
  - [asFalse](#asfalse)
  - [asTrue](#astrue)
  - [toggle](#toggle)

---

# constructors

## make

Construct a new RefArray with the given initial value.

**Signature**

```ts
export declare function make<R, E>(
  initial: Effect.Effect<R, E, boolean>
): Effect.Effect<R | Scope, never, RefBoolean<never, E>>
export declare function make<R, E>(initial: Fx.Fx<R, E, boolean>): Effect.Effect<R | Scope, never, RefBoolean<never, E>>
```

Added in v1.18.0

## tagged

Create a Tagged RefBoolean

**Signature**

```ts
export declare const tagged: {
  <const I extends IdentifierConstructor<any>>(
    identifier: I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, boolean>
  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, boolean>
}
```

Added in v1.18.0

# models

## RefBoolean (interface)

A RefSubject holding a boolean values

**Signature**

```ts
export interface RefBoolean<R, E> extends RefSubject.RefSubject<R, E, boolean> {}
```

Added in v1.18.0

# utils

## asFalse

Set the value to false

**Signature**

```ts
export declare const asFalse: <R, E>(ref: RefBoolean<R, E>) => Effect.Effect<R, never, boolean>
```

Added in v1.18.0

## asTrue

Set the value to true

**Signature**

```ts
export declare const asTrue: <R, E>(ref: RefBoolean<R, E>) => Effect.Effect<R, never, boolean>
```

Added in v1.18.0

## toggle

Toggle the boolean value between true and false

**Signature**

```ts
export declare const toggle: <R, E>(ref: RefBoolean<R, E>) => Effect.Effect<R, E, boolean>
```

Added in v1.18.0
