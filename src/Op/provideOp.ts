import { doEffect, Effect, provideSome, useSome } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/function'
import { iso } from 'newtype-ts'

import { GetOperation, Op, OpEnv, OPS } from './Op'
import { getOrCreateOpMap } from './OpEnv'

const opEnvIso = iso<OpEnv<any>>()

export function provideOp<O extends Op<any, any>, E1>(op: O, opEff: GetOperation<E1, O>) {
  return <E2, A>(eff: Effect<E2 & OpEnv<O>, A>): Effect<E1 & E2, A> => {
    const effect = doEffect(function* () {
      const opMap = yield* getOrCreateOpMap

      opMap.set(op, opEff)

      const value = yield* pipe(eff, provideSome(opEnvIso.wrap({ [OPS]: opMap }) as OpEnv<O>))

      return value
    })

    return effect
  }
}

export function useOp<O extends Op<any, any>, E1>(op: O, opEff: GetOperation<E1, O>) {
  return <E2, A>(eff: Effect<E2 & OpEnv<O>, A>): Effect<E1 & E2, A> => {
    const effect = doEffect(function* () {
      const opMap = yield* getOrCreateOpMap

      opMap.set(op, opEff)

      const value = yield* pipe(eff, useSome(opEnvIso.wrap({ [OPS]: opMap }) as OpEnv<O>))

      return value
    })

    return effect
  }
}
