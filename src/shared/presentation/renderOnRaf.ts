import { raf } from '@typed/fp/dom/exports'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { createGuardFromSchema } from '@typed/fp/io/exports'
import { pipe } from 'fp-ts/function'
import * as G from 'io-ts/Guard'

import { listenToSharedEvent, runWithNamespace } from '../application/exports'
import { Namespace, NamespaceUpdated, SharedEnv, SharedValueUpdated } from '../domain/exports'
import { patch } from './Patch'

const namespaceUpdated = createGuardFromSchema(NamespaceUpdated.schema)
const sharedValueUpdated = createGuardFromSchema(SharedValueUpdated.schema)

export const renderOnRaf = <E, A, B>(main: Effect<E & SharedEnv, A>, initial: B) => {
  const eff = doEffect(function* () {
    const namespace = Namespace.wrap(Symbol())
    const run = runWithNamespace(namespace, main)
    let updated = false

    yield* listenToSharedEvent(pipe(G.union(namespaceUpdated, sharedValueUpdated)), () => {
      console.log('here')
      updated = true
    })

    let previous = yield* patch(initial, yield* run)

    while (true) {
      yield* raf

      if (updated) {
        updated = false
        previous = yield* patch(previous, yield* run)
      }
    }
  })

  return eff
}
