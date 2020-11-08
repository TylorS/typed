import { createGuardFromSchema } from '@typed/fp/io/exports'

import { NamespaceCompleted, NamespaceUpdated, SharedValueUpdated } from '../../core/exports'
import { createSharedEventHandler } from '../../createSharedEnvProvider/exports'
import { Patch } from '../Patch'
import { createPatchNamespace } from './createPatchNamespace'
import { namespaceCompleted } from './namespaceCompleted'

const namespaceCompletedGuard = createGuardFromSchema(NamespaceCompleted.schema)
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
  ] as const

  return handlers
}
