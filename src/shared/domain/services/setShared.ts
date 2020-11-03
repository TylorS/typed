import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'

import { sendSharedEvent } from '../events/exports'
import { Shared, ValueOf } from '../model/Shared'
import { SharedEnv } from '../SharedEnv'
import { getCurrentNamespace } from './getCurrentNamespace'
import { getKeyStore } from './getKeyStore'
import { getShared } from './getShared'

/**
 * Set the Shared Value.
 */
export const setShared = curry(
  <S extends Shared>(shared: S, value: ValueOf<S>): Effect<SharedEnv, ValueOf<S>> =>
    doEffect(function* () {
      const current = getShared(shared)
      const equals = shared.eq.equals(current, value)

      if (!equals) {
        const store = yield* getKeyStore

        store.set(shared.key, value)

        yield* sendSharedEvent({
          type: 'sharedValue/updated',
          namespace: yield* getCurrentNamespace,
          shared,
          previousValue: current,
          value,
        })
      }

      return value
    }),
) as {
  <S extends Shared>(shared: S, value: ValueOf<S>): Effect<SharedEnv, ValueOf<S>>
  <S extends Shared>(shared: S): (value: ValueOf<S>) => Effect<SharedEnv, ValueOf<S>>
}
