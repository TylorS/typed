import { SharedEventEnv } from './events/exports'
import { CurrentNamespaceEnv } from './services/CurrentNamespaceEnv'
import { NamespaceKeyStoresEnv } from './services/NamespaceKeyStoresEnv'

export interface SharedEnv extends CurrentNamespaceEnv, NamespaceKeyStoresEnv, SharedEventEnv {}
