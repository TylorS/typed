import { Option } from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'

import type { MemoryNavigationOptions } from './Memory.js'
import {
  Destination,
  NavigateOptions,
  NavigationError,
  NavigationEvent,
  NavigationType,
} from './Navigation.js'
import { Model } from './model.js'
import {
  Notify,
  Save,
  makeGoTo,
  makeNotify,
  makeOnNavigation,
  makeOnNavigationEnd,
} from './shared-intent.js'
import { createKey, getUrl } from './util.js'

// Roughly the number of History entries in a browser anyways
const DEFAULT_MAX_ENTRIES = 50

export type MemoryIntent = {
  readonly back: ReturnType<ReturnType<typeof makeGo>>

  readonly forward: ReturnType<ReturnType<typeof makeGo>>

  readonly push: ReturnType<typeof makePush>

  readonly replace: ReturnType<typeof makeReplace>

  readonly navigate: (
    url: string,
    options?: NavigateOptions,
  ) => ReturnType<ReturnType<typeof makePush | typeof makeReplace>>

  readonly notify: Notify

  readonly go: ReturnType<typeof makeGo>

  readonly goTo: (key: string) => Effect.Effect<never, NavigationError, Option<Destination>>

  readonly reload: ReturnType<typeof makeReload>

  readonly onNavigation: ReturnType<typeof makeOnNavigation>

  readonly onNavigationEnd: ReturnType<typeof makeOnNavigationEnd>
}

export function makeIntent(model: Model, options: MemoryNavigationOptions): MemoryIntent {
  const { origin } = options.initialUrl
  const base = options.base ?? '/'
  const maxEntries = Math.abs(options.maxEntries ?? DEFAULT_MAX_ENTRIES)
  const notify = makeNotify(model)
  const save = makeSave(model)
  const go = makeGo(model, notify, save)
  const replace = makeReplace(model, notify, save, base, origin)
  const push = makePush(model, notify, save, base, origin, maxEntries)

  return {
    back: go(-1),
    forward: go(1),
    push,
    replace,
    navigate: (url: string, options: NavigateOptions = {}) =>
      options.history === 'replace' ? replace(url, options) : push(url, options),
    go: go,
    goTo: makeGoTo(model, go),
    reload: makeReload(model, notify, save),
    onNavigation: makeOnNavigation(model),
    onNavigationEnd: makeOnNavigationEnd(model),
    notify,
  } as const
}

export type Intent = ReturnType<typeof makeIntent>

export const makeSave: (
  model: Model,
) => (event: NavigationEvent) => Effect.Effect<never, never, void> =
  (model: Model) => (event: NavigationEvent) =>
    Effect.gen(function* ($) {
      const events = yield* $(model.events)
      const index = yield* $(model.index)

      // Update current entry
      yield* $(model.currentEntry.set(event.destination))

      // Update canGoBack
      yield* $(model.canGoBack.set(index > 0))

      // Update canGoForward
      yield* $(model.canGoForward.set(index < events.length - 1))
    })

export const makeReload = (model: Model, notify: Notify, save: Save<never>) =>
  Effect.gen(function* ($) {
    const i = yield* $(model.index.get)
    const e = yield* $(model.events)
    const event = e[i]
    const reloadEvent = { ...event, navigationType: NavigationType.Reload }

    yield* $(notify(reloadEvent))
    yield* $(save(reloadEvent))

    return event.destination
  })

export const makeReplace =
  (model: Model, notify: Notify, save: Save<never>, base: string, origin: string) =>
  (url: string, options: NavigateOptions = {}) =>
    Effect.gen(function* ($) {
      const entry = yield* $(model.currentEntry.get)
      const destination: Destination = {
        key: entry.key,
        url: getUrl(url, base, origin),
        state: options.state,
      }
      const event: NavigationEvent = {
        destination,
        hashChange: entry.url.hash !== destination.url.hash,
        navigationType: NavigationType.Replace,
      }

      yield* $(notify(event))

      const currentIndex = yield* $(model.index)

      yield* $(
        model.events.update((entries) => {
          const updated = entries.slice(0)
          updated[currentIndex] = event
          return updated
        }),
      )

      yield* $(save(event))

      return destination
    })

export const makePush =
  (
    model: Model,
    notify: Notify,
    save: Save<never>,
    base: string,
    origin: string,
    maxEntries: number,
  ) =>
  (url: string, options: NavigateOptions = {}) =>
    Effect.gen(function* ($) {
      const entry = yield* $(model.currentEntry.get)
      const destination: Destination = {
        key: yield* $(createKey),
        url: getUrl(url, base, origin),
        state: options.state,
      }
      const event: NavigationEvent = {
        destination,
        hashChange: entry.url.hash !== destination.url.hash,
        navigationType: NavigationType.Push,
      }

      // Notify event handlers
      yield* $(notify(event))

      const currentIndex = yield* $(model.index)

      // Remove all entries after the current index
      // and add the new destination to the end
      yield* $(
        model.events.update((entries) => {
          const updated = entries.slice(0, currentIndex + 1)
          updated.push(event)
          return updated.slice(-maxEntries)
        }),
      )

      // Update the index to the new destination
      yield* $(model.index.update((i) => i + 1))

      yield* $(save(event))

      return destination
    })

export const makeGo = (model: Model, notify: Notify, save: Save<never>) => (delta: number) =>
  Effect.gen(function* ($) {
    const currentEntries = yield* $(model.events)
    const totalEntries = currentEntries.length
    const currentIndex = yield* $(model.index)

    // Nothing to do here
    if (delta === 0) return currentEntries[currentIndex].destination

    const nextIndex =
      delta > 0
        ? Math.min(currentIndex + delta, totalEntries - 1)
        : Math.max(currentIndex + delta, 0)
    const nextEntry = currentEntries[nextIndex]

    yield* $(
      notify({
        ...nextEntry,
        navigationType: getNavigationType(currentIndex, nextIndex),
      }),
    )

    yield* $(model.index.set(nextIndex))

    yield* $(save(nextEntry))

    return nextEntry.destination
  })

function getNavigationType(currentIndex: number, nextIndex: number): NavigationType {
  if (nextIndex > currentIndex) return NavigationType.Forward
  if (nextIndex < currentIndex) return NavigationType.Back
  return NavigationType.Reload
}
