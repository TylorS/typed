import { Arity2 } from '@typed/fp/common/types'
import { Effect, map } from '@typed/fp/Effect/exports'
import { applyReducer, State } from '@typed/fp/shared/State/exports'
import { pipe } from 'fp-ts/lib/function'

import { EnvOf, Shared, ValueOf } from '../core/model/exports'
import { SharedEnv } from '../core/services/SharedEnv'
import { useContextState } from './useContextState'

export const useContextReducer = <S extends Shared, A>(
  shared: S,
  reducer: Arity2<ValueOf<S>, A, ValueOf<S>>,
): Effect<SharedEnv & EnvOf<S>, State<ValueOf<S>, A>> =>
  pipe(shared, useContextState, map(applyReducer(reducer)))
