import { Chain } from '@/Effect'
import { Fx } from '@/Fx'

import { ProcessorInstruction } from './Processor'

export const processChain = <R, E, A, R2, E2, B>(
  instruction: Chain<R, E, A, R2, E2, B>,
): ProcessorInstruction<R & R2, E | E2, B> => ({
  type: 'Fx',
  fx: Fx(function* () {
    const a = yield* instruction.input.fx

    return yield* instruction.input.f(a)
  }),
})
