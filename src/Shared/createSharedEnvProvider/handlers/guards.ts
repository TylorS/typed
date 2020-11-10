import { createGuardFromSchema } from '@typed/fp/io/exports'

import {
  NamespaceDeleted,
  NamespaceStarted,
  SharedValueDeleted,
  SharedValueUpdated,
} from '../../core/exports'

export const namespaceDeletedGuard = createGuardFromSchema(NamespaceDeleted.schema)
export const namespaceStartedGuard = createGuardFromSchema(NamespaceStarted.schema)
export const sharedValueDeletedGuard = createGuardFromSchema(SharedValueDeleted.schema)
export const sharedValueUpdatedGuard = createGuardFromSchema(SharedValueUpdated.schema)
