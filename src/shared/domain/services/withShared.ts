import { EffectGenerator } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'

import { Shared, ValueOf } from '../model/Shared'
import { getShared } from './getShared'

export const withShared = <S extends Shared, E, A>(
  shared: S,
  f: (value: ValueOf<S>) => EffectGenerator<E, A>,
) =>
  doEffect(function* () {
    const value = yield* getShared(shared)

    return yield* f(value)
  })
