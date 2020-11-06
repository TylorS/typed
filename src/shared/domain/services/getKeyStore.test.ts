import { createAdapter } from '@most/adapter'
import { runEffects, tap } from '@most/core'
import { newDefaultScheduler } from '@most/scheduler'
import { doEffect, execPure, provideAll } from '@typed/fp/Effect/exports'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { NamespaceCreated } from '../events/exports'
import { Namespace, SharedKeyStore } from '../model/exports'
import { getKeyStore } from './getKeyStore'
import { usingNamespace } from './usingNamespace'

const namespaceA = Namespace.wrap('a')
const keyStoreA: SharedKeyStore = new Map()

const namespaceB = Namespace.wrap('b')
const keyStoreB: SharedKeyStore = new Map()

const keyStores: Map<Namespace, SharedKeyStore> = new Map([
  [namespaceA, keyStoreA],
  [namespaceB, keyStoreB],
])

export const test = describe(`getKeyStore`, [
  given(`a SharedEnv`, [
    it(`returns the current keyStore`, ({ same }, done) => {
      const sut = doEffect(function* () {
        try {
          const a = yield* pipe(getKeyStore, usingNamespace(namespaceA))

          same(keyStoreA, a)

          const b = yield* pipe(getKeyStore, usingNamespace(namespaceB))

          same(keyStoreB, b)

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
          sharedEvents: createAdapter(),
        }),
        execPure,
      )
    }),

    it(`emits NamespaceCreated event when creating a new keyStore`, ({ equal }, done) => {
      const sharedEvents = createAdapter()
      const namespace = Namespace.wrap('test')
      const scheduler = newDefaultScheduler()
      const expected: NamespaceCreated = { type: 'namespace/created', namespace }

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

      pipe(
        getKeyStore,
        provideAll({
          currentNamespace: namespace,
          namespaceKeyStores: keyStores,
          sharedEvents,
        }),
        execPure,
      )
    }),
  ]),
])
