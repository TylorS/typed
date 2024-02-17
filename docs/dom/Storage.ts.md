---
title: Storage.ts
nav_order: 11
parent: "@typed/dom"
---

## Storage overview

Low-level Effect wrappers for Storage, including session + localStorage, and its usage via Context.

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [SchemaKeyStorage](#schemakeystorage)
  - [SchemaStorage](#schemastorage)
  - [StorageEffect](#storageeffect)
- [context](#context)
  - [Storage](#storage)
  - [localStorage](#localstorage)
  - [sessionStorage](#sessionstorage)
- [getters](#getters)
  - [getItem](#getitem)
- [models](#models)
  - [SchemaKeyStorage (interface)](#schemakeystorage-interface)
  - [SchemaStorage (interface)](#schemastorage-interface)
  - [Storage (interface)](#storage-interface)
  - [StorageEffect (interface)](#storageeffect-interface)
- [setters](#setters)
  - [removeItem](#removeitem)
  - [setItem](#setitem)

---

# constructors

## SchemaKeyStorage

Construct a SchemaKeyStorage

**Signature**

```ts
export declare function SchemaKeyStorage<K extends string, R, O>(
  key: K,
  schema: S.Schema<O, string, R>
): SchemaKeyStorage<R, O>
```

Added in v8.19.0

## SchemaStorage

Construct a SchemaStorage

**Signature**

```ts
export declare function SchemaStorage<const Schemas extends Readonly<Record<string, S.Schema<any, string, any>>>>(
  schemas: Schemas
): SchemaStorage<Schemas>
```

Added in v8.19.0

## StorageEffect

StorageEffect is a small extension of an Effect, which has 2 additional properties:
local and session. These are utilized to run the effect with either localStorage or
sessionStorage.

**Signature**

```ts
export declare function StorageEffect<A, E, R>(effect: Effect.Effect<A, E, R>): StorageEffect<A, E, Exclude<R, Storage>>
```

Added in v8.19.0

# context

## Storage

The (local/session)Storage interface is a simple key/value store, used to store data
persistently across browser sessions.

**Signature**

```ts
export declare const Storage: Context.Tagged<Storage, Storage>
```

Added in v8.19.0

## localStorage

A Layer for using localStorage for Storage

**Signature**

```ts
export declare const localStorage: Layer.Layer<Storage, never, Window>
```

Added in v8.19.0

## sessionStorage

A Layer for using sessionStorage for Storage

**Signature**

```ts
export declare const sessionStorage: Layer.Layer<Storage, never, Window>
```

Added in v8.19.0

# getters

## getItem

Get an item from storage

**Signature**

```ts
export declare const getItem: (key: string) => StorageEffect<O.Option<string>>
```

Added in v8.19.0

# models

## SchemaKeyStorage (interface)

SchemaKeyStorage is effectively a lens into a specific key in a SchemaStorage.
It allows you to get/set/remove a value for a specific key.

**Signature**

```ts
export interface SchemaKeyStorage<R, O> {
  readonly schema: S.Schema<O, string, R>

  readonly get: (options?: ParseOptions) => StorageEffect<O.Option<O>, ParseResult.ParseError, R>

  readonly set: (value: O, options?: ParseOptions) => StorageEffect<void, ParseResult.ParseError, R>

  readonly remove: StorageEffect<void>
}
```

Added in v8.19.0

## SchemaStorage (interface)

SchemaStorage is a wrapper around Storage that allows you to store and retrieve values
that are parsed and encoded using a Schema. Given that storage is a string based key/value
store, this allows you to store and retrieve values that are not strings. JSON.stringify and
JSON.parse is used on the values to store and retrieve them.

**Signature**

```ts
export interface SchemaStorage<Schemas extends Readonly<Record<string, S.Schema<any, string, any>>>> {
  readonly schemas: Schemas

  readonly get: <K extends keyof Schemas & string>(
    key: K,
    options?: ParseOptions
  ) => StorageEffect<O.Option<S.Schema.To<Schemas[K]>>, ParseResult.ParseError, S.Schema.Context<Schemas[K]>>

  readonly set: <K extends keyof Schemas & string>(
    key: K,
    value: S.Schema.To<Schemas[K]>,
    options?: ParseOptions
  ) => StorageEffect<void, ParseResult.ParseError, S.Schema.Context<Schemas[K]>>

  readonly remove: <K extends keyof Schemas & string>(key: K) => StorageEffect<void>

  readonly key: <K extends keyof Schemas & string>(
    key: K
  ) => SchemaKeyStorage<S.Schema.Context<Schemas[K]>, S.Schema.To<Schemas[K]>>
}
```

Added in v8.19.0

## Storage (interface)

The (local/session)Storage interface is a simple key/value store, used to store data
persistently across browser sessions.

**Signature**

```ts
export interface Storage extends globalThis.Storage {}
```

Added in v8.19.0

## StorageEffect (interface)

StorageEffect is a small extension of an Effect, which has 2 additional properties:
local and session. These are utilized to run the effect with either localStorage or
sessionStorage.

**Signature**

```ts
export interface StorageEffect<A, E = never, R = never> extends Effect.Effect<A, E, Exclude<R, Storage> | Storage> {
  readonly local: Effect.Effect<A, E, Window | Exclude<R, Storage>>
  readonly session: Effect.Effect<A, E, Window | Exclude<R, Storage>>
}
```

Added in v8.19.0

# setters

## removeItem

Delete an item from storage

**Signature**

```ts
export declare const removeItem: (key: string) => StorageEffect<void>
```

Added in v8.19.0

## setItem

set an item from storage

**Signature**

```ts
export declare const setItem: (key: string, value: string) => StorageEffect<void>
```

Added in v8.19.0
