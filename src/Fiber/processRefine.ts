import { fromExit, Refine, result } from '@/Effect'
import { expected } from '@/Exit'
import { Fx } from '@/Fx/Fx'
import { isUnexpected } from '@/Prelude/Cause'
import { isLeft } from '@/Prelude/Either'

import { FxInstruction } from './Processor'

export const processRefine = <R, E, A, E2>(
  instr: Refine<R, E, A, E2>,
): FxInstruction<R, E | E2, A> => ({
  type: 'Fx',
  fx: Fx(function* () {
    const exit = yield* result(instr.input.fx, instr.trace)
    const refined =
      isLeft(exit) && isUnexpected(exit.left) && instr.input.refinement(exit.left.error)
        ? expected(exit.left.error)
        : exit

    return yield* fromExit<E | E2, A>(refined, instr.trace)
  }),
})
