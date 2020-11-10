import type { SharedEventEnv } from '../events/exports'
import type { CurrentNamespaceEnv } from './CurrentNamespaceEnv'
import type { NamespaceKeyStoresEnv } from './NamespaceKeyStoresEnv'

export interface SharedEnv extends CurrentNamespaceEnv, NamespaceKeyStoresEnv, SharedEventEnv {}
