/**
 * Low-level Effect wrappers for Storage, including session + localStorage, and its usage via Context.
 * @since 8.19.0
 */

import type { ParseOptions } from "@effect/schema/AST"
import * as P from "@effect/schema/Parser"
import type * as ParseResult from "@effect/schema/ParseResult"
import * as S from "@effect/schema/Schema"
import * as Context from "@typed/context"
import * as Effect from "effect/Effect"
import type * as Layer from "effect/Layer"
import * as O from "effect/Option"

import { Window } from "./Window.js"

/**
 * The (local/session)Storage interface is a simple key/value store, used to store data
 * persistently across browser sessions.
 * @since 8.19.0
 * @category models
 */
export interface Storage extends globalThis.Storage {}

/**
 * The (local/session)Storage interface is a simple key/value store, used to store data
 * persistently across browser sessions.
 * @since 8.19.0
 * @category context
 */
export const Storage: Context.Tagged<Storage> = Context.Tagged<Storage>("@typed/dom/Storage")

/**
 * Get an item from storage
 * @since 8.19.0
 * @category getters
 */
export const getItem: (key: string) => StorageEffect<O.Option<string>> = (
  key: string
): StorageEffect<O.Option<string>> =>
  StorageEffect(
    Storage.with((s) => {
      try {
        return O.fromNullable(s.getItem(key))
      } catch (error) {
        console.error(error)
        return O.none()
      }
    })
  )

/**
 * set an item from storage
 * @since 8.19.0
 * @category setters
 */
export const setItem: (key: string, value: string) => StorageEffect<void> = (
  key: string,
  value: string
): StorageEffect<void> =>
  StorageEffect(
    Storage.with((s) => {
      try {
        return s.setItem(key, value)
      } catch (error) {
        console.error(error)
      }
    })
  )

/**
 * Delete an item from storage
 * @since 8.19.0
 * @category setters
 */
export const removeItem: (key: string) => StorageEffect<void> = (
  key: string
): StorageEffect<void> =>
  StorageEffect(
    Storage.with((s) => {
      try {
        return s.removeItem(key)
      } catch (error) {
        console.error(error)
      }
    })
  )

/**
 * A Layer for using sessionStorage for Storage
 * @since 8.19.0
 * @category context
 */
export const sessionStorage: Layer.Layer<Storage, never, Window> = Storage.layer(
  Window.with((w) => w.sessionStorage)
)

/**
 * A Layer for using localStorage for Storage
 * @since 8.19.0
 * @category context
 */
export const localStorage: Layer.Layer<Storage, never, Window> = Storage.layer(
  Window.with((w) => w.localStorage)
)

/**
 * SchemaStorage is a wrapper around Storage that allows you to store and retrieve values
 * that are parsed and encoded using a Schema. Given that storage is a string based key/value
 * store, this allows you to store and retrieve values that are not strings. JSON.stringify and
 * JSON.parse is used on the values to store and retrieve them.
 *
 * @since 8.19.0
 * @category models
 */
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

/**
 * SchemaKeyStorage is effectively a lens into a specific key in a SchemaStorage.
 * It allows you to get/set/remove a value for a specific key.
 *
 * @since 8.19.0
 * @category models
 */
export interface SchemaKeyStorage<R, O> {
  readonly schema: S.Schema<O, string, R>

  readonly get: (
    options?: ParseOptions
  ) => StorageEffect<O.Option<O>, ParseResult.ParseError, R>

  readonly set: (
    value: O,
    options?: ParseOptions
  ) => StorageEffect<void, ParseResult.ParseError, R>

  readonly remove: StorageEffect<void>
}

/**
 * Construct a SchemaStorage
 * @since 8.19.0
 * @category constructors
 */
export function SchemaStorage<
  const Schemas extends Readonly<Record<string, S.Schema<any, string, any>>>
>(schemas: Schemas): SchemaStorage<Schemas> {
  const decoders: Partial<
    {
      [K in keyof Schemas]: (
        i: S.Schema.From<Schemas[K]>,
        options?: ParseOptions
      ) => Effect.Effect<S.Schema.To<Schemas[K]>, ParseResult.ParseError, S.Schema.Context<Schemas[K]>>
    }
  > = {}
  const getDecoder = <K extends keyof Schemas>(key: K): NonNullable<(typeof decoders)[K]> =>
    decoders[key] || (decoders[key] = P.decode(schemas[key]) as any)

  const encoders: Partial<
    {
      [K in keyof Schemas]: (
        i: S.Schema.To<Schemas[K]>,
        options?: ParseOptions
      ) => Effect.Effect<S.Schema.From<Schemas[K]>, ParseResult.ParseError>
    }
  > = {}
  const getEncoder = <K extends keyof Schemas>(key: K): NonNullable<(typeof encoders)[K]> =>
    encoders[key] || (encoders[key] = P.encode(schemas[key]) as any)

  const get = <K extends keyof Schemas & string>(key: K, options?: ParseOptions) =>
    StorageEffect(
      Effect.gen(function*($) {
        const option = yield* $(getItem(key))

        if (O.isNone(option)) {
          return O.none()
        }

        const decoder = getDecoder(key)

        const result = yield* $(decoder(option.value as S.Schema.From<Schemas[K]>, options))

        return O.some(result)
      })
    )

  const set = <K extends keyof Schemas & string>(
    key: K,
    value: S.Schema.To<Schemas[K]>,
    options?: ParseOptions
  ) =>
    StorageEffect(
      Effect.gen(function*($) {
        const encoder = getEncoder(key)
        const encoded = yield* $(encoder(value, options))

        return yield* $(setItem(key, encoded))
      })
    )

  return {
    schemas,
    get,
    set,
    remove: (key) => StorageEffect(removeItem(key)),
    key: (key) => SchemaKeyStorage(key, schemas[key])
  }
}

/**
 * Construct a SchemaKeyStorage
 * @since 8.19.0
 * @category constructors
 */
export function SchemaKeyStorage<K extends string, R, O>(
  key: K,
  schema: S.Schema<O, string, R>
): SchemaKeyStorage<R, O> {
  const decoder = S.decode(schema)
  const encoder = S.encode(schema)

  const get = (options?: ParseOptions): StorageEffect<O.Option<O>, ParseResult.ParseError, R> =>
    StorageEffect(
      Effect.gen(function*($) {
        const option = yield* $(getItem(key))

        if (O.isNone(option)) {
          return O.none()
        }

        const result = yield* $(decoder(option.value, options))

        return O.some(result)
      })
    )

  const set = (value: O, options?: ParseOptions) =>
    StorageEffect(
      Effect.gen(function*($) {
        const encoded = yield* $(encoder(value, options))

        return yield* $(setItem(key, encoded))
      })
    )

  return {
    schema,
    get,
    set,
    remove: StorageEffect(removeItem(key))
  }
}

/**
 * StorageEffect is a small extension of an Effect, which has 2 additional properties:
 * local and session. These are utilized to run the effect with either localStorage or
 * sessionStorage.
 *
 * @since 8.19.0
 * @category models
 */
export interface StorageEffect<A, E = never, R = never> extends Effect.Effect<A, E, Exclude<R, Storage> | Storage> {
  readonly local: Effect.Effect<A, E, Window | Exclude<R, Storage>>
  readonly session: Effect.Effect<A, E, Window | Exclude<R, Storage>>
}

/**
 * StorageEffect is a small extension of an Effect, which has 2 additional properties:
 * local and session. These are utilized to run the effect with either localStorage or
 * sessionStorage.
 *
 * @since 8.19.0
 * @category constructors
 */
export function StorageEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>
): StorageEffect<A, E, Exclude<R, Storage>> {
  return Object.assign(effect, {
    local: Effect.provide(effect, localStorage),
    session: Effect.provide(effect, sessionStorage)
  }) as StorageEffect<A, E, Exclude<R, Storage>>
}
