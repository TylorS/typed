import { Pure } from '@typed/fp/Effect/exports'
import { getShared, Namespace, Shared, shared, SharedKey } from '@typed/fp/Shared/domain/exports'

export const NamespaceConsumers = shared(
  Symbol('NamespaceConsumers'),
  Pure.fromIO(() => new Map<SharedKey, Map<Namespace, Set<Shared>>>()),
)

export const getNamespaceConsumers = getShared(NamespaceConsumers)
