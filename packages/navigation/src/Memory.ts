import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
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
  readonly base?: string
}

export function memory(options: MemoryNavigationOptions): Layer.Layer<never, never, Navigation> {
  return Navigation.layerScoped(
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
        (
          error: NavigationError | Cause.NoSuchElementException,
        ): Effect.Effect<never, never, Destination> =>
          Effect.gen(function* ($) {
            if (depth >= 50) {
              throw new Error(
                'Too many redirects. You may have an infinite loop of onNavigation handlers that are redirecting.',
              )
            }

            switch (error._tag) {
              case 'NoSuchElementException':
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

      const catchNavigationError = <R, A>(
        effect: Effect.Effect<R, NavigationError | Cause.NoSuchElementException, A>,
      ) => Effect.catchAll(effect, handleNavigationError(0))

      // Construct our service
      const navigation: Navigation = {
        back: lock(catchNavigationError(intent.back)),
        base: '/',
        canGoBack: model.canGoBack,
        canGoForward: model.canGoForward,
        currentEntry: model.currentEntry,
        entries: model.entries,
        forward: lock(catchNavigationError(intent.forward)),
        goTo: (n) =>
          pipe(
            n,
            intent.goTo,
            Effect.catchAll((a) => pipe(a, handleNavigationError(0), Effect.map(Option.some))),
            lock,
          ),
        navigate: (url, options) => pipe(intent.navigate(url, options), catchNavigationError, lock),
        onNavigation: (handler, options) =>
          pipe(intent.onNavigation(handler, options), catchNavigationError, Effect.asUnit),
        onNavigationEnd: (handler, options) =>
          Effect.asUnit(intent.onNavigationEnd(handler, options)),
        reload: lock(catchNavigationError(intent.reload)),
      }

      return navigation
    }),
  )
}
