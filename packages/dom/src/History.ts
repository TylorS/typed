import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as T from '@fp-ts/data/Context'
import * as Fx from '@typed/fx'

import { getWindow } from './Window.js'

export interface History extends globalThis.History {}

export namespace History {
  export const Tag: T.Tag<History> = T.Tag<History>()

  export const access = Effect.serviceWith(Tag)
  export const accessEffect = Effect.serviceWithEffect(Tag)
  export const accessFx = Fx.serviceWithFx(Tag)

  export const provide = Effect.provideService(Tag)
}

export const getHistory: Effect.Effect<History, never, History> = Effect.service(History.Tag)

export const pushState = (url: string | URL, data?: unknown) =>
  History.access((h) => h.pushState(data, '', url))

export const replaceState = (url: string | URL, data?: unknown) =>
  History.access((h) => h.replaceState(data, '', url))

export const getState = History.access((h) => h.state as unknown)

export const go = (delta: number) => History.access((h) => h.go(delta))

export const back = History.access((h) => h.back())

export const forward = History.access((h) => h.forward())

export const getLength = History.access((h) => h.length)

export const getScrollRestoration = History.access((h) => h.scrollRestoration)

const setScrollRestoration = (scrollRestoration: ScrollRestoration) =>
  Effect.asUnit(History.access((h) => (h.scrollRestoration = scrollRestoration)))

export const setAutoScrollRestoration = setScrollRestoration('auto')

export const setManualScrollRestoration = setScrollRestoration('manual')

export const liveHistory = Layer.fromEffect(History.Tag)(
  Effect.map((w: Window) => w.history)(getWindow),
)
