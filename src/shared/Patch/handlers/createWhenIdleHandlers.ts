import { WhenIdleEnv } from '@typed/fp/dom/exports'
import { doEffect, useSome } from '@typed/fp/Effect/exports'
import { createGuardFromSchema } from '@typed/fp/io/exports'
import { pipe } from 'fp-ts/lib/function'

import {
  Namespace,
  NamespaceCompleted,
  NamespaceUpdated,
  SharedValueUpdated,
} from '../../core/exports'
import { createSharedEventHandler } from '../../createSharedEnvProvider/exports'
import { Patch } from '../Patch'
import { createPatchNamespace } from './createPatchNamespace'
import { createIdleScheduler } from './IdleScheduler'
import { namespaceCompleted } from './namespaceCompleted'

const namespaceCompletedGuard = createGuardFromSchema(NamespaceCompleted.schema)
const namespaceUpdatedGuard = createGuardFromSchema(NamespaceUpdated.schema)
const sharedValueUpdatedGuard = createGuardFromSchema(SharedValueUpdated.schema)

/**
 * Creates a version of the Render Handlers that will Patch a Namespace
 * as soon when the browser is idle.
 */
export function createWhenIdleHandlers<A, B>(env: Patch<A, B> & WhenIdleEnv) {
  const queue = new Set<Namespace>()
  const patchNamespace = createPatchNamespace(env)
  const scheduler = createIdleScheduler(queue, patchNamespace)
  const addNamespace = (namespace: Namespace) => {
    const eff = doEffect(function* () {
      queue.add(namespace)

      yield* pipe(scheduler.scheduleNextRun(), useSome(env))
    })

    return eff
  }

  const handlers = [
    createSharedEventHandler(namespaceCompletedGuard, namespaceCompleted),
    createSharedEventHandler(namespaceUpdatedGuard, (event) => addNamespace(event.namespace)),
    createSharedEventHandler(sharedValueUpdatedGuard, (event) => addNamespace(event.namespace)),
  ] as const

  return handlers
}
