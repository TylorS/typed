import { flow, pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Context from '@typed/context'
import { Location, History, Window, Storage, addWindowListener, Document } from '@typed/dom'
import * as Fx from '@typed/fx'

import { Destination, DestinationKey, Navigation, NavigationError } from './Navigation.js'
import { makeIntent } from './dom-intent.js'
import { onHistoryEvent, patchHistory } from './history.js'
import { NavigationEventJson } from './json.js'
import { makeModel } from './model.js'
import { getInitialValues } from './storage.js'

export type NavigationServices = Window | Document | Location | History | Storage

export interface DomNavigationOptions {
  // Defaults to a random value, but you can provide your own
  // Navigation keys can be provided to Navigation.navigate along the way as needed.
  readonly initialKey?: DestinationKey

  // Defaults to 50
  // The maximum number of entries to keep in memory and storage.
  readonly maxEntries?: number
}

export const dom = (
  options: DomNavigationOptions = {},
): Layer.Layer<NavigationServices, never, Navigation> => {
  return Navigation.layerScoped(
    Effect.gen(function* ($) {
      // Get resources
      const context = yield* $(Effect.context<NavigationServices>())
      const history = Context.get(context, History)
      const document = Context.get(context, Document)
      const base = document.querySelector('base')
      const baseHref = base ? getBasePathFromHref(base.href) : '/'

      // Create model and intent
      const [initialEntries, initialIndex] = yield* $(getInitialValues(baseHref, options))
      const model = yield* $(makeModel(initialEntries, initialIndex))
      const intent = makeIntent(model, baseHref, options)

      // Used to ensure ordering of navigation events
      const lock = Effect.unsafeMakeSemaphore(1).withPermits(1)

      const handleNavigationError =
        (depth: number) =>
        (
          error: NavigationError | Cause.NoSuchElementException,
        ): Effect.Effect<never, never, Destination> =>
          Effect.provideContext(
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
            }),
            context,
          )

      const catchNavigationError = <R, A>(
        effect: Effect.Effect<R, NavigationError | Cause.NoSuchElementException, A>,
      ) => Effect.catchAll(effect, handleNavigationError(0))

      // Used to provide a locked effect with the current context
      const provideLocked = <E, A>(effect: Effect.Effect<NavigationServices, E, A>) =>
        Effect.provideContext(lock(effect), context)

      // Constructor our service
      const navigation: Navigation = {
        back: provideLocked(catchNavigationError(intent.back(false))),
        base: baseHref,
        canGoBack: model.canGoBack,
        canGoForward: model.canGoForward,
        currentEntry: model.currentEntry,
        entries: model.entries,
        forward: provideLocked(catchNavigationError(intent.forward(false))),
        goTo: flow(
          intent.goTo,
          Effect.catchAll(flow(handleNavigationError(0), Effect.map(Option.some))),
          provideLocked,
        ),
        navigate: flow(intent.navigate, catchNavigationError, provideLocked),
        onNavigation: (handler, options) =>
          pipe(intent.onNavigation(handler, options), catchNavigationError, Effect.asUnit),
        onNavigationEnd: (handler, options) =>
          Effect.asUnit(intent.onNavigationEnd(handler, options)),
        reload: provideLocked(catchNavigationError(intent.reload)),
      }

      // Patch History API to enable sending events
      const historyEvents = yield* $(patchHistory)

      // Listen to various events and update our model
      yield* $(
        Fx.mergeAll(
          // Listen to history events and keep track of entries
          pipe(
            historyEvents,
            Fx.flatMapEffect((event) => lock(onHistoryEvent(event, intent))),
          ),
          // Listen to hash changes and push them to the history
          pipe(
            addWindowListener('hashchange', { capture: true }),
            Fx.flatMapEffect((ev) => lock(intent.push(ev.newURL, { state: history.state }, true))),
          ),
          // Listen to popstate events and go to the correct entry
          pipe(
            addWindowListener('popstate'),
            Fx.map((ev) => {
              // TODO: Should we throw some kind of error here?
              // This should never happen if you are solely using the Navigation Service
              if (!ev.state || !ev.state.event) {
                return Option.none()
              }

              const navigation = ev.state.event as NavigationEventJson

              return Option.some(lock(intent.goTo(navigation.destination.key)))
            }),
            Fx.compact,
            Fx.flattenEffect,
          ),
        ),
        Fx.drain,
        Effect.forkScoped,
      )

      return navigation
    }),
  )
}

export function getBasePathFromHref(href: string) {
  try {
    const url = new URL(href)

    return getCurrentPathFromLocation(url)
  } catch {
    return href
  }
}

export function getCurrentPathFromLocation(location: Location | HTMLAnchorElement | URL) {
  return location.pathname + location.search + location.hash
}
