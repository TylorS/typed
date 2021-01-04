import { asks, Effect } from '@fp/Effect/exports'

import { Namespace, SharedKeyStore } from '../model/exports'
import { SharedEnv } from './SharedEnv'

/**
 * Get all of the Shared key stores.
 */
export const getKeyStores: Effect<SharedEnv, Map<Namespace, SharedKeyStore>> = asks(
  (e) => e.namespaceKeyStores,
)
