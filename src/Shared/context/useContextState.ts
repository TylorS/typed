import { Effect } from '@typed/fp/Effect/Effect'
import {
  GetSharedEnv,
  GetSharedValue,
  Shared,
  SharedEnv,
  usingNamespace,
} from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

import { getSharedState, State } from '../State/exports'
import { withProvider } from './withProvider'

/**
 * Get a State for a contextual value.
 */
export const useContextState = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & GetSharedEnv<S>, State<GetSharedValue<S>>> =>
  withProvider(shared, (provider) => pipe(shared, getSharedState, usingNamespace(provider)))
