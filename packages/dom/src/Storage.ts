import * as Effect from '@effect/io/Effect'
import type * as Layer from '@effect/io/Layer'
import { pipe } from '@fp-ts/data/Function'
import * as E from '@fp-ts/data/Either'
import * as O from '@fp-ts/data/Option'
import * as C from '@typed/context'
import type * as Fx from '@typed/fx'
import type * as S from '@fp-ts/schema/Schema'
import * as P from '@fp-ts/schema/Parser'
import type { ParseError, ParseResult } from '@fp-ts/schema/ParseError'

import { addEventListener } from './EventTarget.js'
import { GlobalThis } from './GlobalThis.js'
import { Window } from './Window.js'

export interface Storage extends globalThis.Storage {}
export const Storage = C.Tag<Storage>('@typed/dom/Storage')

export const getItem = (key: string): StorageEffect<never, never, O.Option<string>> =>
  StorageEffect(Storage.with((s) => O.fromNullable(s.getItem(key))))

export const setItem = (key: string, value: string): StorageEffect<never, never, void> =>
  StorageEffect(Storage.with((s) => s.setItem(key, value)))

export const removeItem = (key: string): StorageEffect<never, never, void> =>
  StorageEffect(Storage.with((s) => s.removeItem(key)))

export const sessionStorage: Layer.Layer<Window, never, Storage> = Storage.layer(
  Window.with((w) => w.sessionStorage),
)

export const localStorage: Layer.Layer<Window, never, Storage> = Storage.layer(
  Window.with((w) => w.localStorage),
)

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
      GlobalThis.withEffect((g) =>
        Window.withEffect((w) =>
          Storage.withEffect((s) =>
            Effect.sync(() => sendStorageEvent_(g, w, s, key, oldValue, newValue)),
          ),
        ),
      ),
    ),
  setItem: (key: string, value: string): StorageEffect<GlobalThis | Window, never, void> =>
    StorageEffect(
      Storage.withEffect((s) =>
        Effect.suspendSucceed(() => {
          const oldValue = s.getItem(key)
          s.setItem(key, value)

          return oldValue === value ? Effect.unit() : storageEvents.send(key, oldValue, value)
        }),
      ),
    ),
  removeItem: (key: string): StorageEffect<GlobalThis | Window, never, void> =>
    StorageEffect(
      Storage.withEffect((s) =>
        Effect.suspendSucceed(() => {
          const oldValue = s.getItem(key)

          s.removeItem(key)

          return oldValue === null ? Effect.unit() : storageEvents.send(key, oldValue, null)
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
export interface SchemaStorage<S extends Record<string, S.Schema<any>>> {
  readonly schema: S

  readonly get: <K extends keyof S & string>(
    key: K,
    options?: P.ParseOptions,
  ) => StorageEffect<never, SchemaParseError, O.Option<S.Infer<S[K]>>>

  readonly set: <K extends keyof S & string>(
    key: K,
    value: S.Infer<S[K]>,
    options?: P.ParseOptions,
  ) => StorageEffect<never, never, void>

  readonly remove: <K extends keyof S & string>(key: K) => StorageEffect<never, never, void>

  readonly events: {
    readonly get: <K extends keyof S & string>(
      key: K,
      options?: P.ParseOptions,
    ) => StorageEffect<never, SchemaParseError, O.Option<S.Infer<S[K]>>>

    readonly set: <K extends keyof S & string>(
      key: K,
      value: S.Infer<S[K]>,
      options?: P.ParseOptions,
    ) => StorageEffect<GlobalThis | Window, never, void>

    readonly remove: <K extends keyof S & string>(
      key: K,
    ) => StorageEffect<GlobalThis | Window, never, void>
  }
}

export function SchemaStorage<S extends Record<string, S.Schema<any>>>(
  schema: S,
): SchemaStorage<S> {
  const decoders: Record<string, (i: unknown, options?: P.ParseOptions) => ParseResult<any>> = {}
  const getDecoder = (key: string) => decoders[key] || (decoders[key] = P.decode(schema[key]))

  const encoders: Record<string, (i: unknown, options?: P.ParseOptions) => unknown> = {}
  const getEncoder = (key: string) => encoders[key] || (encoders[key] = P.encode(schema[key]))

  const get = <K extends keyof S & string>(key: K, options?: P.ParseOptions) =>
      StorageEffect(
        Effect.gen(function* ($) {
          const option = yield* $(getItem(key))

          if (O.isNone(option)) {
            return O.none
          }

          const result = getDecoder(key)(JSON.parse(option.value), options)

          if (E.isLeft(result)) {
            return yield* $(Effect.fail(SchemaParseError(key, option.value, result.left)))
          }

          return O.some(result.right)
        }),
      )

  return {
    schema,
    get,
    set: <K extends keyof S & string>(key: K, value: S.Infer<S[K]>, options?: P.ParseOptions) =>
      StorageEffect(setItem(key, JSON.stringify(getEncoder(key)(value, options)))),
    remove: <K extends keyof S & string>(key: K) => StorageEffect(removeItem(key)),
    events: {
      get,
      set: <K extends keyof S & string>(key: K, value: S.Infer<S[K]>, options?: P.ParseOptions) =>
        storageEvents.setItem(key, JSON.stringify(getEncoder(key)(value, options))),
      remove: <K extends keyof S & string>(key: K) => storageEvents.removeItem(key),
    }
  }
}

export interface SchemaParseError {
  readonly _tag: 'SchemaParserError'
  readonly key: string
  readonly value: string
  readonly errors: readonly [ParseError, ...ParseError[]]
}

export function SchemaParseError(
  key: string,
  value: string,
  errors: readonly [ParseError, ...ParseError[]],
): SchemaParseError {
  return {
    _tag: 'SchemaParserError',
    key,
    value,
    errors,
  }
}

export interface StorageEffect<R, E, A> extends Effect.Effect<R | Storage, E, A> {
  readonly local: Effect.Effect<R, E, A>
  readonly session: Effect.Effect<R, E, A>
}

export function StorageEffect<R, E, A>(
  effect: Effect.Effect<R | Storage, E, A>,
): StorageEffect<Exclude<R, Storage>, E, A> {
  return Object.assign(effect, {
    local: pipe(effect, Effect.provideSomeLayer(localStorage)),
    session: pipe(effect, Effect.provideSomeLayer(sessionStorage)),
  }) as StorageEffect<Exclude<R, Storage>, E, A>
}
