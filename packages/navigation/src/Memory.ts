import { flow } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'

import type { DomNavigationOptions } from './DOM.js'
import {
  Destination,
  Navigation,
  NavigationError,
  NavigationEvent,
  NavigationType,
} from './Navigation.js'
import { makeIntent } from './memory-intent.js'
import { Model, makeModel } from './model.js'
import { createKey } from './util.js'

export interface MemoryNavigationOptions extends DomNavigationOptions {
  readonly initialUrl: URL
  readonly initialState?: unknown
}

export function memory(options: MemoryNavigationOptions): Layer.Layer<never, never, Navigation> {
  return Navigation.layer(
    Effect.gen(function* ($) {
      const initial: Destination = {
        key: options.initialKey ?? (yield* $(createKey)),
        url: options.initialUrl,
        state: options.initialState,
      }
      const initialEvent: NavigationEvent = {
        destination: initial,
        hashChange: false,
        navigationType: NavigationType.Push,
      }

      const model: Model = yield* $(makeModel([initialEvent], 0))
      const intent = makeIntent(model, options)

      // Used to ensure ordering of navigation events
      const lock = Effect.unsafeMakeSemaphore(1).withPermits(1)

      const handleNavigationError =
        (depth: number) =>
        (error: NavigationError): Effect.Effect<never, never, Destination> =>
          Effect.gen(function* ($) {
            if (depth >= 50) {
              throw new Error(
                'Too many redirects. You may have an infinite loop of onNavigation handlers that are redirecting.',
              )
            }

            switch (error._tag) {
              case 'CancelNavigation':
                return yield* $(model.currentEntry.get)
              case 'RedirectNavigation':
                return yield* $(
                  Effect.catchAll(
                    intent.navigate(error.url, error),
                    handleNavigationError(depth + 1),
                  ),
                )
            }
          })

      const catchNavigationError = <A>(effect: Effect.Effect<never, NavigationError, A>) =>
        Effect.catchAll(effect, handleNavigationError(0))

      // Constructor our service
      const navigation: Navigation = {
        back: lock(catchNavigationError(intent.back)),
        canGoBack: model.canGoBack,
        canGoForward: model.canGoForward,
        currentEntry: model.currentEntry,
        entries: model.entries,
        forward: lock(catchNavigationError(intent.forward)),
        goTo: flow(
          intent.goTo,
          Effect.catchAll(flow(handleNavigationError(0), Effect.map(Option.some))),
          lock,
        ),
        navigate: flow(intent.navigate, catchNavigationError, lock),
        onNavigation: intent.onNavigation,
        reload: lock(catchNavigationError(intent.reload)),
      }

      return navigation
    }),
  )
}
