import { Effect } from '@typed/fp/Effect/Effect'
import {
  EnvOf,
  getShared,
  Shared,
  SharedEnv,
  usingNamespace,
  ValueOf,
} from '@typed/fp/shared/core/exports'
import { pipe } from 'fp-ts/function'

import { withProvider } from './withProvider'

export const useContext = <S extends Shared>(shared: S): Effect<SharedEnv & EnvOf<S>, ValueOf<S>> =>
  withProvider(shared, (provider) => pipe(shared, getShared, usingNamespace(provider)))
