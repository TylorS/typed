import { Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared, Namespace, SharedKey } from '@typed/fp/Shared/core/exports'
import { Eq } from 'fp-ts/Eq'

export const NamespaceConsumers = createShared(
  Symbol.for('NamespaceConsumers'),
  Pure.fromIO(() => new Map<SharedKey, Map<Namespace, Set<Eq<unknown>>>>()),
)

export const getNamespaceConsumers = getShared(NamespaceConsumers)
