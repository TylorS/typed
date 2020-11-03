import { fromKey } from '../constructors/fromKey'
import { SharedKey } from '../exports'
import { Namespace } from './Namespace'
import { SharedKeyStore } from './SharedKeyStore'

export interface NamespaceKeyStores extends Map<Namespace, Map<SharedKey, SharedKeyStore>> {}

export const NamespaceKeyStores = fromKey<NamespaceKeyStores>()(
  Symbol('@typed/fp/NamespaceKeyStores'),
)
