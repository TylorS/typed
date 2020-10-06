import { Effect } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'

import { HookEnvironmentId } from './HookEnvironment'
import { getNextIndex, HookPositions } from './HookPositions'
import { getHookSymbol, HookSymbols } from './HookSymbols'

export const getNextSymbol = (
  id: HookEnvironmentId,
): Effect<SharedRefEnv<HookPositions> & SharedRefEnv<HookSymbols>, symbol> => {
  const eff = doEffect(function* () {
    const index = yield* getNextIndex(id)
    const symbol = yield* getHookSymbol(id, index)

    return symbol
  })

  return eff
}
