import { Arity2 } from '@fp/common/types'
import { Effect, map } from '@fp/Effect/exports'
import { applyReducer, State } from '@fp/Shared/State/exports'
import { pipe } from 'fp-ts/function'

import { GetSharedEnv, GetSharedValue, Shared } from '../core/model/exports'
import { SharedEnv } from '../core/services/SharedEnv'
import { useContextState } from './useContextState'

/**
 * Apply a reducer to a contextual value.
 */
export const useContextReducer = <S extends Shared, A>(
  shared: S,
  reducer: Arity2<GetSharedValue<S>, A, GetSharedValue<S>>,
): Effect<SharedEnv & GetSharedEnv<S>, State<GetSharedValue<S>, A>> =>
  pipe(shared, useContextState, map(applyReducer(reducer)))
