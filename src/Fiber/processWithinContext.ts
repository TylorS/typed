import { WithinContext } from '@/Effect'
import { forkJoin } from '@/Fx'

import { FxInstruction } from './Processor'

export const processWithinContext = <R, E, A>(
  instr: WithinContext<R, E, A>,
): FxInstruction<R, E, A> => ({
  type: 'Fx',
  fx: forkJoin(instr.input.fx, { fiberContext: instr.input.context }),
})
