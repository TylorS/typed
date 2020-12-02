import { createGuardFromSchema } from '@typed/fp/io/exports'
import {
  NamespaceCompleted,
  NamespaceDeleted,
  NamespaceUpdated,
  SharedValueUpdated,
} from '@typed/fp/Shared/core/exports'
import { createSharedEventHandler } from '@typed/fp/Shared/exports'

import { Patch } from '../Patch'
import { createPatchNamespace } from './createPatchNamespace'
import { namespaceCompleted } from './namespaceCompleted'
import { namespaceDeleted } from './namespaceDeleted'

const namespaceCompletedGuard = createGuardFromSchema(NamespaceCompleted.schema)
const namespaceDeletedGuard = createGuardFromSchema(NamespaceDeleted.schema)
const namespaceUpdatedGuard = createGuardFromSchema(NamespaceUpdated.schema)
const sharedValueUpdatedGuard = createGuardFromSchema(SharedValueUpdated.schema)

/**
 * Creates a version of the Render Handlers that will Patch a Namespace
 * as soon as it receives an Update.
 */
export function createRenderHandlers<A, B>(Patch: Patch<A, B>) {
  const patchNamespace = createPatchNamespace(Patch)

  const handlers = [
    createSharedEventHandler(namespaceCompletedGuard, namespaceCompleted),
    createSharedEventHandler(namespaceUpdatedGuard, (event) => patchNamespace(event.namespace)),
    createSharedEventHandler(sharedValueUpdatedGuard, (event) => patchNamespace(event.namespace)),
    createSharedEventHandler(namespaceDeletedGuard, namespaceDeleted),
  ] as const

  return handlers
}
