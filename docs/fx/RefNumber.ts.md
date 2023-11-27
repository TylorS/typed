---
title: RefNumber.ts
nav_order: 20
parent: "@typed/fx"
---

## RefNumber overview

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [make](#make)
  - [of](#of)
  - [tagged](#tagged)
- [models](#models)
  - [RefNumber (interface)](#refnumber-interface)
- [utils](#utils)
  - [decrement](#decrement)
  - [increment](#increment)

---

# constructors

## make

Construct a new RefArray with the given initial value.

**Signature**

```ts
export declare function make<R, E>(
  initial: Effect.Effect<R, E, number>
): Effect.Effect<R | Scope, never, RefNumber<never, E>>
export declare function make<R, E>(initial: Fx.Fx<R, E, number>): Effect.Effect<R | Scope, never, RefNumber<never, E>>
```

Added in v1.18.0

## of

Construct a new RefArray with the given initial value.

**Signature**

```ts
export declare function of(initial: number): Effect.Effect<Scope, never, RefNumber<never, never>>
```

Added in v1.18.0

## tagged

Create a Tagged RefNumber

**Signature**

```ts
export declare const tagged: {
  <const I extends IdentifierConstructor<any>>(
    identifier: I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, number>
  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, number>
}
```

Added in v1.18.0

# models

## RefNumber (interface)

A RefSubject holding a number values

**Signature**

```ts
export interface RefNumber<R, E> extends RefSubject.RefSubject<R, E, number> {}
```

Added in v1.18.0

# utils

## decrement

Set the value to false

**Signature**

```ts
export declare const decrement: <R, E>(ref: RefNumber<R, E>) => Effect.Effect<R, E, number>
```

Added in v1.18.0

## increment

Set the value to true

**Signature**

```ts
export declare const increment: <R, E>(ref: RefNumber<R, E>) => Effect.Effect<R, E, number>
```

Added in v1.18.0
