import { doEffect, Effect, provide } from '@typed/fp/Effect'
import { pipe } from 'fp-ts/lib/function'

import { GetOperation, Op, OpEnv, OPS } from './'
import { getOrCreateOpMap } from './OpEnv'

export function provideOp<O extends Op, E1>(O: O, opEff: GetOperation<E1, O>) {
  return <E2, A>(eff: Effect<E2 & OpEnv<O>, A>): Effect<E1 & E2, A> => {
    const effect = doEffect(function* () {
      const opMap = yield* getOrCreateOpMap

      opMap.set(O, opEff)

      const value = yield* pipe(eff, provide({ [OPS]: opMap })) as Effect<E2, A>

      return value
    })

    return effect
  }
}
