import * as Effect from '@effect/core/io/Effect'
import { Layer, fromEffect } from '@effect/core/io/Layer'
import { millis } from '@tsplus/stdlib/data/Duration'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Tag } from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

import { addEventListener } from '../DOM/EventTarget.js'
import { getHistory } from '../DOM/History.js'
import { getLocation } from '../DOM/Location.js'
import { getWindow } from '../DOM/Window.js'

/**
 * The current path is a Service which provides the current "path" with is all
 * portions of what can be inside your URL bar. This includes the pathname,
 * search, and hash. This is allows sampling the current state as well as subscribing
 * to its changes.
 */
export interface CurrentPath {
  readonly currentPath: Fx.RefSubject<never, string>
}

export const CurrentPath = Tag<CurrentPath>()

export const makeCurrentPath: Effect.Effect<Location | History | Window, never, CurrentPath> =
  Effect.gen(function* ($) {
    const location = yield* $(getLocation)
    const history = yield* $(getHistory)
    const window = yield* $(getWindow)
    const currentPath = yield* $(Fx.makeRefSubject(() => getCurrentPath(location)))

    const runtime = yield* $(Effect.runtime<never>())
    // TODO: When upgrading to latest Effect, use Effect.blocking for scheduling maybe?
    const emit = Effect.gen(function* () {
      // Allow for location to be updated by the browser
      yield* $(Effect.sleep(millis(0)))
      yield* $(currentPath.set(getCurrentPath(location)))
    })
    const unsafeEmit = () => runtime.unsafeRunAsync(emit)

    // Listen to PopState events and update the current path
    yield* $(
      pipe(
        window,
        addEventListener('popstate'),
        Fx.runObserve(() => currentPath.set(getCurrentPath(location))),
        Effect.fork,
      ),
    )

    // Listen to HashChange events and update the current path
    yield* $(
      pipe(
        window,
        addEventListener('hashchange'),
        Fx.runObserve(() => currentPath.set(getCurrentPath(location))),
        Effect.fork,
      ),
    )

    yield* $(
      pipe(
        window.document,
        addEventListener('click'),
        Fx.runObserve((ev) => {
          return Effect.sync(() => {
            if (ev.which !== 1) return
            if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return
            if (ev.defaultPrevented) return

            let el = ev.target as Element | null
            const eventPath = (ev as any).path || (ev.composedPath ? ev.composedPath() : null)

            if (eventPath) {
              for (let i = 0; i < eventPath.length; i++) {
                if (
                  !eventPath[i].nodeName ||
                  eventPath[i].nodeName.toUpperCase() !== 'A' ||
                  !eventPath[i].href
                )
                  continue

                el = eventPath[i]
                break
              }
            }

            const target = el as HTMLAnchorElement

            // Ensure same origin
            if (target.origin !== location.origin) return

            // Ignore if tag has
            // 1. "download" attribute
            // 2. rel="external" attribute
            if (target.hasAttribute('download') || target.getAttribute('rel') === 'external') return

            // ensure non-hash for the same path
            const link = target.getAttribute('href')
            if ((target as HTMLAnchorElement).hash || '#' === link) return

            // Check for mailto: in the href
            if (link && link.indexOf('mailto:') > -1) return

            // We made it! We'll intercept this event and update history
            ev.preventDefault()
            history.pushState(null, '', target.href)
          })
        }),
        Effect.fork,
      ),
    )

    // Patch the history methods to emit the current path

    const pushStateOriginal = history.pushState.bind(history)
    history.pushState = function (state, title, url) {
      pushStateOriginal(state, title, url)
      unsafeEmit()
    }

    const replaceStateOriginal = history.replaceState.bind(history)
    history.replaceState = function (state, title, url) {
      replaceStateOriginal(state, title, url)
      unsafeEmit()
    }

    const goOriginal = history.go.bind(history)
    history.go = function (delta) {
      goOriginal(delta)
      unsafeEmit()
    }

    const backOriginal = history.back.bind(history)
    history.back = function () {
      backOriginal()
      unsafeEmit()
    }

    const forwardOriginal = history.forward.bind(history)
    history.forward = function () {
      forwardOriginal()
      unsafeEmit()
    }

    return {
      currentPath,
    } as CurrentPath
  })

function getCurrentPath(location: Location): string {
  return location.pathname + location.search + location.hash
}

export const currentPathLayer: Layer<Location | History | Window, never, CurrentPath> =
  fromEffect(CurrentPath)(makeCurrentPath)
