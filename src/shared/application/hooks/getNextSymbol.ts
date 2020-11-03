import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { getOrCreate, SharedEnv } from '@typed/fp/Shared/domain/exports'

import { getNextPosition } from './getNextPosition'
import { getNamespaceSymbols } from './NamespaceSymbols'

export const getNextSymbol: Effect<SharedEnv, symbol> = doEffect(function* () {
  const position = yield* getNextPosition
  const symbols = yield* getNamespaceSymbols

  return yield* getOrCreate(
    symbols,
    position,
    Pure.fromIO(() => Symbol(position)),
  )
})
