import { doEffect, Effect } from '@typed/fp/Effect/exports'

import {
  getNamespaceDisposables,
  getNamespacePositions,
  getNamespaceStates,
  getNamespaceSymbols,
} from './hooks/exports'
import { getNamespaceChildren, getNamespaceParents, SharedEnv } from './SharedEnv'
import { NamespaceDeleted } from './SharedEvent'

/**
 * Cleanup all resources related to a given namespace
 */
export function respondToNamespaceDeleted({
  namespace,
}: NamespaceDeleted): Effect<SharedEnv, void> {
  const eff = doEffect(function* () {
    const disposables = yield* getNamespaceDisposables
    const positions = yield* getNamespacePositions
    const symbols = yield* getNamespaceSymbols
    const states = yield* getNamespaceStates
    const dependencies = yield* getNamespaceChildren
    const parents = yield* getNamespaceParents

    disposables.delete(namespace)
    positions.delete(namespace)
    symbols.delete(namespace)
    dependencies.delete(namespace)
    parents.delete(namespace)
    states.delete(namespace)
  })

  return eff
}
