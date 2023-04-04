import { deepStrictEqual } from 'assert'

import { millis } from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { describe, it } from 'vitest'

import { collectAll } from '../run/collectAll.js'

import { makeRef, RefSubject } from './RefSubject.js'

describe(import.meta.url, () => {
  describe('RefSubject.tuple', () => {
    it('allows joining RefSubjects into a single interface', async () => {
      const test = Effect.scoped(
        Effect.gen(function* ($) {
          const a = yield* $(makeRef(() => 1))
          const b = yield* $(makeRef(() => 2))
          const c = yield* $(makeRef(() => 3))
          const tupled = yield* $(RefSubject.tuple(a, b, c))

          deepStrictEqual(yield* $(tupled.get), [1, 2, 3])

          yield* $(b.set(4))

          deepStrictEqual(yield* $(tupled.get), [1, 4, 3])

          yield* $(tupled.set([5, 6, 7]))

          deepStrictEqual(yield* $(a.get), 5)
          deepStrictEqual(yield* $(b.get), 6)
          deepStrictEqual(yield* $(c.get), 7)
        }),
      )

      await Effect.runPromise(test)
    })
  })

  describe('RefSubject.struct', () => {
    it('allows joining RefSubjects into a single interface', async () => {
      const test = Effect.scoped(
        Effect.gen(function* ($) {
          const a = yield* $(makeRef(() => 1))
          const b = yield* $(makeRef(() => 2))
          const c = yield* $(makeRef(() => 3))
          const struct = yield* $(RefSubject.struct({ a, b, c }))

          deepStrictEqual(yield* $(struct.get), { a: 1, b: 2, c: 3 })

          yield* $(b.set(4))

          deepStrictEqual(yield* $(struct.get), { a: 1, b: 4, c: 3 })

          yield* $(struct.set({ a: 5, b: 6, c: 7 }))

          deepStrictEqual(yield* $(a.get), 5)
          deepStrictEqual(yield* $(b.get), 6)
          deepStrictEqual(yield* $(c.get), 7)
        }),
      )

      await Effect.runPromise(test)
    })
  })

  describe('Computed', () => {
    it('allows computing values from a RefSubject', async () => {
      const test = Effect.scoped(
        Effect.gen(function* ($) {
          const refSubject = yield* $(makeRef(() => 1))
          const computed = yield* $(refSubject.computeSync((a) => a + 42))

          deepStrictEqual(yield* $(computed.get), 43)

          yield* $(refSubject.set(2))

          deepStrictEqual(yield* $(computed.get), 44)
        }),
      )

      await Effect.runPromise(test)
    })

    it('allows computing values from a Computed', async () => {
      const test = Effect.scoped(
        Effect.gen(function* ($) {
          const refSubject = yield* $(makeRef(() => 1))
          const computed = yield* $(refSubject.computeSync((a) => a + 42))
          const computed2 = yield* $(computed.computeSync((a) => a + 1))

          deepStrictEqual(yield* $(computed.get), 43, '1a -43')
          deepStrictEqual(yield* $(computed2.get), 44, '1b - 44')

          yield* $(refSubject.set(2))

          deepStrictEqual(yield* $(computed.get), 44, '2a - 44')
          deepStrictEqual(yield* $(computed2.get), 45, '2a - 45')
        }),
      )

      await Effect.runPromise(test)
    })
  })

  it('allows replaying latest events to late subscribers', async () => {
    const test = Effect.gen(function* ($) {
      const holdSubject = RefSubject.unsafeMake<number>(() => 0)

      const producer = Effect.gen(function* ($) {
        yield* $(Effect.sleep(millis(0)))
        yield* $(holdSubject.event(1))
        yield* $(Effect.sleep(millis(100)))
        yield* $(holdSubject.event(2))
        yield* $(Effect.sleep(millis(100)))
        yield* $(holdSubject.event(3))
        yield* $(Effect.sleep(millis(100)))
        yield* $(holdSubject.event(4))
        yield* $(Effect.sleep(millis(100)))
        yield* $(holdSubject.event(5))
        yield* $(Effect.sleep(millis(100)))
        yield* $(holdSubject.event(6))
        yield* $(holdSubject.end)
      })

      yield* $(Effect.fork(producer))

      const fiber1 = yield* $(Effect.fork(collectAll(holdSubject)))

      yield* $(Effect.sleep(millis(75)))

      const fiber2 = yield* $(Effect.fork(collectAll(holdSubject)))

      yield* $(Effect.sleep(millis(75)))

      const fiber3 = yield* $(Effect.fork(collectAll(holdSubject)))

      const events1 = yield* $(Fiber.join(fiber1))
      const events2 = yield* $(Fiber.join(fiber2))
      const events3 = yield* $(Fiber.join(fiber3))

      deepStrictEqual(events1, [0, 1, 2, 3, 4, 5, 6], '1')
      deepStrictEqual(events2, [1, 2, 3, 4, 5, 6], '2')
      deepStrictEqual(events3, [2, 3, 4, 5, 6], '3')
    })

    await Effect.runPromise(test)
  })
})
