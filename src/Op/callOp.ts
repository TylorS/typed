import { doEffect, Effect } from '@typed/fp/Effect'

import { ArgsOf, GetOpEffect, Op, OpEnv, Ops, OpsUris, ReturnOf, UriOf } from './'
import { getOpMap } from './OpEnv'

/**
 * Given an Op, returns the corresponding effect function which will be provided by the infrastructure later.
 */
export function callOp<O extends Op>(op: O): CallOf<O> {
  const operation = (...args: ArgsOf<O>): Effect<OpEnv<O>, ReturnOf<O>> => {
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

export type CallOf<O extends Op> = UriOf<O> extends OpsUris
  ? Ops<OpEnv<O>>[UriOf<O>]
  : GetOpEffect<OpEnv<O>, O>
