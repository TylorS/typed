import { fromIO } from '@fp/Env'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { createRef, getRef, setRef } from '@fp/Ref'
import { EqStrict } from 'fp-ts/Eq'
import { Eq } from 'fp-ts/number'
import * as RM from 'fp-ts/ReadonlyMap'

import { getNextIndex } from './HookIndex'

const upsert = RM.upsertAt(Eq)

/**
 * An map from HookIndex to Symbol to ensure hooks are unable to collide
 * with user-defined references.
 */
export const HookSymbols = createRef(
  fromIO((): ReadonlyMap<number, symbol> => new Map<number, symbol>()),
  Symbol('HookSymbols'),
  RM.getEq(EqStrict, EqStrict),
)

export const getNextSymbol = Do(function* (_) {
  const index = yield* _(getNextIndex)
  const symbols = yield* _(getRef(HookSymbols))

  if (!symbols.has(index)) {
    const updated = yield* pipe(HookSymbols, setRef(pipe(symbols, upsert(index, Symbol(index)))), _)

    return updated.get(index)!
  }

  return symbols.get(index)!
})
