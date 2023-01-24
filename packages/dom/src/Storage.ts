import * as Effect from '@effect/io/Effect'
import type * as Layer from '@effect/io/Layer'
import * as O from '@fp-ts/data/Option'
import * as C from '@typed/context'
import type * as Fx from '@typed/fx'

import { addEventListener } from './EventTarget.js'
import { GlobalThis } from './GlobalThis.js'
import { Window } from './Window.js'

// TODO: Integrate with Schema/Decoder

export interface Storage extends globalThis.Storage {}
export const Storage = C.Tag<Storage>('@typed/dom/Storage')

export const getItem = (key: string): Effect.Effect<Storage, never, O.Option<string>> =>
  Storage.with((s) => O.fromNullable(s.getItem(key)))

export const setItem = (key: string, value: string): Effect.Effect<Storage, never, void> =>
  Storage.with((s) => s.setItem(key, value))

export const removeItem = (key: string): Effect.Effect<Storage, never, void> =>
  Storage.with((s) => s.removeItem(key))

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
  ): Effect.Effect<GlobalThis | Storage | Window, never, void> =>
    GlobalThis.withEffect((g) =>
      Window.withEffect((w) =>
        Storage.withEffect((s) =>
          Effect.sync(() => sendStorageEvent_(g, w, s, key, oldValue, newValue)),
        ),
      ),
    ),
  setItem: (
    key: string,
    value: string,
  ): Effect.Effect<GlobalThis | Storage | Window, never, void> =>
    Storage.withEffect((s) =>
      Effect.suspendSucceed(() => {
        const oldValue = s.getItem(key)
        s.setItem(key, value)

        return oldValue === value ? Effect.unit() : storageEvents.send(key, oldValue, value)
      }),
    ),
  removeItem: (key: string): Effect.Effect<GlobalThis | Storage | Window, never, void> =>
    Storage.withEffect((s) =>
      Effect.suspendSucceed(() => {
        const oldValue = s.getItem(key)

        s.removeItem(key)

        return oldValue === null ? Effect.unit() : storageEvents.send(key, oldValue, null)
      }),
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
