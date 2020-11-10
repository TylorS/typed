import { asks, Effect } from '@typed/fp/Effect/exports'

import { Namespace } from '../model/exports'
import { CurrentNamespaceEnv } from './CurrentNamespaceEnv'

/**
 * Get the current namespace an effect is operating within
 */
export const getCurrentNamespace: Effect<CurrentNamespaceEnv, Namespace> = asks(
  (e: CurrentNamespaceEnv) => e.currentNamespace,
)
