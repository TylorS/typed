import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'

import { sendSharedEvent } from '../events/exports'
import { GetSharedEnv, GetSharedValue, Shared } from '../model/Shared'
import { getCurrentNamespace } from './getCurrentNamespace'
import { getKeyStore } from './getKeyStore'
import { getShared } from './getShared'
import { SharedEnv } from './SharedEnv'

/**
 * Set the Shared Value.
 */
export const setShared = curry(
  <S extends Shared>(
    shared: S,
    value: GetSharedValue<S>,
  ): Effect<SharedEnv & GetSharedEnv<S>, GetSharedValue<S>> =>
    doEffect(function* () {
      const current = yield* getShared(shared)

      // Always set the value if it's changed
      if (!Object.is(current, value)) {
        const store = yield* getKeyStore

        store.set(shared.key, value)
      }

      // Use Eq to determine if an event should be sent
      if (!shared.eq.equals(current, value)) {
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
  <S extends Shared>(shared: S, value: GetSharedValue<S>): Effect<
    SharedEnv & GetSharedEnv<S>,
    GetSharedValue<S>
  >
  <S extends Shared>(shared: S): (
    value: GetSharedValue<S>,
  ) => Effect<SharedEnv & GetSharedEnv<S>, GetSharedValue<S>>
}
