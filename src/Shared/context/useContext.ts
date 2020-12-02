import { Effect } from '@typed/fp/Effect/Effect'
import {
  getShared,
  GetSharedEnv,
  GetSharedValue,
  Shared,
  SharedEnv,
  usingNamespace,
} from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

import { withProvider } from './withProvider'

/**
 * Use a tree of namespaces to retrieve the closest provider for a given Shared key.
 */
export const useContext = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & GetSharedEnv<S>, GetSharedValue<S>> =>
  withProvider(shared, (provider) => pipe(shared, getShared, usingNamespace(provider)))
