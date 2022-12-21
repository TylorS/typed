import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as T from '@fp-ts/data/Context'
import * as O from '@fp-ts/data/Option'
import * as Fx from '@typed/fx'

import { addEventListener } from './EventTarget.js'
import { GlobalThis } from './GlobalThis.js'
import { Window } from './Window.js'

// TODO: Integrate with Schema/Decoder

export namespace Storage {
  export const Tag: T.Tag<Storage> = T.Tag<Storage>()

  export const access = Effect.serviceWith(Tag)
  export const accessEffect = Effect.serviceWithEffect(Tag)
  export const accessFx = Fx.serviceWithFx(Tag)

  export const provide = Effect.provideService(Tag)
}

export const getStorage: Effect.Effect<Storage, never, Storage> = Effect.service(Storage.Tag)

export const getItem = (key: string): Effect.Effect<Storage, never, O.Option<string>> =>
  Storage.access((s) => O.fromNullable(s.getItem(key)))

export const setItem = (key: string, value: string): Effect.Effect<Storage, never, void> =>
  Storage.access((s) => s.setItem(key, value))

export const removeItem = (key: string): Effect.Effect<Storage, never, void> =>
  Storage.access((s) => s.removeItem(key))

export const sessionStorage: Layer.Layer<Window, never, Storage> = Layer.fromEffect(Storage.Tag)(
  Window.access((w) => w.sessionStorage),
)

export const localStorage: Layer.Layer<Window, never, Storage> = Layer.fromEffect(Storage.Tag)(
  Window.access((w) => w.localStorage),
)

/**
 * Listen to cross-tab storage events. Additional opt-in to storageEvents.setItem and storageEvents.removeItem
 * to be able to replicate storage events in the same tab as well for a single source of truth, but this requires
 * the additional resources of GlobalThis and Window.
 */
export const storageEvents = Object.assign(Window.accessFx(addEventListener('storage')), {
  /**
   * Send custom Storage Events for "in tab" storage changes
   */
  send: (
    key: string,
    oldValue: string | null,
    newValue: string | null,
  ): Effect.Effect<GlobalThis | Storage | Window, never, void> =>
    GlobalThis.accessEffect((g) =>
      Window.accessEffect((w) =>
        Storage.accessEffect((s) =>
          Effect.sync(() => sendStorageEvent_(g, w, s, key, oldValue, newValue)),
        ),
      ),
    ),
  setItem: (
    key: string,
    value: string,
  ): Effect.Effect<GlobalThis | Storage | Window, never, void> =>
    Storage.accessEffect((s) =>
      Effect.suspendSucceed(() => {
        const oldValue = s.getItem(key)
        s.setItem(key, value)

        return oldValue === value ? Effect.unit() : storageEvents.send(key, oldValue, value)
      }),
    ),
  removeItem: (key: string): Effect.Effect<GlobalThis | Storage | Window, never, void> =>
    Storage.accessEffect((s) =>
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
