import * as Effect from '@effect/core/io/Effect'
import * as Layer from '@effect/core/io/Layer'
import * as T from '@tsplus/stdlib/service/Tag'

import { getWindow } from './Window.js'

export namespace History {
  export const Tag: T.Tag<History> = T.Tag<History>()
}

export const getHistory: Effect.Effect<History, never, History> = Effect.service(History.Tag)

export const pushState = (data: unknown, url: string | URL) =>
  Effect.serviceWith(History.Tag, (h) => h.pushState(data, '', url))

export const replaceState = (data: unknown, url: string | URL) =>
  Effect.serviceWith(History.Tag, (h) => h.replaceState(data, '', url))

export const getState = Effect.serviceWith(History.Tag, (h) => h.state as unknown)

export const go = (delta: number) => Effect.serviceWith(History.Tag, (h) => h.go(delta))

export const back = Effect.serviceWith(History.Tag, (h) => h.back())

export const forward = Effect.serviceWith(History.Tag, (h) => h.forward())

export const getLength = Effect.serviceWith(History.Tag, (h) => h.length)

export const getScrollRestoration = Effect.serviceWith(History.Tag, (h) => h.scrollRestoration)

const setScrollRestoration = (scrollRestoration: ScrollRestoration) =>
  Effect.asUnit(Effect.serviceWith(History.Tag, (h) => (h.scrollRestoration = scrollRestoration)))

export const setAutoScrollRestoration = setScrollRestoration('auto')

export const setManualScrollRestoration = setScrollRestoration('manual')

export const liveHistory = Layer.fromEffect(History.Tag)(
  Effect.map((w: Window) => w.history)(getWindow),
)
