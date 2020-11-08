import { asks, Effect } from '@typed/fp/Effect/exports'

import { Namespace, SharedKeyStore } from '../model/exports'
import { SharedEnv } from './SharedEnv'

export const getKeyStores: Effect<SharedEnv, Map<Namespace, SharedKeyStore>> = asks(
  (e) => e.namespaceKeyStores,
)
