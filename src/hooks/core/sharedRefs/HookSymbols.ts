import { doEffect, Effect } from '@typed/fp/Effect/exports'
import {
  createSharedRef,
  readSharedRef,
  SharedRef,
  SharedRefEnv,
} from '@typed/fp/SharedRef/exports'

import { getOrSet } from '../../helpers/getOrSet'
import { HookEnvironmentId } from '../types/HookEnvironment'

export const HOOK_SYMBOLS = '@typed/fp/HookSymbols'
export type HOOK_SYMBOLS = typeof HOOK_SYMBOLS

export interface HookSymbols
  extends SharedRef<HOOK_SYMBOLS, Map<HookEnvironmentId, Map<number, symbol>>> {}

export const HookSymbols = createSharedRef<HookSymbols>(HOOK_SYMBOLS)

export const getHookSymbols = readSharedRef(HookSymbols)

export const getHookSymbol = (
  id: HookEnvironmentId,
  index: number,
): Effect<SharedRefEnv<HookSymbols>, symbol> => {
  const eff = doEffect(function* () {
    const symbolsByHookId = yield* getHookSymbols
    const symbols = getOrSet(id, symbolsByHookId, () => new Map<number, symbol>())
    const symbol = getOrSet(index, symbols, Symbol)

    return symbol
  })

  return eff
}

export const deleteHookSymbols = (
  id: HookEnvironmentId,
): Effect<SharedRefEnv<HookSymbols>, void> => {
  const eff = doEffect(function* () {
    const symbolsByHookId = yield* getHookSymbols

    symbolsByHookId.delete(id)
  })

  return eff
}
