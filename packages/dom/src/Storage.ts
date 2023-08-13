import * as O from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import type * as Layer from '@effect/io/Layer'
import type { ParseOptions } from '@effect/schema/AST'
import * as ParseResult from '@effect/schema/ParseResult'
import * as P from '@effect/schema/Parser'
import * as S from '@effect/schema/Schema'
import * as C from '@typed/context'
import type * as Fx from '@typed/fx'

import { addEventListener } from './EventTarget.js'
import { GlobalThis } from './GlobalThis.js'
import { Window } from './Window.js'

export interface Storage extends globalThis.Storage {}
export const Storage = C.Tag<Storage>('@typed/dom/Storage')

export const getItem = (key: string): StorageEffect<never, never, O.Option<string>> =>
  StorageEffect(
    Storage.with((s) => {
      try {
        return O.fromNullable(s.getItem(key))
      } catch (error) {
        console.error(error)
        return O.none()
      }
    }),
  )

export const setItem = (key: string, value: string): StorageEffect<never, never, void> =>
  StorageEffect(
    Storage.with((s) => {
      try {
        return s.setItem(key, value)
      } catch (error) {
        console.error(error)
      }
    }),
  )

export const removeItem = (key: string): StorageEffect<never, never, void> =>
  StorageEffect(
    Storage.with((s) => {
      try {
        return s.removeItem(key)
      } catch (error) {
        console.error(error)
      }
    }),
  )

export const sessionStorage: Layer.Layer<Window, never, Storage> = Storage.layer(
  Window.with((w) => w.sessionStorage),
)

export const localStorage: Layer.Layer<Window, never, Storage> = Storage.layer(
  Window.with((w) => w.localStorage),
)

const sendResources = Effect.all({
  globalThis: GlobalThis,
  window: Window,
  storage: Storage,
})

/**
 * Listen to cross-tab storage events. Additional opt-in to storageEvents.setItem and storageEvents.removeItem
 * to be able to replicate storage events in the same tab as well for a single source of truth, but this requires
 * the additional resources of GlobalThis and Window.
 */
export const storageEvents = Object.assign(Window.withFx(addEventListener('storage')), {
  /**
   * Send custom Storage Events for "in tab" storage changes
   */
  send: (
    key: string,
    oldValue: string | null,
    newValue: string | null,
  ): StorageEffect<GlobalThis | Window, never, void> =>
    StorageEffect(
      Effect.map(sendResources, (r) =>
        sendStorageEvent_(r.globalThis, r.window, r.storage, key, oldValue, newValue),
      ),
    ),
  getItem,
  setItem: (key: string, value: string): StorageEffect<GlobalThis | Window, never, void> =>
    StorageEffect(
      Storage.withEffect((s) =>
        Effect.suspend(() => {
          try {
            const oldValue = s.getItem(key)
            s.setItem(key, value)

            return oldValue === value ? Effect.unit : storageEvents.send(key, oldValue, value)
          } catch (error) {
            console.error(error)
            return Effect.unit
          }
        }),
      ),
    ),
  removeItem: (key: string): StorageEffect<GlobalThis | Window, never, void> =>
    StorageEffect(
      Storage.withEffect((s) =>
        Effect.suspend(() => {
          try {
            const oldValue = s.getItem(key)

            s.removeItem(key)

            return oldValue === null ? Effect.unit : storageEvents.send(key, oldValue, null)
          } catch (error) {
            console.error(error)
            return Effect.unit
          }
        }),
      ),
    ),
} as const) satisfies Fx.Fx<Window, never, StorageEvent>

function sendStorageEvent_(
  globalThis: GlobalThis,
  window: Window,
  storage: Storage,
  key: string,
  oldValue: string | null,
  newValue: string | null,
): void {
  const event = new globalThis.StorageEvent('storage', {
    key,
    oldValue,
    newValue,
    url: window.location.href,
    storageArea: storage,
  })

  window.dispatchEvent(event)
}

/**
 * SchemaStorage is a wrapper around Storage that allows you to store and retrieve values
 * that are parsed and encoded using a Schema. Given that storage is a string based key/value
 * store, this allows you to store and retrieve values that are not strings. JSON.stringify and
 * JSON.parse is used on the values to store and retrieve them.
 */
export interface SchemaStorage<Schema extends Readonly<Record<string, S.Schema<string, any>>>> {
  readonly schema: Schema

  readonly get: <K extends keyof Schema & string>(
    key: K,
    options?: ParseOptions,
  ) => StorageEffect<never, ParseResult.ParseError, O.Option<S.To<Schema[K]>>>

  readonly set: <K extends keyof Schema & string>(
    key: K,
    value: S.To<Schema[K]>,
    options?: ParseOptions,
  ) => StorageEffect<never, ParseResult.ParseError, void>

  readonly remove: <K extends keyof Schema & string>(key: K) => StorageEffect<never, never, void>

  readonly events: {
    readonly get: <K extends keyof Schema & string>(
      key: K,
      options?: ParseOptions,
    ) => StorageEffect<never, ParseResult.ParseError, O.Option<S.To<Schema[K]>>>

    readonly set: <K extends keyof Schema & string>(
      key: K,
      value: S.To<Schema[K]>,
      options?: ParseOptions,
    ) => StorageEffect<GlobalThis | Window, ParseResult.ParseError, void>

    readonly remove: <K extends keyof Schema & string>(
      key: K,
    ) => StorageEffect<GlobalThis | Window, never, void>
  }
}

const parseJson = <I, A>(schema: S.Schema<I, A>) =>
  S.transformResult(
    S.string,
    schema,
    (s, options) => {
      try {
        return S.decode(S.from(schema))(JSON.parse(s), options)
      } catch (err) {
        return ParseResult.failure(ParseResult.type(schema.ast, s))
      }
    },
    (i) => {
      try {
        return ParseResult.success(JSON.stringify(i))
      } catch {
        return ParseResult.failure(ParseResult.type(schema.ast, i))
      }
    },
  )

export type SchemaUtils = {
  readonly json: typeof parseJson
}

export function SchemaStorage<
  const Schemas extends Readonly<Record<string, S.Schema<string, any>>>,
>(getSchemas: (utils: SchemaUtils) => Schemas): SchemaStorage<Schemas> {
  const schemas = getSchemas({ json: parseJson })
  const decoders: Partial<{
    [K in keyof Schemas]: (
      i: S.From<Schemas[K]>,
      options?: ParseOptions,
    ) => Effect.Effect<never, ParseResult.ParseError, S.To<Schemas[K]>>
  }> = {}
  const getDecoder = <K extends keyof Schemas>(key: K): NonNullable<(typeof decoders)[K]> =>
    decoders[key] || (decoders[key] = P.decode(schemas[key]))

  const encoders: Partial<{
    [K in keyof Schemas]: (
      i: S.To<Schemas[K]>,
      options?: ParseOptions,
    ) => Effect.Effect<never, ParseResult.ParseError, S.From<Schemas[K]>>
  }> = {}
  const getEncoder = <K extends keyof Schemas>(key: K): NonNullable<(typeof encoders)[K]> =>
    encoders[key] || (encoders[key] = P.encode(schemas[key]))

  const get = <K extends keyof Schemas & string>(key: K, options?: ParseOptions) =>
    StorageEffect(
      Effect.gen(function* ($) {
        const option = yield* $(getItem(key))

        if (O.isNone(option)) {
          return O.none()
        }

        const decoder = getDecoder(key)

        const result = yield* $(decoder(option.value, options))

        return O.some(result)
      }),
    )

  const set = <K extends keyof Schemas & string>(
    key: K,
    value: S.To<Schemas[K]>,
    options?: ParseOptions,
  ) =>
    StorageEffect(
      Effect.gen(function* ($) {
        const encoder = getEncoder(key)
        const encoded = yield* $(encoder(value, options))

        return yield* $(setItem(key, encoded))
      }),
    )

  return {
    schema: schemas,
    get,
    set: <K extends keyof Schemas & string>(
      key: K,
      value: S.To<Schemas[K]>,
      options?: ParseOptions,
    ) => set(key, value, options),
    remove: <K extends keyof Schemas & string>(key: K) => StorageEffect(removeItem(key)),
    events: {
      get,
      set: <K extends keyof Schemas & string>(
        key: K,
        value: S.To<Schemas[K]>,
        options?: ParseOptions,
      ) =>
        StorageEffect(
          Effect.gen(function* ($) {
            const encoder = getEncoder(key)
            const encoded = yield* $(encoder(value, options))
            const json = JSON.stringify(encoded)

            return yield* $(storageEvents.setItem(key, json))
          }),
        ),
      remove: <K extends keyof Schemas & string>(key: K) => storageEvents.removeItem(key),
    },
  }
}

export interface StorageEffect<R, E, A> extends Effect.Effect<R | Storage, E, A> {
  readonly local: Effect.Effect<Window | Exclude<R, Storage>, E, A>
  readonly session: Effect.Effect<Window | Exclude<R, Storage>, E, A>
}

export function StorageEffect<R, E, A>(
  effect: Effect.Effect<R | Storage, E, A>,
): StorageEffect<Exclude<R, Storage>, E, A> {
  return Object.assign(effect, {
    local: Effect.provideSomeLayer(effect, localStorage),
    session: Effect.provideSomeLayer(effect, sessionStorage),
  }) as StorageEffect<Exclude<R, Storage>, E, A>
}
