import { WhenIdleEnv } from '@fp/dom/exports'
import { doEffect, useSome } from '@fp/Effect/exports'
import { createGuard } from '@fp/io/exports'
import { equals } from '@fp/logic/equals'
import { createFifoQueue } from '@fp/Queue/exports'
import {
  Namespace,
  NamespaceCompleted,
  NamespaceDeleted,
  NamespaceUpdated,
  SharedValueUpdated,
} from '@fp/Shared/core/exports'
import { createSharedEventHandler } from '@fp/Shared/createSharedEnvProvider/exports'
import { namespaceDeleted } from '@fp/Shared/createSharedEnvProvider/handlers/context/namespaceDeleted'
import { pipe } from 'fp-ts/function'

import { Patch } from '../Patch'
import { createPatchNamespace } from './createPatchNamespace'
import { createIdleScheduler } from './IdleScheduler'
import { namespaceCompleted } from './namespaceCompleted'

const namespaceCompletedGuard = createGuard(NamespaceCompleted.schema)
const namespaceDeletedGuard = createGuard(NamespaceDeleted.schema)
const namespaceUpdatedGuard = createGuard(NamespaceUpdated.schema)
const sharedValueUpdatedGuard = createGuard(SharedValueUpdated.schema)

/**
 * Creates a version of the Render Handlers that will Patch a Namespace
 * as soon when the browser is idle.
 */
export function createWhenIdleHandlers<A, B>(env: Patch<A, B> & WhenIdleEnv) {
  const queue = createFifoQueue<Namespace>([])
  const patchNamespace = createPatchNamespace(env)
  const scheduler = createIdleScheduler(queue, patchNamespace)
  const addNamespace = (namespace: Namespace) => {
    const eff = doEffect(function* () {
      if (!queue.some(equals(namespace))) {
        queue.enqueue(namespace)
      }

      if (!scheduler.scheduled) {
        yield* pipe(scheduler.scheduleNextRun(), useSome(env))
      }
    })

    return eff
  }

  const handlers = [
    createSharedEventHandler(namespaceCompletedGuard, namespaceCompleted),
    createSharedEventHandler(namespaceUpdatedGuard, (event) => addNamespace(event.namespace)),
    createSharedEventHandler(sharedValueUpdatedGuard, (event) => addNamespace(event.namespace)),
    createSharedEventHandler(namespaceDeletedGuard, namespaceDeleted),
  ] as const

  return handlers
}
