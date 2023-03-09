import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import { describe, it } from 'vitest'

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
  })
})
