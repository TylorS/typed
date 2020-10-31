import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/function'

import { getShared } from '../getShared'
import { usingGlobal } from '../global'
import { shared } from '../Shared'
import { getCurrentNamespace, SharedEnv } from '../SharedEnv'
import { getNextPosition } from './NamespacePositions'

export const NamespaceSymbols = shared(
  Symbol('NamespaceSymbols'),
  Pure.fromIO(() => new Map<PropertyKey, Map<number, symbol>>()),
)

export const getNamespaceSymbols = pipe(NamespaceSymbols, getShared, usingGlobal)

export const getNextSymbol: Effect<SharedEnv, symbol> = doEffect(function* () {
  const position = yield* getNextPosition
  const namespace = yield* getCurrentNamespace
  const symbols = yield* getNamespaceSymbols

  if (!symbols.has(namespace)) {
    symbols.set(namespace, new Map())
  }

  const positions = symbols.get(namespace)!

  if (!positions.has(position)) {
    positions.set(position, Symbol())
  }

  return positions.get(position)!
})
