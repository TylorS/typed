import { Effect } from '@typed/fp/Effect/Effect'
import { chain } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'

import { getShared } from './getShared'
import { EnvOf, Shared, ValueOf } from './Shared'
import { SharedEnv } from './SharedEnv'

/**
 * Run an effect from a shared value
 */
export const withShared = curry(
  <S extends Shared, E, A>(
    shared: S,
    f: (value: ValueOf<S>) => Effect<E, A>,
  ): Effect<E & SharedEnv & EnvOf<S>, A> => chain(f, getShared(shared)),
) as {
  <S extends Shared, E, A>(shared: S, f: (value: ValueOf<S>) => Effect<E, A>): Effect<
    E & SharedEnv & EnvOf<S>,
    A
  >

  <S extends Shared>(shared: S): <E, A>(
    f: (value: ValueOf<S>) => Effect<E, A>,
  ) => Effect<E & SharedEnv & EnvOf<S>, A>
}
