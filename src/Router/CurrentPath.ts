import * as Effect from '@effect/core/io/Effect'
import { Layer, fromEffect } from '@effect/core/io/Layer'
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
            const target = ev.target as HTMLAnchorElement

            if (target.tagName.toLowerCase() !== 'a') {
              return
            }

            // TODO: Filter links we don't want to intercept

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
      currentPath.unsafeEmit(getCurrentPath(location))
    }

    const replaceStateOriginal = history.replaceState.bind(history)
    history.replaceState = function (state, title, url) {
      replaceStateOriginal(state, title, url)
      currentPath.unsafeEmit(getCurrentPath(location))
    }

    const goOriginal = history.go.bind(history)
    history.go = function (delta) {
      goOriginal(delta)
      currentPath.unsafeEmit(getCurrentPath(location))
    }

    const backOriginal = history.back.bind(history)
    history.back = function () {
      backOriginal()
      currentPath.unsafeEmit(getCurrentPath(location))
    }

    const forwardOriginal = history.forward.bind(history)
    history.forward = function () {
      forwardOriginal()
      currentPath.unsafeEmit(getCurrentPath(location))
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
