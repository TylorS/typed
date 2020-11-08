import { Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared, SharedKey } from '@typed/fp/shared/core/exports'

import { Ref } from './Ref'

/**
 * Memoize the creation of Ref objects wrapping Shared value.
 */
export const NamespaceRefs = createShared(
  Symbol('NamespaceRefs'),
  Pure.fromIO(() => new Map<SharedKey, Ref<any>>()),
)

export const getNamespaceRefs = getShared(NamespaceRefs)
