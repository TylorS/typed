import { Namespace, SharedKeyStore } from '../model/exports'

export interface NamespaceKeyStoresEnv {
  readonly namespaceKeyStores: Map<Namespace, SharedKeyStore>
}
