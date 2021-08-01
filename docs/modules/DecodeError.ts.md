---
title: DecodeError.ts
nav_order: 9
parent: Modules
---

## DecodeError overview

DecodeError representation of the various errors that might occur while decoding.

Added in v0.9.4

---

<h2 class="text-delta">Table of contents</h2>

- [Deconstructor](#deconstructor)
  - [drawError](#drawerror)
  - [drawErrors](#drawerrors)
- [Model](#model)
  - [DecodeError (type alias)](#decodeerror-type-alias)
  - [Index (interface)](#index-interface)
  - [Key (interface)](#key-interface)
  - [Lazy (interface)](#lazy-interface)
  - [Leaf (interface)](#leaf-interface)
  - [Member (interface)](#member-interface)
  - [MissingIndexes (interface)](#missingindexes-interface)
  - [MissingKeys (interface)](#missingkeys-interface)
  - [UnexpectedIndexes (interface)](#unexpectedindexes-interface)
  - [UnexpectedKeys (interface)](#unexpectedkeys-interface)
  - [Wrap (interface)](#wrap-interface)
- [Typeclass Constructor](#typeclass-constructor)
  - [getSemigroup](#getsemigroup)
- [constructors](#constructors)
  - [index](#index)
  - [key](#key)
  - [lazy](#lazy)
  - [leaf](#leaf)
  - [member](#member)
  - [missingIndexes](#missingindexes)
  - [missingKeys](#missingkeys)
  - [unexpectedIndexes](#unexpectedindexes)
  - [unexpectedKeys](#unexpectedkeys)
  - [wrap](#wrap)
- [destructors](#destructors)
  - [match](#match)
- [utils](#utils)
  - [DecodeErrors (type alias)](#decodeerrors-type-alias)

---

# Deconstructor

## drawError

**Signature**

```ts
export declare const drawError: (error: DecodeError) => string
```

Added in v0.9.4

## drawErrors

**Signature**

```ts
export declare const drawErrors: (fa: readonly DecodeError[]) => string
```

Added in v0.9.4

# Model

## DecodeError (type alias)

**Signature**

```ts
export type DecodeError =
  | Leaf
  | Key
  | MissingKeys
  | UnexpectedKeys
  | Index
  | MissingIndexes
  | UnexpectedIndexes
  | Member
  | Lazy
  | Wrap
```

Added in v0.9.4

## Index (interface)

**Signature**

```ts
export interface Index {
  readonly _tag: 'Index'
  readonly index: number
  readonly errors: DecodeErrors
}
```

Added in v0.9.4

## Key (interface)

**Signature**

```ts
export interface Key {
  readonly _tag: 'Key'
  readonly key: string
  readonly errors: DecodeErrors
}
```

Added in v0.9.4

## Lazy (interface)

**Signature**

```ts
export interface Lazy {
  readonly _tag: 'Lazy'
  readonly id: string
  readonly errors: DecodeErrors
}
```

Added in v0.9.4

## Leaf (interface)

**Signature**

```ts
export interface Leaf {
  readonly _tag: 'Leaf'
  readonly actual: unknown
  readonly error: string
}
```

Added in v0.9.4

## Member (interface)

**Signature**

```ts
export interface Member {
  readonly _tag: 'Member'
  readonly index: number
  readonly errors: DecodeErrors
}
```

Added in v0.9.4

## MissingIndexes (interface)

**Signature**

```ts
export interface MissingIndexes {
  readonly _tag: 'MissingIndexes'
  readonly indexes: readonly [number, ...number[]]
}
```

Added in v0.9.4

## MissingKeys (interface)

**Signature**

```ts
export interface MissingKeys {
  readonly _tag: 'MissingKeys'
  readonly keys: readonly [string, ...string[]]
}
```

Added in v0.9.4

## UnexpectedIndexes (interface)

**Signature**

```ts
export interface UnexpectedIndexes {
  readonly _tag: 'UnexpectedIndexes'
  readonly indexes: readonly [number, ...number[]]
}
```

Added in v0.9.4

## UnexpectedKeys (interface)

**Signature**

```ts
export interface UnexpectedKeys {
  readonly _tag: 'UnexpectedKeys'
  readonly keys: readonly [string, ...string[]]
}
```

Added in v0.9.4

## Wrap (interface)

**Signature**

```ts
export interface Wrap {
  readonly _tag: 'Wrap'
  readonly error: string
  readonly errors: DecodeErrors
}
```

Added in v2.2.9

# Typeclass Constructor

## getSemigroup

**Signature**

```ts
export declare function getSemigroup(): Semigroup<DecodeErrors>
```

Added in v0.9.4

# constructors

## index

**Signature**

```ts
export declare const index: (index: number, errors: DecodeErrors) => DecodeError
```

Added in v0.9.4

## key

**Signature**

```ts
export declare const key: (key: string, errors: DecodeErrors) => DecodeError
```

Added in v0.9.4

## lazy

**Signature**

```ts
export declare const lazy: (id: string, errors: DecodeErrors) => DecodeError
```

Added in v0.9.4

## leaf

**Signature**

```ts
export declare const leaf: (actual: unknown, error: string) => DecodeError
```

Added in v0.9.4

## member

**Signature**

```ts
export declare const member: (index: number, errors: DecodeErrors) => DecodeError
```

Added in v0.9.4

## missingIndexes

**Signature**

```ts
export declare const missingIndexes: (indexes: readonly [number, ...number[]]) => DecodeError
```

Added in v0.9.4

## missingKeys

**Signature**

```ts
export declare const missingKeys: (keys: readonly [string, ...string[]]) => DecodeError
```

Added in v0.9.4

## unexpectedIndexes

**Signature**

```ts
export declare const unexpectedIndexes: (indexes: readonly [number, ...number[]]) => DecodeError
```

Added in v0.9.4

## unexpectedKeys

**Signature**

```ts
export declare const unexpectedKeys: (keys: readonly [string, ...string[]]) => DecodeError
```

Added in v0.9.4

## wrap

**Signature**

```ts
export declare const wrap: (error: string, errors: DecodeErrors) => DecodeError
```

Added in v2.2.9

# destructors

## match

**Signature**

```ts
export declare const match: <R>(patterns: {
  Leaf: (input: unknown, error: string) => R
  Key: (key: string, errors: DecodeErrors) => R
  MissingKeys: (keys: readonly [string, ...string[]]) => R
  UnexpectedKeys: (keys: readonly [string, ...string[]]) => R
  Index: (index: number, errors: DecodeErrors) => R
  MissingIndexes: (indexes: readonly [number, ...number[]]) => R
  UnexpectedIndexes: (keys: readonly [number, ...number[]]) => R
  Member: (index: number, errors: DecodeErrors) => R
  Lazy: (id: string, errors: DecodeErrors) => R
  Wrap: (error: string, errors: DecodeErrors) => R
}) => (e: DecodeError) => R
```

Added in v0.9.4

# utils

## DecodeErrors (type alias)

**Signature**

```ts
export type DecodeErrors = ReadonlyNonEmptyArray<DecodeError>
```

Added in v0.9.4
