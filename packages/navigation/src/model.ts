import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { Destination, NavigationError, NavigationEvent, OnNavigationOptions } from './Navigation.js'

export interface Model {
  readonly eventHandlers: Set<
    readonly [
      (event: NavigationEvent) => Effect.Effect<never, NavigationError, unknown>,
      OnNavigationOptions?,
    ]
  >
  readonly events: Fx.RefSubject<never, readonly NavigationEvent[]>
  readonly index: Fx.RefSubject<never, number>
  readonly entries: Fx.Computed<never, never, Destination[]>
  readonly currentEntry: Fx.RefSubject<never, Destination>
  readonly canGoBack: Fx.RefSubject<never, boolean>
  readonly canGoForward: Fx.RefSubject<never, boolean>
}

export const makeModel = (
  initialEntries: readonly NavigationEvent[],
  initialIndex: number,
): Effect.Effect<Scope.Scope, never, Model> =>
  Effect.gen(function* ($) {
    const events = yield* $(Fx.makeRef(Effect.succeed(initialEntries)))
    const index = yield* $(Fx.makeRef(Effect.succeed(initialIndex)))
    const entries = events.map((es) => es.map((e) => e.destination))
    const currentEntry = yield* $(
      Fx.makeRef(Effect.succeed(initialEntries[initialIndex].destination)),
    )
    const canGoBack = yield* $(Fx.makeRef(Effect.succeed(initialIndex > 0)))
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
