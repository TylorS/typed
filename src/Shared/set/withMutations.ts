import { Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'

import { setShared, SharedEnv, SharedKey, withShared } from '../core/exports'
import { SharedSet } from './SharedSet'

export const withMutations = curry(
  <K extends SharedKey, V>(
    shared: SharedSet<K, V>,
    f: (set: Set<V>) => void,
  ): Effect<SharedEnv, ReadonlySet<V>> => {
    return withShared(shared, function* (set) {
      const mutable = new Set(set)

      f(mutable)

      return yield* setShared(shared, mutable)
    })
  },
) as {
  <K extends SharedKey, V>(shared: SharedSet<K, V>, f: (set: Set<V>) => void): Effect<
    SharedEnv,
    ReadonlySet<V>
  >
  <K extends SharedKey, V>(shared: SharedSet<K, V>): (
    f: (set: Set<V>) => void,
  ) => Effect<SharedEnv, ReadonlySet<V>>
}
