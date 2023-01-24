import * as Effect from '@effect/io/Effect'
import * as C from '@typed/context'

export interface History extends globalThis.History {}
export const History = C.Tag<History>('@typed/dom/History')

export const pushState = (url: string | URL, data?: unknown) =>
  History.with((h) => h.pushState(data, '', url))

export const replaceState = (url: string | URL, data?: unknown) =>
  History.with((h) => h.replaceState(data, '', url))

export const getState = History.with((h) => h.state as unknown)

export const go = (delta: number) => History.with((h) => h.go(delta))

export const back = History.with((h) => h.back())

export const forward = History.with((h) => h.forward())

export const getLength = History.with((h) => h.length)

export const getScrollRestoration = History.with((h) => h.scrollRestoration)

const setScrollRestoration = (scrollRestoration: ScrollRestoration) =>
  Effect.asUnit(History.with((h) => (h.scrollRestoration = scrollRestoration)))

export const setAutoScrollRestoration = setScrollRestoration('auto')

export const setManualScrollRestoration = setScrollRestoration('manual')
