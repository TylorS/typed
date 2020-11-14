import { Effect, EffectGenerator } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'

import { GetSharedEnv, GetSharedValue, Shared } from '../model/Shared'
import { getShared } from './getShared'
import { SharedEnv } from './SharedEnv'

/**
 * Run an effect using a Shared value.
 */
export const withShared = <S extends Shared, E, A>(
  shared: S,
  f: (value: GetSharedValue<S>) => EffectGenerator<E, A>,
): Effect<SharedEnv & GetSharedEnv<S> & E, A> =>
  doEffect(function* () {
    const value = yield* getShared(shared)

    return yield* f(value)
  })
