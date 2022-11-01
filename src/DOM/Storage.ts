import * as Effect from '@effect/core/io/Effect'
import * as Layer from '@effect/core/io/Layer'
import * as M from '@tsplus/stdlib/data/Maybe'
import * as T from '@tsplus/stdlib/service/Tag'

import { Window } from './Window.js'

export namespace Storage {
  export const Tag: T.Tag<Storage> = T.Tag<Storage>()
}

export const getStorage: Effect.Effect<Storage, never, Storage> = Effect.service(Storage.Tag)

export const getItem = (key: string): Effect.Effect<Storage, never, M.Maybe<string>> =>
  Effect.serviceWith(Storage.Tag, (s) => M.fromNullable(s.getItem(key)))

export const setItem = (key: string, value: string): Effect.Effect<Storage, never, void> =>
  Effect.serviceWith(Storage.Tag, (s) => s.setItem(key, value))

export const removeItem = (key: string): Effect.Effect<Storage, never, void> =>
  Effect.serviceWith(Storage.Tag, (s) => s.removeItem(key))

export const sessionStorage: Layer.Layer<Window, never, Storage> = Layer.fromEffect(Storage.Tag)(
  Effect.serviceWith(Window.Tag, (w) => w.sessionStorage),
)

export const localStorage: Layer.Layer<Window, never, Storage> = Layer.fromEffect(Storage.Tag)(
  Effect.serviceWith(Window.Tag, (w) => w.localStorage),
)

// TODO: Test Storage
