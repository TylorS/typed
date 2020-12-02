import { Pure } from '@typed/fp/Effect/Effect'
import { createShared, getShared, Namespace } from '@typed/fp/Shared/core/exports'

/**
 * Get the current Namespace's providers of values.
 */
export const NamespaceProviders = createShared(
  Symbol.for('NamespaceProviders'),
  Pure.fromIO(() => new Set<Namespace>()),
)

/**
 * Get the current Namespace's providers of values.
 */
export const getNamspaceProviders = getShared(NamespaceProviders)
