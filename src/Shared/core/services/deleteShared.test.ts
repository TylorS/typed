import { Pure } from '@fp/Effect/Effect'
import { doEffect, execPure } from '@fp/Effect/exports'
import { provideAll } from '@fp/Effect/provide'
import { createAdapter } from '@most/adapter'
import { runEffects, tap } from '@most/core'
import { newDefaultScheduler } from '@most/scheduler'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { SharedValueDeleted } from '../events/exports'
import { createShared, GetSharedValue, Namespace, Shared, SharedKeyStore } from '../exports'
import { deleteShared } from './deleteShared'

export const test = describe(`deleteShared`, [
  given(`a Shared value`, [
    it(`deletes it from the key store`, ({ ok, notOk }, done) => {
      const initial = 0
      const state = createShared('test', Pure.of(initial))
      const { namespaceA, keyStoreA, keyStores } = createKeyStoresFrom(state, initial)
      const sharedEvents = createAdapter()

      const sut = doEffect(function* () {
        try {
          ok(keyStoreA.has(state.key))
          yield* deleteShared(state)
          notOk(keyStoreA.has(state.key))

          done()
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

    it(`deletes it from the key store`, ({ ok, notOk, equal }, done) => {
      const initial = 0
      const state = createShared('test', Pure.of(initial))
      const { namespaceA, keyStoreA, keyStores } = createKeyStoresFrom(state, initial)
      const sharedEvents = createAdapter()
      const scheduler = newDefaultScheduler()
      const expected: SharedValueDeleted = {
        type: 'sharedValue/deleted',
        namespace: namespaceA,
        shared: state,
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
          ok(keyStoreA.has(state.key))
          yield* deleteShared(state)
          notOk(keyStoreA.has(state.key))
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
