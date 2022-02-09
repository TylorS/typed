import { isUnexpected } from '@/Cause'
import { fromExit, Refine, result } from '@/Effect'
import { expected } from '@/Exit'
import { Fx } from '@/Fx'
import { isLeft } from '@/Prelude/Either'

import { FxInstruction } from './Processor'

export const processRefine = <R, E, A, E2>(
  instr: Refine<R, E, A, E2>,
): FxInstruction<R, E | E2, A> => ({
  type: 'Fx',
  fx: Fx(function* () {
    const exit = yield* result(instr.input.fx, instr.trace)
    const refined =
      isLeft(exit) && isUnexpected(exit.value) && instr.input.refinement(exit.value.error)
        ? expected(exit.value.error)
        : exit

    return yield* fromExit<E | E2, A>(refined, instr.trace)
  }),
})
