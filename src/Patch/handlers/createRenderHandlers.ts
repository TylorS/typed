import { createGuard } from '@fp/io/exports'
import {
  NamespaceCompleted,
  NamespaceDeleted,
  NamespaceUpdated,
  SharedValueUpdated,
} from '@fp/Shared/core/exports'
import { createSharedEventHandler } from '@fp/Shared/exports'

import { Patch } from '../Patch'
import { createPatchNamespace } from './createPatchNamespace'
import { namespaceCompleted } from './namespaceCompleted'
import { namespaceDeleted } from './namespaceDeleted'

const namespaceCompletedGuard = createGuard(NamespaceCompleted.schema)
const namespaceDeletedGuard = createGuard(NamespaceDeleted.schema)
const namespaceUpdatedGuard = createGuard(NamespaceUpdated.schema)
const sharedValueUpdatedGuard = createGuard(SharedValueUpdated.schema)

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
