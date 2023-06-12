import { Option } from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { History, Location } from '@typed/dom'

import type { DomNavigationOptions } from './DOM.js'
import {
  Destination,
  NavigateOptions,
  NavigationError,
  NavigationEvent,
  NavigationType,
} from './Navigation.js'
import { ServiceId } from './constant.js'
import { encodeEvent } from './json.js'
import { Model } from './model.js'
import {
  Notify,
  NotifyEnd,
  Save,
  makeGoTo,
  makeNotify,
  makeNotifyEnd,
  makeOnNavigation,
  makeOnNavigationEnd,
} from './shared-intent.js'
import { saveToStorage } from './storage.js'
import { createKey, getUrl } from './util.js'

// Roughly the number of History entries in a browser anyways
const DEFAULT_MAX_ENTRIES = 50

export type DomIntent = {
  readonly back: (skipHistory: boolean) => ReturnType<ReturnType<typeof makeGo>>

  readonly forward: (skipHistory: boolean) => ReturnType<ReturnType<typeof makeGo>>

  readonly push: ReturnType<typeof makePush>

  readonly replace: ReturnType<typeof makeReplace>

  readonly navigate: (
    url: string,
    options?: NavigateOptions,
  ) => ReturnType<ReturnType<typeof makePush | typeof makeReplace>>

  readonly notify: Notify

  readonly go: ReturnType<typeof makeGo>

  readonly goTo: (
    key: string,
  ) => Effect.Effect<
    Storage | History,
    Cause.NoSuchElementException | NavigationError,
    Option<Destination>
  >

  readonly reload: ReturnType<typeof makeReload>

  readonly onNavigation: ReturnType<typeof makeOnNavigation>

  readonly onNavigationEnd: ReturnType<typeof makeOnNavigationEnd>
}

export const makeIntent = (
  model: Model,
  base: string,
  options: DomNavigationOptions,
): DomIntent => {
  const maxEntries = Math.abs(options.maxEntries ?? DEFAULT_MAX_ENTRIES)
  const notify = makeNotify(model)
  const notifyEnd = makeNotifyEnd(model)
  const save = makeSave(model)
  const go = makeGo(model, notify, notifyEnd, save)
  const replace = makeReplace(model, notify, notifyEnd, save, base)
  const push = makePush(model, notify, notifyEnd, save, base, maxEntries)

  return {
    back: (skipHistory: boolean) => go(-1, skipHistory),
    forward: (skipHistory: boolean) => go(1, skipHistory),
    push,
    replace,
    navigate: (url: string, options: NavigateOptions = {}) =>
      options.history === 'replace' ? replace(url, options) : push(url, options),
    notify,
    go: go,
    goTo: makeGoTo(model, go),
    reload: makeReload(model, notify, save),
    onNavigation: makeOnNavigation(model),
    onNavigationEnd: makeOnNavigationEnd(model),
  } as const
}

export type Intent = ReturnType<typeof makeIntent>

export const makeSave =
  (model: Model) =>
  (event: NavigationEvent): Effect.Effect<Storage, Cause.NoSuchElementException, void> =>
    Effect.gen(function* ($) {
      const events = yield* $(model.events)
      const index = yield* $(model.index)

      // Save to storage
      yield* $(saveToStorage(events, index))

      // Update current entry
      yield* $(model.currentEntry.set(event.destination))

      // Update canGoBack
      yield* $(model.canGoBack.set(index > 0))

      // Update canGoForward
      yield* $(model.canGoForward.set(index < events.length - 1))
    })

export const makeReload = (model: Model, notify: Notify, save: Save<Storage>) =>
  Effect.gen(function* ($) {
    const i = yield* $(model.index.get)
    const e = yield* $(model.events)
    const event = e[i]
    const reloadEvent = { ...event, navigationType: NavigationType.Reload }

    yield* $(notify(reloadEvent))
    yield* $(save(reloadEvent))

    const location = yield* $(Location)

    location.reload()

    return event.destination
  })

export const makeReplace =
  (model: Model, notify: Notify, notifyEnd: NotifyEnd, save: Save<Storage>, base: string) =>
  (url: string, options: NavigateOptions = {}, skipHistory = false) =>
    Effect.gen(function* ($) {
      const location = yield* $(Location)
      const entry = yield* $(model.currentEntry.get)
      const destination: Destination = {
        key: entry.key,
        url: getUrl(url, base, location.origin),
        state: options.state,
      }
      const event: NavigationEvent = {
        destination,
        hashChange: entry.url.hash !== destination.url.hash,
        navigationType: NavigationType.Replace,
      }

      yield* $(notify(event))

      if (!skipHistory) {
        const history = yield* $(History)

        history.replaceState.call(
          ServiceId,
          { state: options.state, event: encodeEvent(event) },
          '',
          url,
        )
      }

      const currentIndex = yield* $(model.index)

      yield* $(
        model.events.update((entries) => {
          const updated = entries.slice(0)
          updated[currentIndex] = event
          return updated
        }),
      )

      yield* $(save(event))
      yield* $(notifyEnd(event))

      return destination
    })

export const makePush =
  (
    model: Model,
    notify: Notify,
    notifyEnd: NotifyEnd,
    save: Save<Storage>,
    base: string,
    maxEntries: number,
  ) =>
  (url: string, options: NavigateOptions = {}, skipHistory = false) =>
    Effect.gen(function* ($) {
      const location = yield* $(Location)
      const entry = yield* $(model.currentEntry.get)
      const destination: Destination = {
        key: yield* $(createKey),
        url: getUrl(url, base, location.origin),
        state: options.state,
      }
      const event: NavigationEvent = {
        destination,
        hashChange: entry.url.hash !== destination.url.hash,
        navigationType: NavigationType.Push,
      }

      // Notify event handlers
      yield* $(notify(event))

      if (!skipHistory) {
        const history = yield* $(History)

        history.pushState.call(
          ServiceId,
          { state: options.state, event: encodeEvent(event) },
          '',
          url,
        )
      }

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
      yield* $(notifyEnd(event))

      return destination
    })

export const makeGo =
  (model: Model, notify: Notify, notifyEnd: NotifyEnd, save: Save<Storage>) =>
  (delta: number, skipHistory = false) =>
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

      if (!skipHistory) {
        const history = yield* $(History)

        history.go.call(ServiceId, delta)
      }

      yield* $(model.index.set(nextIndex))

      yield* $(save(nextEntry))

      yield* $(notifyEnd(nextEntry))

      return nextEntry.destination
    })
