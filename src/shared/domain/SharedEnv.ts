import type { SharedEventEnv } from './events/exports'
import type { CurrentNamespaceEnv } from './services/CurrentNamespaceEnv'
import type { NamespaceKeyStoresEnv } from './services/NamespaceKeyStoresEnv'

export interface SharedEnv extends CurrentNamespaceEnv, NamespaceKeyStoresEnv, SharedEventEnv {}
