import * as ReadonlyArray from '@effect/data/ReadonlyArray'

import { Effect } from './Effect.js'
import { FlatMap } from './Instruction.js'
import { In, Out } from './Lambda.js'
import { Op } from './Op.js'
import * as core from './core.js'

export class ForEach extends Op<ForEach, In.ReadonlyArrayLambda>('@typed/effect/ForEach') {
  static handle = core.handle(
    Op.handleReturn(ForEach)<Out.ReadonlyArrayLambda>(
      (input, resume) => {
        let effect: Effect<never, void> = core.unit()

        for (let i = 0; i < input.length; ++i) {
          const value = input[i]
          effect = new FlatMap(effect, () => resume(value))
        }

        return effect
      },
      (a) => [a],
      ReadonlyArray.getSemigroup(),
    ),
  )
}

export const forEach: <I extends readonly any[]>(input: I) => Effect<ForEach, I[number]> =
  core.op(ForEach)
