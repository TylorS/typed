import { deepStrictEqual, ok } from 'assert'

import * as Duration from '@effect/data/Duration'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Fx from '@typed/fx'
import { describe, it } from 'vitest'

import { MemoryNavigationOptions, memory } from './Memory.js'
import {
  Destination,
  DestinationKey,
  Navigation,
  NavigationType,
  cancelNavigation,
  redirect,
} from './Navigation.js'

const provide = <R, E, A>(effect: Effect.Effect<R, E, A>, options: MemoryNavigationOptions) =>
  Effect.provideSomeLayer(memory(options))(effect)

const testKey = DestinationKey('keys-are-random-and-not-tested-by-default-assertions')
const testUrl = 'https://example.com'
const testDestination = Destination(DestinationKey('default'), new URL(testUrl))
const testPathname1 = `${testUrl}/1`
const testPathname1Destination = Destination(testKey, new URL(testPathname1))
const testPathname2 = `${testUrl}/2`
const testPathname2Destination = Destination(testKey, new URL(testPathname2))

const testNavigation = <Y extends Effect.EffectGen<any, any, any>, A>(
  f: (adapter: Effect.Adapter, navigation: Navigation) => Generator<Y, A, any>,
  options: MemoryNavigationOptions = { initialUrl: new URL(testUrl) },
) =>
  Effect.scoped(
    provide(
      Effect.tapErrorCause(
        Effect.gen(function* ($) {
          const navigation = yield* $(Navigation)
          const result = yield* f($, navigation)

          return result
        }),
        Effect.logError,
      ),
      options,
    ),
  )

const fxToFiber = <R, E, A>(fx: Fx.Fx<R, E, A>, take: number) =>
  Effect.gen(function* ($) {
    const fiber = yield* $(fx, Fx.take(take), Fx.toReadonlyArray, Effect.forkScoped)

    yield* $(Effect.sleep(Duration.millis(0)))
    yield* $(Effect.sleep(Duration.millis(0)))

    return fiber
  })

const assertEqualDestination: (a: Destination, b: Destination) => void = (a, b) => {
  deepStrictEqual(
    a.url.href,
    b.url.href,
    'Urls should match. Actual: ' + a.url.href + ' Expected: ' + b.url.href,
  )
  deepStrictEqual(
    a.state,
    b.state,
    'State should match. Actual: ' +
      JSON.stringify(a.state) +
      ' Expeced: ' +
      JSON.stringify(b.state),
  )
}

const assertSomeDestination = (a: Option.Option<Destination>, b: Destination) => {
  ok(Option.isSome(a))
  assertEqualDestination(a.value, b)
}

const assertEqualDestinations: (a: readonly Destination[], b: readonly Destination[]) => void = (
  a,
  b,
) => {
  deepStrictEqual(a.length, b.length, 'Destinations should have the same length')

  for (let i = 0; i < a.length; ++i) {
    assertEqualDestination(a[i], b[i])
  }
}

describe(import.meta.url, () => {
  describe('entries', () => {
    it('returns the initial entry immediately', async () => {
      const test = testNavigation(function* ($, { entries }) {
        const initial = yield* $(entries)

        assertEqualDestinations(initial, [testDestination])
      })

      await Effect.runPromise(test)
    })

    it('is observerable', async () => {
      const test = testNavigation(function* ($, { entries, navigate }) {
        const fiber = yield* $(fxToFiber(entries, 2))

        yield* $(navigate(testPathname1))

        const results = yield* $(Fiber.join(fiber))

        deepStrictEqual(results.length, 2)

        assertEqualDestinations(results[0], [testDestination])
        assertEqualDestinations(results[1], [testDestination, testPathname1Destination])
      })

      await Effect.runPromise(test)
    })
  })

  describe('currentEntry', () => {
    it('returns the initial entry immediately', async () => {
      const test = testNavigation(function* ($, { currentEntry }) {
        const initial = yield* $(currentEntry)

        assertEqualDestination(initial, testDestination)
      })

      await Effect.runPromise(test)
    })

    it('is observerable', async () => {
      const test = testNavigation(function* ($, { currentEntry, navigate }) {
        const fiber = yield* $(fxToFiber(currentEntry, 3))

        yield* $(navigate(testPathname1))
        yield* $(navigate(testPathname2))

        const results = yield* $(Fiber.join(fiber))

        assertEqualDestinations(results, [
          testDestination,
          testPathname1Destination,
          testPathname2Destination,
        ])
      })

      await Effect.runPromise(test)
    })
  })

  describe('navigate', () => {
    it('navigates to a new url', async () => {
      const test = testNavigation(function* ($, { currentEntry, navigate }) {
        const initial = yield* $(currentEntry)

        assertEqualDestination(initial, testDestination)

        const destination = yield* $(navigate(testPathname1))

        assertEqualDestination(destination, testPathname1Destination)
      })

      await Effect.runPromise(test)
    })

    it('sets state when provided', async () => {
      const test = testNavigation(function* ($, { navigate }) {
        const destination = yield* $(navigate(testPathname1, { state: testKey }))

        assertEqualDestination(destination, Destination(testKey, new URL(testPathname1), testKey))
      })

      await Effect.runPromise(test)
    })

    it('allows replacing the current entry', async () => {
      const test = testNavigation(function* ($, { entries, navigate }) {
        assertEqualDestinations(yield* $(entries), [testDestination])

        const destination = yield* $(navigate(testPathname1, { history: 'replace' }))

        assertEqualDestinations(yield* $(entries), [destination])
      })

      await Effect.runPromise(test)
    })
  })

  describe('onNavigation', () => {
    it('allows subscribing to navigation events', async () => {
      const test = testNavigation(function* ($, { navigate, onNavigation }) {
        let i = 0
        yield* $(
          onNavigation((event) => {
            if (i === 1) {
              deepStrictEqual(event.navigationType, NavigationType.Push)
              assertEqualDestination(event.destination, testPathname1Destination)
            }

            if (i === 2) {
              deepStrictEqual(event.navigationType, NavigationType.Push)
              assertEqualDestination(event.destination, testPathname2Destination)
            }

            i++

            return Effect.unit
          }),
        )

        yield* $(navigate(testPathname1))
        yield* $(navigate(testPathname2))

        deepStrictEqual(i, 3)
      })

      await Effect.runPromise(test)
    })

    it('allows canceling the requested navigation', async () => {
      const test = testNavigation(function* ($, { navigate, onNavigation }) {
        yield* $(onNavigation(() => cancelNavigation))

        const destination = yield* $(navigate(testPathname1))

        assertEqualDestination(destination, testDestination)
      })

      await Effect.runPromise(test)
    })

    it('allow redirection to a different url', async () => {
      const test = testNavigation(function* ($, { navigate, onNavigation }) {
        yield* $(
          onNavigation(({ destination }) =>
            destination.url.href === testPathname1 ? redirect(testPathname2) : Effect.unit,
          ),
        )

        const destination = yield* $(navigate(testPathname1))

        assertEqualDestination(destination, testPathname2Destination)
      })

      await Effect.runPromise(test)
    })
  })

  describe('canGoBack', () => {
    it('returns false when on the first entry', async () => {
      const test = testNavigation(function* ($, { canGoBack }) {
        deepStrictEqual(yield* $(canGoBack), false)
      })

      await Effect.runPromise(test)
    })

    it('returns true when there are entries to go back to', async () => {
      const test = testNavigation(function* ($, { canGoBack, navigate }) {
        yield* $(navigate(testPathname1))

        deepStrictEqual(yield* $(canGoBack), true)
      })

      await Effect.runPromise(test)
    })

    it('is observable', async () => {
      const test = testNavigation(function* ($, { canGoBack, navigate }) {
        const fiber = yield* $(fxToFiber(canGoBack, 2))

        yield* $(navigate(testPathname1))
        yield* $(navigate(testPathname2))

        const results = yield* $(Fiber.join(fiber))

        deepStrictEqual(results, [false, true])
      })

      await Effect.runPromise(test)
    })
  })

  describe('back', () => {
    it('does nothing when there are no entries to go back to', async () => {
      const test = testNavigation(function* ($, { back }) {
        assertEqualDestination(yield* $(back), testDestination)
      })

      await Effect.runPromise(test)
    })

    it('goes back to the previous entry', async () => {
      const test = testNavigation(function* ($, { back, navigate }) {
        yield* $(navigate(testPathname1))

        assertEqualDestination(yield* $(back), testDestination)
      })

      await Effect.runPromise(test)
    })
  })

  describe('canGoForward', () => {
    it('returns false when on the last entry', async () => {
      const test = testNavigation(function* ($, { canGoForward }) {
        deepStrictEqual(yield* $(canGoForward), false)
      })

      await Effect.runPromise(test)
    })

    it('returns true when there are entries to go forward to', async () => {
      const test = testNavigation(function* ($, { canGoForward, back, navigate }) {
        yield* $(navigate(testPathname1))
        yield* $(navigate(testPathname2))

        deepStrictEqual(yield* $(canGoForward), false)

        yield* $(back)

        deepStrictEqual(yield* $(canGoForward), true)
      })

      await Effect.runPromise(test)
    })

    it('is observable', async () => {
      const test = testNavigation(function* ($, { canGoForward, back, navigate }) {
        const fiber = yield* $(fxToFiber(canGoForward, 2))

        yield* $(navigate(testPathname1))
        yield* $(back)

        const results = yield* $(Fiber.join(fiber))

        deepStrictEqual(results, [false, true]) // Duplication between first and second entry is skipped
      })

      await Effect.runPromise(test)
    })
  })

  describe('forward', () => {
    it('does nothing when there are no entries to go forward to', async () => {
      const test = testNavigation(function* ($, { forward }) {
        assertEqualDestination(yield* $(forward), testDestination)
      })

      await Effect.runPromise(test)
    })

    it('goes forward to the next entry', async () => {
      const test = testNavigation(function* ($, { forward, back, navigate }) {
        yield* $(navigate(testPathname1))
        yield* $(navigate(testPathname2))

        assertEqualDestination(yield* $(back), testPathname1Destination)
        assertEqualDestination(yield* $(forward), testPathname2Destination)
      })

      await Effect.runPromise(test)
    })
  })

  describe('reload', () => {
    it('reloads the current entry', async () => {
      const test = testNavigation(function* ($, { reload, navigate }) {
        yield* $(navigate(testPathname1))

        assertEqualDestination(yield* $(reload), testPathname1Destination)
      })

      await Effect.runPromise(test)
    })

    it('sends a reload event to subscribers', async () => {
      const test = testNavigation(function* ($, { reload, navigate, onNavigation }) {
        let i = 0
        yield* $(
          onNavigation((event) => {
            if (i === 1) {
              deepStrictEqual(event.navigationType, NavigationType.Push)
              assertEqualDestination(event.destination, testPathname1Destination)
            }

            if (i === 2) {
              deepStrictEqual(event.navigationType, NavigationType.Reload)
              assertEqualDestination(event.destination, testPathname1Destination)
            }

            i++

            return Effect.unit
          }),
        )

        yield* $(navigate(testPathname1))
        yield* $(reload)

        deepStrictEqual(i, 3)
      })

      await Effect.runPromise(test)
    })
  })

  describe('goTo', () => {
    it('goes to a specific entry', async () => {
      const test = testNavigation(function* ($, { currentEntry, goTo, navigate }) {
        const d0 = yield* $(currentEntry)
        const d1 = yield* $(navigate(testPathname1))
        const d2 = yield* $(navigate(testPathname2))

        assertSomeDestination(yield* $(goTo(d0.key)), testDestination)
        assertSomeDestination(yield* $(goTo(d1.key)), testPathname1Destination)
        assertSomeDestination(yield* $(goTo(d2.key)), testPathname2Destination)
      })

      await Effect.runPromise(test)
    })

    it('returns None when the entry does not exist', async () => {
      const test = testNavigation(function* ($, { goTo }) {
        deepStrictEqual(yield* $(goTo(DestinationKey('does-not-exist'))), Option.none())
      })

      await Effect.runPromise(test)
    })
  })

  describe('maxEntries', () => {
    it('allows configuring how many entries are stored', async () => {
      const test = testNavigation(
        function* ($, { currentEntry, entries, navigate }) {
          const fiber = yield* $(fxToFiber(currentEntry, 3))

          yield* $(navigate(testPathname1))
          yield* $(navigate(testPathname2))

          const results = yield* $(Fiber.join(fiber))

          assertEqualDestinations(results, [
            testDestination,
            testPathname1Destination,
            testPathname2Destination,
          ])

          const entriesAfterNavigation = yield* $(entries)

          assertEqualDestinations(entriesAfterNavigation, [
            testPathname1Destination,
            testPathname2Destination,
          ])
        },
        { initialUrl: new URL(testUrl), maxEntries: 2 },
      )

      await Effect.runPromise(test)
    })
  })
})
