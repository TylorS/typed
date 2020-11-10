import { doEffect } from '@typed/fp/Effect/exports'

import { getNamespacePosition } from './NamespacePosition'

export const resetPosition = doEffect(function* () {
  const position = yield* getNamespacePosition

  position.current = 0
})
