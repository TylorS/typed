---
title: Identifier.ts
nav_order: 9
parent: "@typed/context"
---

## Identifier overview

Helpers for creating unique identifiers for Contextual implementations.

Oftentimes you won't need to use these directly, as it is embedded in all of
the Contextual implementations.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Identifier (interface)](#identifier-interface)
  - [IdentifierConstructor (interface)](#identifierconstructor-interface)
  - [IdentifierFactory (type alias)](#identifierfactory-type-alias)
  - [IdentifierInput (type alias)](#identifierinput-type-alias)
  - [IdentifierOf (type alias)](#identifierof-type-alias)
  - [id](#id)
  - [identifierToString](#identifiertostring)
  - [makeIdentifier](#makeidentifier)

---

# utils

## Identifier (interface)

A unique identifier for a Contextual implementation.

**Signature**

```ts
export interface Identifier<T> {
  readonly __identifier__: T
}
```

Added in v1.0.0

## IdentifierConstructor (interface)

A constructor for a unique identifier for a Contextual implementation.

**Signature**

```ts
export interface IdentifierConstructor<T> extends Identifier<T> {
  new (): Identifier<T>
}
```

Added in v1.0.0

## IdentifierFactory (type alias)

A factory for creating a unique identifier for a Contextual implementation.

**Signature**

```ts
export type IdentifierFactory<T> = (_id: typeof id) => IdentifierConstructor<T>
```

Added in v1.0.0

## IdentifierInput (type alias)

A factory, constructor, or instance of a unique identifier for a Contextual implementation.

**Signature**

```ts
export type IdentifierInput<T> = IdentifierFactory<T> | IdentifierConstructor<T> | T
```

Added in v1.0.0

## IdentifierOf (type alias)

Extract the Identifier from a Contextual implementation.

**Signature**

```ts
export type IdentifierOf<T> = T extends (_id: typeof id) => IdentifierConstructor<infer _>
  ? InstanceType<ReturnType<T>>
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends IdentifierConstructor<infer _>
  ? InstanceType<T>
  : T
```

Added in v1.0.0

## id

Construct a unique identifier for a Contextual implementation.

**Signature**

```ts
export declare function id<const T>(uniqueIdentifier: T): IdentifierConstructor<T>
```

Added in v1.0.0

## identifierToString

Convert an identifier to a string.

**Signature**

```ts
export declare function identifierToString(x: unknown): string
```

Added in v1.0.0

## makeIdentifier

Create an Identifier from a factory, constructor, or instance of an Identifier.

**Signature**

```ts
export declare function makeIdentifier<T>(input: IdentifierInput<T>): IdentifierOf<T>
```

Added in v1.0.0
