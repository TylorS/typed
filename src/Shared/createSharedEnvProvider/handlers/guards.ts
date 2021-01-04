import { createGuard } from '@fp/io/exports'

import {
  NamespaceDeleted,
  NamespaceStarted,
  SharedValueDeleted,
  SharedValueUpdated,
} from '../../core/exports'

export const namespaceDeletedGuard = createGuard(NamespaceDeleted.schema)
export const namespaceStartedGuard = createGuard(NamespaceStarted.schema)
export const sharedValueDeletedGuard = createGuard(SharedValueDeleted.schema)
export const sharedValueUpdatedGuard = createGuard(SharedValueUpdated.schema)
