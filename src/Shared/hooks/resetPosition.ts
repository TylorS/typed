import { doEffect } from '@fp/Effect/exports'

import { getNamespacePosition } from './NamespacePosition'

/**
 * Reset the current namespace's position.s
 */
export const resetPosition = doEffect(function* () {
  const position = yield* getNamespacePosition

  position.current = 0
})
