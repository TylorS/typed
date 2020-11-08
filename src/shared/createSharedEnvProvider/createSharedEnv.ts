import { createAdapter } from '@most/adapter'

import { Namespace } from '../core/model/exports'
import { SharedEnv } from '../core/services/SharedEnv'

/**
 * Create a new SharedEnv
 */
export const createSharedEnv = (currentNamespace: Namespace): SharedEnv => ({
  currentNamespace,
  sharedEvents: createAdapter(),
  namespaceKeyStores: new Map(),
})
