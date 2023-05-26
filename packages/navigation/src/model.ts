import * as Effect from '@effect/io/Effect'
import { History, Location } from '@typed/dom'
import * as Fx from '@typed/fx'

import type { DomNavigationOptions } from './DOM.js'
import { Destination, NavigationEvent } from './Navigation.js'
import { getInitialValues } from './storage.js'

export interface Model {
  readonly eventHandlers: Set<(event: NavigationEvent) => Effect.Effect<never, never, unknown>>
  readonly events: Fx.RefSubject<never, readonly NavigationEvent[]>
  readonly index: Fx.RefSubject<never, number>
  readonly entries: Fx.Computed<never, never, Destination[]>
  readonly currentEntry: Fx.RefSubject<never, Destination>
  readonly canGoBack: Fx.Computed<never, never, boolean>
  readonly canGoForward: Fx.RefSubject<never, boolean>
}

export const makeModel = (
  options: DomNavigationOptions,
): Effect.Effect<History | Location | Storage, never, Model> =>
  Effect.gen(function* ($) {
    const [initialEntries, initialIndex] = yield* $(getInitialValues(options))
    const events = yield* $(Fx.makeRef(Effect.succeed(initialEntries)))
    const index = yield* $(Fx.makeRef(Effect.succeed(initialIndex)))
    const entries = events.map((es) => es.map((e) => e.destination))
    const currentEntry = yield* $(
      Fx.makeRef(Effect.succeed(initialEntries[initialIndex].destination)),
    )
    const canGoBack = index.map((i) => i > 0)
    const canGoForward = yield* $(
      Fx.makeRef(Effect.succeed(initialIndex < initialEntries.length - 1)),
    )

    return {
      eventHandlers: new Set(),
      events,
      index,
      entries,
      currentEntry,
      canGoBack,
      canGoForward,
    }
  })
