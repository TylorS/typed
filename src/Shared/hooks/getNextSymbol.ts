import { doEffect, Effect, Pure } from '@fp/Effect/exports'
import { getOrCreate, SharedEnv } from '@fp/Shared/core/exports'

import { getNextPosition } from './getNextPosition'
import { getNamespaceSymbols } from './NamespaceSymbols'

/**
 * Get the next symbol based on position
 */
export const getNextSymbol: Effect<SharedEnv, symbol> = doEffect(function* () {
  const position = yield* getNextPosition
  const symbols = yield* getNamespaceSymbols

  return yield* getOrCreate(symbols, position, () => Pure.of(Symbol(`HookPosition: ${position}`)))
})
