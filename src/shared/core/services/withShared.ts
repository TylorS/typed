import { Effect, EffectGenerator } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'

import { EnvOf, Shared, ValueOf } from '../model/Shared'
import { getShared } from './getShared'
import { SharedEnv } from './SharedEnv'

/**
 * Run an effect using a Shared value.
 */
export const withShared = <S extends Shared, E, A>(
  shared: S,
  f: (value: ValueOf<S>) => EffectGenerator<E, A>,
): Effect<SharedEnv & EnvOf<S> & E, A> =>
  doEffect(function* () {
    const value = yield* getShared(shared)

    return yield* f(value)
  })
