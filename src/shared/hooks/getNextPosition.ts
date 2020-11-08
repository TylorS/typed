import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { setShared, SharedEnv } from '@typed/fp/shared/core/exports'

import { getNamespacePosition, NamespacePosition } from './NamespacePosition'

export const getNextPosition: Effect<SharedEnv, number> = doEffect(function* () {
  const position = yield* getNamespacePosition

  yield* setShared(NamespacePosition, position + 1)

  return position
})
