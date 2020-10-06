import { doEffect } from '@typed/fp/Effect/exports'

import { ArgsOf, CallOf, Op } from './exports'
import { getOpMap } from './OpEnv'

/**
 * Given an Op, returns the corresponding effect function which will be provided by the infrastructure later.
 */
export function callOp<O extends Op<any, any>>(op: O): CallOf<O> {
  const operation = (...args: ArgsOf<O>) => {
    const eff = doEffect(function* () {
      const map = yield* getOpMap
      const callOf = map.get(op)!
      const eff = callOf(...args)
      const value = yield* eff

      return value
    })

    return eff
  }

  return (operation as unknown) as CallOf<O>
}
