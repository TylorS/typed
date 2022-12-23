import * as Effect from '@effect/io/Effect'
import { Identity } from '@fp-ts/data/Identity'
import * as C from '@typed/context'

export interface GlobalThis extends Identity<typeof globalThis> {}

export const GlobalThis: C.Tag<GlobalThis> = C.Tag<GlobalThis>()

export const makeDOMParser: Effect.Effect<GlobalThis, never, globalThis.DOMParser> =
  GlobalThis.with((globalThis) => new globalThis.DOMParser())
