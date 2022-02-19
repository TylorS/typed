import { Match, result } from '@/Effect'
import { fromCause, Fx } from '@/Fx'
import { isExpected } from '@/Prelude/Cause'
import { isRight } from '@/Prelude/Either'

import { InstructionProcessor } from './InstructionProcessor'
import { FxInstruction } from './Processor'

export const processMatch = <R, E, A, R2, E2, B, R3, E3, C>(
  instruction: Match<R, E, A, R2, E2, B, R3, E3, C>,
  _: InstructionProcessor<R & R2 & R3, E | E2 | E3, any>,
): FxInstruction<R & R2 & R3, E | E2 | E3, B | C> => ({
  type: 'Fx',
  fx: Fx(function* () {
    const exit = yield* result(instruction.input.fx)

    if (isRight(exit)) {
      return yield* instruction.input.onRight(exit.value)
    }

    if (isExpected(exit.value)) {
      return yield* instruction.input.onLeft(exit.value.error)
    }

    return yield* fromCause(exit.value, instruction.trace)
  }),
})
