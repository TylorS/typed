import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { setShared, SharedEnv } from '@typed/fp/Shared/domain/exports'

import { getNamespacePosition, NamespacePosition } from './NamespacePosition'

export const getNextPosition: Effect<SharedEnv, number> = doEffect(function* () {
  const position = yield* getNamespacePosition
  const next = position + 1

  yield* setShared(NamespacePosition, next)

  return position
})
