import { deepEqual, deepStrictEqual, ok } from 'assert'

import { equals } from '@effect/data/Equal'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as RemoteData from '@typed/remote-data'
import { describe, it } from 'vitest'

import { makeRefRemoteData } from './RefRemoteData.js'

describe('RefRemoteData', () => {
  const makeRef = makeRefRemoteData<Error, string>()
  // const error = new Error('test')

  it('initializes with no data', async () => {
    const test = Effect.gen(function* ($) {
      const ref = yield* $(makeRef)
      const current = yield* $(ref.get)

      deepStrictEqual(current, RemoteData.noData)
    }).pipe(Effect.scoped)

    await Effect.runPromise(test)
  })

  it('running an Effect updates the state to loading', async () => {
    const test = Effect.gen(function* ($) {
      const ref = yield* $(makeRef)

      const fiber = yield* $(Effect.fork(ref.runEffect(Effect.delay(100)(Effect.succeed('test')))))

      // Let fiber start executing
      yield* $(Effect.sleep(1))

      const current = yield* $(ref.get)

      deepEqual(current, RemoteData.loading)

      yield* $(Fiber.join(fiber))

      const updated = yield* $(ref.get)

      ok(equals(updated, RemoteData.success('test')))
    }).pipe(Effect.scoped)

    await Effect.runPromise(test)
  })

  it('stops loading when Effect is interrupted', async () => {
    const test = Effect.gen(function* ($) {
      const ref = yield* $(makeRef)

      const fiber = yield* $(Effect.fork(ref.runEffect(Effect.delay(1000)(Effect.succeed('test')))))

      // Let fiber start executing
      yield* $(Effect.sleep(1))

      const current = yield* $(ref.get)

      deepEqual(current, RemoteData.loading)

      yield* $(Fiber.interrupt(fiber))

      const updated = yield* $(ref.get)

      ok(equals(updated, RemoteData.noData))
    }).pipe(Effect.scoped)

    await Effect.runPromise(test)
  })

  it('allows matching over RemoteData with Effects', async () => {
    const test = Effect.gen(function* ($) {
      const ref = yield* $(makeRef)
      const matched = ref.matchEffect({
        onNoData: () => Effect.succeedNone,
        onLoading: () => Effect.succeedNone,
        onFailure: () => Effect.succeedNone,
        onSuccess: Effect.succeedSome,
      })

      deepStrictEqual(yield* $(matched), Option.none())

      yield* $(ref.set(RemoteData.loading))

      deepStrictEqual(yield* $(matched), Option.none())

      yield* $(ref.set(RemoteData.fail(new Error('test'))))

      deepStrictEqual(yield* $(matched), Option.none())

      yield* $(ref.set(RemoteData.success('test')))

      deepStrictEqual(yield* $(matched), Option.some('test'))
    }).pipe(Effect.scoped)

    await Effect.runPromise(test)
  })
})
