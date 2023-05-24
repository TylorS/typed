import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Layer from '@effect/io/Layer'
import * as Random from '@effect/io/Random'
import * as Runtime from '@effect/io/Runtime'
import * as Context from '@typed/context'
import {
  Location,
  History,
  Window,
  Storage,
  storageEvents,
  getItem,
  GlobalThis,
  addWindowListener,
  localStorage,
} from '@typed/dom'
import * as Fx from '@typed/fx'

import {
  Destination,
  NavigateOptions,
  Navigation,
  NavigationEvent,
  NavigationType,
} from './Navigation.js'

// ServiceId is utilized when internal calls to History.* methods to prevent
// history events from being emitted causing an infinite loop
const ServiceId: any = Symbol()

const TYPED_NAVIGATION_ENTRIES_KEY = '@typed/navigation/entries'
const TYPED_NAVIGATION_INDEX_KEY = '@typed/navigation/index'

type NavigationEventJson = {
  readonly [K in keyof NavigationEvent]: NavigationEvent[K] extends Destination
    ? DestinationJson
    : NavigationEvent[K]
}

type DestinationJson = {
  readonly [K in keyof Destination]: Destination[K] extends URL ? string : Destination[K]
}

const parseDestination = (d: DestinationJson): Destination => ({
  ...d,
  url: new URL(d.url),
})

/**
 * @internal
 */
export const getStoredEvents: Effect.Effect<Storage, never, readonly NavigationEvent[]> =
  Effect.gen(function* ($) {
    const option = yield* $(getItem(TYPED_NAVIGATION_ENTRIES_KEY))

    if (Option.isNone(option)) {
      return []
    }

    // TODO: Validate entries with Schema
    return (JSON.parse(option.value) as readonly NavigationEventJson[]).map((event) => ({
      ...event,
      destination: parseDestination(event.destination),
    }))
  })

const getStoredIndex = Effect.gen(function* ($) {
  const option = yield* $(getItem(TYPED_NAVIGATION_INDEX_KEY))

  if (Option.isNone(option)) {
    return Option.none()
  }

  // TODO: Validate index with Schema
  const n = JSON.parse(option.value) as number

  if (Number.isNaN(n)) {
    return Option.none()
  }

  return Option.some(n)
})

const encodeEvent = (event: NavigationEvent): NavigationEventJson => ({
  ...event,
  destination: {
    ...event.destination,
    url: event.destination.url.href,
  },
})

const getInitialValues = (
  random: Random.Random,
  history: History,
  location: Location,
): Effect.Effect<Storage, never, readonly [readonly NavigationEvent[], number]> =>
  Effect.gen(function* ($) {
    const storedEntries = yield* $(getStoredEvents)
    const storedIndex = Option.getOrElse(yield* $(getStoredIndex), () => storedEntries.length - 1)
    const storedEntry = storedEntries[storedIndex]
    const initialUrl = getUrl(location.href, location.origin)
    const initial: Destination = {
      key: yield* $(createKey(random)),
      url: initialUrl,
      state: history.state?.state,
    }
    const initialEvent: NavigationEvent = {
      destination: initial,
      hashChange: false,
      navigationType: NavigationType.Push,
    }

    if (!storedEntry) {
      return [[initialEvent], 0] as const
    }

    // If we're starting on the same page as the initial entry
    // then we can just use the initial entries
    if (storedEntry.destination.url.href === initialUrl.href) {
      return [storedEntries, storedIndex] as const
    }

    // Otherwise, we need to push the initial entry with the current page
    const entries = [...storedEntries.slice(0, storedIndex + 1), initialEvent]

    return [entries, entries.length - 1] as const
  })

const saveToStorage = (entries: readonly NavigationEvent[], index: number) =>
  Effect.gen(function* ($) {
    yield* $(storageEvents.setItem(TYPED_NAVIGATION_ENTRIES_KEY, JSON.stringify(entries)))
    yield* $(storageEvents.setItem(TYPED_NAVIGATION_INDEX_KEY, JSON.stringify(index)))
  })

export type NavigationServices = Window | Location | History | GlobalThis | Storage

export const dom: Layer.Layer<
  Exclude<NavigationServices, Storage>,
  never,
  Navigation
> = Layer.provide(
  localStorage,
  Navigation.layerScoped(
    Effect.gen(function* ($) {
      const context = yield* $(Effect.context<NavigationServices>())
      const location = Context.get(context, Location)
      const history = Context.get(context, History)
      const random = yield* $(Effect.random())
      const historyEvents = yield* $(patchHistory(history))
      const eventHandlers = new Set<
        (event: NavigationEvent) => Effect.Effect<never, never, unknown>
      >()
      const [initialEntries, initialIndex] = yield* $(getInitialValues(random, history, location))

      const events = yield* $(Fx.makeRef(Effect.succeed(initialEntries)))
      const entries = events.map((events) => events.map((event) => event.destination))
      const index = yield* $(Fx.makeRef(Effect.succeed(initialIndex)))
      const currentEntry = yield* $(
        Fx.makeRef(Effect.succeed(initialEntries[initialIndex].destination)),
      )
      const canGoBack = index.map((i) => i > 0)

      const back = (
        skipHistory: boolean,
      ): Effect.Effect<Storage | Window | GlobalThis, never, Destination> =>
        Effect.gen(function* ($) {
          const current = yield* $(currentEntry)
          const i = yield* $(index.update((i) => Math.max(i - 1, 0)))
          const e = yield* $(events)

          if (!skipHistory) {
            history.back.call(ServiceId)
          }

          const previous = e[i].destination

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

      const canGoForward = yield* $(
        Fx.makeRef(Effect.succeed(initialIndex < initialEntries.length - 1)),
      )

      const forward = (skipHistory: boolean) =>
        Effect.gen(function* ($) {
          const current = yield* $(currentEntry)
          const e = yield* $(events)
          const i = yield* $(index.update((i) => Math.min(i + 1, e.length - 1)))
          if (!skipHistory) {
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

      const reload = Effect.gen(function* ($) {
        const i = yield* $(index.get)
        const e = yield* $(events)
        const event = e[i]

        yield* $(notify({ ...event, navigationType: NavigationType.Reload }))

        location.reload()

        return event.destination
      })

      const onNavigation = <R>(
        handler: (event: NavigationEvent) => Effect.Effect<R, never, unknown>,
      ) =>
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

      const notify = (event: NavigationEvent) =>
        Effect.gen(function* ($) {
          const e = yield* $(events)
          const i = yield* $(index)
          yield* $(saveToStorage(e, i))
          yield* $(currentEntry.set(event.destination))
          yield* $(canGoForward.set(i < e.length - 1))

          if (eventHandlers.size > 0)
            yield* $(Effect.forEachDiscard(eventHandlers, (handler) => handler(event)))
        })

      const replaceEntry = (destination: NavigationEvent) =>
        Effect.gen(function* ($) {
          const currentIndex = yield* $(index)

          yield* $(
            events.update((entries) => {
              const updated = entries.slice(0)
              updated[currentIndex] = destination
              return updated
            }),
          )
        })

      const pushEntry = (destination: NavigationEvent) =>
        Effect.gen(function* ($) {
          const currentIndex = yield* $(index)

          // Remove all entries after the current index
          // and add the new destination to the end
          yield* $(
            events.update((entries) => {
              const updated = entries.slice(0, currentIndex + 1)
              updated.push(destination)
              return updated
            }),
          )

          // Update the index to the new destination
          yield* $(index.update((i) => i + 1))
        })

      const lock = Effect.unsafeMakeSemaphore(1).withPermits(1)

      const hashChanged = (newUrl: URL) =>
        Effect.gen(function* ($) {
          const entry = yield* $(currentEntry.get)

          return entry.url.hash !== newUrl.hash
        })

      const replace = (url: string, options: NavigateOptions = {}, skipHistory = false) =>
        Effect.gen(function* ($) {
          const entry = yield* $(currentEntry.get)
          const destination: Destination = {
            key: entry.key,
            url: getUrl(url, location.origin),
            state: options.state,
          }
          const event: NavigationEvent = {
            destination,
            hashChange: yield* $(hashChanged(destination.url)),
            navigationType: NavigationType.Replace,
          }

          if (!skipHistory) {
            history.replaceState.call(
              ServiceId,
              { state: options.state, event: encodeEvent(event) },
              '',
              url,
            )
          }

          yield* $(replaceEntry(event))
          yield* $(notify(event))

          return destination
        })

      const push = (url: string, options: NavigateOptions = {}, skipHistory = false) =>
        Effect.gen(function* ($) {
          const destination: Destination = {
            key: yield* $(createKey(random)),
            url: getUrl(url, location.origin),
            state: options.state,
          }
          const event: NavigationEvent = {
            destination,
            hashChange: yield* $(hashChanged(destination.url)),
            navigationType: NavigationType.Push,
          }

          if (!skipHistory) {
            history.pushState.call(
              ServiceId,
              { state: options.state, event: encodeEvent(event) },
              '',
              url,
            )
          }

          yield* $(pushEntry(event))
          yield* $(notify(event))

          return destination
        })

      const navigate = (url: string, options: NavigateOptions = {}) =>
        lock(options.history === 'replace' ? replace(url, options) : push(url, options))

      const go = (delta: number, skipHistory = false) =>
        Effect.gen(function* ($) {
          const currentEntries = yield* $(events)
          const totalEntries = currentEntries.length
          const currentIndex = yield* $(index)

          // Nothing to do here
          if (delta === 0) return currentEntries[currentIndex].destination

          const nextIndex =
            delta > 0
              ? Math.min(currentIndex + delta, totalEntries - 1)
              : Math.max(currentIndex + delta, 0)
          const nextEntry = currentEntries[nextIndex]

          if (!skipHistory) {
            history.go.call(ServiceId, delta)
          }

          yield* $(index.set(nextIndex))

          yield* $(
            notify({
              ...nextEntry,
              navigationType:
                nextIndex > currentIndex ? NavigationType.Forward : NavigationType.Back,
            }),
          )

          return nextEntry.destination
        })

      const goTo = (key: string) =>
        Effect.gen(function* ($) {
          const entries = yield* $(events)
          const currentIndex = yield* $(index)
          const nextIndex = entries.findIndex((event) => event.destination.key === key)
          const delta = nextIndex - currentIndex

          if (delta !== 0) {
            return yield* $(go(delta))
          }

          return entries[nextIndex].destination
        })

      const navigation: Navigation = {
        entries,
        currentEntry,
        canGoBack,
        back: Effect.provideContext(back(false), context),
        canGoForward,
        forward: Effect.provideContext(forward(false), context),
        reload: Effect.provideContext(reload, context),
        onNavigation,
        navigate: (url, options) => Effect.provideContext(navigate(url, options), context),
        goTo: (key) => Effect.provideContext(goTo(key), context),
      }

      // Listen to history events and keep track of entries
      yield* $(
        Fx.mergeAll(
          pipe(
            historyEvents,
            Fx.map((event) =>
              Effect.gen(function* ($) {
                switch (event._tag) {
                  case 'PushState':
                    return yield* $(push(event.url, { state: event.state }, true))
                  case 'ReplaceState':
                    return yield* $(replace(event.url, { state: event.state }, true))
                  case 'Back':
                    return yield* $(back(true))
                  case 'Forward':
                    return yield* $(forward(true))
                  case 'Go':
                    return yield* $(go(event.delta))
                }
              }),
            ),
          ),
          pipe(
            addWindowListener('hashchange'),
            Fx.map(() => push(location.href, { state: history.state }, true)),
          ),
          pipe(
            addWindowListener('popstate'),
            Fx.map((ev) => {
              if (!ev.state || !ev.state.event) {
                return Option.none()
              }

              const navigation = ev.state.event as NavigationEventJson

              return Option.some(goTo(navigation.destination.key))
            }),
            Fx.compact,
          ),
        ),
        Fx.switchLatestEffect,
        Fx.drain,
        Effect.forkScoped,
      )

      return navigation
    }),
  ),
)

function createKey(random: Random.Random) {
  return Effect.map(random.nextIntBetween(0, Number.MAX_SAFE_INTEGER), (n) =>
    n.toString(36).slice(2, 10),
  )
}

export type HistoryEvent = PushStateEvent | ReplaceStateEvent | GoEvent | BackEvent | ForwardEvent

export interface PushStateEvent {
  readonly _tag: 'PushState'
  readonly state: unknown
  readonly url: string
}

export interface ReplaceStateEvent {
  readonly _tag: 'ReplaceState'
  readonly state: unknown
  readonly url: string
}

export interface GoEvent {
  readonly _tag: 'Go'
  readonly delta: number
}

export interface BackEvent {
  readonly _tag: 'Back'
}

export interface ForwardEvent {
  readonly _tag: 'Forward'
}

const patchHistory = (history: History) =>
  Effect.gen(function* ($) {
    const scope = yield* $(Effect.scope())
    const historyEvents = Fx.makeSubject<never, HistoryEvent>()
    const runtime = yield* $(Effect.runtime<never>())
    const runFork = Runtime.runFork(runtime)
    const cleanup = patchHistory_(history, (event: HistoryEvent) =>
      runFork(Effect.flatMap(Effect.forkIn(historyEvents.event(event), scope), Fiber.join)),
    )

    // unpatch history upon finalization
    yield* $(Effect.addFinalizer(() => Effect.sync(cleanup)))

    return historyEvents
  })

function patchHistory_(history: History, sendEvent: (event: HistoryEvent) => void) {
  const pushState = history.pushState.bind(history)
  const replaceState = history.replaceState.bind(history)
  const go = history.go.bind(history)
  const back = history.back.bind(history)
  const forward = history.forward.bind(history)

  history.pushState = function (state, title, url) {
    pushState(state, title, url)

    if (url && this !== ServiceId) sendEvent({ _tag: 'PushState', state, url: url.toString() })
  }

  history.replaceState = function (state, title, url) {
    replaceState(state, title, url)

    if (url && this !== ServiceId) sendEvent({ _tag: 'ReplaceState', state, url: url.toString() })
  }

  history.go = function (delta) {
    if (!delta) return

    go(delta)
    if (this !== ServiceId) sendEvent({ _tag: 'Go', delta })
  }

  history.back = function () {
    back()
    if (this !== ServiceId) sendEvent({ _tag: 'Back' })
  }

  history.forward = function () {
    forward()
    if (this !== ServiceId) sendEvent({ _tag: 'Forward' })
  }

  const stateDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(history), 'state')
  Object.defineProperty(history, 'state', {
    ...stateDescriptor,
    get() {
      return stateDescriptor?.get?.()?.state
    },
  })
  Object.defineProperty(history, 'originalState', {
    ...stateDescriptor,
  })

  // Reset history to original state
  return () => {
    history.pushState = pushState
    history.replaceState = replaceState
    history.go = go
    history.back = back
    history.forward = forward

    if (stateDescriptor) Object.defineProperty(history, 'state', stateDescriptor)
  }
}

function getUrl(href: string, origin: string) {
  return new URL(href, origin)
}
