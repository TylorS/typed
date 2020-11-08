import { Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared, Namespace, SharedKey } from '@typed/fp/shared/core/exports'
import { Eq } from 'fp-ts/Eq'

export const NamespaceConsumers = createShared(
  Symbol('NamespaceConsumers'),
  Pure.fromIO(() => new Map<SharedKey, Map<Namespace, Set<Eq<unknown>>>>()),
)

export const getNamespaceConsumers = getShared(NamespaceConsumers)
