import type * as Effect from '@effect/io/Effect'
import * as C from '@typed/context'

type Identity<A> = A

export interface GlobalThis extends Identity<typeof globalThis> {}

export const GlobalThis: C.Tag<GlobalThis> = C.Tag<GlobalThis>('@typed/dom/GlobalThis')

export const makeDOMParser: Effect.Effect<GlobalThis, never, globalThis.DOMParser> =
  GlobalThis.with((globalThis) => new globalThis.DOMParser())
