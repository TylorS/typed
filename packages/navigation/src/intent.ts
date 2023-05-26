import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { History, Location } from '@typed/dom'

import { Destination, NavigateOptions, NavigationEvent, NavigationType } from './Navigation.js'
import { ServiceId } from './constant.js'
import { encodeEvent } from './json.js'
import { Model } from './model.js'
import { saveToStorage } from './storage.js'
import { createKey, getUrl } from './util.js'

export function makeIntent(model: Model) {
  // eslint-disable-next-line require-yield
  const notify = makeNotify(model)
  const go = makeGo(model, notify)
  const replace = makeReplace(model, notify)
  const push = makePush(model, notify)

  return {
    back: makeBack(model, notify),
    forward: makeForward(model, notify),
    push,
    replace,
    navigate: (url: string, options: NavigateOptions = {}) =>
      options.history === 'replace' ? replace(url, options) : push(url, options),
    go: go,
    goTo: makeGoTo(model, go),
    reload: makeReload(model, notify),
    onNavigation: makeOnNavigation(model),
  } as const
}

export type Intent = ReturnType<typeof makeIntent>

type Notify = ReturnType<typeof makeNotify>

// Anytime there are changes to the model, we need to notify all event handlers
export const makeNotify = (model: Model) => (event: NavigationEvent) =>
  Effect.gen(function* ($) {
    const events = yield* $(model.events)
    const index = yield* $(model.index)

    // Save to storage
    yield* $(saveToStorage(events, index))

    // Update current entry
    yield* $(model.currentEntry.set(event.destination))

    // Update canGoForward
    yield* $(model.canGoForward.set(index < events.length - 1))

    // Notify event handlers
    if (model.eventHandlers.size > 0)
      yield* $(Effect.forEachDiscard(model.eventHandlers, (handler) => handler(event)))
  })

export const makeOnNavigation =
  ({ eventHandlers, events, index }: Model) =>
  <R>(
    handler: (event: NavigationEvent) => Effect.Effect<R, never, unknown>,
  ): Effect.Effect<R | Scope.Scope, never, void> =>
    Effect.uninterruptibleMask((restore) =>
      Effect.gen(function* ($) {
        const context = yield* $(Effect.context<R>())
        const handler_ = (event: NavigationEvent) =>
          restore(Effect.provideContext(handler(event), context))

        eventHandlers.add(handler_)

        yield* $(Effect.addFinalizer(() => Effect.sync(() => eventHandlers.delete(handler_))))

        const entries = yield* $(events)
        const i = yield* $(index)

        // Always start with the current event
        yield* $(restore(handler(entries[i])))
      }),
    )

export const makeBack = (model: Model, notify: Notify) => (skipHistory: boolean) =>
  Effect.gen(function* ($) {
    const current = yield* $(model.currentEntry)
    const index = yield* $(model.index.update((i) => Math.max(i - 1, 0)))
    const events = yield* $(model.events)

    if (!skipHistory) {
      const history = yield* $(History)
      history.back.call(ServiceId)
    }

    const previous = events[index].destination

    if (previous.url.href !== current.url.href) {
      yield* $(
        notify({
          destination: previous,
          hashChange: previous.url.hash !== current.url.hash,
          navigationType: NavigationType.Back,
        }),
      )
    }

    return previous
  })

export const makeForward = (model: Model, notify: Notify) => (skipHistory: boolean) =>
  Effect.gen(function* ($) {
    const current = yield* $(model.currentEntry)
    const e = yield* $(model.events)
    const i = yield* $(model.index.update((i) => Math.min(i + 1, e.length - 1)))
    if (!skipHistory) {
      const history = yield* $(History)
      history.forward.call(ServiceId)
    }
    const previous = e[i].destination

    if (previous.url.href !== current.url.href) {
      yield* $(
        notify({
          destination: previous,
          hashChange: previous.url.hash !== current.url.hash,
          navigationType: NavigationType.Forward,
        }),
      )
    }

    return previous
  })

export const makeReload = (model: Model, notify: Notify) =>
  Effect.gen(function* ($) {
    const i = yield* $(model.index.get)
    const e = yield* $(model.events)
    const event = e[i]

    yield* $(notify({ ...event, navigationType: NavigationType.Reload }))

    const location = yield* $(Location)

    location.reload()

    return event.destination
  })

export const makeReplace =
  (model: Model, notify: Notify) =>
  (url: string, options: NavigateOptions = {}, skipHistory = false) =>
    Effect.gen(function* ($) {
      const location = yield* $(Location)
      const entry = yield* $(model.currentEntry.get)
      const destination: Destination = {
        key: entry.key,
        url: getUrl(url, location.origin),
        state: options.state,
      }
      const event: NavigationEvent = {
        destination,
        hashChange: entry.url.hash !== destination.url.hash,
        navigationType: NavigationType.Replace,
      }

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

      yield* $(notify(event))

      return destination
    })

export const makePush =
  (model: Model, notify: Notify) =>
  (url: string, options: NavigateOptions = {}, skipHistory = false) =>
    Effect.gen(function* ($) {
      const location = yield* $(Location)
      const entry = yield* $(model.currentEntry.get)
      const destination: Destination = {
        key: yield* $(createKey),
        url: getUrl(url, location.origin),
        state: options.state,
      }
      const event: NavigationEvent = {
        destination,
        hashChange: entry.url.hash !== destination.url.hash,
        navigationType: NavigationType.Push,
      }

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
          return updated
        }),
      )

      // Update the index to the new destination
      yield* $(model.index.update((i) => i + 1))

      // Notify event handlers
      yield* $(notify(event))

      return destination
    })

export const makeGo =
  (model: Model, notify: Notify) =>
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

      if (!skipHistory) {
        const history = yield* $(History)

        history.go.call(ServiceId, delta)
      }

      yield* $(model.index.set(nextIndex))

      yield* $(
        notify({
          ...nextEntry,
          navigationType: nextIndex > currentIndex ? NavigationType.Forward : NavigationType.Back,
        }),
      )

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
