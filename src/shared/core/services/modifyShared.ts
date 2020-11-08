import { Arity1 } from '@typed/fp/common/types'
import { chain, Effect, map } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { Shared, ValueOf } from '@typed/fp/shared/core/model/Shared'
import { pipe } from 'fp-ts/function'

import { getShared } from './getShared'
import { setShared } from './setShared'
import { SharedEnv } from './SharedEnv'

/**
 * Update the current Shared value.
 */
export const modifyShared = curry(
  <S extends Shared>(shared: S, f: Arity1<ValueOf<S>, ValueOf<S>>): Effect<SharedEnv, ValueOf<S>> =>
    pipe(shared, getShared, map(f), chain(setShared(shared))),
) as {
  <S extends Shared>(shared: S, f: Arity1<ValueOf<S>, ValueOf<S>>): Effect<SharedEnv, ValueOf<S>>
  <S extends Shared>(shared: S): (
    f: Arity1<ValueOf<S>, ValueOf<S>>,
  ) => Effect<SharedEnv, ValueOf<S>>
}
