import { doEffect, Effect } from '@typed/fp/Effect/exports'

import {
  getNamespaceDisposables,
  getNamespacePositions,
  getNamespaceStates,
  getNamespaceSymbols,
} from './hooks/exports'
import { getSharedEnv, SharedEnv } from './SharedEnv'
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
    const { children, parents, consumers } = yield* getSharedEnv

    disposables.delete(namespace)
    positions.delete(namespace)
    symbols.delete(namespace)
    states.delete(namespace)

    children.delete(namespace)
    parents.delete(namespace)
    // TODO: is the a better way to make this O(1) as well?
    consumers.forEach((set) => set.delete(namespace))
  })

  return eff
}
