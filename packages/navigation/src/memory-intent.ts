import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'

import type { MemoryNavigationOptions } from './Memory.js'
import {
  Destination,
  NavigateOptions,
  NavigationError,
  NavigationEvent,
  NavigationType,
  OnNavigationOptions,
} from './Navigation.js'
import { Model } from './model.js'
import { createKey, getUrl } from './util.js'

// Roughly the number of History entries in a browser anyways
const DEFAULT_MAX_ENTRIES = 50

export function makeIntent(model: Model, options: MemoryNavigationOptions) {
  const { origin } = options.initialUrl
  const maxEntries = Math.abs(options.maxEntries ?? DEFAULT_MAX_ENTRIES)
  const notify = makeNotify(model)
  const save = makeSave(model)
  const go = makeGo(model, notify, save)
  const replace = makeReplace(model, notify, save, origin)
  const push = makePush(model, notify, save, origin, maxEntries)

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
  } as const
}

export type Intent = ReturnType<typeof makeIntent>

type Notify = ReturnType<typeof makeNotify>
type Save = ReturnType<typeof makeSave>

// Anytime there are changes to the model, we need to notify all event handlers
export const makeNotify = (model: Model) => (event: NavigationEvent) =>
  Effect.gen(function* ($) {
    // Notify event handlers
    if (model.eventHandlers.size > 0)
      yield* $(
        Effect.forEachDiscard(model.eventHandlers, ([handler, options]) =>
          options?.passive ? Effect.fork(handler(event)) : handler(event),
        ),
      )
  })

export const makeSave = (model: Model) => (event: NavigationEvent) =>
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

export const makeOnNavigation =
  ({ eventHandlers }: Model) =>
  <R>(
    handler: (event: NavigationEvent) => Effect.Effect<R, NavigationError, unknown>,
    options?: OnNavigationOptions,
  ): Effect.Effect<R | Scope.Scope, never, void> =>
    Effect.uninterruptibleMask((restore) =>
      Effect.gen(function* ($) {
        const context = yield* $(Effect.context<R>())
        const handler_ = (event: NavigationEvent) =>
          restore(Effect.provideContext(handler(event), context))
        const entry = [handler_, options] as const

        eventHandlers.add(entry)

        yield* $(Effect.addFinalizer(() => Effect.sync(() => eventHandlers.delete(entry))))
      }),
    )

export const makeReload = (model: Model, notify: Notify, save: Save) =>
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
  (model: Model, notify: Notify, save: Save, origin: string) =>
  (url: string, options: NavigateOptions = {}) =>
    Effect.gen(function* ($) {
      const entry = yield* $(model.currentEntry.get)
      const destination: Destination = {
        key: entry.key,
        url: getUrl(url, origin),
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
  (model: Model, notify: Notify, save: Save, origin: string, maxEntries: number) =>
  (url: string, options: NavigateOptions = {}) =>
    Effect.gen(function* ($) {
      const entry = yield* $(model.currentEntry.get)
      const destination: Destination = {
        key: yield* $(createKey),
        url: getUrl(url, origin),
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

export const makeGo = (model: Model, notify: Notify, save: Save) => (delta: number) =>
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
        navigationType: nextIndex > currentIndex ? NavigationType.Forward : NavigationType.Back,
      }),
    )

    yield* $(model.index.set(nextIndex))

    yield* $(save(nextEntry))

    return nextEntry.destination
  })

export const makeGoTo = (model: Model, go: ReturnType<typeof makeGo>) => (key: string) =>
  Effect.gen(function* ($) {
    const entries = yield* $(model.entries)
    const currentIndex = yield* $(model.index)
    const nextIndex = entries.findIndex((destination) => destination.key === key)

    if (nextIndex === -1) return Option.none()

    const delta = nextIndex - currentIndex

    if (delta !== 0) {
      return Option.some(yield* $(go(delta)))
    }

    return Option.some(entries[nextIndex])
  })
