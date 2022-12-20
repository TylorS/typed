import { deepStrictEqual } from 'assert'

import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { millis } from '@fp-ts/data/Duration'
import * as Either from '@fp-ts/data/Either'
import { describe, it } from 'vitest'

import { at } from '../constructor/at.js'
import { collectAll } from '../run/collectAll.js'

import { mergeAll } from './merge.js'
import { separate } from './separate.js'

describe(import.meta.url, () => {
  describe(separate.name, () => {
    it('allows separating Eithers to lefts and rights', async () => {
      const test = Effect.gen(function* ($) {
        const source = mergeAll(
          at(millis(0), Either.left(1)),
          at(millis(200), Either.right(2)),
          at(millis(100), Either.left(3)),
          at(millis(150), Either.right(4)),
          at(millis(250), Either.left(5)),
        )
        const [lefts, rights] = separate(source)

        const fiberLefts = yield* $(Effect.fork(collectAll(lefts)))
        const fiberRights = yield* $(Effect.fork(collectAll(rights)))

        deepStrictEqual(yield* $(Fiber.join(fiberLefts)), [1, 3, 5])
        deepStrictEqual(yield* $(Fiber.join(fiberRights)), [4, 2])
      })

      await Effect.unsafeRunPromise(test)
    })
  })
})
