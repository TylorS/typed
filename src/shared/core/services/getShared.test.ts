import { createAdapter } from '@most/adapter'
import { runEffects, tap } from '@most/core'
import { newDefaultScheduler } from '@most/scheduler'
import { doEffect, execPure, provideAll, Pure } from '@typed/fp/Effect/exports'
import { provideSchedulerEnv } from '@typed/fp/fibers/exports'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { createSharedEnvProvider } from '../../createSharedEnvProvider/exports'
import { createShared } from '../constructors/exports'
import { SharedEvent, SharedValueCreated } from '../events/exports'
import { Namespace, SharedKeyStore } from '../exports'
import { getShared } from './getShared'

export const test = describe(`getShared`, [
  given(`a Shared instance`, [
    it(`returns the default value`, ({ same }, done) => {
      const expected = {}
      const initial = Pure.of(expected)
      const state = createShared('test', initial)

      const sut = doEffect(function* () {
        try {
          const actual = yield* getShared(state)

          same(expected, actual)

          done()
        } catch (error) {
          done(error)
        }
      })

      pipe(sut, createSharedEnvProvider(), provideSchedulerEnv, execPure)
    }),

    it(`emits SharedValueCreated event when does not exist in store`, ({ equal }, done) => {
      const initial = 0
      const state = createShared('test', Pure.of(initial))
      const { namespaceA, keyStores } = createKeyStores()
      const sharedEvents = createAdapter<SharedEvent>()
      const expected: SharedValueCreated = {
        type: 'sharedValue/created',
        namespace: namespaceA,
        shared: state,
        value: initial,
      }

      runEffects(
        tap((event) => {
          try {
            equal(expected, event)

            done()
          } catch (error) {
            done(error)
          }
        }, sharedEvents[1]),
        newDefaultScheduler(),
      )

      pipe(
        getShared(state),
        provideAll({ currentNamespace: namespaceA, sharedEvents, namespaceKeyStores: keyStores }),
        execPure,
      )
    }),
  ]),
])

function createKeyStores() {
  const namespaceA = Namespace.wrap('a')
  const keyStoreA: SharedKeyStore = new Map()

  const namespaceB = Namespace.wrap('b')
  const keyStoreB: SharedKeyStore = new Map()

  const keyStores: Map<Namespace, SharedKeyStore> = new Map([
    [namespaceA, keyStoreA],
    [namespaceB, keyStoreB],
  ])

  return { namespaceA, keyStoreA, namespaceB, keyStoreB, keyStores }
}
