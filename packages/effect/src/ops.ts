import { Effect } from './Effect.js'
import { Handler } from './Handler.js'
import { In, Out } from './Lambda.js'
import { Op } from './Op.js'
import * as core from './core.js'

export class ForEach extends Op<ForEach, never, In.ReadonlyArrayLambda>('@typed/effect/ForEach') {
  static sequential = ForEach.handleReturn<ForEach, Out.ReadonlyArrayLambda, never, never>(
    (input, resume) => core.map(core.tuple(...input.map(resume)), (xs) => xs.flat()),
    (a) => [a],
  )
}

export const forEach: <I extends readonly any[]>(input: I) => Effect<ForEach, never, I[number]> =
  core.op(ForEach)

export const withForEach: <E extends Effect.Any>(
  effect: E,
) => Handler.Apply<E, (typeof ForEach)['sequential']> = core.handle(ForEach.sequential)
