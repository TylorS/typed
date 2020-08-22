import { doEffect, Effect } from '@typed/fp/Effect'

import { ArgsOf, GetOpEffect, Op, OpEnv, ReturnOf } from './Op'
import { getOpMap } from './OpEnv'

export function callOp<O extends Op>(O: O): GetOpEffect<OpEnv<O>, O> {
  const operation = (...args: ArgsOf<O>): Effect<OpEnv<O>, ReturnOf<O>> => {
    const eff = doEffect(function* () {
      const map = yield* getOpMap
      const callEff = map.get(O)!
      const value = yield* callEff(...args)

      return value
    })

    return eff
  }

  return operation as GetOpEffect<OpEnv<O>, O>
}
