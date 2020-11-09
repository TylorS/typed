import { createAdapter } from '@most/adapter'

import { SharedEvent } from '../core/exports'
import { Namespace } from '../core/model/exports'
import { SharedEnv } from '../core/services/SharedEnv'

/**
 * Create a new SharedEnv
 */
export const createSharedEnv = (currentNamespace: Namespace): SharedEnv => {
  return {
    currentNamespace,
    sharedEvents: createAdapter<SharedEvent>(),
    namespaceKeyStores: new Map(),
  }
}
