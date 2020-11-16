import { doEffect } from '@typed/fp/Effect/doEffect'
import { Effect } from '@typed/fp/Effect/Effect'
import { curry } from '@typed/fp/lambda/exports'

import { SharedEnv, SharedKey } from '../core/exports'
import { SharedSet } from './SharedSet'
import { withMutations } from './withMutations'

export const deleteValue = curry(
  <K extends SharedKey, V>(shared: SharedSet<K, V>, value: V): Effect<SharedEnv, boolean> => {
    const eff = doEffect(function* () {
      let deleted = false

      yield* withMutations(shared, (set) => (deleted = set.delete(value)))

      return deleted
    })

    return eff
  },
) as {
  <K extends SharedKey, V>(shared: SharedSet<K, V>, value: V): Effect<SharedEnv, boolean>
  <K extends SharedKey, V>(shared: SharedSet<K, V>): (value: V) => Effect<SharedEnv, boolean>
}
