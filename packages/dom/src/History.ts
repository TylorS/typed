import * as Effect from '@effect/io/Effect'
import * as C from '@typed/context'

export interface History extends globalThis.History {}
export const History = C.Tag<History>('@typed/dom/History')

export const pushState: (
  url: string | URL,
  data?: unknown,
) => Effect.Effect<History, never, void> = (url: string | URL, data?: unknown) =>
  History.with((h) => h.pushState(data, '', url))

export const replaceState: (
  url: string | URL,
  data?: unknown,
) => Effect.Effect<History, never, void> = (url: string | URL, data?: unknown) =>
  History.with((h) => h.replaceState(data, '', url))

export const getState: Effect.Effect<History, never, unknown> = History.with(
  (h) => h.state as unknown,
)

export const go: (delta: number) => Effect.Effect<History, never, void> = (delta: number) =>
  History.with((h) => h.go(delta))

export const back: Effect.Effect<History, never, void> = History.with((h) => h.back())

export const forward: Effect.Effect<History, never, void> = History.with((h) => h.forward())

export const getLength: Effect.Effect<History, never, number> = History.with((h) => h.length)

export const getScrollRestoration: Effect.Effect<History, never, ScrollRestoration> = History.with(
  (h) => h.scrollRestoration,
)

const setScrollRestoration: (
  scrollRestoration: ScrollRestoration,
) => Effect.Effect<History, never, void> = (scrollRestoration: ScrollRestoration) =>
  Effect.asUnit(History.with((h) => (h.scrollRestoration = scrollRestoration)))

export const setAutoScrollRestoration: Effect.Effect<History, never, void> =
  setScrollRestoration('auto')

export const setManualScrollRestoration: Effect.Effect<History, never, void> =
  setScrollRestoration('manual')
