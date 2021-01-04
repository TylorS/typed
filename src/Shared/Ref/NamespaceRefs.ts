import { Pure } from '@fp/Effect/exports'
import { createShared, getShared, SharedKey } from '@fp/Shared/core/exports'

import { Ref } from './Ref'

/**
 * Memoize the creation of Ref objects wrapping Shared value.
 */
export const NamespaceRefs = createShared(
  Symbol.for('NamespaceRefs'),
  Pure.fromIO(() => new Map<SharedKey, Ref<any>>()),
)

/**
 * Get a Map of References
 */
export const getNamespaceRefs = getShared(NamespaceRefs)
