import { doEffect } from '@typed/fp/Effect'

import { ArgsOf, CallOf, Op } from './'
import { getOpMap } from './OpEnv'

/**
 * Given an Op, returns the corresponding effect function which will be provided by the infrastructure later.
 */
export function callOp<O extends Op<any, any>>(op: O): CallOf<O> {
  const operation = (...args: ArgsOf<O>) => {
    const eff = doEffect(function* () {
      const map = yield* getOpMap
      const callOf = map.get(op)!
      const value = yield* callOf(...args)

      return value
    })

    return eff
  }

  return operation as CallOf<O>
}
