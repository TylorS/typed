import { Effect } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'

import { getShared } from './getShared'
import { Shared, ValueOf } from './Shared'
import { getCurrentNamespace, modifyNamespace, sendSharedEvent, SharedEnv } from './SharedEnv'

export const updatedShared = curry(
  <S extends Shared>(
    shared: S,
    update: (current: ValueOf<S>) => ValueOf<S>,
  ): Effect<SharedEnv, ValueOf<S>> => {
    const eff = doEffect(function* () {
      const current = yield* getShared(shared)
      const value = update(current)

      if (!shared.eq.equals(current, value)) {
        const namespace = yield* getCurrentNamespace

        yield* modifyNamespace(namespace, (map) => map.set(shared.key, value))

        yield* sendSharedEvent({
          type: 'sharedValue/updated',
          namespace,
          shared,
          previousValue: current,
          value,
        })

        return value
      }

      return current
    })

    return eff
  },
) as {
  <S extends Shared>(shared: S, update: (current: ValueOf<S>) => ValueOf<S>): Effect<
    SharedEnv,
    ValueOf<S>
  >

  <S extends Shared>(shared: S): (
    update: (current: ValueOf<S>) => ValueOf<S>,
  ) => Effect<SharedEnv, ValueOf<S>>
}
