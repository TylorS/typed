import { createAdapter } from '@most/adapter'
import { runEffects, tap } from '@most/core'
import { newDefaultScheduler } from '@most/scheduler'
import { Pure } from '@typed/fp/Effect/Effect'
import { doEffect, execPure, provideAll } from '@typed/fp/Effect/exports'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { provideSharedEnv } from '../../createSharedEnvProvider/exports'
import { createShared } from '../constructors/createShared'
import { SharedValueUpdated } from '../events/exports'
import { GetSharedValue, Namespace, Shared, SharedKeyStore } from '../exports'
import { getShared } from './getShared'
import { modifyShared } from './modifyShared'

export const test = describe(`modifyShared`, [
  given(`a Shared value and an update function`, [
    it(`returns the most up to date state`, ({ equal }, done) => {
      const initial = 0
      const state = createShared('test', Pure.of(initial))

      const sut = doEffect(function* () {
        try {
          equal(initial, yield* getShared(state))
          equal(initial + 1, yield* modifyShared(state, (x) => x + 1))

          done()
        } catch (error) {
          done(error)
        }
      })

      pipe(sut, provideSharedEnv, execPure)
    }),

    it(`emits a SharedValueUpdated event`, ({ equal }, done) => {
      const initial = 0
      const state = createShared('test', Pure.of(initial))

      const { namespaceA, keyStores } = createKeyStoresFrom(state, initial)

      const sharedEvents = createAdapter()
      const scheduler = newDefaultScheduler()
      const expected: SharedValueUpdated = {
        type: 'sharedValue/updated',
        namespace: namespaceA,
        shared: state,
        previousValue: 0,
        value: 1,
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
        scheduler,
      )

      const sut = doEffect(function* () {
        try {
          equal(initial + 1, yield* modifyShared(state, (x) => x + 1))
        } catch (error) {
          done(error)
        }
      })

      pipe(
        sut,
        provideAll({
          currentNamespace: namespaceA,
          namespaceKeyStores: keyStores,
          sharedEvents,
        }),
        execPure,
      )
    }),
  ]),
])

function createKeyStoresFrom<S extends Shared>(state: S, initial: GetSharedValue<S>) {
  const namespaceA = Namespace.wrap('a')
  const keyStoreA: SharedKeyStore<typeof state> = new Map([[state.key, initial]])

  const namespaceB = Namespace.wrap('b')
  const keyStoreB: SharedKeyStore<typeof state> = new Map()

  const keyStores: Map<Namespace, SharedKeyStore<typeof state>> = new Map([
    [namespaceA, keyStoreA],
    [namespaceB, keyStoreB],
  ])

  return { namespaceA, keyStoreA, namespaceB, keyStoreB, keyStores }
}
