import { Pure } from '@typed/fp/Effect/exports'
import { getShared, shared, SharedKey } from '@typed/fp/Shared/domain/exports'

import { Ref } from './Ref'

/**
 * Memoize the creation of Ref objects wrapping Shared value.
 */
export const NamespaceRefs = shared(
  Symbol('NamespaceRefs'),
  Pure.fromIO(() => new Map<SharedKey, Ref<any>>()),
)

export const getNamespaceRefs = getShared(NamespaceRefs)
