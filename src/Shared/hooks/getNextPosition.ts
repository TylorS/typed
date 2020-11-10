import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { SharedEnv } from '@typed/fp/Shared/core/exports'

import { getNamespacePosition } from './NamespacePosition'

export const getNextPosition: Effect<SharedEnv, number> = doEffect(function* () {
  const position = yield* getNamespacePosition

  const current = position.current

  position.current = position.current + 1

  return current
})
