import type { SharedEventEnv } from '../events/exports'
import type { CurrentNamespaceEnv } from './CurrentNamespaceEnv'
import type { NamespaceKeyStoresEnv } from './NamespaceKeyStoresEnv'

/**
 * An environment type for all the things required to power Shared with lifecycle events.
 */
export interface SharedEnv extends CurrentNamespaceEnv, NamespaceKeyStoresEnv, SharedEventEnv {}
