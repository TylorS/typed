import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import { History, Location, getItem, setItem } from '@typed/dom'

import type { DomNavigationOptions } from './DOM.js'
import { NavigationEvent, Destination, NavigationType } from './Navigation.js'
import { NavigationEventJson, decodeNavigationEvent } from './json.js'
import { createKey, getUrl } from './util.js'

const TYPED_NAVIGATION_ENTRIES_KEY = '@typed/navigation/entries'
const TYPED_NAVIGATION_INDEX_KEY = '@typed/navigation/index'

/**
 * @internal
 */
export const getStoredEvents: Effect.Effect<Storage, never, readonly NavigationEvent[]> =
  Effect.gen(function* ($) {
    const option = yield* $(getItem(TYPED_NAVIGATION_ENTRIES_KEY))

    if (Option.isNone(option)) {
      return []
    }

    return (JSON.parse(option.value) as readonly NavigationEventJson[]).map(decodeNavigationEvent)
  })

/**
 * @internal
 */
export const getStoredIndex = Effect.gen(function* ($) {
  const option = yield* $(getItem(TYPED_NAVIGATION_INDEX_KEY))

  if (Option.isNone(option)) {
    return Option.none()
  }

  const n = JSON.parse(option.value) as number

  if (Number.isNaN(n)) {
    return Option.none()
  }

  return Option.some(n)
})

/**
 * @internal
 */
export const getInitialValues = (
  base: string,
  options: DomNavigationOptions,
): Effect.Effect<
  Storage | History | Location,
  never,
  readonly [readonly NavigationEvent[], number]
> =>
  Effect.gen(function* ($) {
    // Get Resources
    const history = yield* $(History)
    const location = yield* $(Location)

    // Read the stored entries and index
    const storedEntries = yield* $(getStoredEvents)
    const storedIndex = Option.getOrElse(yield* $(getStoredIndex), () => storedEntries.length - 1)
    const storedEntry = storedEntries[storedIndex]

    // Read the initial url from the location
    const initialUrl = getUrl(location.href, base, location.origin)
    const initial: Destination = {
      key: options.initialKey ?? (yield* $(createKey)),
      url: initialUrl,
      state: history.state,
    }
    const initialEvent: NavigationEvent = {
      destination: initial,
      hashChange: false,
      navigationType: NavigationType.Push,
    }

    // If there are no stored entries then we can just use the initial entry
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

export const saveToStorage = (entries: readonly NavigationEvent[], index: number) =>
  Effect.gen(function* ($) {
    yield* $(setItem(TYPED_NAVIGATION_ENTRIES_KEY, JSON.stringify(entries)))
    yield* $(setItem(TYPED_NAVIGATION_INDEX_KEY, JSON.stringify(index)))
  })
