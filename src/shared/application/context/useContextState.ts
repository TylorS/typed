import { Effect } from '@typed/fp/Effect/Effect'
import { EnvOf, Shared, SharedEnv, usingNamespace, ValueOf } from '@typed/fp/Shared/domain/exports'
import { pipe } from 'fp-ts/function'

import { State } from '../model/exports'
import { getSharedState } from '../services/exports'
import { withProvider } from './withProvider'

export const useContextState = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & EnvOf<S>, State<ValueOf<S>>> =>
  withProvider(shared, (provider) => pipe(shared, getSharedState, usingNamespace(provider)))
