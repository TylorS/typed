import { doEffect } from '../Effect/exports'
import { getSharedEnv } from './SharedEnv'
import { SharedValueDeleted } from './SharedEvent'

/**
 * Remove shared value references from consumer tree.
 */
export function respondToSharedValueDeleted({ namespace, shared }: SharedValueDeleted) {
  const eff = doEffect(function* () {
    const { consumers } = yield* getSharedEnv

    // TODO: is the a faster way to acheive this?
    consumers.forEach((byShared) => byShared.get(shared.key)?.delete(namespace))
    consumers.get(namespace)?.delete(shared.key)
  })

  return eff
}
