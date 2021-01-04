import { Pure } from '@fp/Effect/exports'
import { createShared, getShared, Namespace, SharedKey } from '@fp/Shared/core/exports'
import { Eq } from 'fp-ts/Eq'

/**
 * Keep track of all of the namespaces currently consuming this namespace's values.
 */
export const NamespaceConsumers = createShared(
  Symbol.for('NamespaceConsumers'),
  Pure.fromIO(() => new Map<SharedKey, Map<Namespace, Set<Eq<unknown>>>>()),
)

/**
 * Get the current namespace's consumers
 */
export const getNamespaceConsumers = getShared(NamespaceConsumers)
