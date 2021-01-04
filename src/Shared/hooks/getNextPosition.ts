import { doEffect, Effect } from '@fp/Effect/exports'
import { SharedEnv } from '@fp/Shared/core/exports'

import { getNamespacePosition } from './NamespacePosition'

/**
 * Get the current namespace's next position
 */
export const getNextPosition: Effect<SharedEnv, number> = doEffect(function* () {
  const position = yield* getNamespacePosition

  const current = position.current

  position.current = position.current + 1

  return current
})
